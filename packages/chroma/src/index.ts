// Main entry point for chroma package
export { createWalletTest, expect, test } from './context-playwright'
export type { ChromaTestOptions, WalletAccount, WalletConfig, WalletFixtures, WalletType } from './context-playwright'
export { downloadAndExtractPolkadotExtension } from './context-playwright/download-polkadot-js.js'

// Re-export Playwright types that users might need
export type { BrowserContext, Page } from '@playwright/test'
