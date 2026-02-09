import type { BrowserContext, Page } from '@playwright/test'
import type { WalletAccount } from '../context-playwright/types.js'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

// MetaMask specific configuration
// https://github.com/MetaMask/metamask-extension/releases
const VERSION = '13.17.0'
export const METAMASK_CONFIG = {
  downloadUrl: `https://github.com/MetaMask/metamask-extension/releases/download/v${VERSION}/metamask-flask-chrome-${VERSION}-flask.0.zip`,
  extensionName: `metamask-extension-${VERSION}`,
} as const

// Get MetaMask extension path
export async function getMetaMaskExtensionPath(): Promise<string> {
  const extensionsDir = path.resolve(process.cwd(), '.chroma')
  const extensionDir = path.join(extensionsDir, METAMASK_CONFIG.extensionName)

  // Check if extension exists
  if (!fs.existsSync(extensionDir) || fs.readdirSync(extensionDir).length === 0) {
    throw new Error(
      `MetaMask extension not found at: ${extensionDir}\n\n`
      + `Please download the extension first by running:\n`
      + `  npx @avalix/chroma download-extensions\n`,
    )
  }

  return extensionDir
}

/*
 * Wallet interaction functions below are excluded from coverage because:
 * - They require a real Chromium browser with extension support
 * - They interact with Chrome extension popup pages
 */
/* c8 ignore start */

// Helper function to find existing MetaMask extension page
async function findOnboardingPage(
  context: BrowserContext,
  extensionId: string,
): Promise<Page> {
  const maxAttempts = 10
  const retryDelay = 500

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const pages = context.pages()
    for (const p of pages) {
      if (p.url().includes(`chrome-extension://${extensionId}/`)) {
        await p.waitForLoadState('domcontentloaded')
        await p.getByText('I accept the risks').click()
        return p
      }
    }

    // If not found, wait a bit before retrying
    if (attempt < maxAttempts - 1) {
      await new Promise(resolve => setTimeout(resolve, retryDelay))
    }
  }

  throw new Error(`MetaMask extension page not found for ID: ${extensionId}`)
}

// Helper function to find MetaMask side panel via CDP, open in new tab, and return the page
async function findExtensionPopup(
  context: BrowserContext,
  extensionId: string,
): Promise<Page> {
  const maxAttempts = 10
  const retryDelay = 500

  const page0 = context.pages()[0]
  if (!page0) {
    throw new Error('No pages available to create CDP session')
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const client = await context.newCDPSession(page0)
    const { targetInfos } = await client.send('Target.getTargets')
    const sidePanelTarget = targetInfos.find(
      (t: any) => t.url.includes(`chrome-extension://${extensionId}/`) && t.url.includes('sidepanel'),
    )
    await client.detach()

    if (sidePanelTarget) {
      // Open the side panel URL in a new tab to interact with it
      const sidePanelPage = await context.newPage()
      await sidePanelPage.goto(sidePanelTarget.url)
      await sidePanelPage.waitForLoadState('domcontentloaded')
      return sidePanelPage
    }

    // If not found, wait a bit before retrying
    if (attempt < maxAttempts - 1) {
      await new Promise(resolve => setTimeout(resolve, retryDelay))
    }
  }

  throw new Error(`MetaMask side panel not found for ID: ${extensionId}`)
}

const METAMASK_PASSWORD = 'h3llop0lkadot!'

