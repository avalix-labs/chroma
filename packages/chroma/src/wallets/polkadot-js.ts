import type { BrowserContext } from '@playwright/test'
import type { WalletAccount } from '../context-playwright/types.js'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { findExtensionPopup } from '../utils/find-extension-popup.js'
import { DEFAULT_TEST_PASSWORD } from '../utils/test-defaults.js'

// Polkadot-JS specific configuration
// https://github.com/polkadot-js/extension/releases
const VERSION = '0.62.6'
export const POLKADOT_JS_CONFIG = {
  downloadUrl: `https://github.com/polkadot-js/extension/releases/download/v${VERSION}/master-chrome-build.zip`,
  extensionName: `polkadot-extension-${VERSION}`,
} as const

// Get Polkadot-JS extension path
export async function getPolkadotJSExtensionPath(): Promise<string> {
  const extensionsDir = path.resolve(process.cwd(), '.chroma')
  const extensionDir = path.join(extensionsDir, POLKADOT_JS_CONFIG.extensionName)

  // Check if extension exists (readdir rejects if missing → treat as empty)
  const entries = await fs.promises.readdir(extensionDir).catch(() => [] as string[])
  if (entries.length === 0) {
    throw new Error(
      `Polkadot-JS extension not found at: ${extensionDir}\n\n`
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

// Polkadot-JS specific account import implementation
export async function importPolkadotJSAccount(
  context: BrowserContext,
  extensionId: string,
  { seed, name = 'Test Account', password = DEFAULT_TEST_PASSWORD }: WalletAccount,
): Promise<void> {
  const extensionPopupUrl = `chrome-extension://${extensionId}/index.html`
  const extensionPage = await context.newPage()

  try {
    await extensionPage.goto(extensionPopupUrl)

    // Handle "Understood, let me continue" button if it exists
    const understoodButton = extensionPage.getByRole('button', { name: 'Understood, let me continue' })
    if (await understoodButton.count() > 0) {
      await understoodButton.click()
    }

    // The "I Understand" disclaimer may follow; wait briefly for it to settle.
    const iUnderstand = extensionPage.getByRole('button', { name: 'I Understand' })
    await iUnderstand.click({ timeout: 1000 }).catch(() => {})

    // Navigate to import seed page
    await extensionPage.goto(`${extensionPopupUrl}#/account/import-seed`)

    // Fill seed phrase and account details
    await extensionPage.locator('textarea').fill(seed)
    await extensionPage.locator('button:has-text("Next")').click()
    await extensionPage.locator('input[type="text"]').fill(name)
    await extensionPage.locator('input[type="password"]').fill(password)
    await extensionPage.locator('div').filter({ hasText: /^Repeat password for verification$/ }).getByRole('textbox').fill(password)
    await extensionPage.getByRole('button', { name: 'Add the account with the supplied seed' }).click()
  }
  finally {
    await extensionPage.close()
  }
}

// Polkadot-JS specific authorization implementation
export async function authorizePolkadotJS(
  context: BrowserContext,
  extensionId: string,
): Promise<void> {
  const extensionPopup = await findExtensionPopup(context, extensionId)

  if (await extensionPopup.getByRole('button', { name: 'I Understand' }).isVisible()) {
    await extensionPopup.getByRole('button', { name: 'I Understand' }).click()
  }

  // Check if "Select all" checkbox is already checked
  const selectAllCheckbox = extensionPopup.getByText('Select all').locator('..').locator('input[type="checkbox"]')
  const isChecked = await selectAllCheckbox.isChecked().catch(() => false)

  if (!isChecked) {
    await extensionPopup.getByText('Select all').click()
  }

  await extensionPopup.getByRole('button', { name: /Connect \d+ account\(s\)/ }).click()
}

// Polkadot-JS specific transaction approval implementation
export async function approvePolkadotJSTx(
  context: BrowserContext,
  extensionId: string,
  options: { password?: string } = {},
): Promise<void> {
  const { password = DEFAULT_TEST_PASSWORD } = options
  const extensionPopup = await findExtensionPopup(context, extensionId)
  await extensionPopup.getByRole('textbox').fill(password)
  await extensionPopup.getByRole('button', { name: 'Sign the transaction' }).click()
}

// Polkadot-JS specific transaction rejection implementation
export async function rejectPolkadotJSTx(
  context: BrowserContext,
  extensionId: string,
): Promise<void> {
  const extensionPopup = await findExtensionPopup(context, extensionId)
  await extensionPopup.getByRole('link', { name: 'Cancel' }).click()
}

/* c8 ignore stop */
