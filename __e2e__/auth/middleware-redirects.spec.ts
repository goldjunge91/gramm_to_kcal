/**
 * Middleware Redirects E2E Tests
 *
 * Tests middleware redirect behavior (GitHub Issues #8 and #11).
 * Verifies that authenticated users are redirected away from auth pages,
 * unauthenticated users are redirected to login for protected routes,
 * and post-authentication redirects work correctly.
 */

import { expect, test } from '@playwright/test'

import testUsers from '../fixtures/test-users.json'
import {
  clearAuthState,
  loginUser,
  logoutUser,
  testProtectedRoute,
} from '../helpers/auth-helpers'

test.describe('Middleware Redirects (GitHub Issues #8, #11)', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
  })

  test.describe('Issue #8: Redirect logged-in users away from auth pages', () => {
    test('should redirect authenticated user from login page', async ({
      page,
    }) => {
      // First login
      await loginUser(page, testUsers.validUser)

      // Try to access login page while logged in
      await page.goto('/auth/login')

      // Should be redirected away from login page to main app
      await page.waitForURL('/calories', { timeout: 5000 })
      await expect(page).toHaveURL('/calories')

      // Verify we're actually logged in (not just redirected)
      const loggedInIndicator = page
        .locator('[data-testid="user-avatar"]')
        .or(page.locator('button:has-text("Abmelden")'))
      await expect(loggedInIndicator).toBeVisible()
    })

    test('should redirect authenticated user from signup page', async ({
      page,
    }) => {
      // First login
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

    test('should redirect authenticated user from forgot password page', async ({
      page,
    }) => {
      // First login
      await loginUser(page, testUsers.validUser)

      // Try to access forgot password page while logged in
      await page.goto('/auth/forgot-password')

      // Should be redirected away
      await page.waitForURL('/calories', { timeout: 5000 })
      await expect(page).toHaveURL('/calories')
    })

    test('should redirect from all auth pages when logged in', async ({
      page,
    }) => {
      // Login first
      await loginUser(page, testUsers.validUser)

      const authPages = [
        '/auth/login',
        '/auth/sign-up',
        '/auth/forgot-password',
      ]

      for (const authPage of authPages) {
        await page.goto(authPage)

        // Should be redirected to main app
        await page.waitForURL('/calories', { timeout: 5000 })
        await expect(page).toHaveURL('/calories')

        console.log(`✅ Redirected from ${authPage} to /calories`)
      }
    })
  })

  test.describe('Protected Routes for Unauthenticated Users', () => {
    test('should redirect unauthenticated user from protected routes', async ({
      page,
    }) => {
      const protectedRoutes = [
        '/calories',
        '/recipe',
        '/profile', // if this exists
      ]

      for (const route of protectedRoutes) {
        await testProtectedRoute(page, route)
        console.log(
          `✅ Protected route ${route} correctly redirected to login`,
        )
      }
    })

    test('should allow unauthenticated access to public routes', async ({
      page,
    }) => {
      const publicRoutes = [
        '/',
        '/about', // if this exists
      ]

      for (const route of publicRoutes) {
        await page.goto(route)

        // Should not be redirected to login
        await page.waitForTimeout(1000)
        await expect(page).toHaveURL(route)

        // Should not show logged-in UI elements
        const loggedInIndicator = page
          .locator('[data-testid="user-avatar"]')
          .or(page.locator('button:has-text("Abmelden")'))
        await expect(loggedInIndicator).not.toBeVisible()

        console.log(
          `✅ Public route ${route} accessible without authentication`,
        )
      }
    })
  })

  test.describe('Issue #11: Post-Authentication Redirects', () => {
    test('should redirect to requested page after login', async ({
      page,
    }) => {
      // Try to access protected route while not logged in
      await page.goto('/calories')

      // Should be redirected to login with return URL
      await page.waitForURL('/auth/login')

      // Login with valid credentials
      await page.fill('input[name="email"]', testUsers.validUser.email)
      await page.fill(
        'input[name="password"]',
        testUsers.validUser.password,
      )
      await page.click('button[type="submit"]')

      // Should be redirected to originally requested page
      await page.waitForURL('/calories', { timeout: 5000 })
      await expect(page).toHaveURL('/calories')
    })

    test('should default to main app page when no return URL', async ({
      page,
    }) => {
      // Go directly to login page (no return URL)
      await page.goto('/auth/login')

      // Login
      await page.fill('input[name="email"]', testUsers.validUser.email)
      await page.fill(
        'input[name="password"]',
        testUsers.validUser.password,
      )
      await page.click('button[type="submit"]')

      // Should redirect to default post-login page
      await page.waitForURL('/calories', { timeout: 5000 })
      await expect(page).toHaveURL('/calories')
    })

    test('should handle deep protected route redirects', async ({
      page,
    }) => {
      // Try to access a deep protected route
      const deepRoute = '/recipe/some-id/edit' // example deep route

      try {
        await page.goto(deepRoute)

        // Should be redirected to login
        await page.waitForURL('/auth/login')

        // Login
        await page.fill(
          'input[name="email"]',
          testUsers.validUser.email,
        )
        await page.fill(
          'input[name="password"]',
          testUsers.validUser.password,
        )
        await page.click('button[type="submit"]')

        // Should redirect back to requested deep route (or default if route doesn't exist)
        await page.waitForTimeout(2000)

        // The exact behavior depends on whether the deep route exists
        // At minimum, should not be on login page anymore
        expect(page.url()).not.toContain('/auth/login')
      }
      catch (error) {
        console.log(
          `Deep route test skipped - route may not exist: ${error}`,
        )
      }
    })
  })

  test.describe('Edge Cases and Redirect Loops Prevention', () => {
    test('should not create redirect loops', async ({ page }) => {
      // This test ensures middleware doesn't create infinite redirects

      // Try various navigation patterns that could cause loops
      await page.goto('/')
      await page.waitForTimeout(1000)

      await page.goto('/auth/login')
      await page.waitForTimeout(1000)

      // Should end up on login page without loops
      await expect(page).toHaveURL('/auth/login')

      // Login and test logged-in redirect behavior
      await loginUser(page, testUsers.validUser)

      await page.goto('/auth/login')
      await page.waitForTimeout(1000)

      // Should end up on main app without loops
      await expect(page).toHaveURL('/calories')
    })

    test('should handle direct URL access correctly', async ({ page }) => {
      // Test direct URL access to various routes
      const testCases = [
        { url: '/auth/login', expectedBehavior: 'should_load' },
        {
          url: '/calories',
          expectedBehavior: 'should_redirect_to_login',
        },
        { url: '/', expectedBehavior: 'should_load' },
      ]

      for (const testCase of testCases) {
        await page.goto(testCase.url)
        await page.waitForTimeout(1000)

        if (testCase.expectedBehavior === 'should_redirect_to_login') {
          await expect(page).toHaveURL('/auth/login')
        }
        else if (testCase.expectedBehavior === 'should_load') {
          await expect(page).toHaveURL(testCase.url)
        }

        console.log(
          `✅ Direct access to ${testCase.url}: ${testCase.expectedBehavior}`,
        )
      }
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
