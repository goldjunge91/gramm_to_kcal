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
