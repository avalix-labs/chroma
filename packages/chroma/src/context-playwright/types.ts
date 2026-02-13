import type { BrowserContext, Page } from '@playwright/test'
import type {
  MetaMaskWalletInstance,
  PolkadotJsWalletInstance,
  TalismanWalletInstance,
  WalletInstance,
} from './wallet-factory.js'

// Re-export wallet instance types
export type { MetaMaskWalletInstance, PolkadotJsWalletInstance, TalismanWalletInstance, WalletInstance }

// Wallet types - single source of truth
export type WalletType = 'polkadot-js' | 'talisman' | 'metamask'

// Wallet account configuration
export interface WalletAccount {
  seed: string
  name?: string
  password?: string
}

// Configuration for a single wallet
export interface WalletConfig {
  type: WalletType
  downloadUrl?: string
}

// Map wallet type to its instance
export interface WalletTypeMap {
  'polkadot-js': PolkadotJsWalletInstance
  'talisman': TalismanWalletInstance
  'metamask': MetaMaskWalletInstance
}

// Wallets collection - all wallet types
export type Wallets = WalletTypeMap

// Helper type to build a wallets object based on configured wallet types
export type ConfiguredWallets<T extends readonly WalletConfig[]> = {
  [K in T[number]['type']]: WalletTypeMap[K]
}

// Extended page with wallet context
export type ExtendedPage = Page & {
  __extensionContext: BrowserContext
  __walletExtensionIds: Map<string, string>
}

// Complete test configuration - supports single and multi-wallet
export interface ChromaTestOptions<T extends readonly WalletConfig[] = WalletConfig[]> {
  // Wallet configuration (single or multiple)
  wallets?: T
  // Common options
  headless?: boolean
  slowMo?: number
}

// Test fixtures (test-scoped: recreated per test)
export interface WalletFixtures<W = Wallets> {
  page: ExtendedPage
  wallets: W
}

// Worker fixtures (worker-scoped: persisted across tests)
export interface WalletWorkerFixtures {
  walletContext: BrowserContext
  walletExtensionIds: Map<string, string>
}
