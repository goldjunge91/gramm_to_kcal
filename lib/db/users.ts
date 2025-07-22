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
import { eq } from 'drizzle-orm'

import { db } from './index'
import { user as users } from './schemas'

// Use Better Auth User type
type DatabaseUser = typeof users.$inferSelect
interface BetterAuthUser {
  id: string
  email: string | null
  name: string
  image?: string
}

/**
 * Create or update user in database when they sign up/sign in via Better Auth
 */
export async function upsertUser(
  betterAuthUser: BetterAuthUser,
): Promise<DatabaseUser> {
  const userData = {
    id: betterAuthUser.id,
    email: betterAuthUser.email || '',
    name: betterAuthUser.name
      || betterAuthUser.email?.split('@')[0]
      || 'Unknown User',
    emailVerified: false,
    image: betterAuthUser.image || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  // Try to update existing user first
  const existingUsers = await db
    .update(users)
    .set(userData)
    .where(eq(users.id, betterAuthUser.id))
    .returning()

  if (existingUsers.length > 0) {
    return existingUsers[0]
  }

  // If user doesn't exist, create new one
  const newUsers = await db.insert(users).values(userData).returning()

  return newUsers[0]
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
    .limit(1)

  return result[0] || null
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
    .limit(1)

  return result[0] || null
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<DatabaseUser, 'name'>>,
): Promise<DatabaseUser | null> {
  const result = await db
    .update(users)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning()

  return result[0] || null
}

/**
 * Delete user and all associated data
 */
export async function deleteUser(userId: string): Promise<boolean> {
  try {
    await db.delete(users).where(eq(users.id, userId))
    return true
  }
  catch (error) {
    console.error('Error deleting user:', error)
    return false
  }
}
