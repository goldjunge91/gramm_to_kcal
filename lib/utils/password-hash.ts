/* eslint-disable regexp/no-unused-capturing-group */
/**
 * Client-side password hashing utilities
 * Implements secure password hashing on the client side before sending to server
 */

import bcrypt from 'bcryptjs'

/**
 * Hash a password on the client side using bcrypt
 * @param password - Plain text password
 * @param saltRounds - Number of salt rounds (default: 12)
 * @returns Promise<string> - Hashed password
 */
export async function hashPassword(
  password: string,
  saltRounds: number = 12,
): Promise<string> {
  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(saltRounds)
    const hashedPassword = await bcrypt.hash(password, salt)
    return hashedPassword
  }
  catch (error) {
    console.error('Error hashing password:', error)
    throw new Error('Failed to hash password')
  }
}

/**
 * Validate password strength on the client side
 * @param password - Plain text password
 * @returns Object with validation results
 */
export function validatePasswordStrength(password: string) {
  const minLength = 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  const checks = {
    minLength: password.length >= minLength,
    hasUpperCase,
    hasLowerCase,
    hasNumbers,
    hasSpecialChar,
  }

  const score = Object.values(checks).filter(Boolean).length

  let strength: 'weak' | 'fair' | 'good' | 'strong'
  if (score < 2)
    strength = 'weak'
  else if (score < 3)
    strength = 'fair'
  else if (score < 4)
    strength = 'good'
  else strength = 'strong'

  const messages: string[] = []
  if (!checks.minLength)
    messages.push(`At least ${minLength} characters`)
  if (!checks.hasUpperCase)
    messages.push('One uppercase letter')
  if (!checks.hasLowerCase)
    messages.push('One lowercase letter')
  if (!checks.hasNumbers)
    messages.push('One number')
  if (!checks.hasSpecialChar)
    messages.push('One special character')

  return {
    isValid: score >= 3, // Require at least 3 criteria
    strength,
    score,
    checks,
    messages,
  }
}

/**
 * Generate a secure random salt
 * @param rounds - Number of salt rounds
 * @returns Promise<string> - Generated salt
 */
export async function generateSalt(rounds: number = 12): Promise<string> {
  try {
    return await bcrypt.genSalt(rounds)
  }
  catch (error) {
    console.error('Error generating salt:', error)
    throw new Error('Failed to generate salt')
  }
}

/**
 * Compare a plain text password with a hashed password
 * @param password - Plain text password
 * @param hashedPassword - Hashed password
 * @returns Promise<boolean> - Whether passwords match
 */
export async function comparePassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hashedPassword)
  }
  catch (error) {
    console.error('Error comparing passwords:', error)
    return false
  }
}

/**
 * Enhanced password validation with common password checks
 * @param password - Plain text password
 * @returns Object with detailed validation results
 */
export function validatePasswordSecurity(password: string) {
  const basicValidation = validatePasswordStrength(password)

  // Common weak passwords (simplified list)
  const commonPasswords = [
    'password',
    '123456',
    'password123',
    'admin',
    'qwerty',
    'letmein',
    'welcome',
    'monkey',
    'dragon',
    'master',
  ]

  const isCommonPassword = commonPasswords.some(common =>
    password.toLowerCase().includes(common.toLowerCase()),
  )

  // Check for repeated characters
  const hasRepeatedChars = /(.)\1{2,}/.test(password)

  // Check for sequential characters
  const hasSequential
    = /(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|123|234|345|456|567|678|789)/i.test(
      password,
    )

  const additionalChecks = {
    isCommonPassword,
    hasRepeatedChars,
    hasSequential,
  }

  const additionalMessages: string[] = []
  if (isCommonPassword)
    additionalMessages.push('Avoid common passwords')
  if (hasRepeatedChars)
    additionalMessages.push('Avoid repeated characters')
  if (hasSequential)
    additionalMessages.push('Avoid sequential characters')

  const overallValid
    = basicValidation.isValid
      && !isCommonPassword
      && !hasRepeatedChars
      && !hasSequential

  return {
    ...basicValidation,
    isValid: overallValid,
    additionalChecks,
    allMessages: [...basicValidation.messages, ...additionalMessages],
  }
}
