import type { BrowserContext, Page } from '@playwright/test'
import type {
  MetaMaskWalletInstance,
  PolkadotJsWalletInstance,
  TalismanWalletInstance,
} from './wallet-factory.js'

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
}

// Map wallet type to its instance
export interface WalletTypeMap {
  'polkadot-js': PolkadotJsWalletInstance
  'talisman': TalismanWalletInstance
  'metamask': MetaMaskWalletInstance
}

// Helper type to build a wallets object based on configured wallet types
export type ConfiguredWallets<T extends readonly WalletConfig[]> = {
  [K in T[number]['type']]: WalletTypeMap[K]
}

// Complete test configuration - supports single and multi-wallet
export interface ChromaTestOptions<T extends readonly WalletConfig[] = WalletConfig[]> {
  // Wallet configuration (single or multiple)
  wallets?: T
  // Common options
  headless?: boolean
  slowMo?: number
  /**
   * Persistent profile dir for the browser context.
   * - Empty/undefined (default): temp dir is used; state is lost each run.
   * - String: shared profile path. Requires `workers: 1` if used by multiple workers.
   * - Function: receives the worker index, returns the path. Use for parallel
   *   isolation (e.g. `({ workerIndex }) => `.cache/wallet-w${workerIndex}``).
   */
  userDataDir?: string | ((info: { workerIndex: number }) => string | Promise<string>)
  /**
   * If set, the source dir is copied into `userDataDir` before launch (target is
   * removed first). Use with the Playwright setup-project pattern: a setup
   * project writes to the source dir, then test projects clone it per worker so
   * each parallel worker boots from the same prepared state.
   * No-op if `userDataDir` resolves to an empty string.
   */
  cloneUserDataDirFrom?: string
}

// Test fixtures (test-scoped: recreated per test)
export interface WalletFixtures<W = WalletTypeMap> {
  page: Page
  wallets: W
}

// Worker fixtures (worker-scoped: persisted across tests)
export interface WalletWorkerFixtures {
  walletContext: BrowserContext
  walletExtensionIds: Map<WalletType, string>
}
