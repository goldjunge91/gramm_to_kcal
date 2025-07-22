/**
 * Auth E2E Test Helpers
 *
 * Utility functions for authenticating users and managing sessions
 * in Playwright E2E tests. These helpers work with real Supabase
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

  // Wait for successful login (redirect to main app)
  await page.waitForURL('/calories')

  // Verify we're logged in by checking for user avatar or logout button
  await expect(
    page
      .locator('[data-testid="user-avatar"]')
      .or(page.locator('button:has-text("Abmelden")')),
  ).toBeVisible({ timeout: 5000 })
}

/**
 * Logs out the current user
 * @param page Playwright page object
 */
export async function logoutUser(page: Page): Promise<void> {
  // Look for logout button (could be in header or dropdown)
  const logoutButton = page
    .locator('button:has-text("Abmelden")')
    .or(page.locator('[data-testid="logout-button"]'))

  if (await logoutButton.isVisible()) {
    await logoutButton.click()
  }
  else {
    // If logout button is in a dropdown, try clicking user avatar first
    const userAvatar = page.locator('[data-testid="user-avatar"]')
    if (await userAvatar.isVisible()) {
      await userAvatar.click()
      await page.locator('button:has-text("Abmelden")').click()
    }
  }

  // Wait for redirect to home page
  await page.waitForURL('/')

  // Verify we're logged out by checking login link is visible
  await expect(
    page.locator('a[href="/auth/login"]').or(page.locator('text=Anmelden')),
  ).toBeVisible({ timeout: 5000 })
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
  await page.context().clearCookies()
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
}
