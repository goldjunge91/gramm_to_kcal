/**
 * OpenFoodFacts API integration for barcode product lookup
 * https://world.openfoodfacts.org/api/v2/
 */

import type { Product } from "@/lib/types";

const OPENFOODFACTS_API_BASE = "https://world.openfoodfacts.org/api/v2";

interface OpenFoodFactsProduct {
  code: string;
  product: {
    product_name?: string;
    product_name_de?: string;
    product_name_en?: string;
    brands?: string;
    nutriments?: {
      "energy-kcal_100g"?: number;
      "energy-kcal"?: number;
      energy_100g?: number;
      energy?: number;
    };
    quantity?: string;
    serving_quantity?: string;
    categories?: string;
    image_url?: string;
    image_front_url?: string;
  };
  status: number;
  status_verbose: string;
}

interface ProductLookupResult {
  success: boolean;
  product?: Omit<Product, "id">;
  error?: string;
  source?: "openfoodfacts";
  raw?: any;
}

/**
 * Lookup product information by EAN13 barcode
 */
export async function lookupProductByBarcode(
  barcode: string,
): Promise<ProductLookupResult> {
  try {
    // Validate barcode format (basic check)
    if (!barcode || barcode.length < 8 || barcode.length > 14) {
      return {
        success: false,
        error: "Invalid barcode format",
      };
    }

    const url = `${OPENFOODFACTS_API_BASE}/product/${barcode}.json`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "CalorieTracker/1.0 (https://gramm-to-kcal.vercel.app)",
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: `API request failed: ${response.status}`,
      };
    }

    const data: OpenFoodFactsProduct = await response.json();

    // Check if product was found
    if (data.status !== 1 || !data.product) {
      return {
        success: false,
        error: "Product not found in OpenFoodFacts database",
        raw: data,
      };
    }

    const product = data.product;

    // Extract product name (prefer German, fallback to English or generic)
    const name =
      product.product_name_de ||
      product.product_name_en ||
      product.product_name ||
      "Unknown Product";

    // Extract calories per 100g
    const kcal = extractCaloriesPer100g(product.nutriments);

    if (!kcal || kcal <= 0) {
      return {
        success: false,
        error: "No calorie information available for this product",
        raw: data,
      };
    }

    // Build the result product
    const resultProduct: Omit<Product, "id"> = {
      name: formatProductName(name, product.brands),
      quantity: 100, // Default to 100g for comparison
      kcal: Math.round(kcal),
    };

    return {
      success: true,
      product: resultProduct,
      source: "openfoodfacts",
      raw: data,
    };
  } catch (error) {
    console.error("Product lookup error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Extract calories per 100g from OpenFoodFacts nutriment data
 */
function extractCaloriesPer100g(
  nutriments?: OpenFoodFactsProduct["product"]["nutriments"],
): number | null {
  if (!nutriments) return null;

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
 * Format product name with brand information
 */
function formatProductName(name: string, brands?: string): string {
  let formattedName = name.trim();

  // Add brand if available and not already in name
  if (brands) {
    const brandList = brands
      .split(",")
      .map((b) => b.trim())
      .filter(Boolean);

    if (brandList.length > 0) {
      const mainBrand = brandList[0];
      // Only add brand if it's not already in the product name
      if (!formattedName.toLowerCase().includes(mainBrand.toLowerCase())) {
        formattedName = `${mainBrand} ${formattedName}`;
      }
    }
  }

  // Capitalize first letter
  formattedName =
    formattedName.charAt(0).toUpperCase() + formattedName.slice(1);

  return formattedName;
}

/**
 * Validate if a string is a valid EAN13 barcode
 */
export function isValidEAN13(barcode: string): boolean {
  // Basic validation: 13 digits
  if (!/^\d{13}$/.test(barcode)) {
    return false;
  }

  // EAN13 checksum validation
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
 * Search for products by name (for testing/fallback)
 */
export async function searchProductsByName(
  query: string,
  limit = 5,
): Promise<ProductLookupResult[]> {
  try {
    const url = `${OPENFOODFACTS_API_BASE}/search?search_terms=${encodeURIComponent(query)}&page_size=${limit}&fields=code,product_name,product_name_de,brands,nutriments`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "CalorieTracker/1.0 (https://gramm-to-kcal.vercel.app)",
      },
    });

    if (!response.ok) {
      throw new Error(`Search request failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.products || !Array.isArray(data.products)) {
      return [];
    }

    return data.products
      .map((product: any) => {
        const name =
          product.product_name_de || product.product_name || "Unknown Product";
        const kcal = extractCaloriesPer100g(product.nutriments);

        if (!kcal || kcal <= 0) return null;

        return {
          success: true,
          product: {
            name: formatProductName(name, product.brands),
            quantity: 100,
            kcal: Math.round(kcal),
          },
          source: "openfoodfacts" as const,
          raw: product,
        };
      })
      .filter(Boolean);
  } catch (error) {
    console.error("Product search error:", error);
    return [];
  }
}
