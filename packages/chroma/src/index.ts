// Main entry point for chroma package
export { expect, test, createWalletTest } from './context-playwright'
export type { WalletAccount, WalletFixtures, WalletConfig, ChromaTestOptions, WalletType } from './context-playwright'
export { downloadAndExtractPolkadotExtension } from './context-playwright/download-polkadot-js.js'

// Re-export Playwright types that users might need
export type { BrowserContext, Page } from '@playwright/test'
