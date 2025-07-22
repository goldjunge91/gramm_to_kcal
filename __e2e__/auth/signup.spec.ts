/**
 * Signup Flow E2E Tests
 *
 * Tests user registration functionality including form validation,
 * successful signup, error handling, and email verification flow.
 */

import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'

import testUsers from '../fixtures/test-users.json'

// Helper function to log in a user
// eslint-disable-next-line unused-imports/no-unused-vars
async function loginUser(page: Page, user: { email: any, password: any, name?: string }) {
  await page.goto('/auth/login')
  await page.fill('input[name="email"]', user.email)
  await page.fill('input[name="password"]', user.password)
  await page.click('button[type="submit"]')
  // Wait for login to complete (adjust selector as needed)
  await page.waitForSelector('[data-testid="user-avatar"]', { timeout: 5000 })
}

// test.describe('Signup Flow @auth @core', () => {
test.describe('Signup Flow', () => {
  // test.beforeEach(async ({ page }) => {
  //   // Navigate to app first, then ensure clean state
  //   await page.goto('/')
  // })

  test('should successfully signup with valid details', async ({ page }) => {
    // Navigate to signup page
    await page.goto('/auth/sign-up')

    // Verify signup form is visible
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()

    // Generate unique email for this test run
    const uniqueEmail = `test-${Date.now()}@example.com`
    const testUser = {
      ...testUsers.newUser,
      email: uniqueEmail,
    }

    // Fill and submit the form
    await page.fill('input[name="name"]', testUser.name)
    await page.fill('input[name="email"]', testUser.email)
    await page.fill('input[name="password"]', testUser.password)
    await page.fill('input[name="confirmPassword"]', testUser.password)
    await page.click('button[type="submit"]')

    // Should be on success page
    await expect(page).toHaveURL('/auth/sign-up-success')

    // Verify success message is shown
    const successMessage = page
      .locator('text=You\'ve successfully signed up. Please check your email')

    await expect(successMessage).toBeVisible()
  })

  test('should show error for existing email', async ({ page }) => {
    await page.goto('/auth/sign-up')
    // Verify signup form is visible
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()

    await page.fill('input[name="name"]', testUsers.validUser.name)
    await page.fill('input[name="email"]', testUsers.validUser.email)
    await page.fill('input[name="password"]', testUsers.validUser.password)
    await page.fill('input[name="confirmPassword"]', testUsers.validUser.password)

    await page.click('button[type="submit"]')

    // Should show error for existing email
    const errorMessage = page
      .locator('text=An account with this email already exists. Please sign in instead.')
      .or(page.locator('text=User already registered'))
      .or(page.locator('text=Email already exists'))
      .or(page.locator('text=Benutzer bereits registriert'))
      .or(page.locator('[data-testid="signup-error"]'))
      .or(page.locator('.error').or(page.locator('[role="alert"]')))

    await expect(errorMessage).toBeVisible({ timeout: 5000 })

    // Should still be on signup page
    await expect(page).toHaveURL('/auth/sign-up')

    // Ensure test completes properly
    await page.waitForTimeout(100)
  })

  // test('should validate required fields', async ({ page }) => {
  //   await page.goto('/auth/sign-up')

  //   // Try to submit empty form
  //   await page.click('button[type="submit"]')

  //   // Should show validation errors for required fields
  //   const emailError = page
  //     .locator('text=Email is required')
  //     .or(page.locator('text=E-Mail ist erforderlich'))
  //     .or(page.locator('input[name="email"]:invalid'))

  //   const passwordError = page
  //     .locator('text=Password is required')
  //     .or(page.locator('text=Passwort ist erforderlich'))
  //     .or(page.locator('input[name="password"]:invalid'))

  //   await expect(emailError.first()).toBeVisible()
  //   await expect(passwordError.first()).toBeVisible()
  // })

  // test('should validate email format', async ({ page }) => {
  //   await page.goto('/auth/sign-up')

  //   // Fill invalid email format
  //   await page.fill('input[name="email"]', 'invalid-email')
  //   await page.fill('input[name="password"]', 'ValidPassword123!')
  //   await page.click('button[type="submit"]')

  //   // Should show email format validation error
  //   const emailFormatError = page
  //     .locator('text=Invalid email')
  //     .or(page.locator('text=Ungültige E-Mail'))
  //     .or(page.locator('input[name="email"]:invalid'))

  //   await expect(emailFormatError.first()).toBeVisible()
  // })

  // test('should validate password strength', async ({ page }) => {
  //   await page.goto('/auth/sign-up')

  //   // Fill valid email but weak password
  //   await page.fill('input[name="email"]', 'test@example.com')
  //   await page.fill('input[name="password"]', '123') // Too weak
  //   await page.click('button[type="submit"]')

  //   // Should show password strength error
  //   const passwordError = page
  //     .locator('text=Password too short')
  //     .or(page.locator('text=Passwort zu kurz'))
  //     .or(page.locator('text=Password must be'))
  //     .or(page.locator('input[name="password"]:invalid'))

  //   await expect(passwordError.first()).toBeVisible()
  // })

  // test('should have link to login page', async ({ page }) => {
  //   await page.goto('/auth/sign-up')

  //   // Should have link to login page
  //   const loginLink = page
  //     .locator('a[href="/auth/login"]')
  //     .or(page.locator('text=Already have an account'))
  //     .or(page.locator('text=Bereits registriert'))

  //   await expect(loginLink).toBeVisible()

  //   // Clicking should navigate to login
  //   await loginLink.first().click()
  //   await expect(page).toHaveURL('/auth/login')
  // })

  // test('should redirect logged-in user away from signup page', async ({
  //   page,
  // }) => {
  //   // First login with existing user
  //   await loginUser(page, testUsers.validUser)

  //   // Try to access signup page while logged in
  //   await page.goto('/auth/sign-up')

  //   // Should be redirected away from signup page
  //   await page.waitForURL('/calories', { timeout: 5000 })
  //   await expect(page).toHaveURL('/calories')

  //   // Verify we're still logged in
  //   const loggedInIndicator = page
  //     .locator('[data-testid="user-avatar"]')
  //     .or(page.locator('button:has-text("Abmelden")'))
  //   await expect(loggedInIndicator).toBeVisible()
  // })

  // test('should handle network errors gracefully', async ({ page }) => {
  //   await page.goto('/auth/sign-up')

  //   // Intercept and fail network requests to simulate server error
  //   await page.route('**/auth/**', async (route) => {
  //     await route.abort('failed')
  //   })

  //   // Try to signup
  //   await page.fill('input[name="email"]', 'networktest@example.com')
  //   await page.fill('input[name="password"]', 'NetworkTest123!')
  //   await page.click('button[type="submit"]')

  //   // Should show network error message
  //   const networkError = page
  //     .locator('text=Network error')
  //     .or(page.locator('text=Connection failed'))
  //     .or(page.locator('text=Netzwerkfehler'))
  //     .or(page.locator('[data-testid="network-error"]'))

  //   await expect(networkError).toBeVisible({ timeout: 5000 })

  //   // Should still be on signup page
  //   await expect(page).toHaveURL('/auth/sign-up')
  // })

  //   test('should handle form submission states correctly', async ({ page }) => {
  //     await page.goto('/auth/sign-up')

  //     // Fill form
  //     const uniqueEmail = `loading-test-${Date.now()}@example.com`
  //     await page.fill('input[name="email"]', uniqueEmail)
  //     await page.fill('input[name="password"]', 'LoadingTest123!')

  //     // Submit form and check for loading state
  //     const submitButton = page.locator('button[type="submit"]')
  //     await submitButton.click()

  //     // Button should show loading state or be disabled
  //     const loadingIndicator = page
  //       .locator('button[disabled]')
  //       .or(page.locator('text=Loading'))
  //       .or(page.locator('text=Wird geladen'))
  //       .or(page.locator('[data-testid="loading"]'))

  //     // Note: This might be very quick, so we use a short timeout
  //     await expect(loadingIndicator)
  //       .toBeVisible({ timeout: 2000 })
  //       .catch(() => {
  //         console.log('Loading state might be too quick to catch - this is okay')
  //       })
  //   })

  test.afterEach(async ({ page }) => {
    // Directly clear auth state to ensure test isolation.
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    await page.close()
  })
})
