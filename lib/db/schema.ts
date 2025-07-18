import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  fullName: text("full_name"),
  phone: varchar("phone", { length: 256 }),
});

// Sync status enum for offline functionality
export const syncStatusEnum = pgEnum("sync_status", [
  "synced",
  "pending",
  "conflict",
]);

// Base sync metadata for offline-first architecture
const syncMetadata = {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  syncStatus: syncStatusEnum("sync_status").default("synced").notNull(),
  lastSyncAt: timestamp("last_sync_at"),
  version: integer("version").default(1).notNull(),
  isDeleted: boolean("is_deleted").default(false).notNull(),
};

export const products = pgTable("products", {
  ...syncMetadata,
  name: text("name").notNull(),
  quantity: real("quantity").notNull(), // in grams
  kcal: real("kcal").notNull(),
});

export const recipes = pgTable("recipes", {
  ...syncMetadata,
  name: text("name").notNull(),
  originalPortions: integer("original_portions").notNull(),
  description: text("description"),
});

export const ingredients = pgTable("ingredients", {
  ...syncMetadata,
  recipeId: uuid("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  quantity: real("quantity").notNull(),
  unit: text("unit").notNull(),
  order: integer("order").default(0).notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  products: many(products),
  recipes: many(recipes),
}));

export const recipesRelations = relations(recipes, ({ many, one }) => ({
  ingredients: many(ingredients),
  user: one(users, {
    fields: [recipes.userId],
    references: [users.id],
  }),
}));

export const ingredientsRelations = relations(ingredients, ({ one }) => ({
  recipe: one(recipes, {
    fields: [ingredients.recipeId],
    references: [recipes.id],
  }),
  user: one(users, {
    fields: [ingredients.userId],
    references: [users.id],
  }),
}));

export const productsRelations = relations(products, ({ one }) => ({
  user: one(users, {
    fields: [products.userId],
    references: [users.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Recipe = typeof recipes.$inferSelect;
export type Ingredient = typeof ingredients.$inferSelect;

export type NewProduct = typeof products.$inferInsert;
export type NewRecipe = typeof recipes.$inferInsert;
export type NewIngredient = typeof ingredients.$inferInsert;
