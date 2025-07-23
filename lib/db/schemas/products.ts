import { eq } from "drizzle-orm";
import {
    boolean,
    index,
    integer,
    pgEnum,
    pgTable,
    real,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth-schema";

// Sync status enum for offline functionality
export const syncStatusEnum = pgEnum("sync_status", [
    "synced",
    "pending",
    "conflict",
]);

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

export const products = pgTable("products", {
    ...syncMetadata,
    name: text("name").notNull(),
    quantity: real("quantity").notNull(), // in grams
    kcal: real("kcal").notNull(),
}, table => ({
    // Critical performance indexes based on common query patterns
    userCreatedIdx: index("products_user_created_idx").on(table.userId, table.createdAt.desc()),
    userActiveIdx: index("products_user_active_idx").on(table.userId).where(eq(table.isDeleted, false)),
    userSyncIdx: index("products_user_sync_idx").on(table.userId, table.syncStatus),
    nameSearchIdx: index("products_name_search_idx").on(table.name),
}));

// Types
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
