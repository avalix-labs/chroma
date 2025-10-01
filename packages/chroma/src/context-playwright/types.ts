import type { BrowserContext, Page } from '@playwright/test'

// Wallet types - single source of truth
export type WalletType = 'polkadot-js' | 'talisman'

// Available wallet types as constant array
export const WALLET_TYPES: readonly WalletType[] = ['polkadot-js', 'talisman'] as const

// Wallet account configuration
export interface WalletAccount {
  seed: string
  name?: string
  password?: string
}

// Configuration for a single wallet
export interface WalletConfig {
  type: WalletType
  customPath?: string
  downloadUrl?: string
}

// Base wallet instance - common methods for all wallets
export interface BaseWalletInstance {
  extensionId: string
  importMnemonic: (options: WalletAccount) => Promise<void>
  authorize: () => Promise<void>
  approveTx: (options?: { password?: string }) => Promise<void>
}

// Polkadot-JS specific wallet instance
export interface PolkadotJsWalletInstance extends BaseWalletInstance {
  type: 'polkadot-js'
}

// Talisman specific wallet instance (with additional methods)
export interface TalismanWalletInstance extends BaseWalletInstance {
  type: 'talisman'
  importPrivateKey: (options: { privateKey: string, name?: string, password?: string }) => Promise<void>
}

// Union type of all wallet instances
export type WalletInstance = PolkadotJsWalletInstance | TalismanWalletInstance

// Wallets collection - each wallet type has its specific instance type
export interface Wallets {
  'polkadot-js': PolkadotJsWalletInstance
  'talisman': TalismanWalletInstance
}

// Extended page with wallet context
export type ExtendedPage = Page & {
  __extensionContext: BrowserContext
  __walletExtensionIds: Map<string, string>
}

// Complete test configuration - supports single and multi-wallet
export interface ChromaTestOptions {
  // Wallet configuration (single or multiple)
  wallets?: WalletConfig[]
  // Common options
  headless?: boolean
  slowMo?: number
}

// Test fixtures (test-scoped: recreated per test)
export interface WalletFixtures {
  page: ExtendedPage
  wallets: Wallets
}

// Worker fixtures (worker-scoped: persisted across tests)
export interface WalletWorkerFixtures {
  walletContext: BrowserContext
  walletExtensionIds: Map<string, string>
}
