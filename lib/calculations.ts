import type { Ingredient, Product } from "./types/types";

/** Calculate calories per 1g from a product */
export const calculateKcalPer100g = (product: Product): number => {
  if (!product.quantity || product.quantity === 0) return 0;
  return product.kcal / product.quantity;
};

/** Scale recipe ingredients based on portion changes */
export const scaleRecipe = (
  ingredients: Ingredient[],
  originalPortions: number,
  desiredPortions: number,
): Ingredient[] => {
  if (!originalPortions || originalPortions === 0) return ingredients;

  const scaleFactor = desiredPortions / originalPortions;
  return ingredients.map((ingredient) => ({
    ...ingredient,
    quantity: ingredient.quantity * scaleFactor,
  }));
};
