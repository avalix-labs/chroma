import type { BrowserContext, Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { DEFAULT_TEST_PASSWORD } from '../utils/test-defaults.js'

// MetaMask specific configuration
// https://github.com/MetaMask/metamask-extension/releases
const VERSION = '13.28.0'
export const METAMASK_CONFIG = {
  downloadUrl: `https://github.com/MetaMask/metamask-extension/releases/download/v${VERSION}/metamask-chrome-${VERSION}.zip`,
  extensionName: `metamask-extension-${VERSION}`,
} as const

// Get MetaMask extension path
export async function getMetaMaskExtensionPath(): Promise<string> {
  const extensionsDir = path.resolve(process.cwd(), '.chroma')
  const extensionDir = path.join(extensionsDir, METAMASK_CONFIG.extensionName)

  // Check if extension exists (readdir rejects if missing → treat as empty)
  const entries = await fs.promises.readdir(extensionDir).catch(() => [] as string[])
  if (entries.length === 0) {
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

// Helper function to complete MetaMask onboarding flow
async function completeOnboarding(
  extensionPage: Page,
  seedPhrase: string,
): Promise<void> {
  // Bring the onboarding page to front
  await extensionPage.bringToFront()
  await extensionPage.waitForLoadState('domcontentloaded')

  // Click "Import an existing wallet"
  await extensionPage.getByTestId('onboarding-import-wallet').click()

  // Click "Import with Secret Recovery Phrase"
  await extensionPage.getByTestId('onboarding-import-with-srp-button').click()

  // Enter seed phrase
  // Must use pressSequentially because MetaMask listens for Space keypress to separate words
  await extensionPage.getByTestId('srp-input-import__srp-note').pressSequentially(seedPhrase, { delay: 50 })

  // Confirm seed phrase
  await extensionPage.getByTestId('import-srp-confirm').click()

  // Set password
  await extensionPage.getByTestId('create-password-new-input').fill(DEFAULT_TEST_PASSWORD)
  await extensionPage.getByTestId('create-password-confirm-input').fill(DEFAULT_TEST_PASSWORD)
  await extensionPage.getByTestId('create-password-terms').click()
  await extensionPage.getByTestId('create-password-submit').click()

  // Agree to metrics
  await extensionPage.getByTestId('metametrics-checkbox').click()
  await extensionPage.getByTestId('metametrics-i-agree').click()

  // Complete onboarding
  await extensionPage.getByTestId('manage-default-settings').click()
  await extensionPage.getByTestId('category-item-Assets').click()
  await extensionPage.getByTestId('privacy-settings-settings').locator('.toggle-button').nth(0).click()
  await extensionPage.getByTestId('privacy-settings-settings').locator('.toggle-button').nth(1).click()
  await extensionPage.getByTestId('privacy-settings-settings').locator('.toggle-button').nth(2).click()
  await extensionPage.getByTestId('privacy-settings-settings').locator('.toggle-button').nth(3).click()
  await extensionPage.getByTestId('privacy-settings-settings').locator('.toggle-button').nth(4).click()
  await extensionPage.getByTestId('category-back-button').click()
  await extensionPage.getByTestId('privacy-settings-back-button').click()

  await extensionPage.getByTestId('onboarding-complete-done').click()
  await extensionPage.close()
}

// Approve a MetaMask popup — covers both the dapp connect popup ("Connect"
// button = `confirm-btn`) and the sign / transaction popup ("Confirm" button
// = `confirm-footer-button`). The two flows share the same find-popup,
// click, close shape, so a single function accepts whichever button the
// popup presents.
export async function approveMetaMask(
  context: BrowserContext,
  extensionId: string,
): Promise<void> {
  const extensionPopup = await findExtensionPopup(context, extensionId)

  const approveButton = extensionPopup.getByTestId('confirm-btn')
    .or(extensionPopup.getByTestId('confirm-footer-button'))
    .or(extensionPopup.getByTestId('confirm-sign-message-confirm-snap-footer-button'))
  await approveButton.first().click()
  await extensionPopup.close()
}

// MetaMask specific reject implementation
// Handles the reject/cancel popup (e.g. reject transaction, switch chain)
export async function rejectMetaMask(
  context: BrowserContext,
  extensionId: string,
): Promise<void> {
  const extensionPopup = await findExtensionPopup(context, extensionId)

  // Click "Reject" or "Cancel" - MetaMask uses confirm-footer-cancel for tx/sign reject
  const rejectButton = extensionPopup.getByTestId('confirm-footer-cancel')
    .or(extensionPopup.getByTestId('page-container-footer-cancel'))
    .or(extensionPopup.getByRole('button', { name: /Reject|Cancel/i }))
  await rejectButton.first().click()
  await extensionPopup.close()
}

// Unlock MetaMask and leave its side panel open for the rest of the session.
//
// Idempotent: callers can invoke this from a fixture on every test without
// tracking state. The function:
//   1. Reuses the unlock tab MetaMask auto-opens on a locked profile (e.g. a
//      cloned userDataDir) — opening a second one leaves the auto-opened tab
//      around and queues dapp requests behind it.
//   2. After unlock succeeds, navigates that same tab to `sidepanel.html` so
//      the wallet UI stays visible throughout the test session.
//   3. If MetaMask is already unlocked, just ensures a side panel tab exists.
export async function unlockMetaMask(
  context: BrowserContext,
  extensionId: string,
): Promise<void> {
  const sidePanelUrl = `chrome-extension://${extensionId}/sidepanel.html`
  const extensionUrlPrefix = `chrome-extension://${extensionId}/`

  // Poll for one of two signals:
  //   - an unlock tab → MetaMask auto-opened it on a locked profile
  //   - any non-unlock extension page → MetaMask is already unlocked
  //     (e.g. the sidepanel left over from a prior test in this worker)
  // 10s deadline accommodates slow CI cold starts; the already-unlocked
  // branch short-circuits within one tick on worker-scoped reuse, so the
  // longer ceiling only applies on the first unlock per worker.
  let unlockPage: Page | undefined
  const deadline = Date.now() + 10_000
  while (Date.now() < deadline) {
    const extensionPages = context.pages().filter(p =>
      p.url().startsWith(extensionUrlPrefix),
    )

    unlockPage = extensionPages.find(p => p.url().includes('unlock'))
    if (unlockPage)
      break

    // A non-unlock extension page means MetaMask has booted unlocked; fall
    // through to the sidepanel branch.
    if (extensionPages.length > 0)
      break

    await new Promise(resolve => setTimeout(resolve, 100))
  }

  if (unlockPage) {
    await unlockPage.bringToFront()
    await unlockPage.waitForLoadState('domcontentloaded')

    // Fill password and unlock
    await unlockPage.getByTestId('unlock-password').fill(DEFAULT_TEST_PASSWORD)
    await unlockPage.getByTestId('unlock-submit').click()

    // Some MetaMask versions show a post-unlock completion screen. Click it
    // if present, otherwise continue — the absence is not an error.
    await unlockPage.getByTestId('onboarding-complete-done').click({ timeout: 3_000 }).catch(() => {})

    // Navigate to the side panel and leave the tab open for the session.
    await unlockPage.goto(sidePanelUrl)
    await unlockPage.waitForLoadState('domcontentloaded')
    return
  }

  // No unlock tab seen — either MetaMask is already unlocked, or it never
  // booted within the deadline. Ensure a sidepanel tab exists; downstream
  // calls will surface a clear failure if the profile turns out to still be
  // locked.
  const existing = context.pages().find(p => p.url().startsWith(sidePanelUrl))
  if (existing)
    return

  const sidePanel = await context.newPage()
  await sidePanel.goto(sidePanelUrl)
  await sidePanel.waitForLoadState('domcontentloaded')
}

// MetaMask specific seed phrase import implementation
export async function importSeedPhrase(
  context: BrowserContext,
  extensionId: string,
  { seedPhrase }: { seedPhrase: string },
): Promise<void> {
  const extensionPage = await findOnboardingPage(context, extensionId)

  try {
    await completeOnboarding(extensionPage, seedPhrase)
  }
  catch (error) {
    console.error('❌ Error during MetaMask Ethereum account import:', error)
    throw error
  }
}

/* c8 ignore stop */
