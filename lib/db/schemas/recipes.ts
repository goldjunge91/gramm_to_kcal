import {
    boolean,
    integer,
    pgTable,
    real,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth-schema";
import { syncStatusEnum } from "./products";

// Base sync metadata for offline-first architecture
const syncMetadata = {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    syncStatus: syncStatusEnum("sync_status").default("synced").notNull(),
    lastSyncAt: timestamp("last_sync_at"),
    version: integer("version").default(1).notNull(),
    isDeleted: boolean("is_deleted").default(false).notNull(),
};

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

// Types
export type Recipe = typeof recipes.$inferSelect;
export type Ingredient = typeof ingredients.$inferSelect;
export type NewRecipe = typeof recipes.$inferInsert;
export type NewIngredient = typeof ingredients.$inferInsert;
