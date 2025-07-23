/* eslint-disable unused-imports/no-unused-vars */
/**
 * Enhanced OpenFoodFacts API integration for developer testing
 * Provides comprehensive product data and diagnostics
 */

import type {
    BarcodeValidation,
    EnhancedProductLookupResult,
    ExtendedOpenFoodFactsProduct,
    ProductImages,
    TestBarcode,
} from "@/lib/types/dev-scanner";
import type { Product } from "@/lib/types/types";

const OPENFOODFACTS_API_BASE = "https://world.openfoodfacts.org/api/v2";
const USER_AGENT = "CalorieTracker-Dev/1.0 (https://gramm-to-kcal.vercel.app)";

/**
 * Enhanced product lookup with comprehensive data and diagnostics
 */
export async function enhancedLookupProductByBarcode(
    barcode: string,
): Promise<EnhancedProductLookupResult> {
    const startTime = performance.now();

    try {
        // Validate barcode
        const validation = validateBarcode(barcode);

        if (!validation.isValid) {
            return {
                success: false,
                error: `Invalid barcode: ${validation.errors.join(", ")}`,
                metadata: {
                    requestTime: startTime,
                    responseTime: performance.now(),
                    barcode,
                    apiUrl: "",
                    userAgent: USER_AGENT,
                },
                validation,
            };
        }

        // Build comprehensive API URL with all fields
        const fields = [
            "code",
            "product_name",
            "product_name_de",
            "product_name_en",
            "generic_name",
            "brands",
            "brands_tags",
            "categories",
            "categories_tags",
            "categories_hierarchy",
            "nutriments",
            "quantity",
            "serving_quantity",
            "serving_size",
            "net_weight",
            "image_url",
            "image_front_url",
            "image_nutrition_url",
            "image_ingredients_url",
            "selected_images",
            "ingredients",
            "ingredients_text",
            "ingredients_text_de",
            "ingredients_text_en",
            "allergens",
            "allergens_tags",
            "traces",
            "traces_tags",
            "completeness",
            "data_quality_tags",
            "nutrition_data_per",
            "countries",
            "countries_tags",
            "manufacturing_places",
            "origins",
            "labels",
            "labels_tags",
            "packaging",
            "packaging_tags",
            "created_datetime",
            "last_modified_datetime",
            "last_image_datetime",
        ].join(",");

        const apiUrl = `${OPENFOODFACTS_API_BASE}/product/${barcode}.json?fields=${fields}`;

        const requestStartTime = performance.now();
        const response = await fetch(apiUrl, {
            headers: {
                "User-Agent": USER_AGENT,
            },
        });
        const responseTime = performance.now();

        if (!response.ok) {
            return {
                success: false,
                error: `API request failed: ${response.status} ${response.statusText}`,
                metadata: {
                    requestTime: startTime,
                    responseTime,
                    barcode,
                    apiUrl,
                    userAgent: USER_AGENT,
                },
                validation,
            };
        }

        const data: ExtendedOpenFoodFactsProduct = await response.json();

        // Check if product was found
        if (data.status !== 1 || !data.product) {
            return {
                success: false,
                error: "Product not found in OpenFoodFacts database",
                enhancedData: {
                    openFoodFacts: data,
                    completenessScore: 0,
                    images: {},
                    categories: [],
                    allergens: [],
                    ingredients: [],
                },
                metadata: {
                    requestTime: startTime,
                    responseTime,
                    barcode,
                    apiUrl,
                    userAgent: USER_AGENT,
                },
                validation,
            };
        }

        const product = data.product;

        // Extract and enhance product data
        const enhancedData = {
            openFoodFacts: data,
            nutritionScore: calculateNutritionScore(product.nutriments),
            completenessScore: product.completeness || 0,
            images: extractImages(product),
            categories: extractCategories(product),
            allergens: extractAllergens(product),
            ingredients: extractIngredients(product),
        };

        // Extract basic product info for compatibility
        const name = extractProductName(product);
        const kcal = extractCaloriesPer100g(product.nutriments);

        if (!kcal || kcal <= 0) {
            return {
                success: false,
                error: "No calorie information available for this product",
                enhancedData,
                metadata: {
                    requestTime: startTime,
                    responseTime,
                    barcode,
                    apiUrl,
                    userAgent: USER_AGENT,
                },
                validation,
            };
        }

        // Build result product
        const resultProduct: Omit<Product, "id"> = {
            name: formatProductName(name, product.brands),
            quantity: 100, // Default to 100g for comparison
            kcal: Math.round(kcal),
        };

        return {
            success: true,
            product: resultProduct,
            enhancedData,
            source: "openfoodfacts",
            metadata: {
                requestTime: startTime,
                responseTime,
                barcode,
                apiUrl,
                userAgent: USER_AGENT,
            },
            validation,
        };
    }
    catch (error) {
        console.error("Enhanced product lookup error:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred",
            metadata: {
                requestTime: startTime,
                responseTime: performance.now(),
                barcode,
                apiUrl: "",
                userAgent: USER_AGENT,
            },
            validation: validateBarcode(barcode),
        };
    }
}

