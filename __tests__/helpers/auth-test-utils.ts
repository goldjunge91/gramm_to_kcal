/**
 * Real Auth Testing Utilities
 *
 * Provides utilities for integration testing with real Supabase and Redis connections.
 * No mocks or fake data - all testing uses actual services.
 */

import { NextRequest } from "next/server";

import { env } from "@/lib/env";
import { getRedis } from "@/lib/redis";
import { createClient } from "@/lib/supabase/server"; // Use our actual implementation

// Test configuration
export const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || "http://localhost:3000",
  supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  testUserPrefix: "auth-integration-test",
  testRunId: `test-${Date.now()}`,
};

export interface TestUser {
  email: string;
  password: string;
  id?: string;
  accessToken?: string;
  refreshToken?: string;
}

/**
 * Creates our actual Supabase client for testing
 */
export async function createTestSupabaseClient() {
  return await createClient(); // Use our actual server-side client
}

/**
 * Creates a test user with real Supabase authentication
 */
export async function createRealTestUser(userNumber = 1): Promise<TestUser> {
  const email = `${TEST_CONFIG.testUserPrefix}-${TEST_CONFIG.testRunId}-${userNumber}@example.com`;
  const password = `TestPassword123!${userNumber}`;

  const supabase = await createTestSupabaseClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${TEST_CONFIG.baseUrl}/calories`,
    },
  });

  if (error) {
    throw new Error(`Failed to create test user: ${error.message}`);
  }

  return {
    email,
    password,
    id: data.user?.id,
    accessToken: data.session?.access_token,
    refreshToken: data.session?.refresh_token,
  };
}

/**
 * Authenticates a test user and returns session data
 */
export async function authenticateTestUser(user: TestUser): Promise<{
  accessToken: string;
  refreshToken: string;
  userId: string;
}> {
  const supabase = await createTestSupabaseClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });

  if (error || !data.session) {
    throw new Error(
      `Failed to authenticate test user: ${error?.message || "No session"}`,
    );
  }

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    userId: data.user.id,
  };
}

/**
 * Creates a NextRequest with real session cookies
 */
export function createRequestWithSession(
  path: string,
  sessionData?: { accessToken: string; refreshToken: string },
): NextRequest {
  const url = new URL(path, TEST_CONFIG.baseUrl);
  const request = new NextRequest(url);

  if (sessionData) {
    // Add real Supabase session cookies
    request.cookies.set("sb-access-token", sessionData.accessToken);
    request.cookies.set("sb-refresh-token", sessionData.refreshToken);

    // Add Supabase auth cookies (format used by Supabase SSR)
    const authCookie = btoa(
      JSON.stringify({
        access_token: sessionData.accessToken,
        refresh_token: sessionData.refreshToken,
        expires_at: Date.now() + 3600000, // 1 hour
        token_type: "bearer",
        user: { id: "test-user-id" },
      }),
    );

    request.cookies.set(
      `sb-${TEST_CONFIG.supabaseUrl.replace("https://", "").split(".")[0]}-auth-token`,
      authCookie,
    );
  }

  return request;
}

/**
 * Extracts session information from cookies
 */
export function extractSessionFromCookies(cookies: any): {
  accessToken?: string;
  refreshToken?: string;
  isValid: boolean;
} {
  const accessToken = cookies.get("sb-access-token")?.value;
  const refreshToken = cookies.get("sb-refresh-token")?.value;

  return {
    accessToken,
    refreshToken,
    isValid: !!(accessToken && refreshToken),
  };
}

/**
 * Validates that a session token is still valid
 */
export async function isSessionValid(accessToken: string): Promise<boolean> {
  const supabase = await createTestSupabaseClient();

  // Set the session
  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: "dummy", // Only checking access token validity
  });

  return !error && !!data.user;
}

/**
 * Cleans up test users from Supabase
 */
export async function cleanupTestUser(user: TestUser): Promise<void> {
  const supabase = await createTestSupabaseClient();

  try {
    // Authenticate first
    await supabase.auth.signInWithPassword({
      email: user.email,
      password: user.password,
    });

    // Delete the user account (if admin functions are available)
    // Note: This may not work with regular auth keys, only service role keys
    try {
      const { error } = await supabase.auth.admin.deleteUser(user.id!);
      if (error && !error.message.includes("not found")) {
        console.warn(
          `Warning: Could not cleanup test user ${user.email}: ${error.message}`,
        );
      }
    } catch {
      // Admin functions not available with current key - just sign out
      await supabase.auth.signOut();
      console.log(
        `Test user ${user.email} signed out (cleanup requires admin privileges)`,
      );
    }
  } catch (error) {
    console.warn(`Warning: Could not cleanup test user ${user.email}:`, error);
  }
}

/**
 * Cleans up Redis test data
 */
export async function cleanupRedisTestData(
  keyPattern: string = `*${TEST_CONFIG.testRunId}*`,
): Promise<void> {
  const redis = getRedis();

  if (!redis) {
    console.warn("Warning: Redis not available for cleanup");
    return;
  }

  try {
    const keys = await redis.keys(keyPattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`Cleaned up ${keys.length} Redis test keys`);
    }
  } catch (error) {
    console.warn("Warning: Could not cleanup Redis test data:", error);
  }
}

/**
 * Creates a Redis test key with the test run ID
 */
export function createTestRedisKey(baseKey: string): string {
  return `test:${TEST_CONFIG.testRunId}:${baseKey}`;
}

/**
 * Waits for a condition to be true with timeout
 */
export async function waitForCondition(
  condition: () => Promise<boolean> | boolean,
  timeoutMs: number = 5000,
  intervalMs: number = 100,
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      if (await condition()) {
        return true;
      }
    } catch {
      // Continue waiting on errors
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return false;
}

/**
 * Asserts that a response is a redirect to the expected URL
 */
export function assertRedirectResponse(
  response: Response,
  expectedPath: string,
): void {
  if (response.status < 300 || response.status >= 400) {
    throw new Error(`Expected redirect response (3xx), got ${response.status}`);
  }

  const location = response.headers.get("location");
  if (!location) {
    throw new Error("Redirect response missing Location header");
  }

  const redirectPath = new URL(location, TEST_CONFIG.baseUrl).pathname;
  if (redirectPath !== expectedPath) {
    throw new Error(
      `Expected redirect to ${expectedPath}, got ${redirectPath}`,
    );
  }
}

/**
 * Test environment validation
 */
export async function validateTestEnvironment(): Promise<void> {
  const errors: string[] = [];

  // Check environment variables
  if (!TEST_CONFIG.supabaseUrl) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL not set");
  }

  if (!TEST_CONFIG.supabaseKey) {
    errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY not set");
  }

  // Test Supabase connection
  try {
    const supabase = await createTestSupabaseClient();
    const { error } = await supabase.auth.getSession();
    if (error) {
      errors.push(`Supabase connection failed: ${error.message}`);
    }
  } catch (error) {
    errors.push(
      `Supabase connection error: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }

  // Test Redis connection
  try {
    const redis = getRedis();
    if (redis) {
      await redis.ping();
    } else {
      console.warn(
        "Warning: Redis not available (rate limiting tests will be limited)",
      );
    }
  } catch (error) {
    console.warn(
      "Warning: Redis connection failed (rate limiting tests will be limited):",
      error,
    );
  }

  if (errors.length > 0) {
    throw new Error(
      `Test environment validation failed:\n${errors.join("\n")}`,
    );
  }
}

/**
 * Global test setup
 */
export async function setupTestEnvironment(): Promise<void> {
  await validateTestEnvironment();
  console.log(
    `Test environment initialized with run ID: ${TEST_CONFIG.testRunId}`,
  );
}

/**
 * Global test cleanup
 */
export async function cleanupTestEnvironment(): Promise<void> {
  await cleanupRedisTestData();
  console.log(
    `Test environment cleanup completed for run ID: ${TEST_CONFIG.testRunId}`,
  );
}
