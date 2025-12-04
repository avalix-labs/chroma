import process from 'node:process'
import { defineConfig } from '@playwright/test'

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './examples',
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

    // Test projects - depend on wallet-setup
    // fullyParallel: false because tests share the same userDataDir
    {
      name: 'talisman-tests',
      testMatch: /talisman-with-setup\.spec\.ts/,
      dependencies: ['wallet-setup'],
      fullyParallel: false, // Chromium can't share userDataDir across parallel workers
    },

    // Standalone tests (tanpa setup, untuk backward compatibility)
    {
      name: 'standalone',
      testMatch: /talisman-wallet\.spec\.ts/,
    },
  ],
})
