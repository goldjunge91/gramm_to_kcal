import { describe, expect, it } from "vitest";

import type { Ingredient, Product } from "../../lib/types";

import { calculateKcalPer100g, scaleRecipe } from "../../lib/calculations";

describe("calculateKcalPer100g", () => {
  it("should calculate calories per 1g correctly for normal cases", () => {
    const product: Product = {
      id: "test-1",
      name: "Test Product",
      quantity: 200,
      kcal: 500,
    };

    const result = calculateKcalPer100g(product);
    expect(result).toBe(2.5); // 500 kcal / 200g = 2.5 kcal/g
  });

  it("should handle decimal values correctly", () => {
    const product: Product = {
      id: "test-2",
      name: "Test Product",
      quantity: 150,
      kcal: 300,
    };

    const result = calculateKcalPer100g(product);
    expect(result).toBe(2); // 300 kcal / 150g = 2 kcal/g
  });

  it("should return 0 when quantity is 0", () => {
    const product: Product = {
      id: "test-3",
      name: "Test Product",
      quantity: 0,
      kcal: 500,
    };

    const result = calculateKcalPer100g(product);
    expect(result).toBe(0);
  });

  it("should return 0 when quantity is undefined/null", () => {
    const product: Product = {
      id: "test-4",
      name: "Test Product",
      quantity: 0,
      kcal: 500,
    };

    const result = calculateKcalPer100g(product);
    expect(result).toBe(0);
  });

  it("should handle very small quantities", () => {
    const product: Product = {
      id: "test-5",
      name: "Test Product",
      quantity: 1,
      kcal: 10,
    };

    const result = calculateKcalPer100g(product);
    expect(result).toBe(10); // 10 kcal / 1g = 10 kcal/g
  });
});

describe("scaleRecipe", () => {
  const mockIngredients: Ingredient[] = [
    {
      id: "ing-1",
      name: "Flour",
      quantity: 500,
      unit: "g",
    },
    {
      id: "ing-2",
      name: "Sugar",
      quantity: 200,
      unit: "g",
    },
    {
      id: "ing-3",
      name: "Milk",
      quantity: 300,
      unit: "ml",
    },
  ];

  it("should scale recipe up correctly", () => {
    const result = scaleRecipe(mockIngredients, 4, 8);

    expect(result).toHaveLength(3);
    expect(result[0].quantity).toBe(1000); // 500 * 2
    expect(result[1].quantity).toBe(400); // 200 * 2
    expect(result[2].quantity).toBe(600); // 300 * 2

    // Check that other properties remain unchanged
    expect(result[0].name).toBe("Flour");
    expect(result[0].unit).toBe("g");
    expect(result[0].id).toBe("ing-1");
  });

  it("should scale recipe down correctly", () => {
    const result = scaleRecipe(mockIngredients, 4, 2);

    expect(result).toHaveLength(3);
    expect(result[0].quantity).toBe(250); // 500 / 2
    expect(result[1].quantity).toBe(100); // 200 / 2
    expect(result[2].quantity).toBe(150); // 300 / 2
  });

  it("should handle fractional scaling", () => {
    const result = scaleRecipe(mockIngredients, 4, 3);

    expect(result).toHaveLength(3);
    expect(result[0].quantity).toBe(375); // 500 * 0.75
    expect(result[1].quantity).toBe(150); // 200 * 0.75
    expect(result[2].quantity).toBe(225); // 300 * 0.75
  });

  it("should return original ingredients when originalPortions is 0", () => {
    const result = scaleRecipe(mockIngredients, 0, 8);

    expect(result).toEqual(mockIngredients);
  });

  it("should handle empty ingredients array", () => {
    const result = scaleRecipe([], 4, 8);

    expect(result).toEqual([]);
  });

  it("should handle scaling to same portions (no change)", () => {
    const result = scaleRecipe(mockIngredients, 4, 4);

    expect(result).toHaveLength(3);
    expect(result[0].quantity).toBe(500);
    expect(result[1].quantity).toBe(200);
    expect(result[2].quantity).toBe(300);
  });

  it("should handle decimal quantities", () => {
    const decimalIngredients: Ingredient[] = [
      {
        id: "ing-1",
        name: "Salt",
        quantity: 2.5,
        unit: "g",
      },
    ];

    const result = scaleRecipe(decimalIngredients, 2, 6);

    expect(result[0].quantity).toBe(7.5); // 2.5 * 3
  });
});
