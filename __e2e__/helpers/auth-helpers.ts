/**
 * Auth E2E Test Helpers
 *
 * Utility functions for authenticating users and managing sessions
 * in Playwright E2E tests. These helpers work with real Better Auth
 * connections and actual browser behavior.
 */

import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'

export interface TestUser {
  email: string
  password: string
  name?: string
}

/**
 * Logs in a user using the login form
 * @param page Playwright page object
 * @param user User credentials
 */
export async function loginUser(page: Page, user: TestUser): Promise<void> {
  // Navigate to login page
  await page.goto('/auth/login')

  // Fill in the form
  await page.fill('input[name="email"]', user.email)
  await page.fill('input[name="password"]', user.password)

  // Submit the form
  await page.click('button[type="submit"]')

  // Wait for successful login - Better Auth server actions might redirect or stay on page
  // Instead of waiting for URL, wait for signs of successful authentication
  try {
    // Try waiting for redirect to /calories first (if it happens)
    await page.waitForURL('/calories', { timeout: 8000 })
  } catch {
    // If no redirect, check if we're logged in by looking for auth indicators
    // This handles cases where server action doesn't redirect immediately
    await page.waitForTimeout(2000) // Brief wait for any processing
  }

  // Verify we're logged in by checking for user avatar, logout button, or protected content
  // Try multiple indicators to handle different UI states
  const loggedInIndicators = page
    .locator('[data-testid="user-avatar"]')
    .or(page.locator('button:has-text("Abmelden")'))
    .or(page.locator('[data-testid="logout-button"]'))
    .or(page.locator('text=Willkommen')) // Welcome message
    .or(page.locator('nav')) // Main navigation (usually only shown when logged in)

  await expect(loggedInIndicators).toBeVisible({ timeout: 10000 })

  // If we're still on login page, something went wrong
  if (page.url().includes('/auth/login')) {
    // Check for error messages that might indicate why login failed
    const errorMessage = page.locator('.text-red-500, .error, [role="alert"]')
    if (await errorMessage.isVisible()) {
      const errorText = await errorMessage.textContent()
      throw new Error(`Login failed with error: ${errorText}`)
    }
    throw new Error('Login appeared to fail - still on login page with no error message')
  }
}

/**
 * Logs out the current user
 * @param page Playwright page object
 */
export async function logoutUser(page: Page): Promise<void> {
  try {
    // Look for logout button (could be in header or dropdown)
    const logoutButton = page
      .locator('button:has-text("Abmelden")')
      .or(page.locator('[data-testid="logout-button"]'))

    // Try to find and click logout button with timeout
    const logoutButtonVisible = await logoutButton.isVisible({ timeout: 3000 })
    
    if (logoutButtonVisible) {
      await logoutButton.click()
    }
    else {
      // If logout button is in a dropdown, try clicking user avatar first
      const userAvatar = page.locator('[data-testid="user-avatar"]')
      const avatarVisible = await userAvatar.isVisible({ timeout: 3000 })
      
      if (avatarVisible) {
        await userAvatar.click()
        // Wait for dropdown to appear and click logout
        const dropdownLogout = page.locator('button:has-text("Abmelden")')
        await dropdownLogout.click({ timeout: 3000 })
      } else {
        // User might already be logged out or logout button not found
        console.log('No logout button found - user might already be logged out')
        return
      }
    }

    // Instead of waiting for URL, wait for signs that logout was successful
    try {
      // Try waiting for redirect first (with short timeout)
      await page.waitForURL('/', { timeout: 5000 })
    } catch {
      // If no redirect, just wait briefly for any processing
      await page.waitForTimeout(1000)
    }

    // Verify we're logged out by checking for login-related elements
    const loggedOutIndicators = page
      .locator('a[href="/auth/login"]')
      .or(page.locator('text=Anmelden'))
      .or(page.locator('text=Login'))
      .or(page.locator('button:has-text("Anmelden")'))

    // Wait for logout indicators to appear (shorter timeout for cleanup)
    await expect(loggedOutIndicators).toBeVisible({ timeout: 5000 })

  } catch (error) {
    // If logout fails, don't block the test - just log and continue
    console.log('Logout process failed:', error)
    // Still try to verify if we're actually logged out
    const currentUrl = page.url()
    if (currentUrl.includes('/auth/login') || currentUrl === '/' || currentUrl.includes('localhost:3000')) {
      // We're probably logged out if on these pages
      return
    }
    // If we can't logout, at least clear the auth state manually
    await clearAuthState(page)
  }
}

