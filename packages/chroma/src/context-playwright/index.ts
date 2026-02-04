import type {
  ChromaTestOptions,
  ConfiguredWallets,
  ExtendedPage,
  WalletConfig,
  WalletFixtures,
  Wallets,
  WalletWorkerFixtures,
} from './types.js'
import { test as base, chromium } from '@playwright/test'
import { getPolkadotJSExtensionPath } from '../wallets/polkadot-js.js'
import { getTalismanExtensionPath } from '../wallets/talisman.js'
import { walletFactories } from './wallet-factory.js'

// Helper function to get extension path for a wallet config
export async function getExtensionPathForWallet(config: WalletConfig): Promise<string> {
  const { type } = config

  switch (type) {
    case 'polkadot-js':
      return await getPolkadotJSExtensionPath()
    case 'talisman':
      return await getTalismanExtensionPath()
    default:
      throw new Error(`Unsupported wallet type: ${type}`)
  }
}

// Create a test function with wallet configuration
// Supports single and multi-wallet modes
export function createWalletTest<const T extends readonly WalletConfig[]>(
  options: ChromaTestOptions<T> = {} as ChromaTestOptions<T>,
) {
  const { headless = false, slowMo = 150 } = options

  // Default to polkadot-js if no wallets specified
  const walletConfigs: readonly WalletConfig[] = options.wallets && options.wallets.length > 0
    ? options.wallets
    : [{ type: 'polkadot-js' }]

  const isMultiWallet = walletConfigs.length > 1

  // Compute the expected wallets type
  type ExpectedWallets = T extends readonly WalletConfig[] ? ConfiguredWallets<T> : Wallets

  /*
   * Playwright Fixtures - Coverage Exclusion
   *
   * The fixture implementations below are excluded from unit test coverage because:
   * 1. They require a real Chromium browser with extension support
   * 2. They interact with Chrome's extension APIs (service workers, extension IDs)
   * 3. They are thoroughly tested via E2E tests in the tests/ directory
   */
  /* c8 ignore start */
  return base.extend<WalletFixtures<ExpectedWallets>, WalletWorkerFixtures>({
    // Worker-scoped: Browser context with extension(s) (persists across all tests in worker)
    // eslint-disable-next-line no-empty-pattern
    walletContext: [async ({}, use) => {
      // Get all extension paths
      const extensionPaths = await Promise.all(
        walletConfigs.map(config => getExtensionPathForWallet(config)),
      )

      // Join paths with comma for Chrome args
      const extensionPathsString = extensionPaths.join(',')

      const context = await chromium.launchPersistentContext('', {
        headless,
        channel: 'chromium',
        args: [
          `--load-extension=${extensionPathsString}`,
          `--disable-extensions-except=${extensionPathsString}`,
        ],
        slowMo,
      })

      await use(context)
      await context.close()
    }, { scope: 'worker' }],

    // Worker-scoped: Map of wallet type to extension ID
    walletExtensionIds: [async ({ walletContext }, use) => {
      const extensionIds = new Map<string, string>()

      // Wait for all service workers to load
      const serviceWorkers = walletContext.serviceWorkers()
      if (serviceWorkers.length === 0) {
        // Wait for at least one service worker
        await walletContext.waitForEvent('serviceworker')
      }

      // Give some time for all extensions to load
      if (isMultiWallet) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // Get all service workers (one per extension)
      const allServiceWorkers = walletContext.serviceWorkers()

      // Map service workers to wallet types
      // Note: The order should match the walletConfigs order
      for (let i = 0; i < walletConfigs.length && i < allServiceWorkers.length; i++) {
        const extensionId = allServiceWorkers[i].url().split('/')[2]
        const walletType = walletConfigs[i].type
        extensionIds.set(walletType, extensionId)
      }

      await use(extensionIds)
    }, { scope: 'worker' }],

    // Main page with extension context (uses worker-scoped context)
    page: async ({ walletContext, walletExtensionIds }, use) => {
      const page = walletContext.pages()[0] || await walletContext.newPage()

      // Store context and extension IDs on page
      const extendedPage = page as ExtendedPage
      extendedPage.__extensionContext = walletContext
      extendedPage.__walletExtensionIds = walletExtensionIds

      await use(extendedPage)
      // Note: Don't close the page or context here since they're worker-scoped
    },

    // Wallet instances for each configured wallet
    wallets: async ({ walletContext, walletExtensionIds }, use) => {
      const walletMap = {} as ExpectedWallets

      // Create wallet instance for each configured wallet
      for (const [walletType, extensionId] of walletExtensionIds) {
        const factory = walletFactories[walletType as keyof typeof walletFactories]
        if (factory) {
          walletMap[walletType as keyof ExpectedWallets] = factory(extensionId, walletContext) as ExpectedWallets[keyof ExpectedWallets]
        }
      }

      await use(walletMap)
    },
  })
  /* c8 ignore stop */
}

// Default test with Polkadot JS wallet (with persistent wallet support via worker-scoped fixtures)
export const test: ReturnType<typeof createWalletTest> = createWalletTest()

export { expect } from '@playwright/test'
