/* eslint-disable regexp/optimal-quantifier-concatenation */
/* eslint-disable regexp/no-super-linear-backtracking */
import type { Ingredient, ParsedRecipe, RecipeStep } from "@/lib/types/types";

/** Extract clean title by removing emojis and extra whitespace */
const extractTitle = (text: string): string => {
  const lines = text.split("\n");
  const titleLine = lines[0] || "";

  // Remove emojis and clean up
  return titleLine
    .replaceAll(
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
      "",
    )
    .trim()
    .replaceAll(/\s+/g, " ");
};

/** Parse metadata line containing calories, time, and difficulty */
const parseMetadata = (
  text: string,
): { calories?: number; time?: string; difficulty?: string } => {
  const metadataRegex = /(\d+)\s*kcal\s*・\s*([^・]+)\s*・\s*([^・\n]+)/i;
  const match = text.match(metadataRegex);

  if (!match) return {};

  return {
    calories: Number.parseInt(match[1], 10),
    time: match[2].trim(),
    difficulty: match[3].trim(),
  };
};

/** Extract description paragraph */
const extractDescription = (text: string): string => {
  const lines = text.split("\n");

  // Find the first substantial paragraph after title/metadata
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (
      line.length > 50 &&
      !line.includes("Zutaten für") &&
      !line.includes("Anleitung für") &&
      !line.includes("#YAZIO") &&
      line !== ""
    ) {
      return line;
    }
  }

  return "";
};

/** Parse ingredient list from text */
const parseIngredients = (
  text: string,
): { ingredients: Ingredient[]; portions: number } => {
  const ingredients: Ingredient[] = [];
  let portions = 1;

  // Find ingredients section
  const ingredientsMatch = text.match(
    /Zutaten für (\d+) Portion[^:]*:([\s\S]*?)(?=Anleitung für|$)/i,
  );

  if (!ingredientsMatch) {
    return { ingredients, portions };
  }

  portions = Number.parseInt(ingredientsMatch[1], 10) || 1;
  const ingredientText = ingredientsMatch[2];

  // Split by bullet points and parse each ingredient
  const ingredientLines = ingredientText
    .split(/[・•\n]/)
    .filter((line) => line.trim());

  ingredientLines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Parse: "Ingredient Name (quantity unit)" format
    const match = trimmed.match(/([^(]+)\s*\(([^)]+)\)/);

    if (match) {
      const name = match[1].trim();
      const quantityAndUnit = match[2].trim();

      // Extract number and unit - improved regex to handle fractions like 1⅔
      const quantityMatch = quantityAndUnit.match(
        /(\d+(?:[.,]\d+)?[⅛⅙⅕¼⅓⅜⅖½⅗⅔⅝¾⅘⅚⅞]?|[⅛⅙⅕¼⅓⅜⅖½⅗⅔⅝¾⅘⅚⅞])\s*(.+)/,
      );

      if (quantityMatch) {
        let quantity = quantityMatch[1];

        // Convert fractions to decimal
        quantity = quantity
          .replace("⅛", "0.125")
          .replace("⅙", "0.167")
          .replace("⅕", "0.2")
          .replace("¼", "0.25")
          .replace("⅓", "0.333")
          .replace("⅜", "0.375")
          .replace("⅖", "0.4")
          .replace("½", "0.5")
          .replace("⅗", "0.6")
          .replace("⅔", "0.667")
          .replace("⅝", "0.625")
          .replace("¾", "0.75")
          .replace("⅘", "0.8")
          .replace("⅚", "0.833")
          .replace("⅞", "0.875");

        // Handle mixed numbers like "1⅔"
        const mixedMatch = quantity.match(/(\d+)([0-9.]+)/);
        if (mixedMatch) {
          quantity = (
            Number.parseFloat(mixedMatch[1]) + Number.parseFloat(mixedMatch[2])
          ).toString();
        }

        const unit = quantityMatch[2].trim();

        ingredients.push({
          id: `ingredient-${index + 1}`,
          name,
          quantity: Number.parseFloat(quantity.replace(",", ".")),
          unit,
        });
      }
    } else if (trimmed.length > 2) {
      // Fallback for ingredients without clear quantity format
      ingredients.push({
        id: `ingredient-${index + 1}`,
        name: trimmed,
        quantity: 1,
        unit: "Stk",
      });
    }
  });

  return { ingredients, portions };
};

/** Parse instruction steps from text */
const parseInstructions = (text: string): string[] => {
  const instructions: string[] = [];

  // Find instructions section
  const instructionsMatch = text.match(
    /Anleitung für[^:]*:([\s\S]*?)(?=Lass es dir schmecken|#YAZIO|$)/i,
  );

  if (!instructionsMatch) {
    return instructions;
  }

  const instructionText = instructionsMatch[1];

  // Split by numbered steps
  const steps = instructionText.split(/\d+\.\s*/).filter((step) => step.trim());

  steps.forEach((step) => {
    const trimmed = step.trim();
    if (trimmed) {
      instructions.push(trimmed);
    }
  });

  return instructions;
};

/** Convert instructions to RecipeStep objects */
const createStepsFromInstructions = (instructions: string[]): RecipeStep[] => {
  return instructions.map((instruction, index) => ({
    id: `step-${index + 1}`,
    instruction,
    order: index + 1,
    image: undefined,
  }));
};

/** Main function to parse recipe text into structured data */
export const parseRecipeText = (text: string): ParsedRecipe => {
  const title = extractTitle(text);
  const metadata = parseMetadata(text);
  const description = extractDescription(text);
  const { ingredients, portions } = parseIngredients(text);
  const instructions = parseInstructions(text);
  const steps = createStepsFromInstructions(instructions);

  return {
    title,
    calories: metadata.calories,
    time: metadata.time,
    difficulty: metadata.difficulty,
    description,
    portions,
    ingredients,
    instructions,
    steps,
  };
};