// Helper function to complete MetaMask onboarding flow
async function completeOnboarding(
  extensionPage: Page,
): Promise<void> {
  // Bring the onboarding page to front
  await extensionPage.bringToFront()
  await extensionPage.waitForLoadState('domcontentloaded')

  // Click "Import an existing wallet"
  await extensionPage.getByTestId('onboarding-import-wallet').click()

  // Click "Import with Secret Recovery Phrase"
  await extensionPage.getByTestId('onboarding-import-with-srp-button').click()

  // Enter a dummy seed phrase to complete onboarding
  // Must use type() instead of fill() because MetaMask listens for Space keypress to separate words
  const dummySeed = 'test test test test test test test test test test test junk'
  await extensionPage.getByTestId('srp-input-import__srp-note').pressSequentially(dummySeed, { delay: 50 })

  // Confirm seed phrase
  await extensionPage.getByTestId('import-srp-confirm').click()

  // Set password
  await extensionPage.getByTestId('create-password-new-input').fill(METAMASK_PASSWORD)
  await extensionPage.getByTestId('create-password-confirm-input').fill(METAMASK_PASSWORD)
  await extensionPage.getByTestId('create-password-terms').click()
  await extensionPage.getByTestId('create-password-submit').click()

  // Agree to metrics
  // await extensionPage.pause()
  await extensionPage.getByTestId('metametrics-checkbox').click()
  await extensionPage.getByTestId('metametrics-i-agree').click()

  // Complete onboarding
  await extensionPage.getByTestId('manage-default-settings').click()
  await extensionPage.getByTestId('category-item-General').click()
  await extensionPage.getByTestId('basic-functionality-toggle').locator('.toggle-button').click()
  await extensionPage.getByText('I understand and want to continue').click()
  await extensionPage.getByTestId('basic-configuration-modal-toggle-button').click()
  await extensionPage.getByTestId('category-back-button').click()

  await extensionPage.getByTestId('category-item-Assets').click()
  await extensionPage.getByTestId('privacy-settings-settings').locator('.toggle-button').nth(0).click()
  await extensionPage.getByTestId('privacy-settings-settings').locator('.toggle-button').nth(1).click()
  await extensionPage.getByTestId('privacy-settings-settings').locator('.toggle-button').nth(2).click()
  await extensionPage.getByTestId('privacy-settings-settings').locator('.toggle-button').nth(3).click()
  await extensionPage.getByTestId('privacy-settings-settings').locator('.toggle-button').nth(4).click()
  await extensionPage.getByTestId('category-back-button').click()
  await extensionPage.getByTestId('privacy-settings-back-button').click()

  // await extensionPage.pause()
  await extensionPage.getByTestId('onboarding-complete-done').click()
  await extensionPage.close()
}

// MetaMask specific authorization implementation
// Handles the "connect" popup when a dapp requests wallet connection
export async function authorizeMetaMask(
  page: Page & { __extensionContext: BrowserContext, __extensionId: string },
): Promise<void> {
  const context = page.__extensionContext
  const extensionId = page.__extensionId

  const extensionPopup = await findExtensionPopup(context, extensionId)

  // Click "Connect" to authorize the dapp
  await extensionPopup.getByTestId('confirm-btn').click()
  await extensionPopup.close()
}

// Unlock MetaMask by navigating to unlock page and filling password
export async function unlockMetaMask(
  page: Page & { __extensionContext: BrowserContext, __extensionId: string },
): Promise<void> {
  const context = page.__extensionContext
  const extensionId = page.__extensionId

  const unlockUrl = `chrome-extension://${extensionId}/home.html#/onboarding/unlock`
  const unlockPage = await context.newPage()
  await unlockPage.goto(unlockUrl)
  await unlockPage.waitForLoadState('domcontentloaded')

  // Fill password and unlock
  await unlockPage.getByTestId('unlock-password').fill(METAMASK_PASSWORD)
  await unlockPage.getByTestId('unlock-submit').click()

  // await unlockPage.getByTestId('onboarding-complete-done').click()
  // await unlockPage.pause()
  await unlockPage.close()
}

// MetaMask specific Ethereum private key import implementation
export async function importEthPrivateKey(
  page: Page & { __extensionContext: BrowserContext, __extensionId: string },
  { seed, name: _name = 'Test Account' }: WalletAccount,
): Promise<void> {
  const context = page.__extensionContext
  const extensionId = page.__extensionId

  const extensionPage = await findOnboardingPage(context, extensionId)

  try {
    await completeOnboarding(extensionPage)
  }
  catch (error) {
    console.error('❌ Error during MetaMask Ethereum account import:', error)
    throw error
  }
}

/* c8 ignore stop */
