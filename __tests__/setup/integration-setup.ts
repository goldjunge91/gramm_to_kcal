/**
 * Integration Test Setup
 *
 * Sets up the test environment for real integration tests with proper
 * environment variables and service connections.
 */

import { config } from "dotenv";
import { resolve } from "node:path";

// Load test environment variables
config({ path: resolve(process.cwd(), ".env.test.local") });

// Verify required environment variables are set
const requiredEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_NODE_ENV",
  "NEXT_PUBLIC_STORAGE_KEY",
  "NEXT_PUBLIC_RECENT_SCANS_KEY",
];

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(
    "❌ Missing required environment variables for integration tests:",
  );
  console.error(missingVars.map((v) => `  - ${v}`).join("\n"));
  console.error("\nCreate .env.test.local with the required variables.");
  process.exit(1);
}

// Set default test values if not provided
if (!process.env.TEST_BASE_URL) {
  process.env.TEST_BASE_URL = "http://localhost:3000";
}

if (!process.env.NEXT_PUBLIC_URL) {
  process.env.NEXT_PUBLIC_URL = "http://localhost:3000";
}

console.log("🧪 Integration test environment configured");
console.log(`   Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
console.log(`   Test Base URL: ${process.env.TEST_BASE_URL}`);

// Note: Vitest doesn't use jest.setTimeout, timeout is configured in vitest config
