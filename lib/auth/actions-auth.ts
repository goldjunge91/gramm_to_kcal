'use server'

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { auth } from '@/lib/auth/auth';
import { REDIRECT_PATHS } from '@/lib/auth/routes';

// Validation schemas
const signInSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
})

const signUpSchema = z
  .object({
    email: z
      .string()
      .email('Invalid email address')
      .min(1, 'Email is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long'),
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
    name: z.string().min(1, 'Name is required'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

// Audit logging helper
function logAuthAttempt(
  type: 'signin' | 'signup' | 'signout',
  email: string,
  success: boolean,
  error?: string,
) {
  console.log(
    `[BETTER_AUTH] ${type.toUpperCase()} - ${email} - ${success ? 'SUCCESS' : 'FAILED'}${error ? ` - ${error}` : ''}`,
  )
}

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
 * Server action for Better Auth login
 */
export async function loginAction(formData: FormData) {
  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  // Input validation with Zod
  const validation = signInSchema.safeParse(rawData)
  if (!validation.success) {
    const errorMessage = validation.error.issues[0]?.message || 'Invalid input'
    logAuthAttempt('signin', rawData.email || 'unknown', false, errorMessage)
    redirect(`/auth/login?error=${encodeURIComponent(errorMessage)}`)
  }

  const { email, password } = validation.data

  try {
    const result = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    })

    if (!result.user) {
      logAuthAttempt('signin', email, false, 'Invalid credentials')
      redirect(`/auth/login?error=${encodeURIComponent('Invalid email or password')}`)
    }

    logAuthAttempt('signin', email, true)

    // Revalidate layout to update auth state
    revalidatePath('/', 'layout')

    // Redirect to main app
    redirect(REDIRECT_PATHS.DEFAULT_AFTER_LOGIN)
  }
  catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unexpected error'
    logAuthAttempt('signin', email, false, errorMsg)
    redirect(`/auth/login?error=${encodeURIComponent('Login failed. Please try again.')}`)
  }
}

/**
 * Server action for Better Auth signup
 */
export async function signupAction(formData: FormData) {
  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
    name: formData.get('name') as string,
  }

  // Input validation with Zod
  const validation = signUpSchema.safeParse(rawData)
  if (!validation.success) {
    const errorMessage = validation.error.issues[0]?.message || 'Invalid input'
    logAuthAttempt('signup', rawData.email || 'unknown', false, errorMessage)
    redirect(`/auth/sign-up?error=${encodeURIComponent(errorMessage)}`)
  }

  const { email, password, name } = validation.data

  try {
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    })

    if (!result.user) {
      logAuthAttempt('signup', email, false, 'Signup failed')
      redirect(`/auth/sign-up?error=${encodeURIComponent('Account creation failed')}`)
    }

    logAuthAttempt('signup', email, true)

    // Revalidate layout to update auth state
    revalidatePath('/', 'layout')

    // Redirect to main app
    redirect(REDIRECT_PATHS.DEFAULT_AFTER_LOGIN)
  }
  catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unexpected error'
    logAuthAttempt('signup', email, false, errorMsg)
    redirect(`/auth/sign-up?error=${encodeURIComponent('Account creation failed')}`)
  }
}

/**
 * Server action to sign out user
 */
export async function signOutUser() {
  try {
    await auth.api.signOut({
      headers: new Headers(),
    })

    revalidatePath('/', 'layout')
    redirect('/auth/login')
  }
  catch (error) {
    console.error('Sign out error:', error)
    redirect('/auth/login?error=Sign out failed')
  }
}

/**
 * Server action for password reset (custom implementation)
 * Note: Better Auth doesn't have built-in email reset, so we'll implement basic version
 */
export async function resetPasswordAction(formData: FormData) {
  const email = formData.get('email') as string

  if (!email) {
    return { success: false, error: 'Email is required' }
  }

  try {
    // Note: This is a placeholder - in production you'd implement proper email reset
    // For now, we'll return success but explain that it's not implemented
    console.log('Password reset requested for:', email)

    return {
      success: true,
      message: 'Password reset is not yet implemented with Better Auth. Please contact support.',
    }
  }
  catch (error) {
    console.error('Password reset error:', error)
    return {
      success: false,
      error: 'Password reset failed',
    }
  }
}

/**
 * Server action for updating user password
 * Note: This is a simplified implementation - in production you'd verify the user's current password
 */
export async function updatePasswordAction(formData: FormData) {
  const newPassword = formData.get('password') as string

  if (!newPassword) {
    return { success: false, error: 'New password is required' }
  }

  if (newPassword.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters long' }
  }

  try {
    const session = await auth.api.getSession({
      headers: new Headers(),
    })

    if (!session?.user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Update user password using Better Auth
    await auth.api.setPassword({
      body: {
        newPassword,
      },
      headers: new Headers(),
    })

    return {
      success: true,
      message: 'Password updated successfully',
    }
  }
  catch (error) {
    console.error('Password update error:', error)
    return {
      success: false,
      error: 'Password update failed',
    }
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
