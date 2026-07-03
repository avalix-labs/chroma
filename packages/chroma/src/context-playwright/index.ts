import type {
  ChromaTestOptions,
  ConfiguredWallets,
  WalletConfig,
  WalletFixtures,
  WalletType,
  WalletTypeMap,
  WalletWorkerFixtures,
} from './types.js'
import { cp, rm } from 'node:fs/promises'
import { resolve as resolvePath } from 'node:path'
import { test as base, chromium } from '@playwright/test'
import { getUnpackedExtensionId } from '../utils/extension-id.js'
import { getMetaMaskExtensionPath } from '../wallets/metamask.js'
import { getPolkadotJSExtensionPath } from '../wallets/polkadot-js.js'
import { getTalismanExtensionPath } from '../wallets/talisman.js'
import { walletFactories } from './wallet-factory.js'

// Helper function to get extension path for a wallet config
async function getExtensionPathForWallet(config: WalletConfig): Promise<string> {
  const { type } = config

  switch (type) {
    case 'polkadot-js':
      return await getPolkadotJSExtensionPath()
    case 'talisman':
      return await getTalismanExtensionPath()
    case 'metamask':
      return await getMetaMaskExtensionPath()
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

  // Compute the expected wallets type
  type ExpectedWallets = T extends readonly WalletConfig[] ? ConfiguredWallets<T> : WalletTypeMap

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
    walletContext: [async ({}, use, workerInfo) => {
      // Get all extension paths
      const extensionPaths = await Promise.all(
        walletConfigs.map(config => getExtensionPathForWallet(config)),
      )

      // Join paths with comma for Chrome args
      const extensionPathsString = extensionPaths.join(',')

      // Resolve userDataDir (string, function, or default empty)
      const userDataDirOption = options.userDataDir
      const userDataDir = typeof userDataDirOption === 'function'
        ? await userDataDirOption({ workerIndex: workerInfo.workerIndex })
        : userDataDirOption ?? ''

      // Optional clone: reset target then copy from source. Skipped when
      // userDataDir is empty (clone into a temp dir would defeat its purpose).
      if (options.cloneUserDataDirFrom && userDataDir) {
        // Guard against rm wiping the source: resolve both to absolute paths
        // and refuse if they point at the same location.
        const sourceAbs = resolvePath(options.cloneUserDataDirFrom)
        const targetAbs = resolvePath(userDataDir)
        if (sourceAbs === targetAbs) {
          throw new Error(
            `cloneUserDataDirFrom and userDataDir must be different paths; both resolved to "${sourceAbs}"`,
          )
        }
        await rm(userDataDir, { recursive: true, force: true })
        await cp(options.cloneUserDataDirFrom, userDataDir, { recursive: true })
      }

      const context = await chromium.launchPersistentContext(userDataDir, {
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
      // Chrome derives an unpacked extension's ID from its directory path, so
      // each wallet's ID is known up front. This avoids the previous approach
      // of pairing serviceWorkers() with walletConfigs by array index, which
      // breaks when extensions register in a different order than configured.
      const extensionIds = new Map<WalletType, string>()
      for (const config of walletConfigs) {
        const extensionPath = await getExtensionPathForWallet(config)
        extensionIds.set(config.type, getUnpackedExtensionId(extensionPath))
      }

      // Wait until every configured wallet's service worker has registered.
      // Bounded by 10s so a stuck worker fails fast instead of hanging the suite.
      const deadline = Date.now() + 10_000
      while (true) {
        const registeredIds = new Set(
          walletContext.serviceWorkers().map(worker => worker.url().split('/')[2]),
        )
        const missing = [...extensionIds.entries()]
          .filter(([, id]) => !registeredIds.has(id))

        if (missing.length === 0) {
          break
        }
        if (Date.now() > deadline) {
          const missingList = missing
            .map(([type, id]) => `${type} (expected extension ID ${id})`)
            .join(', ')
          throw new Error(
            `Timed out after 10s waiting for wallet extension service worker(s) to register: ${missingList}. `
            + `Registered service workers: ${[...registeredIds].join(', ') || 'none'}. `
            + `Make sure the extensions are downloaded (npx @avalix/chroma download-extensions) and not corrupted.`,
          )
        }

        await Promise.race([
          walletContext.waitForEvent('serviceworker', { timeout: 2_000 }).catch(() => {}),
          new Promise(resolve => setTimeout(resolve, 200)),
        ])
      }

      await use(extensionIds)
    }, { scope: 'worker' }],

    // Main page (uses worker-scoped context)
    page: async ({ walletContext }, use) => {
      const page = walletContext.pages()[0] || await walletContext.newPage()
      await use(page)
      // Note: Don't close the page or context here since they're worker-scoped
    },

    // Wallet instances for each configured wallet
    wallets: async ({ walletContext, walletExtensionIds }, use) => {
      const walletMap = {} as ExpectedWallets

      // Create wallet instance for each configured wallet
      for (const [walletType, extensionId] of walletExtensionIds) {
        const factory = walletFactories[walletType]
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