/**
 * Validate barcode format and checksum
 */
export function validateBarcode(barcode: string): BarcodeValidation {
    const errors: string[] = [];
    let format: BarcodeValidation["format"] = "UNKNOWN";
    let checksumValid = false;

    if (!barcode) {
        errors.push("Barcode is empty");
        return {
            isValid: false,
            format,
            checksum: checksumValid,
            length: 0,
            errors,
        };
    }

    const cleanBarcode = barcode.replaceAll(/\D/g, ""); // Remove non-digits
    const length = cleanBarcode.length;

    // Determine format
    if (length === 13) {
        format = "EAN13";
        checksumValid = validateEAN13Checksum(cleanBarcode);
    }
    else if (length === 8) {
        format = "EAN8";
        checksumValid = validateEAN8Checksum(cleanBarcode);
    }
    else if (length === 12) {
        format = "UPC";
        checksumValid = validateUPCChecksum(cleanBarcode);
    }
    else if (length >= 6 && length <= 14) {
        format = "CODE128";
        checksumValid = true; // CODE128 has complex checksum, assume valid for now
    }
    else {
        errors.push(
            `Invalid barcode length: ${length} (expected 8, 12, or 13 digits)`,
        );
    }

    if (cleanBarcode !== barcode) {
        errors.push("Barcode contains non-numeric characters");
    }

    if (format !== "CODE128" && !checksumValid) {
        errors.push("Invalid checksum");
    }

    return {
        isValid: errors.length === 0,
        format,
        checksum: checksumValid,
        length,
        errors,
    };
}

/**
 * Extract product name with language preference
 */
function extractProductName(
    product: ExtendedOpenFoodFactsProduct["product"],
): string {
    return (
        product.product_name_de
        || product.product_name_en
        || product.product_name
        || product.generic_name
        || "Unknown Product"
    );
}

/**
 * Extract calories per 100g with fallback logic
 */
function extractCaloriesPer100g(
    nutriments?: ExtendedOpenFoodFactsProduct["product"]["nutriments"],
): number | null {
    if (!nutriments)
        return null;

    // Try different calorie fields in order of preference
    const calorieFields = [
        "energy-kcal_100g",
        "energy-kcal",
        "energy_100g",
        "energy",
    ] as const;

    for (const field of calorieFields) {
        const value = nutriments[field];
        if (typeof value === "number" && value > 0) {
            // Convert energy from kJ to kcal if needed (1 kcal = 4.184 kJ)
            if (field.includes("energy") && !field.includes("kcal")) {
                return value / 4.184;
            }
            return value;
        }
    }

    return null;
}

/**
 * Calculate nutrition score based on available data
 */
function calculateNutritionScore(
    nutriments?: ExtendedOpenFoodFactsProduct["product"]["nutriments"],
): string {
    if (!nutriments)
        return "No data";

    const importantFields = [
        "energy-kcal_100g",
        "fat_100g",
        "saturated-fat_100g",
        "carbohydrates_100g",
        "sugars_100g",
        "proteins_100g",
        "salt_100g",
        "fiber_100g",
    ];

    const availableFields = importantFields.filter(
        field =>
            nutriments[field] !== undefined && nutriments[field] !== null,
    );

    const completeness
        = (availableFields.length / importantFields.length) * 100;

    if (completeness >= 90)
        return "Excellent";
    if (completeness >= 70)
        return "Good";
    if (completeness >= 50)
        return "Fair";
    if (completeness >= 25)
        return "Poor";
    return "Very Poor";
}

/**
 * Extract product images with fallbacks
 */
function extractImages(
    product: ExtendedOpenFoodFactsProduct["product"],
): ProductImages {
    const images: ProductImages = {};

    // Front image
    images.front
        = product.selected_images?.front?.display?.de
            || product.selected_images?.front?.display?.en
            || product.image_front_url
            || product.image_url;

    // Nutrition image
    images.nutrition
        = product.selected_images?.nutrition?.display?.de
            || product.selected_images?.nutrition?.display?.en
            || product.image_nutrition_url;

    // Ingredients image
    images.ingredients
        = product.selected_images?.ingredients?.display?.de
            || product.selected_images?.ingredients?.display?.en
            || product.image_ingredients_url;

    return images;
}

/**
 * Extract and clean categories
 */
function extractCategories(
    product: ExtendedOpenFoodFactsProduct["product"],
): string[] {
    return (
        product.categories_tags?.map(tag =>
            tag.replace(/^[a-z]{2}:/, "").replaceAll("-", " "),
        ) || []
    );
}

