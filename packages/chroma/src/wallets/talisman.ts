import type { BrowserContext, Page } from '@playwright/test'
import type { WalletAccount } from '../context-playwright/types.js'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

// Talisman specific configuration
export const TALISMAN_CONFIG = {
  downloadUrl: 'https://github.com/avalix-labs/polkadot-wallets/raw/refs/heads/main/talisman/talisman-3.0.5.zip',
  extensionName: 'talisman-extension-3.0.5',
} as const

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

  console.log(`✅ Found Talisman extension at: ${extensionDir}`)
  return extensionDir
}

// Talisman specific Ethereum private key import implementation
export async function importEthPrivateKey(
  page: Page & { __extensionContext: BrowserContext, __extensionId: string },
  { seed, name = 'Test Account', password = 'h3llop0lkadot!' }: WalletAccount,
): Promise<void> {
  const context = page.__extensionContext
  const extensionId = page.__extensionId

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

  if (!extensionPage) {
    throw new Error(`Talisman onboarding page not found`)
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
}

// Talisman specific authorization implementation
export async function authorizeTalisman(
  page: Page & { __extensionContext: BrowserContext, __extensionId: string },
  options: { accountName?: string } = {},
): Promise<void> {
  const { accountName = 'Test Account' } = options
  const context = page.__extensionContext
  const extensionId = page.__extensionId
  await new Promise(resolve => setTimeout(resolve, 1000))

  const extensionPopup = await findExtensionPopup(context, extensionId)

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
  const context = page.__extensionContext
  const extensionId = page.__extensionId

  await new Promise(resolve => setTimeout(resolve, 1000))
  const extensionPopup = await findExtensionPopup(context, extensionId)

  await extensionPopup.getByRole('button', { name: 'Approve' }).click()
}

// Talisman specific transaction rejection implementation
export async function rejectTalismanTx(
  page: Page & { __extensionContext: BrowserContext, __extensionId: string },
): Promise<void> {
  const context = page.__extensionContext
  const extensionId = page.__extensionId

  await new Promise(resolve => setTimeout(resolve, 1000))
  const extensionPopup = await findExtensionPopup(context, extensionId)

  await extensionPopup.getByTestId('connection-reject-button').click()
}
