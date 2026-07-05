import type { BrowserContext, Page } from '@playwright/test'
import type { WalletAccount } from '../context-playwright/types.js'
import { resolveExtensionPath } from '../utils/extension-path.js'
import { findExtensionPopup as findExtensionPopupBase } from '../utils/find-extension-popup.js'
import { DEFAULT_TEST_PASSWORD } from '../utils/test-defaults.js'

// SubWallet specific configuration
// https://github.com/Koniverse/SubWallet-Extension/releases
const VERSION = '1.3.80'
export const SUBWALLET_CONFIG = {
  downloadUrl: `https://github.com/Koniverse/SubWallet-Extension/releases/download/v${VERSION}/master-build.zip`,
  extensionName: `subwallet-extension-${VERSION}`,
} as const

// SubWallet popup needs a fixed viewport to render correctly in headed runs.
/* c8 ignore start */
function findExtensionPopup(context: BrowserContext, extensionId: string): Promise<Page> {
  // Match notification.html only: SubWallet keeps its index.html home tab
  // open, and that must never be mistaken for a request popup.
  return findExtensionPopupBase(context, extensionId, {
    viewport: { width: 400, height: 600 },
    urlIncludes: 'notification.html',
  })
}
/* c8 ignore stop */

// Get SubWallet extension path
export async function getSubWalletExtensionPath(): Promise<string> {
  return resolveExtensionPath(SUBWALLET_CONFIG.extensionName, 'SubWallet')
}

/*
 * Wallet interaction functions below are excluded from coverage because:
 * - They require a real Chromium browser with extension support
 * - They interact with Chrome extension popup pages
 */
/* c8 ignore start */

// Helper function to find SubWallet onboarding page
async function findOnboardingPage(
  context: BrowserContext,
  extensionId: string,
): Promise<Page> {
  const popupUrl = `chrome-extension://${extensionId}/index.html`
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

// Helper function to accept the Terms of Use dialog on first run
async function acceptTermsOfUse(extensionPage: Page): Promise<void> {
  const dialog = extensionPage.getByRole('dialog').filter({ hasText: 'Terms of Use' })

  // The dialog only shows up on the first interaction; skip when absent.
  const visible = await dialog.isVisible({ timeout: 3000 }).catch(() => false)
  if (!visible) {
    return
  }

  // The confirm checkbox only enables after the terms are scrolled to the end.
  await dialog.locator('.term-body').evaluate((el) => {
    el.scrollTop = el.scrollHeight
  })
  await dialog.locator('input[type=checkbox]').check()
  await dialog.getByRole('button', { name: 'Continue' }).click()
}

// SubWallet specific Polkadot mnemonic import implementation
export async function importSubWalletMnemonic(
  context: BrowserContext,
  extensionId: string,
  { seed, name = 'Test Account', password = DEFAULT_TEST_PASSWORD }: WalletAccount,
): Promise<void> {
  const extensionPage = await findOnboardingPage(context, extensionId)

  try {
    await extensionPage.getByRole('button', { name: 'Import an account' }).click()
    await acceptTermsOfUse(extensionPage)

    await extensionPage.getByText('Import from seed phrase').click()

    // First import asks to create the master password
    const passwordInput = extensionPage.getByRole('textbox', { name: 'Enter password' })
    if (await passwordInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await passwordInput.fill(password)
      await extensionPage.getByRole('textbox', { name: 'Confirm password' }).fill(password)
      await extensionPage.getByRole('checkbox', { name: /I understand that SubWallet/ }).check()
      await extensionPage.getByRole('button', { name: 'Continue' }).click()
    }

    // Fill the seed phrase word by word into the numbered inputs
    await extensionPage.waitForURL(/import-seed-phrase/)
    const words = seed.trim().split(/\s+/)
    const wordInputs = extensionPage.getByRole('textbox')
    for (const [index, word] of words.entries()) {
      await wordInputs.nth(index).fill(word)
    }
    await extensionPage.getByRole('button', { name: 'Import account' }).click()

    // A unified-account notice may warn about TON incompatibility; confirm it.
    const noticeDialog = extensionPage.getByRole('dialog').filter({ hasText: 'Incompatible seed phrase' })
    if (await noticeDialog.isVisible({ timeout: 3000 }).catch(() => false)) {
      await noticeDialog.getByRole('button', { name: 'Import', exact: true }).click()
    }

    // Name the account
    const nameDialog = extensionPage.getByRole('dialog').filter({ hasText: 'Account name' })
    await nameDialog.getByRole('textbox', { name: 'Enter the account name' }).fill(name)
    await nameDialog.getByRole('button', { name: 'Confirm' }).click()

    // Import runs async; wait until the app leaves the import screen.
    await extensionPage.waitForURL(url => !url.toString().includes('import-seed-phrase'), { timeout: 60_000 })

    await extensionPage.close()
  }
  catch (error) {
    console.error('❌ Error during SubWallet Polkadot account import:', error)
    throw error
  }
}

// SubWallet specific authorization implementation
export async function authorizeSubWallet(
  context: BrowserContext,
  extensionId: string,
  options: { accountName?: string } = {},
): Promise<void> {
  const { accountName = 'Test Account' } = options

  const extensionPopup = await findExtensionPopup(context, extensionId)

  // Select the account to connect; the Connect button stays disabled until
  // at least one account is picked.
  const accountItem = extensionPopup.getByText(accountName)
  await accountItem.waitFor({ state: 'visible' })
  await accountItem.click()
  await extensionPopup.getByRole('button', { name: 'Connect' }).click()
}

// SubWallet specific transaction approval implementation
export async function approveSubWalletTx(
  context: BrowserContext,
  extensionId: string,
): Promise<void> {
  const extensionPopup = await findExtensionPopup(context, extensionId)
  await extensionPopup.getByRole('button', { name: 'Approve' }).click()
}

// SubWallet specific transaction rejection implementation
export async function rejectSubWalletTx(
  context: BrowserContext,
  extensionId: string,
): Promise<void> {
  const extensionPopup = await findExtensionPopup(context, extensionId)
  await extensionPopup.getByRole('button', { name: 'Cancel' }).click()
}

/* c8 ignore stop */
