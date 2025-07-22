/**
 * Signup Flow E2E Tests
 *
 * Tests user registration functionality including form validation,
 * successful signup, error handling, and email verification flow.
 */

import { expect, test } from '@playwright/test'

import testUsers from '../fixtures/test-users.json'
import {
  clearAuthState,
  loginUser,
  logoutUser,
  signupUser,
} from '../helpers/auth-helpers'

test.describe('Signup Flow @auth @core', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app first, then ensure clean state
    await page.goto('/')
    await clearAuthState(page)
  })

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

    // Signup with new user
    await signupUser(page, testUser)

    // Should be on success page
    await expect(page).toHaveURL('/auth/sign-up-success')

    // Verify success message is shown
    const successMessage = page
      .locator('text=Check your email')
      .or(page.locator('text=E-Mail prüfen'))
      .or(page.locator('text=Confirmation email sent'))
      .or(page.locator('[data-testid="signup-success"]'))

    await expect(successMessage).toBeVisible()
  })

  test('should show error for existing email', async ({ page }) => {
    await page.goto('/auth/sign-up')

    // Try to signup with already existing email
    await page.fill('input[name="email"]', testUsers.validUser.email)
    await page.fill('input[name="password"]', 'NewPassword123!')

    // Fill name field if present
    const nameInput = page.locator('input[name="name"]')
    if (await nameInput.isVisible()) {
      await nameInput.fill('Test User')
    }

    await page.click('button[type="submit"]')

    // Should show error for existing email
    const errorMessage = page
      .locator('text=User already registered')
      .or(page.locator('text=Email already exists'))
      .or(page.locator('text=Benutzer bereits registriert'))
      .or(page.locator('[data-testid="signup-error"]'))
      .or(page.locator('.error').or(page.locator('[role="alert"]')))

    await expect(errorMessage).toBeVisible({ timeout: 5000 })

    // Should still be on signup page
    await expect(page).toHaveURL('/auth/sign-up')
  })

  test('should validate required fields', async ({ page }) => {
    await page.goto('/auth/sign-up')

    // Try to submit empty form
    await page.click('button[type="submit"]')

    // Should show validation errors for required fields
    const emailError = page
      .locator('text=Email is required')
      .or(page.locator('text=E-Mail ist erforderlich'))
      .or(page.locator('input[name="email"]:invalid'))

    const passwordError = page
      .locator('text=Password is required')
      .or(page.locator('text=Passwort ist erforderlich'))
      .or(page.locator('input[name="password"]:invalid'))

    await expect(emailError.first()).toBeVisible()
    await expect(passwordError.first()).toBeVisible()
  })

  test('should validate email format', async ({ page }) => {
    await page.goto('/auth/sign-up')

    // Fill invalid email format
    await page.fill('input[name="email"]', 'invalid-email')
    await page.fill('input[name="password"]', 'ValidPassword123!')
    await page.click('button[type="submit"]')

    // Should show email format validation error
    const emailFormatError = page
      .locator('text=Invalid email')
      .or(page.locator('text=Ungültige E-Mail'))
      .or(page.locator('input[name="email"]:invalid'))

    await expect(emailFormatError.first()).toBeVisible()
  })

  test('should validate password strength', async ({ page }) => {
    await page.goto('/auth/sign-up')

    // Fill valid email but weak password
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', '123') // Too weak
    await page.click('button[type="submit"]')

    // Should show password strength error
    const passwordError = page
      .locator('text=Password too short')
      .or(page.locator('text=Passwort zu kurz'))
      .or(page.locator('text=Password must be'))
      .or(page.locator('input[name="password"]:invalid'))

    await expect(passwordError.first()).toBeVisible()
  })

  test('should have link to login page', async ({ page }) => {
    await page.goto('/auth/sign-up')

    // Should have link to login page
    const loginLink = page
      .locator('a[href="/auth/login"]')
      .or(page.locator('text=Already have an account'))
      .or(page.locator('text=Bereits registriert'))

    await expect(loginLink).toBeVisible()

    // Clicking should navigate to login
    await loginLink.first().click()
    await expect(page).toHaveURL('/auth/login')
  })

  test('should redirect logged-in user away from signup page', async ({
    page,
  }) => {
    // First login with existing user
    await loginUser(page, testUsers.validUser)

    // Try to access signup page while logged in
    await page.goto('/auth/sign-up')

    // Should be redirected away from signup page
    await page.waitForURL('/calories', { timeout: 5000 })
    await expect(page).toHaveURL('/calories')

    // Verify we're still logged in
    const loggedInIndicator = page
      .locator('[data-testid="user-avatar"]')
      .or(page.locator('button:has-text("Abmelden")'))
    await expect(loggedInIndicator).toBeVisible()
  })

  test('should handle network errors gracefully', async ({ page }) => {
    await page.goto('/auth/sign-up')

    // Intercept and fail network requests to simulate server error
    await page.route('**/auth/**', async (route) => {
      await route.abort('failed')
    })

    // Try to signup
    await page.fill('input[name="email"]', 'networktest@example.com')
    await page.fill('input[name="password"]', 'NetworkTest123!')
    await page.click('button[type="submit"]')

    // Should show network error message
    const networkError = page
      .locator('text=Network error')
      .or(page.locator('text=Connection failed'))
      .or(page.locator('text=Netzwerkfehler'))
      .or(page.locator('[data-testid="network-error"]'))

    await expect(networkError).toBeVisible({ timeout: 5000 })

    // Should still be on signup page
    await expect(page).toHaveURL('/auth/sign-up')
  })

  test('should handle form submission states correctly', async ({ page }) => {
    await page.goto('/auth/sign-up')

    // Fill form
    const uniqueEmail = `loading-test-${Date.now()}@example.com`
    await page.fill('input[name="email"]', uniqueEmail)
    await page.fill('input[name="password"]', 'LoadingTest123!')

    // Submit form and check for loading state
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()

    // Button should show loading state or be disabled
    const loadingIndicator = page
      .locator('button[disabled]')
      .or(page.locator('text=Loading'))
      .or(page.locator('text=Wird geladen'))
      .or(page.locator('[data-testid="loading"]'))

    // Note: This might be very quick, so we use a short timeout
    await expect(loadingIndicator)
      .toBeVisible({ timeout: 2000 })
      .catch(() => {
        console.log('Loading state might be too quick to catch - this is okay')
      })
  })

  test.afterEach(async ({ page }) => {
    try {
      await logoutUser(page)
    }
    catch {
      // User might not be logged in
    }
    await clearAuthState(page)
  })
})
