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
  downloadUrl?: string
}

// Base wallet instance - common methods for all wallets
export interface BaseWalletInstance {
  extensionId: string
  importMnemonic: (options: WalletAccount) => Promise<void>
  authorize: (options?: { accountName?: string }) => Promise<void>
  approveTx: (options?: { password?: string }) => Promise<void>
  rejectTx: () => Promise<void>
}

// Polkadot-JS specific wallet instance
export interface PolkadotJsWalletInstance extends BaseWalletInstance {
  type: 'polkadot-js'
}

// Talisman specific wallet instance (with additional methods)
export interface TalismanWalletInstance extends BaseWalletInstance {
  type: 'talisman'
  importEthPrivateKey: (options: { privateKey: string, name?: string, password?: string }) => Promise<void>
}

// Union type of all wallet instances
export type WalletInstance = PolkadotJsWalletInstance | TalismanWalletInstance

// Map wallet type to its instance
export interface WalletTypeMap {
  'polkadot-js': PolkadotJsWalletInstance
  'talisman': TalismanWalletInstance
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
