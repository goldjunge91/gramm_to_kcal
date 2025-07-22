'use server'

import { revalidatePath } from 'next/cache'

import { auth } from '@/lib/auth/auth'

/**
 * Get current authenticated user from Better Auth
 */
export async function getCurrentUser() {
  try {
    const session = await auth.api.getSession({
      headers: new Headers(),
    })

    if (!session?.user) {
      return null
    }

    return session.user
  }
  catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Server action for updating user profile
 */
export async function updateUserProfileAction(updates: {
  fullName?: string | null
}) {
  try {
    const session = await auth.api.getSession({
      headers: new Headers(),
    })

    if (!session?.user) {
      throw new Error('User not authenticated')
    }

    // Update user profile using Better Auth
    await auth.api.updateUser({
      body: {
        name: updates.fullName || undefined,
      },
      headers: new Headers(),
    })

    // Revalidate any cached user data
    revalidatePath('/account')

    return { success: true, user: session.user }
  }
  catch (error) {
    console.error('Error updating user profile:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
