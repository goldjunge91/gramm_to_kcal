import { sql } from "drizzle-orm";
import { db } from "../lib/db";

async function dropRlsPolicies() {
    try {
        await db.execute(
            sql`DROP POLICY IF EXISTS "Users can view own profile" ON users;`,
        );
        await db.execute(
            sql`DROP POLICY IF EXISTS "Users can update own profile" ON users;`,
        );
        await db.execute(
            sql`DROP POLICY IF EXISTS "Users can insert own profile" ON users;`,
        );
        await db.execute(
            sql`DROP POLICY IF EXISTS "Users can view own products" ON products;`,
        );
        await db.execute(
            sql`DROP POLICY IF EXISTS "Users can insert own products" ON products;`,
        );
        await db.execute(
            sql`DROP POLICY IF EXISTS "Users can update own products" ON products;`,
        );
        await db.execute(
            sql`DROP POLICY IF EXISTS "Users can delete own products" ON products;`,
        );
        await db.execute(
            sql`DROP POLICY IF EXISTS "Users can view own recipes" ON recipes;`,
        );
        await db.execute(
            sql`DROP POLICY IF EXISTS "Users can insert own recipes" ON recipes;`,
        );
        await db.execute(
            sql`DROP POLICY IF EXISTS "Users can update own recipes" ON recipes;`,
        );
        await db.execute(
            sql`DROP POLICY IF EXISTS "Users can delete own recipes" ON recipes;`,
        );
        await db.execute(
            sql`DROP POLICY IF EXISTS "Users can view own ingredients" ON ingredients;`,
        );
        await db.execute(
            sql`DROP POLICY IF EXISTS "Users can insert own ingredients" ON ingredients;`,
        );
        await db.execute(
            sql`DROP POLICY IF EXISTS "Users can update own ingredients" ON ingredients;`,
        );
        await db.execute(
            sql`DROP POLICY IF EXISTS "Users can delete own ingredients" ON ingredients;`,
        );
        await db.execute(
            sql`DROP POLICY IF EXISTS "Users can view own posts" ON posts_table;`,
        );
        await db.execute(
            sql`DROP POLICY IF EXISTS "Users can insert own posts" ON posts_table;`,
        );
        await db.execute(
            sql`DROP POLICY IF EXISTS "Users can update own posts" ON posts_table;`,
        );
        await db.execute(
            sql`DROP POLICY IF EXISTS "Users can delete own posts" ON posts_table;`,
        );
        console.log("RLS policies dropped successfully.");
    } catch (error) {
        console.error("Error dropping RLS policies:", error);
    }
}

dropRlsPolicies();