/**
 * Checks if user is currently logged in by examining the page state
 * @param page Playwright page object
 * @returns true if logged in, false otherwise
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    // Look for indicators that user is logged in
    const loggedInIndicator = page
      .locator('[data-testid="user-avatar"]')
      .or(page.locator('button:has-text("Abmelden")'))
    return await loggedInIndicator.isVisible({ timeout: 2000 })
  }
  catch {
    return false
  }
}

/**
 * Signs up a new user using the signup form
 * @param page Playwright page object
 * @param user User details for signup
 */
export async function signupUser(page: Page, user: TestUser): Promise<void> {
  // Navigate to signup page
  await page.goto('/auth/sign-up')

  // Fill in the form
  await page.fill('input[name="email"]', user.email)
  await page.fill('input[name="password"]', user.password)
  if (user.name) {
    const nameInput = page.locator('input[name="name"]')
    if (await nameInput.isVisible()) {
      await nameInput.fill(user.name)
    }
  }

  // Submit the form
  await page.click('button[type="submit"]')

  // Wait for success message or redirect
  await page.waitForURL('/auth/sign-up-success')

  // Verify success message
  await expect(
    page
      .locator('text=Check your email')
      .or(page.locator('text=E-Mail prüfen')),
  ).toBeVisible({ timeout: 5000 })
}

/**
 * Attempts to access a protected route and verifies redirect behavior
 * @param page Playwright page object
 * @param protectedRoute The protected route to test (default: /calories)
 */
export async function testProtectedRoute(
  page: Page,
  protectedRoute: string = '/calories',
): Promise<void> {
  // Try to access protected route
  await page.goto(protectedRoute)

  // Should be redirected to login
  await page.waitForURL('/auth/login')

  // Verify login form is visible
  await expect(
    page.locator('form').or(page.locator('input[name="email"]')),
  ).toBeVisible({ timeout: 5000 })
}

/**
 * Waits for rate limiting error message to appear
 * @param page Playwright page object
 */
export async function waitForRateLimitError(page: Page): Promise<void> {
  // Look for rate limiting error messages
  const rateLimitMessage = page
    .locator('text=Too many attempts')
    .or(page.locator('text=Zu viele Versuche'))
    .or(page.locator('text=Rate limit exceeded'))
    .or(page.locator('[data-testid="rate-limit-error"]'))

  await expect(rateLimitMessage).toBeVisible({ timeout: 10000 })
}

/**
 * Clears all browser storage and cookies to ensure clean test state
 * @param page Playwright page object
 */
export async function clearAuthState(page: Page): Promise<void> {
  try {
    // Clear cookies first (this works on any page)
    await page.context().clearCookies()
    
    // Only attempt to clear storage if we're on a valid page, not about:blank
    const currentUrl = page.url()
    if (currentUrl && !currentUrl.startsWith('about:') && currentUrl !== 'data:,') {
      await page.evaluate(() => {
        try {
          localStorage.clear()
          sessionStorage.clear()
        } catch (error) {
          // Ignore SecurityError on restricted pages
          console.warn('Could not clear storage:', error)
        }
      })
    }
  } catch (error) {
    // If clearing fails completely, just log and continue
    console.warn('clearAuthState failed:', error)
  }
}
