import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
// dotenv.config({ path: path.resolve(__dirname, '.env') })

const envLocalPath = path.resolve(__dirname, "./.env.local");
const envPath = path.resolve(__dirname, "./.env");
dotenv.config({ path: fs.existsSync(envLocalPath) ? envLocalPath : envPath });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    testDir: "./__e2e__/", // Passe ggf. an deinen Testordner an
    testIgnore: [
        "**/auth/**", // Ignoriere alle Tests im Ordner experimental
    // '**/*.skip.ts',                 // Ignoriere alle Dateien mit .skip.ts
    // '**/auth/legacy-login.spec.ts', // Ignoriere eine bestimmte Datei
    ],
    timeout: 30 * 1000,
    expect: {
        timeout: 5000,
    },
    fullyParallel: true,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    // retries: process.env.CI ? 0 : 0,
    /* Opt out of parallel tests on CI. */
    // workers: process.env.CI ? 1 : undefined,
    /* Use single worker for better database isolation */
    workers: 1,
    /* Stop after a few failures to save time */
    maxFailures: 0,

    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: "html",
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */

    use: {
        /* Base URL to use in actions like `await page.goto('/')`. */
        baseURL: "http://localhost:3000",
        trace: "on-first-retry",
        screenshot: "only-on-failure",
        video: "retain-on-failure",
        permissions: ["camera"],
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
        // {
        //   name: "webkit",
        //   use: { ...devices["Desktop Safari"] },
        // },
        //   name: 'firefox',
        //   use: { ...devices['Desktop Firefox'] },
        // },

        // {
        //   name: 'webkit',
        //   use: { ...devices['Desktop Safari'] },
        // },

        /* Test against mobile viewports. */
        // {
        //   name: 'Mobile Chrome',
        //   use: { ...devices['Pixel 5'] },
        // },
        // {
        //   name: 'Mobile Safari',
        //   use: { ...devices['iPhone 12'] },
        // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
    ],
    /* Run your local dev server before starting the tests */
    outputDir: "test-results/",
    webServer: {
        command: "pnpm dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000, // 2 minutes
    },
});
