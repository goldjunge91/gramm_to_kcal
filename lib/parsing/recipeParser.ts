/* eslint-disable regexp/optimal-quantifier-concatenation */
/* eslint-disable regexp/no-super-linear-backtracking */
import type { Ingredient, ParsedRecipe, RecipeStep } from '@/lib/types/types'

/** Extract clean title by removing emojis and extra whitespace */
function extractTitle(text: string): string {
  const lines = text.split('\n')
  const titleLine = lines[0] || ''

  // Remove emojis and clean up
  return titleLine
    .replaceAll(
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
      '',
    )
    .trim()
    .replaceAll(/\s+/g, ' ')
}

/** Parse metadata line containing calories, time, and difficulty */
function parseMetadata(text: string): { calories?: number, time?: string, difficulty?: string } {
  const metadataRegex = /(\d+)\s*kcal\s*・\s*([^・]+)\s*・\s*([^・\n]+)/i
  const match = text.match(metadataRegex)

  if (!match)
    return {}

  return {
    calories: Number.parseInt(match[1], 10),
    time: match[2].trim(),
    difficulty: match[3].trim(),
  }
}

/** Extract description paragraph */
function extractDescription(text: string): string {
  const lines = text.split('\n')

  // Find the first substantial paragraph after title/metadata
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim()
    if (
      line.length > 50
      && !line.includes('Zutaten für')
      && !line.includes('Anleitung für')
      && !line.includes('#YAZIO')
      && line !== ''
    ) {
      return line
    }
  }

  return ''
}

/** Parse ingredient list from text */
function parseIngredients(text: string): { ingredients: Ingredient[], portions: number } {
  const ingredients: Ingredient[] = []
  let portions = 1

  // Find ingredients section
  const ingredientsMatch = text.match(
    /Zutaten für (\d+) Portion[^:]*:([\s\S]*?)(?=Anleitung für|$)/i,
  )

  if (!ingredientsMatch) {
    return { ingredients, portions }
  }

  portions = Number.parseInt(ingredientsMatch[1], 10) || 1
  const ingredientText = ingredientsMatch[2]

  // Split by bullet points and parse each ingredient
  const ingredientLines = ingredientText
    .split(/[・•\n]/)
    .filter(line => line.trim())

  ingredientLines.forEach((line, index) => {
    const trimmed = line.trim()
    if (!trimmed)
      return

    // Parse: "Ingredient Name (quantity unit)" format
    const match = trimmed.match(/([^(]+)\s*\(([^)]+)\)/)

    if (match) {
      const name = match[1].trim()
      const quantityAndUnit = match[2].trim()

      let quantityMatch = null
      // Zuerst gemischte Zahl mit Bruch: z.B. 1 ⅔
      quantityMatch = quantityAndUnit.match(
        /^(\d+(?:[.,]\d+)?) ?([⅛⅙⅕¼⅓⅜⅖½⅗⅔⅝¾⅘⅚⅞])\s+(\S.*)$/,
      )
      // Dann nur Zahl: z.B. 1.5
      if (!quantityMatch)
        quantityMatch = quantityAndUnit.match(/^(\d+(?:[.,]\d+)?)\s+(\S.*)$/)
      // Dann nur Bruch: z.B. ⅔
      if (!quantityMatch)
        quantityMatch = quantityAndUnit.match(/^([⅛⅙⅕¼⅓⅜⅖½⅗⅔⅝¾⅘⅚⅞])\s+(\S.*)$/)

      if (quantityMatch) {
        let quantity = ''
        let unit = ''
        if (quantityMatch.length === 4) {
          // gemischte Zahl mit Bruch
          quantity = quantityMatch[1]
          if (quantityMatch[2]) {
            const fraction = quantityMatch[2]
              .replace('⅛', '0.125')
              .replace('⅙', '0.167')
              .replace('⅕', '0.2')
              .replace('¼', '0.25')
              .replace('⅓', '0.333')
              .replace('⅜', '0.375')
              .replace('⅖', '0.4')
              .replace('½', '0.5')
              .replace('⅗', '0.6')
              .replace('⅔', '0.667')
              .replace('⅝', '0.625')
              .replace('¾', '0.75')
              .replace('⅘', '0.8')
              .replace('⅚', '0.833')
              .replace('⅞', '0.875')
            quantity = (
              Number.parseFloat(quantity.replace(',', '.'))
              + Number.parseFloat(fraction)
            ).toString()
          }
          unit = quantityMatch.at(-1)?.trim() ?? ''
        }
        else if (
          quantityMatch.length === 3
          && /[⅛⅙⅕¼⅓⅜⅖½⅗⅔⅝¾⅘⅚⅞]/.test(quantityMatch[1])
        ) {
          // nur Bruch
          quantity = quantityMatch[1]
            .replace('⅛', '0.125')
            .replace('⅙', '0.167')
            .replace('⅕', '0.2')
            .replace('¼', '0.25')
            .replace('⅓', '0.333')
            .replace('⅜', '0.375')
            .replace('⅖', '0.4')
            .replace('½', '0.5')
            .replace('⅗', '0.6')
            .replace('⅔', '0.667')
            .replace('⅝', '0.625')
            .replace('¾', '0.75')
            .replace('⅘', '0.8')
            .replace('⅚', '0.833')
            .replace('⅞', '0.875')
          unit = quantityMatch.at(-1)?.trim() ?? ''
        }
        else if (quantityMatch.length === 3) {
          // nur Zahl
          quantity = quantityMatch[1]
          unit = quantityMatch.at(-1)?.trim() ?? ''
        }
        ingredients.push({
          id: `ingredient-${index + 1}`,
          name,
          quantity: Number.parseFloat(quantity.replace(',', '.')),
          unit,
        })
      }
    }
    else if (trimmed.length > 2) {
      // Fallback für Zutaten ohne Mengenangabe
      ingredients.push({
        id: `ingredient-${index + 1}`,
        name: trimmed,
        quantity: 1,
        unit: 'Stk',
      })
    }
  })

  return { ingredients, portions }
}

/** Parse instruction steps from text */
function parseInstructions(text: string): string[] {
  const instructions: string[] = []

  // Find instructions section
  const instructionsMatch = text.match(
    /Anleitung für[^:]*:([\s\S]*?)(?=Lass es dir schmecken|#YAZIO|$)/i,
  )

  if (!instructionsMatch) {
    return instructions
  }

  const instructionText = instructionsMatch[1]

  // Split by numbered steps
  const steps = instructionText.split(/\d+\.\s*/).filter(step => step.trim())

  steps.forEach((step) => {
    const trimmed = step.trim()
    if (trimmed) {
      instructions.push(trimmed)
    }
  })

  return instructions
}

/** Convert instructions to RecipeStep objects */
function createStepsFromInstructions(instructions: string[]): RecipeStep[] {
  return instructions.map((instruction, index) => ({
    id: `step-${index + 1}`,
    instruction,
    order: index + 1,
    image: undefined,
  }))
}

/** Main function to parse recipe text into structured data */
export function parseRecipeText(text: string): ParsedRecipe {
  const title = extractTitle(text)
  const metadata = parseMetadata(text)
  const description = extractDescription(text)
  const { ingredients, portions } = parseIngredients(text)
  const instructions = parseInstructions(text)
  const steps = createStepsFromInstructions(instructions)

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
  }
}
