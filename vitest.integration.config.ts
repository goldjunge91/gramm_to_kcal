import path from "node:path";
/// <reference types="vitest" />
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "integration",
    environment: "node",
    env: {
      NODE_ENV: "test",
    },
    setupFiles: ["__tests__/setup/integration-setup.ts"],
    include: ["__tests__/integration/**/*.test.ts"],
    testTimeout: 30000, // 30 seconds for integration tests
    hookTimeout: 10000, // 10 seconds for setup/teardown
    pool: "forks", // Use separate processes for integration tests
    poolOptions: {
      forks: {
        singleFork: true, // Run tests sequentially to avoid conflicts
      },
    },
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
