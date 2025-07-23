/**
 * Unit-Tests für die ML zu Gramm Umrechnungslogik
 */

import { describe, expect, it } from "vitest";

import {
    calculateDensity,
    convertGramsToMl,
    convertMlToGrams,
    convertUnits,
    formatNumber,
    getQuickConversions,
    parseNumberInput,
} from "../../lib/utils/unit-converter";

describe("mL zu Gramm Umrechnung", () => {
    describe("convertMlToGrams", () => {
        it("should convert water correctly (density = 1.0)", () => {
            const result = convertMlToGrams(250, { substance: "water" });

            expect(result.success).toBe(true);
            expect(result.value).toBe(250);
            expect(result.unit).toBe("g");
            expect(result.originalValue).toBe(250);
            expect(result.originalUnit).toBe("ml");
        });

        it("should convert honey correctly (density = 1.4)", () => {
            const result = convertMlToGrams(100, { substance: "honey" });

            expect(result.success).toBe(true);
            expect(result.value).toBe(140);
            expect(result.unit).toBe("g");
        });

        it("should convert with custom density", () => {
            const result = convertMlToGrams(500, { customDensity: 0.8 });

            expect(result.success).toBe(true);
            expect(result.value).toBe(400);
            expect(result.unit).toBe("g");
        });

        it("should handle invalid input", () => {
            const result = convertMlToGrams(-100);

            expect(result.success).toBe(false);
            expect(result.error).toContain("Ungültiges Volumen");
        });

        it("should handle unknown substance", () => {
            const result = convertMlToGrams(100, {
                substance: "unknown_substance",
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain("nicht in der Datenbank gefunden");
        });

        it("should respect precision setting", () => {
            const result = convertMlToGrams(333, {
                customDensity: 1.333,
                precision: 1,
            });

            expect(result.success).toBe(true);
            expect(result.value).toBe(443.9);
        });
    });

    describe("convertGramsToMl", () => {
        it("should convert water correctly (density = 1.0)", () => {
            const result = convertGramsToMl(250, { substance: "water" });

            expect(result.success).toBe(true);
            expect(result.value).toBe(250);
            expect(result.unit).toBe("ml");
            expect(result.originalValue).toBe(250);
            expect(result.originalUnit).toBe("g");
        });

        it("should convert honey correctly (density = 1.4)", () => {
            const result = convertGramsToMl(140, { substance: "honey" });

            expect(result.success).toBe(true);
            expect(result.value).toBe(100);
            expect(result.unit).toBe("ml");
        });

        it("should convert with custom density", () => {
            const result = convertGramsToMl(400, { customDensity: 0.8 });

            expect(result.success).toBe(true);
            expect(result.value).toBe(500);
            expect(result.unit).toBe("ml");
        });

        it("should handle invalid input", () => {
            const result = convertGramsToMl(-100);

            expect(result.success).toBe(false);
            expect(result.error).toContain("Ungültiges Gewicht");
        });
    });

    describe("convertUnits", () => {
        it("should handle same unit conversion", () => {
            const result = convertUnits(100, "ml", "ml");

            expect(result.success).toBe(true);
            expect(result.value).toBe(100);
            expect(result.formula).toBe("100 ml = 100 ml");
        });

        it("should delegate to correct conversion function", () => {
            const mlToG = convertUnits(250, "ml", "g", { substance: "water" });
            const gToMl = convertUnits(250, "g", "ml", { substance: "water" });

            expect(mlToG.success).toBe(true);
            expect(mlToG.value).toBe(250);
            expect(gToMl.success).toBe(true);
            expect(gToMl.value).toBe(250);
        });
    });

    describe("calculateDensity", () => {
        it("should calculate density correctly", () => {
            const result = calculateDensity(140, 100);

            expect("density" in result).toBe(true);
            if ("density" in result) {
                expect(result.density).toBe(1.4);
                expect(result.formula).toBe("140 g ÷ 100 ml = 1.4 g/ml");
            }
        });

        it("should handle invalid input", () => {
            const result = calculateDensity(-10, 100);

            expect("error" in result).toBe(true);
            if ("error" in result) {
                expect(result.error).toContain("positive Zahlen");
            }
        });

        it("should respect precision", () => {
            const result = calculateDensity(333, 250, 2);

            expect("density" in result).toBe(true);
            if ("density" in result) {
                expect(result.density).toBe(1.33);
            }
        });
    });

    describe("formatNumber", () => {
        it("should remove trailing zeros", () => {
            expect(formatNumber(100)).toBe("100");
            expect(formatNumber(100.5)).toBe("100.5");
            expect(formatNumber(100.123, 2)).toBe("100.12");
        });

        it("should respect max decimals", () => {
            expect(formatNumber(100.999, 1)).toBe("101");
            expect(formatNumber(100.666, 2)).toBe("100.67");
        });
    });

    describe("parseNumberInput", () => {
        it("should parse valid numbers", () => {
            expect(parseNumberInput("100")).toBe(100);
            expect(parseNumberInput("100.5")).toBe(100.5);
            expect(parseNumberInput("100,5")).toBe(100.5); // German format
        });

        it("should handle invalid input", () => {
            expect(parseNumberInput("")).toBe(null);
            expect(parseNumberInput("abc")).toBe(null);
            expect(parseNumberInput("-100")).toBe(null); // Negative numbers
        });

        it("should handle edge cases", () => {
            expect(parseNumberInput("0")).toBe(0);
            expect(parseNumberInput("0.1")).toBe(0.1);
            expect(parseNumberInput("   123   ")).toBe(123); // Whitespace
        });
    });

    describe("getQuickConversions", () => {
        it("should generate quick conversions for water", () => {
            const conversions = getQuickConversions("water");

            expect(conversions).toHaveLength(6);
            expect(conversions[0]).toEqual({
                ml: 50,
                grams: 50,
                label: "50 ml",
            });
            expect(conversions[5]).toEqual({
                ml: 1000,
                grams: 1000,
                label: "1 Liter",
            });
        });

        it("should generate quick conversions for honey", () => {
            const conversions = getQuickConversions("honey");

            expect(conversions).toHaveLength(6);
            expect(conversions[0]).toEqual({
                ml: 50,
                grams: 70, // 50 * 1.4 = 70
                label: "50 ml",
            });
        });

        it("should handle unknown substance (fallback to water)", () => {
            const conversions = getQuickConversions("unknown");

            expect(conversions).toHaveLength(6);
            expect(conversions[0].grams).toBe(50); // Falls back to density 1.0
        });
    });
});

describe("realistische Küchen-Szenarien", () => {
    it("should handle common cooking scenarios", () => {
        // Milch für Rezept
        const milk = convertMlToGrams(200, { substance: "milk" });
        expect(milk.success).toBe(true);
        expect(milk.value).toBe(206); // 200 * 1.03

        // Öl zum Braten
        const oil = convertMlToGrams(50, { substance: "cooking_oil" });
        expect(oil.success).toBe(true);
        expect(oil.value).toBe(46); // 50 * 0.92

        // Honig als Süßungsmittel
        const honey = convertMlToGrams(25, { substance: "honey" });
        expect(honey.success).toBe(true);
        expect(honey.value).toBe(35); // 25 * 1.4
    });

    it("should handle recipe scaling", () => {
        // Rezept verdoppeln: 125ml Milch → 250ml
        const original = convertMlToGrams(125, { substance: "milk" });
        const doubled = convertMlToGrams(250, { substance: "milk" });

        expect(original.success && doubled.success).toBe(true);
        if (original.success && doubled.success) {
            expect(doubled.value).toBe(original.value * 2);
        }
    });

    it("should maintain precision for small amounts", () => {
        // Kleine Mengen für Gewürze etc.
        const smallAmount = convertMlToGrams(2.5, { substance: "water" });

        expect(smallAmount.success).toBe(true);
        expect(smallAmount.value).toBe(2.5);
    });
});
