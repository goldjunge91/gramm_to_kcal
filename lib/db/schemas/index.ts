import { relations } from "drizzle-orm";

// Import for relations
import { account, session, user } from "./auth-schema";
import { products } from "./products";
import { ingredients, recipes } from "./recipes";

// Export all schema tables
export * from "./auth-schema";
export * from "./products";
export * from "./recipes";

// Relations
export const userRelations = relations(user, ({ many }) => ({
  products: many(products),
  recipes: many(recipes),
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const recipesRelations = relations(recipes, ({ many, one }) => ({
  ingredients: many(ingredients),
  user: one(user, {
    fields: [recipes.userId],
    references: [user.id],
  }),
}));

export const ingredientsRelations = relations(ingredients, ({ one }) => ({
  recipe: one(recipes, {
    fields: [ingredients.recipeId],
    references: [recipes.id],
  }),
  user: one(user, {
    fields: [ingredients.userId],
    references: [user.id],
  }),
}));

export const productsRelations = relations(products, ({ one }) => ({
  user: one(user, {
    fields: [products.userId],
    references: [user.id],
  }),
}));

// Re-export types for convenience
export type {
  NewProduct,
  Product,
} from "./products";

export type {
  Ingredient,
  NewIngredient,
  NewRecipe,
  Recipe
} from "./recipes";

// Export User type from auth schema
export type User = typeof user.$inferSelect;