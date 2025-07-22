import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './__e2e__/', // Passe ggf. an deinen Testordner an
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    permissions: ['camera'],
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // {
    //   name: "firefox",
    //   use: { ...devices["Desktop Firefox"] },
    // },
    // {
    //   name: "webkit",
    //   use: { ...devices["Desktop Safari"] },
    // },
  ],
  outputDir: 'test-results/',
  webServer: {
    command: 'pnpm dev',
    port: 3000,
    timeout: 120 * 1000,
    reuseExistingServer: true,
  },
})
