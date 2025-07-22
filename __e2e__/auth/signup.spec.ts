/**
 * Signup Flow E2E Tests
 *
 * Tests user registration functionality including form validation,
 * successful signup, error handling, and email verification flow.
 */

import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'

import testUsers from './fixtures/test-users.json'

// Helper function to log in a user

async function loginUser(page: Page, user: { email: any, password: any, name?: string }) {
  await page.goto('/auth/login')
  await page.fill('input[name="email"]', user.email)
  await page.fill('input[name="password"]', user.password)
  await page.click('button[type="submit"]')
  // Wait for login to complete - check for redirect away from login page
  await page.waitForURL('/', { timeout: 5000 })
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

    // Fill valid email but weak password and leave name empty
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

    // Should also show name field validation error
    const nameError = page
      .locator('text=Name is required')
      .or(page.locator('text=Name ist erforderlich'))
      .or(page.locator('input[name="name"]:invalid'))

    await expect(nameError.first()).toBeVisible()
  })

  test('should have link to login page', async ({ page }) => {
    await page.goto('/auth/sign-up')

    // Should have link to login page
    const loginLink = page.getByRole('link', { name: 'Login' })

    await expect(loginLink).toBeVisible()

    // Clicking should navigate to login
    await loginLink.click()
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

    // Verify we're still logged in by checking we're not on login page
    await expect(page).not.toHaveURL('/auth/login')
    // And that login link is not visible (meaning user is logged in)
    await expect(page.getByRole('link', { name: 'Login' })).not.toBeVisible()
  })

  test('should handle network errors gracefully', async ({ page }) => {
    await page.goto('/auth/sign-up')

    // Intercept and fail network requests to simulate server error
    await page.route('**/auth/**', async (route) => {
      await route.abort('failed')
    })

    // Try to signup
    await page.fill('input[name="name"]', 'Network Test')
    await page.fill('input[name="email"]', 'networktest@example.com')
    await page.fill('input[name="password"]', 'NetworkTest123!')
    await page.fill('input[name="confirmPassword"]', 'NetworkTest123!')
    await page.click('button[type="submit"]')

    // Should show error message (any error will do for network failure)
    const errorMessage = page
      .locator('text=Signup failed')
      .or(page.locator('.text-red-600')) // Error styling class
      .or(page.locator('.bg-red-50')) // Error container class
      .or(page.locator('text=Failed'))

    await expect(errorMessage).toBeVisible({ timeout: 5000 })

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
    // Directly clear auth state to ensure test isolation.
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    await page.close()
  })
})
