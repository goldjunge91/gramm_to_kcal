import { defineConfig, devices } from "@playwright/test";
/**
 * Focused E2E Test Configuration for Authentication Tests Only
 *
 * This config runs only core authentication tests in the proper order:
 * 1. Signup tests (create new users)
 * 2. Login tests (authenticate existing users)
 * 3. Logout tests (terminate sessions)
 *
 * Use this for faster development cycles:
 * pnpm test:e2e:auth
 */
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

const envLocalPath = path.resolve(__dirname, "./.env.local");
const envPath = path.resolve(__dirname, "./.env");
dotenv.config({ path: fs.existsSync(envLocalPath) ? envLocalPath : envPath });

export default defineConfig({
    testDir: "./__e2e__",
    testMatch: [
        "**/auth/signup.spec.ts", // Run FIRST - creates users
    // '**/auth/login.spec.ts', // Run SECOND - tests existing users
    // '**/auth/logout.spec.ts', // Run THIRD - tests session cleanup
    ],

    /* Sequential execution for database safety */
    fullyParallel: false,
    workers: 1,

    /* Fast failure for quick feedback */
    maxFailures: 3,

    /* No retries for faster feedback */
    retries: 0,

    /* Shorter timeouts for development */
    timeout: 15000,
    expect: {
        timeout: 8000,
    },

    /* Reporter optimized for development */
    reporter: [
        ["list"],
        ["html", { open: "on-failure" }],
    ],

    /* Shared settings */
    use: {
        baseURL: "http://localhost:3000",
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
    },

    /* Single browser for speed */
    projects: [
        {
            name: "chromium-auth",
            use: { ...devices["Desktop Chrome"] },
        },
    ],

    /* Run dev server */
    webServer: {
        command: "pnpm dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
    },
});
