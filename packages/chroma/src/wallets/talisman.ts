import type { BrowserContext, Page } from '@playwright/test'
import type { WalletAccount } from '../context-playwright/types.js'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

// Default password for all wallet operations
const DEFAULT_PASSWORD = 'h3llop0lkadot!'

// Talisman specific configuration
export const TALISMAN_CONFIG = {
  downloadUrl: 'https://github.com/avalix-labs/polkadot-wallets/raw/refs/heads/main/talisman/talisman-3.0.5.zip',
  extensionName: 'talisman-extension-3.0.5',
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

// Talisman specific Ethereum private key import implementation
export async function importEthPrivateKey(
  page: Page & { __extensionContext: BrowserContext, __extensionId: string },
  { seed, name = 'Test Account' }: WalletAccount,
): Promise<void> {
  const password = DEFAULT_PASSWORD
  const context = page.__extensionContext
  const extensionId = page.__extensionId

  // Wait for Talisman to open its onboarding tab with retry logic
  const maxAttempts = 20
  const retryDelay = 500
  let extensionPage: Page | null = null

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const pages = context.pages()

    for (const p of pages) {
      const url = p.url()
      if (url.includes('onboarding.html') || url.includes(`chrome-extension://${extensionId}/`)) {
        extensionPage = p
        break
      }
    }

    if (extensionPage) {
      break
    }

    // If not found, wait before retrying
    if (attempt < maxAttempts - 1) {
      console.log(`⏳ Attempt ${attempt + 1}/${maxAttempts}: Waiting for onboarding page...`)
      await new Promise(resolve => setTimeout(resolve, retryDelay))
    }
  }

  if (!extensionPage) {
    throw new Error(`Talisman onboarding page not found after ${maxAttempts} attempts`)
  }

  try {
    // Bring the onboarding page to front
    await extensionPage.bringToFront()

    // Wait for the page to load and become interactive
    await extensionPage.waitForLoadState('domcontentloaded')

    // Click the get started button
    await extensionPage.getByTestId('onboarding-get-started-button').click()

    // Fill the password
    await extensionPage.getByRole('textbox', { name: 'Enter password' }).fill(password)
    await extensionPage.getByRole('textbox', { name: 'Confirm password' }).fill(password)
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
    await extensionPage.getByRole('textbox', { name: 'Choose a name' }).fill(name)
    await extensionPage.getByRole('textbox', { name: 'Enter your private key' }).fill(seed)
    await extensionPage.getByRole('button', { name: 'Save' }).click()

    await extensionPage.close()

    console.log('✅ Talisman account import completed')
  }
  catch (error) {
    console.error('❌ Error during Talisman account import:', error)
    throw error
  }
}

// Talisman specific authorization implementation
export async function authorizeTalisman(
  page: Page & { __extensionContext: BrowserContext, __extensionId: string },
  options: { accountName?: string } = {},
): Promise<void> {
  const { accountName = 'Test Account' } = options
  const password = DEFAULT_PASSWORD
  const context = page.__extensionContext
  const extensionId = page.__extensionId

  const extensionPopup = await findExtensionPopup(context, extensionId)

  // Check if password input exists (wallet is locked)
  const passwordInput = extensionPopup.getByRole('textbox', { name: 'Enter password' })
  if (await passwordInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log('🔐 Wallet is locked, entering password...')
    await passwordInput.fill(password)
    await extensionPopup.getByRole('button', { name: 'Unlock' }).click()
    await extensionPopup.waitForTimeout(500)
  }

  // Authorize Talisman account
  await extensionPopup.getByRole('button', { name: accountName }).click()
  await extensionPopup.getByTestId('connection-connect-button').click()

  try {
    const anotherPopup = await findExtensionPopup(context, extensionId)
    await anotherPopup.getByRole('button', { name: 'Approve' }).click()
  }
  catch {
    console.log('No another popup found, skipping')
  }
}

// Talisman specific transaction approval implementation
export async function approveTalismanTx(
  page: Page & { __extensionContext: BrowserContext, __extensionId: string },
): Promise<void> {
  const password = DEFAULT_PASSWORD
  const context = page.__extensionContext
  const extensionId = page.__extensionId

  const extensionPopup = await findExtensionPopup(context, extensionId)

  // Check if password input exists (wallet is locked)
  const passwordInput = extensionPopup.getByRole('textbox', { name: 'Enter password' })
  if (await passwordInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log('🔐 Wallet is locked, entering password...')
    await passwordInput.fill(password)
    await extensionPopup.getByRole('button', { name: 'Unlock' }).click()
    await extensionPopup.waitForTimeout(500)
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
  await extensionPopup.getByTestId('connection-reject-button').click()
}
