import type { BrowserContext, Locator, Page } from '@playwright/test'
import { resolveExtensionPath } from '../utils/extension-path.js'
import { findExtensionPopup as findOnboardingPage } from '../utils/find-extension-popup.js'
import { DEFAULT_TEST_PASSWORD } from '../utils/test-defaults.js'

// MetaMask specific configuration
// https://github.com/MetaMask/metamask-extension/releases
const VERSION = '13.35.1'
export const METAMASK_CONFIG = {
  downloadUrl: `https://github.com/MetaMask/metamask-extension/releases/download/v${VERSION}/metamask-chrome-${VERSION}.zip`,
  extensionName: `metamask-extension-${VERSION}`,
  // SHA-256 of the zip above; update together with VERSION
  sha256: '4e0f8626df0ae9fb15f5f3ad6784a0b518f3ede067b2b0d4f539f9f457c5049c',
} as const

// Get MetaMask extension path
export async function getMetaMaskExtensionPath(): Promise<string> {
  return resolveExtensionPath(METAMASK_CONFIG.extensionName, 'MetaMask')
}

/*
 * Wallet interaction functions below are excluded from coverage because:
 * - They require a real Chromium browser with extension support
 * - They interact with Chrome extension popup pages
 */
/* c8 ignore start */

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

  // Skip the passkey setup screen (added in MetaMask 13.3x). It is shown
  // between password creation and the metrics screen; click "Maybe later" if
  // present, otherwise continue — older builds skip straight to metrics.
  await extensionPage.getByTestId('passkey-maybe-later-button').click({ timeout: 5_000 }).catch(() => {})

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

// Open the MetaMask side panel and click a confirmation/rejection button,
// tolerating the panel occasionally getting stuck on its loading skeleton —
// seen mainly on slower CI, where the freshly-opened side-panel tab never
// finishes connecting to the background service worker and the confirmation
// screen never renders.
//
// Each attempt is bounded by `timeout`; without it a frozen boot would block
// until the whole test timeout elapses (Playwright's default actionTimeout is
// 0 = unbounded). A stuck tab does not recover in place, so on failure we
// discard it and open a fresh one — the pending request stays queued in the
// background, so a new side-panel tab re-renders the same confirmation. Fresh
// boots are independent, so a couple of retries make a stuck boot very
// unlikely instead of failing the whole test.
async function clickInSidePanel(
  context: BrowserContext,
  extensionId: string,
  selectButton: (popup: Page) => Locator,
  { attempts = 3, timeout = 15_000 }: { attempts?: number, timeout?: number } = {},
): Promise<void> {
  let lastError: unknown
  for (let attempt = 0; attempt < attempts; attempt++) {
    const popup = await findExtensionPopup(context, extensionId)
    try {
      await selectButton(popup).first().click({ timeout })
      await popup.close()
      return
    }
    catch (error) {
      lastError = error
      await popup.close().catch(() => {})
    }
  }
  throw lastError
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
  await clickInSidePanel(context, extensionId, popup =>
    popup.getByTestId('confirm-btn')
      .or(popup.getByTestId('confirm-footer-button'))
      .or(popup.getByTestId('confirm-sign-message-confirm-snap-footer-button')))
}

// MetaMask specific reject implementation
// Handles the reject/cancel popup (e.g. reject transaction, switch chain)
export async function rejectMetaMask(
  context: BrowserContext,
  extensionId: string,
): Promise<void> {
  // Click "Reject" or "Cancel" - MetaMask uses confirm-footer-cancel-button for tx/sign reject
  await clickInSidePanel(context, extensionId, popup =>
    popup.getByTestId('confirm-footer-cancel-button')
      .or(popup.getByTestId('page-container-footer-cancel'))
      .or(popup.getByRole('button', { name: /Reject|Cancel/i })))
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
