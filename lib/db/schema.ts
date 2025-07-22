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
} from "drizzle-orm/pg-core";

// export const users = pgTable("users", {
//   id: uuid("id").primaryKey(), // Match Supabase Auth UUID format
//   fullName: text("full_name"),
//   phone: varchar("phone", { length: 256 }),
//   email: varchar("email", { length: 256 }).unique(),
//   createdAt: timestamp("created_at").defaultNow().notNull(),
//   updatedAt: timestamp("updated_at").defaultNow().notNull(),
// });

export const users = pgTable("users", {
  id: uuid("id").primaryKey(), // Match Supabase Auth UUID format
  email: text("email").unique(),
  fullName: text("full_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const postsTable = pgTable("posts_table", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .$onUpdate(() => new Date()),
});

export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;

export type InsertPost = typeof postsTable.$inferInsert;
export type SelectPost = typeof postsTable.$inferSelect;

// Sync status enum for offline functionality
export const syncStatusEnum = pgEnum("sync_status", [
  "synced",
  "pending",
  "conflict",
]);

// Base sync metadata for offline-first architecture (Legacy - Supabase users)
const syncMetadata = {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => betterAuthUser.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  syncStatus: syncStatusEnum("sync_status").default("synced").notNull(),
  lastSyncAt: timestamp("last_sync_at"),
  version: integer("version").default(1).notNull(),
  isDeleted: boolean("is_deleted").default(false).notNull(),
};

// Better Auth compatible metadata
const betterAuthSyncMetadata = {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => betterAuthUser.id, { onDelete: "cascade" }),
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

// Better Auth Tables
export const betterAuthUser = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => betterAuthUser.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => betterAuthUser.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(
    () => new Date(),
  ),
  updatedAt: timestamp("updated_at").$defaultFn(
    () => new Date(),
  ),
});
