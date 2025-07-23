/**
 * E2E Test: Auth Route Protection
 * Tests that auth routes (/auth/login, /auth/sign-up) are accessible to unauthenticated users
 * This is a TDD Red Phase test to identify the specific protection issue
 */

import { expect, test } from '@playwright/test';

test.describe('Auth Route Protection', () => {
  test('unauthenticated user should access login page directly', async ({ page }) => {
    // Clear any existing session to ensure we're unauthenticated
    await page.context().clearCookies()
    
    // Try to access login page directly
    await page.goto('/auth/login')
    
    // Should successfully load login page (not redirect to protected area)
    await expect(page).toHaveURL('/auth/login')
    
    // Should see login form elements (proving the page loaded correctly)
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('unauthenticated user should access signup page directly', async ({ page }) => {
    // Clear any existing session to ensure we're unauthenticated
    await page.context().clearCookies()
    
    // Try to access signup page directly
    await page.goto('/auth/sign-up')
    
    // Should successfully load signup page (not redirect to protected area)
    await expect(page).toHaveURL('/auth/sign-up')
    
    // Should see signup form elements (proving the page loaded correctly)
    await expect(page.locator('input[name="name"]')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should not redirect unauthenticated users to login when accessing auth pages', async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies()
    
    // Test multiple auth pages to ensure none incorrectly redirect
    const authPages = ['/auth/login', '/auth/sign-up', '/auth/forgot-password']
    
    for (const authPage of authPages) {
      await page.goto(authPage)
      
      // Should stay on the auth page, not redirect to login (which would be circular)
      await expect(page).toHaveURL(authPage)
      
      // Should not show any "access denied" or similar protection messages
      await expect(page.locator('text=Access denied')).not.toBeVisible()
      await expect(page.locator('text=Unauthorized')).not.toBeVisible()
    }
  })
})