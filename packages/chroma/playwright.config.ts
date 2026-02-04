import process from 'node:process'
import { defineConfig, devices } from '@playwright/test'

/**
 * See https://playwright.dev/docs/test-configuration.
 *
 * NOTE: This config is for playground-e2e only.
 * The playground-e2e folder contains experimental/playground code that is not
 * part of the main test suite. It is not run in CI/CD and may be messy.
 * Reviewers can safely ignore this folder and config.
 */
export default defineConfig({
  testDir: './playground-e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
