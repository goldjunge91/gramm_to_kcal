/** Product interface for calorie comparison */
export interface Product {
  id: string;
  name: string;
  quantity: number; // in grams
  kcal: number;
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
