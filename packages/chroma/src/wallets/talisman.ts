import type { BrowserContext, Page } from '@playwright/test'
import type { WalletAccount } from '../context-playwright/types.js'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

// Talisman specific configuration
// https://github.com/avalix-labs/polkadot-wallets/tree/main/talisman
const VERSION = '3.1.13'
export const TALISMAN_CONFIG = {
  downloadUrl: `https://github.com/avalix-labs/polkadot-wallets/raw/refs/heads/main/talisman/talisman-${VERSION}.zip`,
  extensionName: `talisman-extension-${VERSION}`,
} as const

// Helper function to find extension popup
async function findExtensionPopup(context: BrowserContext, extensionId: string): Promise<Page> {
  // Wait for extension popup to appear with retry logic
  const maxAttempts = 10
  const retryDelay = 500

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const pages = context.pages()
    for (const p of pages) {
      if (p.url().includes(`chrome-extension://${extensionId}/`)) {
        await p.setViewportSize({ width: 400, height: 600 })
        await p.waitForLoadState('domcontentloaded')
        return p
      }
    }

    // If not found, wait a bit before retrying
    if (attempt < maxAttempts - 1) {
      await new Promise(resolve => setTimeout(resolve, retryDelay))
    }
  }

  throw new Error(`Extension popup not found for ID: ${extensionId}`)
}

// Get Talisman extension path
export async function getTalismanExtensionPath(): Promise<string> {
  const extensionsDir = path.resolve(process.cwd(), '.chroma')
  const extensionDir = path.join(extensionsDir, TALISMAN_CONFIG.extensionName)

  // Check if extension exists
  if (!fs.existsSync(extensionDir) || fs.readdirSync(extensionDir).length === 0) {
    throw new Error(
      `Talisman extension not found at: ${extensionDir}\n\n`
      + `Please download the extension first by running:\n`
      + `  npx @avalix/chroma download-extensions\n`,
    )
  }

  return extensionDir
}

// Helper function to find Talisman onboarding page
async function findOnboardingPage(
  context: BrowserContext,
  extensionId: string,
): Promise<Page> {
  // Open new dashboard page
  const popupUrl = `chrome-extension://${extensionId}/dashboard.html`
  const newPage = await context.newPage()
  await newPage.goto(popupUrl)
  await newPage.waitForLoadState('domcontentloaded')

  // Close any other extension tabs that may have been opened automatically
  for (const p of context.pages()) {
    if (p !== newPage && p.url().includes(`chrome-extension://${extensionId}/`)) {
      await p.close()
    }
  }

  return newPage
}

// Helper function to complete Talisman onboarding flow
async function completeOnboarding(
  extensionPage: Page,
  password: string,
): Promise<void> {
  // Bring the onboarding page to front
  await extensionPage.bringToFront()

  // Wait for the page to load and become interactive
  await extensionPage.waitForLoadState('domcontentloaded')

  if (await extensionPage.getByRole('button', { name: 'Settings' }).isVisible()) {
    await extensionPage.getByRole('button', { name: 'Settings' }).click({ force: true })
    return
  }

  // Click the get started button
  await extensionPage.getByTestId('onboarding-get-started-button').click()

  // Fill the password
  await extensionPage.getByRole('textbox', { name: 'Enter password' }).fill(password)
  await extensionPage.getByRole('textbox', { name: 'Confirm password' }).fill(password)
  await extensionPage.getByTestId('onboarding-password-confirm-button').click()

  // Click the no thanks button
  await extensionPage.getByRole('button', { name: 'No thanks' }).click()
  await extensionPage.getByTestId('onboarding-enter-talisman-button').click()

  // Enable auto risk scan
  await extensionPage.waitForLoadState('domcontentloaded')
  if (await extensionPage.getByText('Pin Talisman for easy').isVisible()) {
    await extensionPage.getByText('Pin Talisman for easy').click()
  }
  await extensionPage.getByRole('button', { name: 'Settings' }).click({ force: true })
  await extensionPage.getByRole('link', { name: 'Security & Privacy' }).click()
  await extensionPage.getByTestId('component-toggle-button').first().click()
}

