/**
 * Login Flow E2E Tests
 *
 * Tests the complete login functionality including form validation,
 * successful authentication, error handling, and redirect behavior.
 */

import { expect, test } from "@playwright/test";

import testUsers from "../fixtures/test-users.json";
import { clearAuthState, loginUser, logoutUser } from "../helpers/auth-helpers";

test.describe("Login Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Ensure clean state before each test
    await clearAuthState(page);
  });

  test("should successfully login with valid credentials", async ({ page }) => {
    // Navigate to login page
    await page.goto("/auth/login");

    // Verify login form is visible
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Login with valid user
    await loginUser(page, testUsers.validUser);

    // Verify successful login - should be on main app page
    await expect(page).toHaveURL("/calories");

    // Verify user avatar or logout button is visible (indicates logged in state)
    const loggedInIndicator = page
      .locator('[data-testid="user-avatar"]')
      .or(page.locator('button:has-text("Abmelden")'));
    await expect(loggedInIndicator).toBeVisible();
  });

  test("should show error message for invalid credentials", async ({
    page,
  }) => {
    await page.goto("/auth/login");

    // Fill form with invalid credentials
    await page.fill('input[name="email"]', testUsers.invalidUser.email);
    await page.fill('input[name="password"]', testUsers.invalidUser.password);
    await page.click('button[type="submit"]');

    // Should show error message (stay on login page)
    await expect(page).toHaveURL("/auth/login");

    // Look for error message
    const errorMessage = page
      .locator("text=Invalid credentials")
      .or(page.locator("text=Ungültige Anmeldedaten"))
      .or(page.locator('[data-testid="auth-error"]'))
      .or(page.locator(".error").or(page.locator('[role="alert"]')));

    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test("should validate required fields", async ({ page }) => {
    await page.goto("/auth/login");

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Should show validation errors for required fields
    const emailError = page
      .locator("text=Email is required")
      .or(page.locator("text=E-Mail ist erforderlich"))
      .or(page.locator('input[name="email"]:invalid'));

    await expect(emailError.first()).toBeVisible();
  });

  test("should validate email format", async ({ page }) => {
    await page.goto("/auth/login");

    // Fill invalid email format
    await page.fill('input[name="email"]', "invalid-email");
    await page.fill('input[name="password"]', "somepassword");
    await page.click('button[type="submit"]');

    // Should show email format validation error
    const emailFormatError = page
      .locator("text=Invalid email")
      .or(page.locator("text=Ungültige E-Mail"))
      .or(page.locator('input[name="email"]:invalid'));

    await expect(emailFormatError.first()).toBeVisible();
  });

  test("should redirect to originally requested page after login", async ({
    page,
  }) => {
    // Try to access protected route while not logged in
    await page.goto("/calories");

    // Should be redirected to login
    await expect(page).toHaveURL("/auth/login");

    // Login with valid credentials
    await loginUser(page, testUsers.validUser);

    // Should be redirected back to originally requested page
    await expect(page).toHaveURL("/calories");
  });

  test("should maintain login state across page navigation", async ({
    page,
  }) => {
    // Login first
    await loginUser(page, testUsers.validUser);

    // Navigate to different pages
    await page.goto("/");
    await expect(
      page
        .locator('[data-testid="user-avatar"]')
        .or(page.locator('button:has-text("Abmelden")')),
    ).toBeVisible();

    await page.goto("/recipe");
    await expect(
      page
        .locator('[data-testid="user-avatar"]')
        .or(page.locator('button:has-text("Abmelden")')),
    ).toBeVisible();

    // Navigate back to protected route
    await page.goto("/calories");
    await expect(page).toHaveURL("/calories");
    await expect(
      page
        .locator('[data-testid="user-avatar"]')
        .or(page.locator('button:has-text("Abmelden")')),
    ).toBeVisible();
  });

  test.afterEach(async ({ page }) => {
    // Clean up: logout if logged in
    try {
      await logoutUser(page);
    } catch {
      // User might not be logged in, that's fine
    }
    await clearAuthState(page);
  });
});
