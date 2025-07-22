/**
 * Server-only User-Datenbankfunktionen.
 *
 * Darf NUR im Server-Kontext verwendet werden:
 * - Server-Komponenten
 * - API-Routen
 * Niemals in Client-Komponenten oder Hooks importieren!
 *
 * Beispiel für Server-Import:
 * import { upsertUser } from "@/lib/db/users";
 */
import type { User as SupabaseUser } from "@supabase/supabase-js";

import { eq } from "drizzle-orm";

import { db } from "./index";
import { user as users } from "./schemas";

// Use our database User type instead of Supabase User type  
type DatabaseUser = typeof users.$inferSelect;

/**
 * Create or update user in database when they sign up/sign in via Supabase Auth
 */
export async function upsertUser(
  supabaseUser: SupabaseUser,
): Promise<DatabaseUser> {
  const userData = {
    id: supabaseUser.id,
    email: supabaseUser.email || null,
    fullName:
      supabaseUser.user_metadata?.full_name ||
      supabaseUser.user_metadata?.name ||
      supabaseUser.email?.split("@")[0] ||
      null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Try to update existing user first
  const existingUsers = await db
    .update(users)
    .set(userData)
    .where(eq(users.id, supabaseUser.id))
    .returning();

  if (existingUsers.length > 0) {
    return existingUsers[0];
  }

  // If user doesn't exist, create new one
  const newUsers = await db.insert(users).values(userData).returning();

  return newUsers[0];
}

/**
 * Get user by ID
 */
export async function getUserById(
  userId: string,
): Promise<DatabaseUser | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return result[0] || null;
}

/**
 * Get user by email
 */
export async function getUserByEmail(
  email: string,
): Promise<DatabaseUser | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return result[0] || null;
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<DatabaseUser, "fullName">>,
): Promise<DatabaseUser | null> {
  const result = await db
    .update(users)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  return result[0] || null;
}

/**
 * Delete user and all associated data
 */
export async function deleteUser(userId: string): Promise<boolean> {
  try {
    await db.delete(users).where(eq(users.id, userId));
    return true;
  } catch (error) {
    console.error("Error deleting user:", error);
    return false;
  }
}