// Talisman specific Polkadot mnemonic import implementation
export async function importPolkadotMnemonic(
  page: Page & { __extensionContext: BrowserContext, __extensionId: string },
  { seed, name = 'Test Account', password = 'h3llop0lkadot!' }: WalletAccount,
): Promise<void> {
  const context = page.__extensionContext
  const extensionId = page.__extensionId

  const extensionPage = await findOnboardingPage(context, extensionId)

  try {
    await completeOnboarding(extensionPage, password!)

    // Import Polkadot account via Recovery Phrase
    await extensionPage.getByRole('link', { name: 'Manage Accounts' }).click()
    await extensionPage.getByRole('button', { name: 'Get Started' }).click()
    await extensionPage.getByRole('button', { name: 'Add Account' }).click()
    await extensionPage.getByRole('button', { name: 'Import Import an existing' }).click()
    await extensionPage.getByRole('button', { name: 'Import via Recovery Phrase' }).click()
    await extensionPage.getByRole('button', { name: 'Polkadot Relay Chain, Asset' }).click()
    await extensionPage.getByRole('textbox', { name: 'Choose a name' }).fill(name!)
    await extensionPage.getByRole('textbox', { name: 'Enter your 12 or 24 word' }).fill(seed!)
    await extensionPage.getByTestId('account-add-mnemonic-import-button').click()

    await extensionPage.close()
  }
  catch (error) {
    console.error('❌ Error during Talisman Polkadot account import:', error)
    throw error
  }
}

// Talisman specific Ethereum private key import implementation
export async function importEthPrivateKey(
  page: Page & { __extensionContext: BrowserContext, __extensionId: string },
  { seed, name = 'Test Account', password = 'h3llop0lkadot!' }: WalletAccount,
): Promise<void> {
  const context = page.__extensionContext
  const extensionId = page.__extensionId

  const extensionPage = await findOnboardingPage(context, extensionId)

  try {
    await completeOnboarding(extensionPage, password!)

    // Import Ethereum account via Private Key
    await extensionPage.getByRole('link', { name: 'Manage Accounts' }).click()
    await extensionPage.getByRole('button', { name: 'Get Started' }).click()
    await extensionPage.getByRole('button', { name: 'Add Account' }).click()
    await extensionPage.getByRole('button', { name: 'Import Import an existing' }).click()
    await extensionPage.getByRole('button', { name: 'Import via Private Key' }).click()
    await extensionPage.getByRole('button', { name: 'Select account platform' }).click()
    await extensionPage.getByRole('option', { name: 'Ethereum' }).locator('div').click()
    await extensionPage.getByRole('textbox', { name: 'Choose a name' }).fill(name!)
    await extensionPage.getByRole('textbox', { name: 'Enter your private key' }).fill(seed!)
    await extensionPage.getByRole('button', { name: 'Save' }).click()

    await extensionPage.close()
  }
  catch (error) {
    console.error('❌ Error during Talisman Ethereum account import:', error)
    throw error
  }
}

// Talisman specific authorization implementation
export async function authorizeTalisman(
  page: Page & { __extensionContext: BrowserContext, __extensionId: string },
  options: { accountName?: string } = {},
): Promise<void> {
  const { accountName = 'Test Account' } = options
  const context = page.__extensionContext
  const extensionId = page.__extensionId

  const extensionPopup = await findExtensionPopup(context, extensionId)

  // Authorize Talisman account
  await extensionPopup.getByRole('button', { name: accountName }).click()
  await extensionPopup.getByTestId('connection-connect-button').click()

  try {
    const anotherPopup = await findExtensionPopup(context, extensionId)
    await anotherPopup.getByRole('button', { name: 'Approve' }).click()
  }
  catch {
  }
}

// Talisman specific transaction approval implementation
export async function approveTalismanTx(
  page: Page & { __extensionContext: BrowserContext, __extensionId: string },
): Promise<void> {
  const context = page.__extensionContext
  const extensionId = page.__extensionId

  const extensionPopup = await findExtensionPopup(context, extensionId)

  if (await extensionPopup.getByRole('button', { name: 'Yes' }).isVisible()) {
    await extensionPopup.getByRole('button', { name: 'Yes' }).click()
  }

  await extensionPopup.getByRole('button', { name: 'Approve' }).click()
}

// Talisman specific transaction rejection implementation
export async function rejectTalismanTx(
  page: Page & { __extensionContext: BrowserContext, __extensionId: string },
): Promise<void> {
  const context = page.__extensionContext
  const extensionId = page.__extensionId

  const extensionPopup = await findExtensionPopup(context, extensionId)

  const rejectButton = extensionPopup.getByTestId('connection-reject-button')
    .or(extensionPopup.getByRole('button', { name: 'Cancel' }))

  await rejectButton.click()
}
