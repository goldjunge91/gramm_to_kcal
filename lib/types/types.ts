/** Product interface for calorie comparison */
export interface Product {
  id: string;
  name: string;
  quantity: number; // in grams
  kcal: number;
}

export interface ProductFormProps {
  onSubmit: (product: Omit<Product, "id">) => Promise<void>;
  isLoading?: boolean;
  compact?: boolean;
  enableBarcode?: boolean;
  enableBarcode2?: boolean;
}

/** Ingredient interface for recipe management */
export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: "g" | "ml" | "TL" | "EL" | string;
}

/** Extended unit types for unit conversion */
export type VolumeUnit = "ml" | "l" | "cl" | "dl";
export type WeightUnit = "g" | "kg" | "mg";
export type CookingUnit = "TL" | "EL" | "Tasse" | "Prise";
export type AllUnits = VolumeUnit | WeightUnit | CookingUnit | string;

/** Unit conversion context */
export interface UnitConversionContext {
  substance?: string;
  density?: number;
  temperature?: number;
  precision?: number;
}

/** Recipe interface for complete recipe data */
export interface Recipe {
  id: string;
  name: string;
  originalPortions: number;
  ingredients: Ingredient[];
}

export interface RecentScan {
  id: string;
  productName: string;
  barcode?: string;
  quantity: number;
  kcal: number;
  scannedAt: string; // ISO date string
}

/** Recipe step with optional image */
export interface RecipeStep {
  id: string;
  instruction: string;
  image?: string; // base64 encoded image or URL
  order: number;
}

/** Parsed recipe data from text input for Anleitungsgenerator */
export interface ParsedRecipe {
  title: string;
  calories?: number;
  time?: string;
  difficulty?: string;
  description: string;
  portions: number;
  ingredients: Ingredient[];
  instructions: string[];
  steps?: RecipeStep[]; // Enhanced steps with images
}
