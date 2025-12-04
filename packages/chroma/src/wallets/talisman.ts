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

  console.log(`✅ Found Talisman extension at: ${extensionDir}`)
  return extensionDir
}

// Helper function to find dashboard page
async function findDashboardPage(context: BrowserContext, extensionId: string): Promise<Page | null> {
  const maxAttempts = 10
  const retryDelay = 500

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const pages = context.pages()
    for (const p of pages) {
      const url = p.url()
      if (url.includes(`chrome-extension://${extensionId}/dashboard.html`)) {
        return p
      }
    }

    if (attempt < maxAttempts - 1) {
      await new Promise(resolve => setTimeout(resolve, retryDelay))
    }
  }

  return null
}

// Helper function to check if onboarding is needed and setup wallet
async function setupTalismanWallet(
  context: BrowserContext,
  extensionId: string,
  password: string,
): Promise<Page> {
  let extensionPage: Page | null = null

  // First, check if there's already a Talisman page open (onboarding or dashboard)
  const pages = context.pages()
  for (const p of pages) {
    const url = p.url()
    if (url.includes('onboarding.html') || url.includes(`chrome-extension://${extensionId}/`)) {
      extensionPage = p
      console.log(`✅ Found existing Talisman page: ${url}`)
      break
    }
  }

  // If no page found, try to wait for onboarding (first time setup)
  if (!extensionPage) {
    const maxAttempts = 10
    const retryDelay = 500

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const currentPages = context.pages()

      for (const p of currentPages) {
        const url = p.url()
        if (url.includes('onboarding.html')) {
          extensionPage = p
          console.log(`✅ Found Talisman onboarding page: ${url}`)
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
  }

  // If still no page found, manually open the extension dashboard
  if (!extensionPage) {
    console.log('📂 Opening Talisman dashboard manually...')
    const dashboardUrl = `chrome-extension://${extensionId}/dashboard.html`
    extensionPage = await context.newPage()
    await extensionPage.goto(dashboardUrl)
    console.log(`✅ Opened Talisman dashboard: ${dashboardUrl}`)
  }

  // Bring the page to front
  await extensionPage.bringToFront()
  await extensionPage.waitForLoadState('domcontentloaded')

  // Check if we need to do onboarding (get started button exists)
  const getStartedButton = extensionPage.getByTestId('onboarding-get-started-button')
  if (await getStartedButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log('🔧 Running Talisman onboarding setup...')

    // Click the get started button
    await getStartedButton.click()

    // Fill the password
    await extensionPage.getByRole('textbox', { name: 'Enter password' }).fill(password)
    await extensionPage.getByRole('textbox', { name: 'Confirm password' }).fill(password)
    await extensionPage.getByTestId('onboarding-password-confirm-button').click()

    // Click the no thanks button (skip backup reminder)
    await extensionPage.getByRole('button', { name: 'No thanks' }).click()
    await extensionPage.getByTestId('onboarding-enter-talisman-button').click()

    console.log('✅ Talisman onboarding completed')

    // After onboarding, the page might redirect or close
    // Wait for dashboard page to appear and use that instead
    console.log('⏳ Waiting for dashboard page after onboarding...')
    const dashboardPage = await findDashboardPage(context, extensionId)
    if (dashboardPage) {
      console.log('✅ Found dashboard page after onboarding')
      await dashboardPage.bringToFront()
      await dashboardPage.waitForLoadState('domcontentloaded')
      return dashboardPage
    }

    // If still on the same page, check if it's still valid
    try {
      await extensionPage.waitForLoadState('domcontentloaded', { timeout: 3000 })
    }
    catch {
      // Page might have closed, open dashboard manually
      console.log('📂 Opening dashboard manually after onboarding...')
      const dashboardUrl = `chrome-extension://${extensionId}/dashboard.html`
      extensionPage = await context.newPage()
      await extensionPage.goto(dashboardUrl)
      await extensionPage.waitForLoadState('domcontentloaded')
    }
  }

  return extensionPage
}

// Talisman specific Ethereum private key import implementation
export async function importEthPrivateKey(
  page: Page & { __extensionContext: BrowserContext, __extensionId: string },
  { seed, name = 'Test Account', password = 'h3llop0lkadot!' }: WalletAccount,
): Promise<void> {
  const context = page.__extensionContext
  const extensionId = page.__extensionId

  try {
    const extensionPage = await setupTalismanWallet(context, extensionId, password!)

    // Wait for page to be fully stable before interacting
    await extensionPage.waitForLoadState('networkidle').catch(() => {})

    // Dismiss any toast notifications by pressing Escape or clicking outside
    // Talisman shows a welcome toast after onboarding that can intercept pointer events
    console.log('⏳ Dismissing any toast notifications...')
    await extensionPage.keyboard.press('Escape')
    await extensionPage.waitForTimeout(500)

    // Wait for the Settings button to be visible and stable
    const settingsButton = extensionPage.getByRole('button', { name: 'Settings' })
    await settingsButton.waitFor({ state: 'visible', timeout: 10000 })

    // Click Settings button - retry if blocked
    let clicked = false
    for (let i = 0; i < 3 && !clicked; i++) {
      try {
        await settingsButton.click({ timeout: 3000 })
        clicked = true
      }
      catch {
        console.log(`⏳ Retry ${i + 1}/3: Settings button click failed, pressing Escape...`)
        await extensionPage.keyboard.press('Escape')
        await extensionPage.waitForTimeout(500)
      }
    }

    if (!clicked) {
      throw new Error('Failed to click Settings button after 3 attempts')
    }

    await extensionPage.getByRole('link', { name: 'Manage Accounts' }).click()
    await extensionPage.getByRole('button', { name: 'Get Started' }).click()
    await extensionPage.getByRole('button', { name: 'Add Account' }).click()
    await extensionPage.getByRole('button', { name: 'Import Import an existing' }).click()
    await extensionPage.getByRole('button', { name: 'Import via Private Key' }).click()

    // Fill private key
    await extensionPage.getByRole('button', { name: 'Select account platform' }).click()
    await extensionPage.getByRole('option', { name: 'Ethereum' }).locator('div').click()
    await extensionPage.getByRole('textbox', { name: 'Choose a name' }).fill(name!)
    await extensionPage.getByRole('textbox', { name: 'Enter your private key' }).fill(seed!)
    await extensionPage.getByRole('button', { name: 'Save' }).click()

    await extensionPage.close()

    console.log(`✅ Talisman Ethereum account imported: ${name}`)
  }
  catch (error) {
    console.error('❌ Error during Talisman Ethereum account import:', error)
    throw error
  }
}

// Talisman specific Polkadot mnemonic import implementation
export async function importPolkadotMnemonic(
  page: Page & { __extensionContext: BrowserContext, __extensionId: string },
  { seed, name = 'Test Account', password = 'h3llop0lkadot!' }: WalletAccount,
): Promise<void> {
  const context = page.__extensionContext
  const extensionId = page.__extensionId

  try {
    const extensionPage = await setupTalismanWallet(context, extensionId, password!)

    // Wait for page to be fully stable before interacting
    await extensionPage.waitForLoadState('networkidle').catch(() => {})

    // Dismiss any toast notifications by pressing Escape or clicking outside
    // Talisman shows a welcome toast after onboarding that can intercept pointer events
    console.log('⏳ Dismissing any toast notifications...')
    await extensionPage.keyboard.press('Escape')
    await extensionPage.waitForTimeout(500)

    // Wait for the Settings button to be visible and stable
    const settingsButton = extensionPage.getByRole('button', { name: 'Settings' })
    await settingsButton.waitFor({ state: 'visible', timeout: 10000 })

    // Click Settings button - retry if blocked
    let clicked = false
    for (let i = 0; i < 3 && !clicked; i++) {
      try {
        await settingsButton.click({ timeout: 3000 })
        clicked = true
      }
      catch {
        console.log(`⏳ Retry ${i + 1}/3: Settings button click failed, pressing Escape...`)
        await extensionPage.keyboard.press('Escape')
        await extensionPage.waitForTimeout(500)
      }
    }

    if (!clicked) {
      throw new Error('Failed to click Settings button after 3 attempts')
    }

    await extensionPage.getByRole('link', { name: 'Manage Accounts' }).click()
    await extensionPage.getByRole('button', { name: 'Get Started' }).click()
    await extensionPage.getByRole('button', { name: 'Add Account' }).click()
    await extensionPage.getByRole('button', { name: 'Import Import an existing' }).click()
    await extensionPage.getByRole('button', { name: 'Import via Recovery Phrase' }).click()

    // Fill mnemonic
    await extensionPage.getByRole('button', { name: 'Polkadot Relay Chain, Asset' }).click()
    await extensionPage.getByRole('textbox', { name: 'Choose a name' }).fill(name!)
    await extensionPage.getByRole('textbox', { name: 'Enter your 12 or 24 word' }).fill(seed!)
    await extensionPage.getByTestId('account-add-mnemonic-import-button').click()

    await extensionPage.close()

    console.log(`✅ Talisman Polkadot account imported: ${name}`)
  }
  catch (error) {
    console.error('❌ Error during Talisman Polkadot mnemonic import:', error)
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
    console.log('No another popup found, skipping')
  }
}

// Talisman specific transaction approval implementation
export async function approveTalismanTx(
  page: Page & { __extensionContext: BrowserContext, __extensionId: string },
): Promise<void> {
  const context = page.__extensionContext
  const extensionId = page.__extensionId

  const extensionPopup = await findExtensionPopup(context, extensionId)
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
