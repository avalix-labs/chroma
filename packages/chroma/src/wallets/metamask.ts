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
  // await extensionPage.getByTestId('onboarding-complete-done').click()
  await extensionPage.close()
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
