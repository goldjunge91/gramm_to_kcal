/**
 * Unit-Converter für ML zu Gramm Umrechnung
 * Implementiert die Formel: Gewicht [g] = Volumen [ml] × Dichte [g/ml]
 */

import type { DensityData } from "./density-database";

import { findDensityData } from "./density-database";

export interface ConversionResult {
    success: boolean;
    value: number;
    unit: "ml" | "g";
    originalValue: number;
    originalUnit: "ml" | "g";
    substance: DensityData | null;
    formula?: string;
    error?: string;
    timestamp?: number;
}

export interface ConversionOptions {
    substance?: string;
    customDensity?: number;
    temperature?: number;
    precision?: number; // Anzahl Dezimalstellen
}

/**
 * Konvertiert Milliliter in Gramm
 * Formel: Gewicht [g] = Volumen [ml] × Dichte [g/ml]
 */
export function convertMlToGrams(
    volumeMl: number,
    options: ConversionOptions = {},
): ConversionResult {
    const { substance, customDensity, precision = 2 } = options;

    // Validierung der Eingabe
    if (!Number.isFinite(volumeMl) || volumeMl < 0) {
        return {
            success: false,
            value: 0,
            unit: "g",
            originalValue: volumeMl,
            originalUnit: "ml",
            substance: null,
            error: "Ungültiges Volumen. Bitte geben Sie eine positive Zahl ein.",
        };
    }

    // Dichte bestimmen
    let density: number;
    let substanceData: DensityData | null = null;

    if (customDensity !== undefined) {
    // Benutzerdefinierte Dichte verwenden
        if (!Number.isFinite(customDensity) || customDensity <= 0) {
            return {
                success: false,
                value: 0,
                unit: "g",
                originalValue: volumeMl,
                originalUnit: "ml",
                substance: null,
                error: "Ungültige Dichte. Bitte geben Sie eine positive Zahl ein.",
            };
        }
        density = customDensity;
    }
    else if (substance) {
    // Substanz in Datenbank suchen
        substanceData = findDensityData(substance) ?? null;
        if (!substanceData) {
            return {
                success: false,
                value: 0,
                unit: "g",
                originalValue: volumeMl,
                originalUnit: "ml",
                substance: null,
                error: `Substanz "${substance}" nicht in der Datenbank gefunden.`,
            };
        }
        density = substanceData.density;
    }
    else {
    // Standard: Wasser (Dichte = 1.0)
        substanceData = findDensityData("water") || null;
        density = 1;
    }

    // Umrechnung durchführen
    const grams = volumeMl * density;
    const roundedGrams = Number(grams.toFixed(precision));

    // Formel für Anzeige
    const formula = `${volumeMl} ml × ${density} g/ml = ${roundedGrams} g`;

    return {
        success: true,
        value: roundedGrams,
        unit: "g",
        originalValue: volumeMl,
        originalUnit: "ml",
        substance: substanceData,
        formula,
        timestamp: Date.now(),
    };
}

/**
 * Konvertiert Gramm in Milliliter
 * Formel: Volumen [ml] = Gewicht [g] / Dichte [g/ml]
 */
export function convertGramsToMl(
    weightGrams: number,
    options: ConversionOptions = {},
): ConversionResult {
    const { substance, customDensity, precision = 2 } = options;

    // Validierung der Eingabe
    if (!Number.isFinite(weightGrams) || weightGrams < 0) {
        return {
            success: false,
            value: 0,
            unit: "ml",
            originalValue: weightGrams,
            originalUnit: "g",
            substance: null,
            error: "Ungültiges Gewicht. Bitte geben Sie eine positive Zahl ein.",
        };
    }

    // Dichte bestimmen
    let density: number;
    let substanceData: DensityData | null = null;

    if (customDensity !== undefined) {
    // Benutzerdefinierte Dichte verwenden
        if (!Number.isFinite(customDensity) || customDensity <= 0) {
            return {
                success: false,
                value: 0,
                unit: "ml",
                originalValue: weightGrams,
                originalUnit: "g",
                substance: null,
                error: "Ungültige Dichte. Bitte geben Sie eine positive Zahl ein.",
            };
        }
        density = customDensity;
    }
    else if (substance) {
    // Substanz in Datenbank suchen
        substanceData = findDensityData(substance) ?? null;
        if (!substanceData) {
            return {
                success: false,
                value: 0,
                unit: "ml",
                originalValue: weightGrams,
                originalUnit: "g",
                substance: null,
                error: `Substanz "${substance}" nicht in der Datenbank gefunden.`,
            };
        }
        density = substanceData.density;
    }
    else {
    // Standard: Wasser (Dichte = 1.0)
        substanceData = findDensityData("water") || null;
        density = 1;
    }

    // Umrechnung durchführen
    const ml = weightGrams / density;
    const roundedMl = Number(ml.toFixed(precision));

    // Formel für Anzeige
    const formula = `${weightGrams} g ÷ ${density} g/ml = ${roundedMl} ml`;

    return {
        success: true,
        value: roundedMl,
        unit: "ml",
        originalValue: weightGrams,
        originalUnit: "g",
        substance: substanceData,
        formula,
        timestamp: Date.now(),
    };
}