/**
 * Extract allergens
 */
function extractAllergens(
    product: ExtendedOpenFoodFactsProduct["product"],
): string[] {
    return (
        product.allergens_tags?.map(tag =>
            tag.replace(/^[a-z]{2}:/, "").replaceAll("-", " "),
        ) || []
    );
}

/**
 * Extract ingredients
 */
function extractIngredients(
    product: ExtendedOpenFoodFactsProduct["product"],
): string[] {
    if (product.ingredients && Array.isArray(product.ingredients)) {
        return product.ingredients.map(ing => ing.text);
    }

    const ingredientsText
        = product.ingredients_text_de
            || product.ingredients_text_en
            || product.ingredients_text;

    if (ingredientsText) {
        return ingredientsText
            .split(/[,;]/)
            .map(ing => ing.trim())
            .filter(Boolean);
    }

    return [];
}

/**
 * Format product name with brand
 */
function formatProductName(name: string, brands?: string): string {
    let formattedName = name.trim();

    if (brands) {
        const brandList = brands
            .split(",")
            .map(b => b.trim())
            .filter(Boolean);
        if (brandList.length > 0) {
            const mainBrand = brandList[0];
            if (
                !formattedName.toLowerCase().includes(mainBrand.toLowerCase())
            ) {
                formattedName = `${mainBrand} ${formattedName}`;
            }
        }
    }

    return formattedName.charAt(0).toUpperCase() + formattedName.slice(1);
}

/**
 * Validate EAN13 checksum
 */
function validateEAN13Checksum(barcode: string): boolean {
    if (barcode.length !== 13)
        return false;

    const digits = barcode.split("").map(Number);
    const checksum = digits.pop()!;

    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += digits[i] * (i % 2 === 0 ? 1 : 3);
    }

    const calculatedChecksum = (10 - (sum % 10)) % 10;
    return calculatedChecksum === checksum;
}

/**
 * Validate EAN8 checksum
 */
function validateEAN8Checksum(barcode: string): boolean {
    if (barcode.length !== 8)
        return false;

    const digits = barcode.split("").map(Number);
    const checksum = digits.pop()!;

    let sum = 0;
    for (let i = 0; i < 7; i++) {
        sum += digits[i] * (i % 2 === 0 ? 3 : 1);
    }

    const calculatedChecksum = (10 - (sum % 10)) % 10;
    return calculatedChecksum === checksum;
}

/**
 * Validate UPC checksum
 */
function validateUPCChecksum(barcode: string): boolean {
    if (barcode.length !== 12)
        return false;

    const digits = barcode.split("").map(Number);
    const checksum = digits.pop()!;

    let sum = 0;
    for (let i = 0; i < 11; i++) {
        sum += digits[i] * (i % 2 === 0 ? 3 : 1);
    }

    const calculatedChecksum = (10 - (sum % 10)) % 10;
    return calculatedChecksum === checksum;
}

/**
 * Test barcodes for development and testing
 */
export const TEST_BARCODES: TestBarcode[] = [
    {
        barcode: "4000417025005",
        name: "Nutella",
        description: "Ferrero Nutella 400g",
        expectedResult: "success",
        category: "spreads",
        notes: "Well-documented product with complete nutrition data",
    },
    {
        barcode: "4008400402228",
        name: "Haribo Goldbären",
        description: "Haribo Goldbären 200g",
        expectedResult: "success",
        category: "candy",
        notes: "Popular German candy with good data quality",
    },
    {
        barcode: "4066600204404",
        name: "Alpro Soja Drink",
        description: "Alpro Soja Drink Original 1L",
        expectedResult: "success",
        category: "plant-based-drinks",
        notes: "Plant-based product with comprehensive nutrition info",
    },
    {
        barcode: "4000521006112",
        name: "Knorr Suppenliebe",
        description: "Knorr Suppenliebe Tomatensuppe",
        expectedResult: "success",
        category: "soups",
        notes: "Prepared food with detailed ingredient list",
    },
    {
        barcode: "4300175047593",
        name: "REWE Bio Haferflocken",
        description: "REWE Bio Haferflocken kernig 500g",
        expectedResult: "success",
        category: "cereals",
        notes: "Organic product with basic nutrition data",
    },
    {
        barcode: "1234567890123",
        name: "Invalid Test Barcode",
        description: "Test barcode that should not exist",
        expectedResult: "failure",
        category: "test",
        notes: "Used for testing error handling",
    },
    {
        barcode: "4000417999999",
        name: "Test Product No Nutrition",
        description: "Product without nutrition data",
        expectedResult: "no-nutrition",
        category: "test",
        notes: "Tests handling of products without calorie information",
    },
];
