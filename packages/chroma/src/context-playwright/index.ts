import type { BrowserContext, Page } from '@playwright/test'
import { test as base, chromium } from '@playwright/test'
import { downloadAndExtractPolkadotExtension } from './download-polkadot-js.js'

// Supported wallet types
export type WalletType = 'polkadot-js' | 'talisman'

// Wallet configuration
export interface WalletConfig {
  downloadUrl?: string
  customPath?: string
}

// Types for our wallet fixtures
export interface WalletAccount {
  seed: string
  name?: string
  password?: string
}

// Test configuration options
export interface ChromaTestOptions {
  walletType?: WalletType
  walletConfig?: WalletConfig
  headless?: boolean
  slowMo?: number
}

// Extended page interface with our custom properties
interface ExtendedPage extends Page {
  __extensionContext: BrowserContext
  __extensionId: string
}

export interface WalletFixtures {
  page: ExtendedPage
  walletType: WalletType
  walletConfig: WalletConfig
  importAccount: (options: WalletAccount) => Promise<void>
  authorize: () => Promise<void>
  approveTx: (options?: { password?: string }) => Promise<void>
}

// Default wallet configurations
const DEFAULT_WALLET_CONFIGS: Record<WalletType, WalletConfig> = {
  'polkadot-js': {
    downloadUrl: 'https://github.com/polkadot-js/extension/releases/download/v0.61.7/master-chrome-build.zip',
  },
  'talisman': {
    // TODO: Add Talisman download URL when implementation is ready
  },
}

// Helper function to get extension path based on wallet type
async function getExtensionPath(walletType: WalletType, walletConfig: WalletConfig): Promise<string> {
  const { customPath } = walletConfig

  if (customPath) {
    return customPath
  }

  switch (walletType) {
    case 'polkadot-js':
      return await downloadAndExtractPolkadotExtension()
    case 'talisman':
      // TODO: Implement Talisman download function
      throw new Error('Talisman wallet download not implemented yet')
    default:
      throw new Error(`Unsupported wallet type: ${walletType}`)
  }
}

// Helper function to find extension popup
async function findExtensionPopup(context: BrowserContext, extensionId: string): Promise<Page> {
  const pages = context.pages()
  for (const p of pages) {
    if (p.url().includes(`chrome-extension://${extensionId}/`)) {
      return p
    }
  }
  throw new Error(`Extension popup not found for ID: ${extensionId}`)
}

// Create a test function with wallet configuration
export function createWalletTest(options: ChromaTestOptions = {}): ReturnType<typeof base.extend<WalletFixtures>> {
  const { walletType = 'polkadot-js', walletConfig, headless = false, slowMo = 150 } = options
  const finalWalletConfig = walletConfig || DEFAULT_WALLET_CONFIGS[walletType]

  return base.extend<WalletFixtures>({
    // Wallet type fixture
    // eslint-disable-next-line no-empty-pattern
    walletType: async ({}, use) => {
      await use(walletType)
    },

    // Wallet configuration fixture
    // eslint-disable-next-line no-empty-pattern
    walletConfig: async ({}, use) => {
      await use(finalWalletConfig)
    },

    // Main page with extension context
    // eslint-disable-next-line no-empty-pattern
    page: async ({}, use) => {
      // Get extension path based on wallet type
      const extensionPath = await getExtensionPath(walletType, finalWalletConfig)

      const context = await chromium.launchPersistentContext('', {
        headless,
        args: [
          `--load-extension=${extensionPath}`,
          `--disable-extensions-except=${extensionPath}`,
        ],
        slowMo,
      })

      const page = context.pages()[0] || await context.newPage()

      // Store context and extensionId on page for internal use
      const extendedPage = page as ExtendedPage
      extendedPage.__extensionContext = context

      // Get extension ID from service worker
      let [background] = context.serviceWorkers()
      if (!background) {
        background = await context.waitForEvent('serviceworker')
      }
      extendedPage.__extensionId = background.url().split('/')[2]

      await use(page)
      await context.close()
    },

    // Fixture to create wallet account
    importAccount: async ({ page }, use) => {
      const importAccount = async ({ seed, name = 'Test Account', password = 'h3llop0lkadot!' }: WalletAccount) => {
        const context = page.__extensionContext
        const extensionId = page.__extensionId

        const extensionPopupUrl = `chrome-extension://${extensionId}/index.html`
        const extensionPage = await context.newPage()

        try {
          await extensionPage.goto(extensionPopupUrl)

          // Handle "Understood, let me continue" button if it exists
          const understoodButton = extensionPage.getByRole('button', { name: 'Understood, let me continue' })
          if (await understoodButton.count() > 0) {
            await understoodButton.click()
            await extensionPage.waitForTimeout(100)
          }

          // Navigate to import seed page
          await extensionPage.goto(`${extensionPopupUrl}#/account/import-seed`)

          // Fill seed phrase and account details
          await extensionPage.locator('textarea').fill(seed)
          await extensionPage.locator('button:has-text("Next")').click()
          await extensionPage.locator('input[type="text"]').fill(name)
          await extensionPage.locator('input[type="password"]').fill(password)
          await extensionPage.locator('div').filter({ hasText: /^Repeat password for verification$/ }).getByRole('textbox').fill(password)
          await extensionPage.getByRole('button', { name: 'Add the account with the supplied seed' }).click()

          console.log(`✅ Created wallet account: ${name}`)
        }
        finally {
          await extensionPage.close()
        }
      }

      await use(importAccount)
    },

    // Fixture to connect wallet to dApp
    authorize: async ({ page }, use) => {
      const authorize = async () => {
        const context = page.__extensionContext
        const extensionId = page.__extensionId
        await new Promise(resolve => setTimeout(resolve, 1000))

        const extensionPopup = await findExtensionPopup(context, extensionId)
        await extensionPopup.getByText('Select all').click()
        await extensionPopup.getByRole('button', { name: /Connect \d+ account\(s\)/ }).click()

        console.log('✅ Wallet connected successfully')
      }

      await use(authorize)
    },

    approveTx: async ({ page }, use) => {
      const approveTx = async (options: { password?: string } = {}) => {
        const { password = 'h3llop0lkadot!' } = options
        const context = page.__extensionContext
        const extensionId = page.__extensionId

        await new Promise(resolve => setTimeout(resolve, 1000))
        const extensionPopup = await findExtensionPopup(context, extensionId)

        await extensionPopup.getByRole('textbox').fill(password)
        await extensionPopup.getByRole('button', { name: 'Sign the transaction' }).click()

        console.log('✅ Transaction signed successfully')
      }

      await use(approveTx)
    },
  })
}

// Default test with Polkadot JS wallet
export const test: ReturnType<typeof createWalletTest> = createWalletTest()

export { expect } from '@playwright/test'