/**
 * Universelle Umrechnungsfunktion
 * Erkennt automatisch die Einheit und konvertiert entsprechend
 */
export function convertUnits(
    value: number,
    fromUnit: "ml" | "g",
    toUnit: "ml" | "g",
    options: ConversionOptions = {},
): ConversionResult {
    if (fromUnit === toUnit) {
    // Keine Umrechnung nötig
        return {
            success: true,
            value,
            unit: toUnit,
            originalValue: value,
            originalUnit: fromUnit,
            substance: options.substance ? (findDensityData(options.substance) ?? null) : null,
            formula: `${value} ${fromUnit} = ${value} ${toUnit}`,
        };
    }

    if (fromUnit === "ml" && toUnit === "g") {
        return convertMlToGrams(value, options);
    }

    if (fromUnit === "g" && toUnit === "ml") {
        return convertGramsToMl(value, options);
    }

    return {
        success: false,
        value: 0,
        unit: toUnit,
        originalValue: value,
        originalUnit: fromUnit,
        substance: null,
        error: "Unsupported unit conversion",
    };
}

/**
 * Berechnet die Dichte basierend auf bekanntem Gewicht und Volumen
 */
export function calculateDensity(
    weightGrams: number,
    volumeMl: number,
    precision: number = 3,
): { density: number; formula: string } | { error: string } {
    if (
        !Number.isFinite(weightGrams)
        || !Number.isFinite(volumeMl)
        || weightGrams <= 0
        || volumeMl <= 0
    ) {
        return {
            error: "Gewicht und Volumen müssen positive Zahlen sein.",
        };
    }

    const density = weightGrams / volumeMl;
    const roundedDensity = Number(density.toFixed(precision));

    return {
        density: roundedDensity,
        formula: `${weightGrams} g ÷ ${volumeMl} ml = ${roundedDensity} g/ml`,
    };
}

/**
 * Formatiert eine Zahl für die Anzeige mit intelligenter Rundung
 */
export function formatNumber(value: number, maxDecimals: number = 2): string {
    // Entferne trailing zeros
    const formatted = value.toFixed(maxDecimals);
    return formatted.replace(/\.?0+$/, "");
}

/**
 * Validiert ob ein String eine gültige Zahl ist
 */
export function isValidNumber(input: string): boolean {
    const num = Number.parseFloat(input);
    return Number.isFinite(num) && num >= 0;
}

/**
 * Konvertiert verschiedene Eingabeformate zu einer Zahl
 */
export function parseNumberInput(input: string): number | null {
    if (!input || input.trim() === "")
        return null;

    // Ersetze Komma durch Punkt für deutsche Eingaben
    const normalized = input.replace(",", ".");
    const num = Number.parseFloat(normalized);

    return Number.isFinite(num) && num >= 0 ? num : null;
}

/**
 * Gibt Schnellwerte für häufige Umrechnungen zurück
 */
export function getQuickConversions(substance: string = "water"): Array<{
    ml: number;
    grams: number;
    label: string;
}> {
    const substanceData = findDensityData(substance);
    const density = substanceData?.density || 1;

    const baseValues = [
        { ml: 50, label: "50 ml" },
        { ml: 100, label: "100 ml" },
        { ml: 200, label: "200 ml" },
        { ml: 250, label: "250 ml" },
        { ml: 500, label: "500 ml" },
        { ml: 1000, label: "1 Liter" },
    ];

    return baseValues.map(({ ml, label }) => ({
        ml,
        grams: Number((ml * density).toFixed(1)),
        label,
    }));
}
