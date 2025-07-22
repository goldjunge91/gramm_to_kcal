/**
 * Session Persistence E2E Tests
 *
 * Tests the critical session persistence bug fix (GitHub Issue #7).
 * Verifies that authenticated users maintain their session when navigating
 * to public routes, and that sessions don't expire unexpectedly.
 */

import { expect, test } from '@playwright/test'

import testUsers from '../fixtures/test-users.json'
import {
  clearAuthState,
  isLoggedIn,
  loginUser,
  logoutUser,
} from '../helpers/auth-helpers'

test.describe('Session Persistence (GitHub Issue #7)', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
  })

  test('should maintain session when accessing public routes', async ({
    page,
  }) => {
    // Login first
    await loginUser(page, testUsers.validUser)

    // Verify initial login state
    expect(await isLoggedIn(page)).toBe(true)

    // Navigate to public routes and verify session persists
    const publicRoutes = ['/', '/about', '/public-page']

    for (const route of publicRoutes) {
      await page.goto(route)

      // Wait a moment for any potential session updates
      await page.waitForTimeout(1000)

      // Verify user is still logged in
      expect(await isLoggedIn(page)).toBe(true)

      // Verify logged-in user UI is visible
      const loggedInIndicator = page
        .locator('[data-testid="user-avatar"]')
        .or(page.locator('button:has-text("Abmelden")'))
      await expect(loggedInIndicator).toBeVisible({ timeout: 3000 })
    }
  })

  test('should maintain session during extended browsing session', async ({
    page,
  }) => {
    // Login
    await loginUser(page, testUsers.validUser)

    // Simulate extended browsing session
    const routes = ['/', '/calories', '/', '/recipe', '/', '/calories']

    for (let i = 0; i < routes.length; i++) {
      await page.goto(routes[i])

      // Add realistic delay between page visits
      await page.waitForTimeout(2000)

      // Verify session persists throughout browsing
      expect(await isLoggedIn(page)).toBe(true)

      console.log(
        `✅ Session maintained after visiting ${routes[i]} (step ${i + 1}/${routes.length})`,
      )
    }
  })

  test('should handle page refresh without losing session', async ({
    page,
  }) => {
    // Login
    await loginUser(page, testUsers.validUser)

    // Navigate to protected route
    await page.goto('/calories')
    expect(await isLoggedIn(page)).toBe(true)

    // Refresh the page
    await page.reload()

    // Verify session survives page refresh
    expect(await isLoggedIn(page)).toBe(true)
    await expect(page).toHaveURL('/calories')

    // Navigate to public route and refresh
    await page.goto('/')
    await page.reload()

    // Verify session still persists
    expect(await isLoggedIn(page)).toBe(true)
  })

  test('should maintain session across browser tab navigation', async ({
    context,
  }) => {
    const page1 = await context.newPage()
    const page2 = await context.newPage()

    try {
      // Login in first tab
      await loginUser(page1, testUsers.validUser)
      expect(await isLoggedIn(page1)).toBe(true)

      // Open second tab and check if logged in
      await page2.goto('/')
      expect(await isLoggedIn(page2)).toBe(true)

      // Navigate in first tab to public route
      await page1.goto('/')
      expect(await isLoggedIn(page1)).toBe(true)

      // Check second tab still shows logged in state
      await page2.reload()
      expect(await isLoggedIn(page2)).toBe(true)

      // Navigate to protected route in second tab
      await page2.goto('/calories')
      await expect(page2).toHaveURL('/calories')
      expect(await isLoggedIn(page2)).toBe(true)
    }
    finally {
      await page1.close()
      await page2.close()
    }
  })

  test('should preserve session when switching between auth and non-auth routes', async ({
    page,
  }) => {
    // Login
    await loginUser(page, testUsers.validUser)

    // Navigate to auth pages (should redirect away since user is logged in)
    const authRoutes = ['/auth/login', '/auth/sign-up']

    for (const authRoute of authRoutes) {
      await page.goto(authRoute)

      // Should be redirected away from auth pages since user is logged in
      // This tests both session persistence AND redirect functionality
      await page.waitForTimeout(1000)

      // Should not be on auth page anymore
      expect(page.url()).not.toContain('/auth/')

      // Session should still be maintained
      expect(await isLoggedIn(page)).toBe(true)
    }

    // Navigate back to protected route to confirm everything still works
    await page.goto('/calories')
    await expect(page).toHaveURL('/calories')
    expect(await isLoggedIn(page)).toBe(true)
  })

  test('should handle session persistence with network delays', async ({
    page,
  }) => {
    // Login
    await loginUser(page, testUsers.validUser)

    // Simulate slow network conditions
    await page.route('**/*', async (route) => {
      // Add delay to simulate network latency
      await new Promise(resolve => setTimeout(resolve, 100))
      await route.continue()
    })

    // Navigate between routes with simulated network delays
    await page.goto('/')
    await page.waitForTimeout(500)
    expect(await isLoggedIn(page)).toBe(true)

    await page.goto('/calories')
    await page.waitForTimeout(500)
    expect(await isLoggedIn(page)).toBe(true)

    await page.goto('/')
    await page.waitForTimeout(500)
    expect(await isLoggedIn(page)).toBe(true)
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
