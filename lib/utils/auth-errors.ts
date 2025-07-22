/**
 * Utility functions for handling authentication errors consistently across the app
 */

export interface AuthError {
  message: string
  code?: string
  details?: string
}

/**
 * Maps Supabase auth errors to user-friendly messages
 */
export function getAuthErrorMessage(error: any): string {
  if (!error)
    return 'An unexpected error occurred'

  const message = error.message || error.toString()
  const code = error.code || error.error_code

  // Map specific error codes first
  switch (code) {
    case 'invalid_credentials':
    case 'email_not_confirmed':
    case 'invalid_grant':
      return 'Invalid email or password. Please check your credentials and try again.'

    case 'signup_disabled':
      return 'Account registration is currently disabled. Please contact support.'

    case 'email_address_invalid':
      return 'Please enter a valid email address.'

    case 'weak_password':
      return 'Password must be at least 6 characters long and contain a mix of letters and numbers.'

    case 'user_already_exists':
      return 'An account with this email already exists. Please sign in instead.'

    case 'too_many_requests':
      return 'Too many attempts. Please wait a few minutes before trying again.'

    case 'email_address_not_authorized':
      return 'This email address is not authorized to create an account.'

    default:
      break
  }

  // Map common error message patterns
  if (message.includes('Invalid login credentials')) {
    return 'Invalid email or password. Please check your credentials and try again.'
  }

  if (message.includes('Email not confirmed')) {
    return 'Please check your email and click the confirmation link before signing in.'
  }

  if (message.includes('User already registered')) {
    return 'An account with this email already exists. Please sign in instead.'
  }

  if (message.includes('Password should be at least')) {
    return 'Password must be at least 6 characters long.'
  }

  if (message.includes('Invalid email')) {
    return 'Please enter a valid email address.'
  }

  if (message.includes('Signup is disabled')) {
    return 'Account registration is currently disabled. Please contact support.'
  }

  if (message.includes('Too many requests')) {
    return 'Too many attempts. Please wait a few minutes before trying again.'
  }

  if (message.includes('User not found')) {
    return 'No account found with this email address. Please sign up first.'
  }

  if (message.includes('New password should be different')) {
    return 'Your new password must be different from your current password.'
  }

  if (message.includes('Invalid password')) {
    return 'Please enter a valid password.'
  }

  if (message.includes('Session not found')) {
    return 'Your session has expired. Please sign in again.'
  }

  if (message.includes('Invalid refresh token')) {
    return 'Your session has expired. Please sign in again.'
  }

  // Return the original message if no mapping found
  return message
}

/**
 * Determines if an error is recoverable (user can retry)
 */
export function isRecoverableError(error: any): boolean {
  if (!error)
    return false

  const message = error.message || error.toString()
  const code = error.code || error.error_code

  // Non-recoverable errors
  const nonRecoverablePatterns = [
    'signup_disabled',
    'email_address_not_authorized',
    'User already registered',
    'Signup is disabled',
  ]

  const nonRecoverableCodes = [
    'signup_disabled',
    'email_address_not_authorized',
    'user_already_exists',
  ]

  if (nonRecoverableCodes.includes(code)) {
    return false
  }

  if (nonRecoverablePatterns.some(pattern => message.includes(pattern))) {
    return false
  }

  return true
}

/**
 * Gets appropriate action text for error recovery
 */
export function getErrorActionText(error: any): string {
  if (!isRecoverableError(error)) {
    return 'Contact Support'
  }

  const message = error.message || error.toString()

  if (message.includes('Email not confirmed')) {
    return 'Resend Confirmation'
  }

  if (message.includes('User not found')) {
    return 'Sign Up Instead'
  }

  if (message.includes('User already registered')) {
    return 'Sign In Instead'
  }

  return 'Try Again'
}

/**
 * Creates a standardized error object
 */
export function createAuthError(error: any): AuthError {
  return {
    message: getAuthErrorMessage(error),
    code: error.code || error.error_code,
    details: error.message || error.toString(),
  }
}
