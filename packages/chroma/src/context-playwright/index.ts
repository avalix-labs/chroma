import type { BrowserContext, Page } from '@playwright/test'
import { test as base, chromium } from '@playwright/test'
import { downloadAndExtractPolkadotExtension } from './download-polkadot-js.js'
import { extractTalismanExtension } from './extract-talisman.js'

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
      return await extractTalismanExtension()
    default:
      throw new Error(`Unsupported wallet type: ${walletType}`)
  }
}

// Helper function to find extension popup
async function findExtensionPopup(context: BrowserContext, extensionId: string): Promise<Page> {
  // delay for 1 second
  await new Promise(resolve => setTimeout(resolve, 1000))

  const pages = context.pages()
  for (const p of pages) {
    if (p.url().includes(`chrome-extension://${extensionId}/`)) {
      p.setViewportSize({ width: 400, height: 600 })
      p.waitForLoadState('domcontentloaded')
      return p
    }
  }
  throw new Error(`Extension popup not found for ID: ${extensionId}`)
}

// Polkadot.js specific account import
async function importPolkadotJsAccount(context: BrowserContext, extensionId: string, { seed, name, password }: WalletAccount) {
  const extensionPopupUrl = `chrome-extension://${extensionId}/onboarding.html`
  const extensionPage = await context.newPage()

  try {
    await extensionPage.goto(extensionPopupUrl)
    await extensionPage.pause()

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
    await extensionPage.locator('input[type="text"]').fill(name!)
    await extensionPage.locator('input[type="password"]').fill(password!)
    await extensionPage.locator('div').filter({ hasText: /^Repeat password for verification$/ }).getByRole('textbox').fill(password!)
    await extensionPage.getByRole('button', { name: 'Add the account with the supplied seed' }).click()
  }
  finally {
    await extensionPage.close()
  }
}

// Talisman specific account import
async function importTalismanAccount(context: BrowserContext, extensionId: string, { seed, name, password }: WalletAccount) {
  console.log(`🔗 Looking for Talisman onboarding tab...`)

  // Wait for Talisman to open its onboarding tab
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Find the onboarding tab
  let extensionPage: Page | null = null
  const pages = context.pages()

  for (const page of pages) {
    const url = page.url()
    console.log(`📄 Found page: ${url}`)
    if (url.includes('onboarding.html') || url.includes(`chrome-extension://${extensionId}/`)) {
      extensionPage = page
      console.log(`✅ Found Talisman onboarding page: ${url}`)
      break
    }
  }

  // If no onboarding page found, wait a bit more and try again
  if (!extensionPage) {
    console.log('⏳ Waiting for onboarding page to appear...')
    await new Promise(resolve => setTimeout(resolve, 3000))

    const updatedPages = context.pages()
    for (const page of updatedPages) {
      const url = page.url()
      console.log(`📄 Checking page again: ${url}`)
      if (url.includes('onboarding.html') || url.includes(`chrome-extension://${extensionId}/`)) {
        extensionPage = page
        console.log(`✅ Found Talisman onboarding page: ${url}`)
        break
      }
    }
  }

  if (!extensionPage) {
    throw new Error('Talisman onboarding page not found. Make sure the extension loaded properly.')
  }

  try {
    // Bring the onboarding page to front
    await extensionPage.bringToFront()

    // Reload the onboarding page to ensure fresh state
    console.log('🔄 Reloading onboarding page for fresh state...')
    await extensionPage.reload()

    // Wait for the page to load and become interactive
    await extensionPage.waitForLoadState('domcontentloaded')
    // await extensionPage.waitForTimeout(20000) // Give Talisman more time to initialize

    // Click the get started button
    await extensionPage.getByTestId('onboarding-get-started-button').click()

    // Fill the password
    await extensionPage.getByRole('textbox', { name: 'Enter password' }).fill(password!)
    await extensionPage.getByRole('textbox', { name: 'Confirm password' }).fill(password!)
    await extensionPage.getByTestId('onboarding-password-confirm-button').click()

    // Click the no thanks button
    await extensionPage.getByRole('button', { name: 'No thanks' }).click()
    await extensionPage.getByTestId('onboarding-enter-talisman-button').click()

    // Import Ethereum account
    await extensionPage.getByRole('button', { name: 'Add account Create or import' }).click()
    await extensionPage.getByRole('button', { name: 'Import Import an existing' }).click()
    await extensionPage.getByRole('button', { name: 'Import via Private Key' }).click()
    await extensionPage.getByRole('button', { name: 'Select account platform' }).click()
    await extensionPage.getByRole('option', { name: 'Ethereum' }).locator('div').click()
    await extensionPage.getByRole('textbox', { name: 'Choose a name' }).fill(name!)
    await extensionPage.getByRole('textbox', { name: 'Enter your private key' }).fill(seed!)
    await extensionPage.getByRole('button', { name: 'Save' }).click()

    await extensionPage.close()

    console.log('✅ Talisman account import completed')
  }
  catch (error) {
    console.error('❌ Error during Talisman account import:', error)
    throw error
  }
  // Note: Don't close extensionPage since it's the onboarding tab that Talisman opened
}

