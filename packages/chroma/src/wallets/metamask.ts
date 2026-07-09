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

// Helper function to find MetaMask side panel via CDP, open in a new tab, and
// return the page. Falls back to opening sidepanel.html directly when Chrome
// has not created a side-panel target (common after unlock on a locked profile).
async function findExtensionPopup(
  context: BrowserContext,
  extensionId: string,
): Promise<Page> {
  const maxAttempts = 10
  const retryDelay = 500
  const extensionUrlPrefix = `chrome-extension://${extensionId}/`
  const sidePanelUrl = `${extensionUrlPrefix}sidepanel.html`

  // Prefer a non-extension page for the CDP session. Extension tabs (especially
  // the unlock tab MetaMask tears down after password submit) go stale and
  // surface CDP "guid not bound" errors when used as the session host.
  const pickCdpHost = (): Page | undefined =>
    context.pages().find((p) => {
      try {
        return !p.isClosed() && !p.url().startsWith(extensionUrlPrefix)
      }
      catch {
        return false
      }
    }) ?? context.pages().find((p) => {
      try {
        return !p.isClosed()
      }
      catch {
        return false
      }
    })

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Reuse any already-open extension page that is showing a confirmation
    // (notification.html popup or an existing sidepanel tab).
    for (const page of context.pages()) {
      try {
        if (page.isClosed() || !page.url().startsWith(extensionUrlPrefix))
          continue
        const confirm = page.getByTestId('confirm-btn')
          .or(page.getByTestId('confirm-footer-button'))
          .or(page.getByTestId('confirm-sign-message-confirm-snap-footer-button'))
        if (await confirm.first().isVisible().catch(() => false))
          return page
      }
      catch {
        // Page closed while inspecting.
      }
    }

    const cdpHost = pickCdpHost()
    if (!cdpHost)
      throw new Error('No pages available to create CDP session')

    try {
      const client = await context.newCDPSession(cdpHost)
      try {
        const { targetInfos } = await client.send('Target.getTargets')
        const sidePanelTarget = targetInfos.find(
          (t: any) => t.url.includes(extensionUrlPrefix) && t.url.includes('sidepanel'),
        )

        if (sidePanelTarget) {
          const sidePanelPage = await context.newPage()
          await sidePanelPage.goto(sidePanelTarget.url)
          await sidePanelPage.waitForLoadState('domcontentloaded')
          return sidePanelPage
        }
      }
      finally {
        await client.detach().catch(() => {})
      }
    }
    catch {
      // CDP host may have died mid-attempt; retry with a fresh host.
    }

    if (attempt < maxAttempts - 1)
      await new Promise(resolve => setTimeout(resolve, retryDelay))
  }

  // Fallback: MetaMask may not have opened a Chrome side-panel target.
  // Opening sidepanel.html as a tab still renders pending confirmations.
  const sidePanelPage = await context.newPage()
  await sidePanelPage.goto(sidePanelUrl)
  await sidePanelPage.waitForLoadState('domcontentloaded')
  return sidePanelPage
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

  // MetaMask 13.3x with side panel enabled dispatches
  // `setCompletedOnboardingWithSidepanel()` and opens the Chrome side panel
  // without navigating this tab off the completion screen. Wait for that
  // async persist to finish before closing — otherwise the profile reboots
  // into `#/onboarding/unlock` and restarts the welcome flow.
  const extensionId = new URL(extensionPage.url()).host
  const deadline = Date.now() + 15_000
  let onboarded = false
  while (Date.now() < deadline) {
    // Side-panel home is the signal that completedOnboarding was written.
    for (const page of extensionPage.context().pages()) {
      try {
        if (
          !page.isClosed()
          && page.url().includes(`chrome-extension://${extensionId}/`)
          && await page.getByTestId('account-menu-icon').isVisible().catch(() => false)
        ) {
          onboarded = true
          break
        }
      }
      catch {
        // Page closed while inspecting.
      }
    }
    if (onboarded)
      break

    // Also accept the completion screen disappearing (non-sidepanel builds).
    if (!(await extensionPage.getByTestId('onboarding-complete-done').isVisible().catch(() => false))) {
      onboarded = true
      break
    }

    await new Promise(resolve => setTimeout(resolve, 200))
  }

  // Extra beat for LevelDB flush before the browser context tears down.
  await new Promise(resolve => setTimeout(resolve, 1_000))
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
      await popup.close().catch(() => {})
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

// True when the page is showing MetaMask's unlock form. Prefer the password
// field over the URL — MetaMask often boots into home.html/sidepanel.html and
// only later client-redirects to #/unlock, so a URL-only check races the hash.
async function pageShowsUnlockForm(page: Page): Promise<boolean> {
  if (page.isClosed())
    return false
  try {
    return await page.getByTestId('unlock-password').isVisible()
  }
  catch {
    return false
  }
}

async function pageShowsUnlockedHome(page: Page): Promise<boolean> {
  if (page.isClosed())
    return false
  try {
    return await page.getByTestId('account-menu-icon').isVisible()
  }
  catch {
    return false
  }
}

