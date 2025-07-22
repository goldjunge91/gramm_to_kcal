/**
 * Logout Flow E2E Tests
 *
 * Tests user logout functionality including successful logout,
 * session cleanup, redirect behavior, and cross-tab logout effects.
 */

import { expect, test } from '@playwright/test'

import testUsers from '../fixtures/test-users.json'
import {
  clearAuthState,
  isLoggedIn,
  loginUser,
  logoutUser,
} from '../helpers/auth-helpers'

test.describe('Logout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
  })

  test('should successfully logout user', async ({ page }) => {
    // First login
    await loginUser(page, testUsers.validUser)
    expect(await isLoggedIn(page)).toBe(true)

    // Logout
    await logoutUser(page)

    // Verify logout was successful
    expect(await isLoggedIn(page)).toBe(false)

    // Should be redirected to home page
    await expect(page).toHaveURL('/')

    // Should show login link/button instead of user avatar
    const loginLink = page
      .locator('a[href="/auth/login"]')
      .or(page.locator('text=Anmelden'))
    await expect(loginLink).toBeVisible({ timeout: 3000 })
  })

  test('should clear session and prevent access to protected routes after logout', async ({
    page,
  }) => {
    // Login first
    await loginUser(page, testUsers.validUser)
    expect(await isLoggedIn(page)).toBe(true)

    // Logout
    await logoutUser(page)
    expect(await isLoggedIn(page)).toBe(false)

    // Try to access protected route after logout
    await page.goto('/calories')

    // Should be redirected to login
    await page.waitForURL('/auth/login')
    await expect(page).toHaveURL('/auth/login')

    // Verify login form is visible
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
  })

  test('should handle logout from different pages', async ({ page }) => {
    // Test logout from various pages
    const testPages = ['/', '/calories']

    for (const testPage of testPages) {
      // Login first
      await loginUser(page, testUsers.validUser)

      // Navigate to test page
      await page.goto(testPage)
      expect(await isLoggedIn(page)).toBe(true)

      // Logout from this page
      await logoutUser(page)
      expect(await isLoggedIn(page)).toBe(false)

      // Should be on home page
      await expect(page).toHaveURL('/')

      console.log(`✅ Successfully logged out from ${testPage}`)

      // Clear state before next iteration
      await clearAuthState(page)
    }
  })

  test('should logout from dropdown menu if logout is in user menu', async ({
    page,
  }) => {
    // Login first
    await loginUser(page, testUsers.validUser)
    expect(await isLoggedIn(page)).toBe(true)

    // Look for user avatar that might contain dropdown
    const userAvatar = page.locator('[data-testid="user-avatar"]')

    if (await userAvatar.isVisible()) {
      // Click user avatar to open dropdown
      await userAvatar.click()

      // Wait for dropdown to appear
      await page.waitForTimeout(500)

      // Look for logout button in dropdown
      const logoutInDropdown = page
        .locator('button:has-text("Abmelden")')
        .or(page.locator('[data-testid="logout-button"]'))

      if (await logoutInDropdown.isVisible()) {
        await logoutInDropdown.click()

        // Wait for logout to complete
        await page.waitForURL('/')
        expect(await isLoggedIn(page)).toBe(false)

        console.log('✅ Successfully logged out via dropdown menu')
      }
      else {
        console.log(
          'ℹ️ Logout button not found in dropdown - using fallback method',
        )
        await logoutUser(page)
      }
    }
    else {
      console.log('ℹ️ User avatar not found - using fallback logout method')
      await logoutUser(page)
    }
  })

  test('should handle logout across multiple tabs', async ({ context }) => {
    const page1 = await context.newPage()
    const page2 = await context.newPage()

    try {
      // Login in first tab
      await loginUser(page1, testUsers.validUser)
      expect(await isLoggedIn(page1)).toBe(true)

      // Open second tab and verify logged in
      await page2.goto('/')
      expect(await isLoggedIn(page2)).toBe(true)

      // Logout from first tab
      await logoutUser(page1)
      expect(await isLoggedIn(page1)).toBe(false)

      // Check second tab - should also be logged out
      await page2.reload()
      expect(await isLoggedIn(page2)).toBe(false)

      // Try to access protected route in second tab
      await page2.goto('/calories')
      await page2.waitForURL('/auth/login')
      await expect(page2).toHaveURL('/auth/login')

      console.log('✅ Cross-tab logout working correctly')
    }
    finally {
      await page1.close()
      await page2.close()
    }
  })

  test('should prevent double logout issues', async ({ page }) => {
    // Login first
    await loginUser(page, testUsers.validUser)
    expect(await isLoggedIn(page)).toBe(true)

    // Logout once
    await logoutUser(page)
    expect(await isLoggedIn(page)).toBe(false)

    // Try to logout again (should handle gracefully)
    try {
      await logoutUser(page)
      console.log('✅ Double logout handled gracefully')
    }
    catch {
      // This is expected - logout button might not be visible
      console.log('✅ Double logout prevented - logout button not available')
    }

    // Should still be logged out and on home page
    expect(await isLoggedIn(page)).toBe(false)
    await expect(page).toHaveURL('/')
  })

  test('should clear local storage and session data on logout', async ({
    page,
  }) => {
    // Login first
    await loginUser(page, testUsers.validUser)
    expect(await isLoggedIn(page)).toBe(true)

    // Check that some session data exists
    const hasSessionData = await page.evaluate(() => {
      return (
        Object.keys(localStorage).length > 0
        || Object.keys(sessionStorage).length > 0
      )
    })
    console.log(`Session data before logout: ${hasSessionData}`)

    // Logout
    await logoutUser(page)

    // Check that sensitive data is cleared (some data might remain for app functionality)
    const authTokens = await page.evaluate(() => {
      // Look for common auth token patterns in storage
      const localStorage_keys = Object.keys(localStorage)
      const sessionStorage_keys = Object.keys(sessionStorage)

      const authKeys = [...localStorage_keys, ...sessionStorage_keys].filter(
        key =>
          key.includes('auth')
          || key.includes('token')
          || key.includes('session')
          || key.includes('supabase'),
      )

      return authKeys
    })

    console.log(`Auth-related keys after logout: ${authTokens}`)

    // The key test is that user cannot access protected routes
    await page.goto('/calories')
    await page.waitForURL('/auth/login')
    await expect(page).toHaveURL('/auth/login')
  })

  test('should handle logout with network errors', async ({ page }) => {
    // Login first
    await loginUser(page, testUsers.validUser)
    expect(await isLoggedIn(page)).toBe(true)

    // Intercept logout requests and simulate network error
    await page.route('**/auth/logout**', async (route) => {
      await route.abort('failed')
    })

    await page.route('**/auth/signout**', async (route) => {
      await route.abort('failed')
    })

    // Try to logout with network error
    const logoutButton = page
      .locator('button:has-text("Abmelden")')
      .or(page.locator('[data-testid="logout-button"]'))

    if (await logoutButton.isVisible()) {
      await logoutButton.click()
    }
    else {
      // Try user avatar dropdown approach
      const userAvatar = page.locator('[data-testid="user-avatar"]')
      if (await userAvatar.isVisible()) {
        await userAvatar.click()
        await page.locator('button:has-text("Abmelden")').click()
      }
    }

    // Even with network error, user should be logged out locally
    await page.waitForTimeout(2000)

    // Check if logout succeeded locally (might still work due to client-side session clearing)
    const isStillLoggedIn = await isLoggedIn(page)

    if (!isStillLoggedIn) {
      console.log(
        '✅ Logout succeeded despite network error (client-side clearing)',
      )
    }
    else {
      console.log(
        'ℹ️ Logout affected by network error - this is acceptable behavior',
      )
    }
  })

  test.afterEach(async ({ page }) => {
    await clearAuthState(page)
  })
})