// Polkadot.js specific authorization
async function authorizePolkadotJs(context: BrowserContext, extensionId: string) {
  await new Promise(resolve => setTimeout(resolve, 1000))
  const extensionPopup = await findExtensionPopup(context, extensionId)
  await extensionPopup.getByText('Select all').click()
  await extensionPopup.getByRole('button', { name: /Connect \d+ account\(s\)/ }).click()
}

// Talisman specific authorization
async function authorizeTalisman(context: BrowserContext, extensionId: string) {
  await new Promise(resolve => setTimeout(resolve, 1000))
  const extensionPopup = await findExtensionPopup(context, extensionId)

  // Authorize Talisman account
  await extensionPopup.getByRole('button', { name: 'Talisman Account 1' }).click()
  await extensionPopup.getByTestId('connection-connect-button').click()

  try {
    const anotherPopup = await findExtensionPopup(context, extensionId)
    await anotherPopup.getByRole('button', { name: 'Approve' }).click()
  }
  catch {
    console.log('No another popup found, skipping')
  }
}

// Polkadot.js specific transaction approval
async function approveTxPolkadotJs(context: BrowserContext, extensionId: string, password: string) {
  await new Promise(resolve => setTimeout(resolve, 1000))
  const extensionPopup = await findExtensionPopup(context, extensionId)
  await extensionPopup.getByRole('textbox').fill(password)
  await extensionPopup.getByRole('button', { name: 'Sign the transaction' }).click()
}

// Talisman specific transaction approval
async function approveTxTalisman(context: BrowserContext, extensionId: string, password: string) {
  await new Promise(resolve => setTimeout(resolve, 1000))
  const extensionPopup = await findExtensionPopup(context, extensionId)

  await extensionPopup.getByRole('button', { name: 'Approve' }).click()
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

      console.log(`🚀 Launching browser with ${walletType} extension from: ${extensionPath}`)

      const context = await chromium.launchPersistentContext('', {
        headless,
        channel: 'chromium',
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

      // Get extension ID from service worker with better error handling
      console.log(`🔍 Looking for ${walletType} extension service worker...`)
      let [background] = context.serviceWorkers()
      if (!background) {
        console.log('⏳ Waiting for service worker to start...')
        try {
          background = await context.waitForEvent('serviceworker', { timeout: 15000 })
        }
        catch {
          console.error(`❌ Service worker timeout for ${walletType}. Available workers:`, context.serviceWorkers().map(sw => sw.url()))
          throw new Error(`Extension service worker not found. Make sure the ${walletType} extension is properly loaded.`)
        }
      }

      // Extract extension ID with validation
      const extensionUrl = background.url()
      console.log(`🔗 Extension service worker URL: ${extensionUrl}`)
      const extensionId = extensionUrl.split('/')[2]
      if (!extensionId || extensionId.length < 10) {
        throw new Error(`Invalid extension ID extracted from URL: ${extensionUrl}`)
      }
      console.log(`✅ ${walletType} extension ID: ${extensionId}`)
      extendedPage.__extensionId = extensionId

      await use(page)
      await context.close()
    },

    // Fixture to create wallet account
    importAccount: async ({ page, walletType }, use) => {
      const importAccount = async ({ seed, name = 'Test Account', password = 'h3llop0lkadot!' }: WalletAccount) => {
        const context = page.__extensionContext
        const extensionId = page.__extensionId

        switch (walletType) {
          case 'polkadot-js':
            await importPolkadotJsAccount(context, extensionId, { seed, name, password })
            break
          case 'talisman':
            await importTalismanAccount(context, extensionId, { seed, name, password })
            break
          default:
            throw new Error(`Unsupported wallet type for account import: ${walletType}`)
        }

        console.log(`✅ Created wallet account: ${name}`)
      }

      await use(importAccount)
    },

    // Fixture to connect wallet to dApp
    authorize: async ({ page, walletType }, use) => {
      const authorize = async () => {
        const context = page.__extensionContext
        const extensionId = page.__extensionId

        switch (walletType) {
          case 'polkadot-js':
            await authorizePolkadotJs(context, extensionId)
            break
          case 'talisman':
            await authorizeTalisman(context, extensionId)
            break
          default:
            throw new Error(`Unsupported wallet type for authorization: ${walletType}`)
        }

        console.log('✅ Wallet connected successfully')
      }

      await use(authorize)
    },

    approveTx: async ({ page, walletType }, use) => {
      const approveTx = async (options: { password?: string } = {}) => {
        const { password = 'h3llop0lkadot!' } = options
        const context = page.__extensionContext
        const extensionId = page.__extensionId

        switch (walletType) {
          case 'polkadot-js':
            await approveTxPolkadotJs(context, extensionId, password)
            break
          case 'talisman':
            await approveTxTalisman(context, extensionId, password)
            break
          default:
            throw new Error(`Unsupported wallet type for transaction approval: ${walletType}`)
        }

        console.log('✅ Transaction signed successfully')
      }

      await use(approveTx)
    },
  })
}

// Default test with Polkadot JS wallet
export const test: ReturnType<typeof createWalletTest> = createWalletTest()

export { expect } from '@playwright/test'