// Submit the unlock form on an already-open MetaMask page.
async function submitUnlock(
  unlockPage: Page,
): Promise<void> {
  await unlockPage.bringToFront()
  await unlockPage.waitForLoadState('domcontentloaded')

  const passwordField = unlockPage.getByTestId('unlock-password')
  await passwordField.waitFor({ state: 'visible', timeout: 10_000 })
  await passwordField.fill(DEFAULT_TEST_PASSWORD)
  await unlockPage.getByTestId('unlock-submit').click()

  // Some MetaMask versions show a post-unlock completion screen. Click it
  // if present, otherwise continue — the absence is not an error.
  await unlockPage.getByTestId('onboarding-complete-done').click({ timeout: 3_000 }).catch(() => {})

  // Wait until the unlock form is gone (vault open) or the tab closed itself.
  await passwordField.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {})

  // Close the unlock tab ourselves so MetaMask's async teardown does not race
  // later CDP / newPage calls. Ignore if it already closed.
  if (!unlockPage.isClosed())
    await unlockPage.close().catch(() => {})
}

async function ensureSidePanelPage(
  context: BrowserContext,
  sidePanelUrl: string,
): Promise<Page> {
  for (const page of context.pages()) {
    try {
      if (!page.isClosed() && page.url().startsWith(sidePanelUrl))
        return page
    }
    catch {
      // Page closed while we inspected it.
    }
  }

  const sidePanel = await context.newPage()
  try {
    await sidePanel.goto(sidePanelUrl, { waitUntil: 'domcontentloaded' })
  }
  catch (error) {
    // Retry once — extension pages can briefly reject navigation while the
    // service worker finishes unlocking.
    await new Promise(resolve => setTimeout(resolve, 500))
    await sidePanel.goto(sidePanelUrl, { waitUntil: 'domcontentloaded' })
    void error
  }
  return sidePanel
}

// Leave a sidepanel.html tab open for the rest of the session so approve() /
// reject() can attach without racing CDP targets after unlock tears down its
// own tab. Wait briefly first — opening a fresh extension page immediately
// after unlock races MetaMask's vault settle into CDP "guid not bound" errors.
async function leaveSidePanelOpen(
  context: BrowserContext,
  sidePanelUrl: string,
): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 1_000))

  const sidePanel = await ensureSidePanelPage(context, sidePanelUrl)
  // Best-effort: unlocked home is the signal the vault is ready. Absence is
  // not fatal — approve()/reject() will surface a clearer failure later.
  await sidePanel.getByTestId('account-menu-icon').waitFor({
    state: 'visible',
    timeout: 15_000,
  }).catch(() => {})
}

async function findUnlockPage(
  context: BrowserContext,
  extensionUrlPrefix: string,
  timeoutMs: number,
): Promise<Page | undefined> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const extensionPages = context.pages().filter((p) => {
      try {
        return !p.isClosed() && p.url().startsWith(extensionUrlPrefix)
      }
      catch {
        return false
      }
    })

    for (const page of extensionPages) {
      if (await pageShowsUnlockForm(page))
        return page
    }

    await new Promise(resolve => setTimeout(resolve, 100))
  }
  return undefined
}

// Unlock MetaMask on a previously-onboarded (locked) profile and leave its
// side panel open for the rest of the session.
//
// Idempotent: callers can invoke this from a fixture on every test without
// tracking state. The function:
//   1. Reuses the unlock tab MetaMask auto-opens on a locked profile (e.g. a
//      cloned userDataDir) — opening a second one leaves the auto-opened tab
//      around and queues dapp requests behind it.
//   2. Detects the unlock form via the unlock-password field (not URL alone),
//      so a late client-side redirect to #/unlock is not missed.
//   3. If no unlock tab appears but other MetaMask pages are already open,
//      assumes the profile is unlocked (worker reuse) and still ensures a
//      sidepanel tab exists.
//   4. After unlock succeeds (or when already unlocked), leaves
//      `sidepanel.html` open so approve()/reject() can attach without racing
//      CDP targets after the unlock tab is torn down.
export async function unlockMetaMask(
  context: BrowserContext,
  extensionId: string,
): Promise<void> {
  const sidePanelUrl = `chrome-extension://${extensionId}/sidepanel.html`
  const extensionUrlPrefix = `chrome-extension://${extensionId}/`

  const listExtensionPages = (): Page[] => context.pages().filter((p) => {
    try {
      return !p.isClosed() && p.url().startsWith(extensionUrlPrefix)
    }
    catch {
      return false
    }
  })

  // Prefer an unlock form MetaMask already opened.
  let unlockPage = await findUnlockPage(context, extensionUrlPrefix, 3_000)

  if (!unlockPage) {
    const existing = listExtensionPages()
    // Any live MetaMask page without an unlock form means the vault is open
    // (or still booting unlocked). Skip opening a second unlock UI — just
    // ensure the side panel is available below.
    if (existing.length === 0) {
      const sidePanel = await ensureSidePanelPage(context, sidePanelUrl)
      const deadline = Date.now() + 10_000
      while (Date.now() < deadline) {
        if (await pageShowsUnlockForm(sidePanel)) {
          unlockPage = sidePanel
          break
        }
        if (await pageShowsUnlockedHome(sidePanel))
          break
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
  }

  if (unlockPage)
    await submitUnlock(unlockPage)

  await leaveSidePanelOpen(context, sidePanelUrl)
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
