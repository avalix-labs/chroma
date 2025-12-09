import process from 'node:process'
import { defineConfig } from '@playwright/test'

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
  },

  projects: [
    // Setup project - runs FIRST to import wallet accounts
    {
      name: 'wallet-setup',
      testMatch: /.*\.setup\.ts/,
    },

    // Standalone test (no setup needed, imports wallet directly in test)
    {
      name: 'simple',
      testMatch: /simple\.spec\.ts/,
    },

    // All other tests - depend on wallet-setup
    // fullyParallel: false because tests share the same userDataDir
    {
      name: 'tests',
      testMatch: /.*\.spec\.ts/,
      testIgnore: /simple\.spec\.ts/,
      dependencies: ['wallet-setup'],
      fullyParallel: false, // Chromium can't share userDataDir across parallel workers
    },
  ],
})
