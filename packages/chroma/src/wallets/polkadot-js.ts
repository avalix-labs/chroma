import type { BrowserContext, Page } from '@playwright/test'
import type { WalletAccount } from '../context-playwright/types.js'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

// Polkadot-JS specific configuration
export const POLKADOT_JS_CONFIG = {
  downloadUrl: 'https://github.com/polkadot-js/extension/releases/download/v0.61.7/master-chrome-build.zip',
  extensionName: 'polkadot-extension-0.61.7',
} as const

// Helper function to find extension popup
async function findExtensionPopup(context: BrowserContext, extensionId: string): Promise<Page> {
  const pages = context.pages()
  for (const p of pages) {
    if (p.url().includes(`chrome-extension://${extensionId}/`)) {
      return p
    }
  }
  throw new Error(`Extension popup not found for ID: ${extensionId}`)
}

// Get Polkadot-JS extension path
export async function getPolkadotJSExtensionPath(): Promise<string> {
  const extensionsDir = path.resolve(process.cwd(), '.chroma')
  const extensionDir = path.join(extensionsDir, POLKADOT_JS_CONFIG.extensionName)

  // Check if extension exists
  if (!fs.existsSync(extensionDir) || fs.readdirSync(extensionDir).length === 0) {
    throw new Error(
      `Polkadot-JS extension not found at: ${extensionDir}\n\n`
      + `Please download the extension first by running:\n`
      + `  npx @avalix/chroma download-extensions\n\n`
      + `Or if you're using this as a dependency:\n`
      + `  npm run chroma:download\n`,
    )
  }

  console.log(`✅ Found Polkadot-JS extension at: ${extensionDir}`)
  return extensionDir
}

// Polkadot-JS specific account import implementation
export async function importPolkadotJSAccount(
  page: Page & { __extensionContext: BrowserContext, __extensionId: string },
  { seed, name = 'Test Account', password = 'h3llop0lkadot!' }: WalletAccount,
): Promise<void> {
  const context = page.__extensionContext
  const extensionId = page.__extensionId

  const extensionPopupUrl = `chrome-extension://${extensionId}/index.html`
  const extensionPage = await context.newPage()

  try {
    await extensionPage.goto(extensionPopupUrl)

    // Handle "Understood, let me continue" button if it exists
    const understoodButton = extensionPage.getByRole('button', { name: 'Understood, let me continue' })
    if (await understoodButton.count() > 0) {
      await understoodButton.click()
      await extensionPage.waitForTimeout(100)
    }

    // Navigate to import seed page
    await extensionPage.goto(`${extensionPopupUrl}#/account/import-seed`)

    // Fill seed phrase and account details
    await extensionPage.locator('textarea').fill(seed)
    await extensionPage.locator('button:has-text("Next")').click()
    await extensionPage.locator('input[type="text"]').fill(name)
    await extensionPage.locator('input[type="password"]').fill(password)
    await extensionPage.locator('div').filter({ hasText: /^Repeat password for verification$/ }).getByRole('textbox').fill(password)
    await extensionPage.getByRole('button', { name: 'Add the account with the supplied seed' }).click()

    console.log(`✅ Created Polkadot-JS wallet account: ${name}`)
  }
  finally {
    await extensionPage.close()
  }
}

// Polkadot-JS specific authorization implementation
export async function authorizePolkadotJS(
  page: Page & { __extensionContext: BrowserContext, __extensionId: string },
): Promise<void> {
  const context = page.__extensionContext
  const extensionId = page.__extensionId
  await new Promise(resolve => setTimeout(resolve, 1000))

  const extensionPopup = await findExtensionPopup(context, extensionId)
  await extensionPopup.getByText('Select all').click()
  await extensionPopup.getByRole('button', { name: /Connect \d+ account\(s\)/ }).click()

  console.log('✅ Polkadot-JS wallet connected successfully')
}

// Polkadot-JS specific transaction approval implementation
export async function approvePolkadotJSTx(
  page: Page & { __extensionContext: BrowserContext, __extensionId: string },
  options: { password?: string } = {},
): Promise<void> {
  const { password = 'h3llop0lkadot!' } = options
  const context = page.__extensionContext
  const extensionId = page.__extensionId

  await new Promise(resolve => setTimeout(resolve, 1000))
  const extensionPopup = await findExtensionPopup(context, extensionId)

  await extensionPopup.getByRole('textbox').fill(password)
  await extensionPopup.getByRole('button', { name: 'Sign the transaction' }).click()

  console.log('✅ Polkadot-JS transaction signed successfully')
}

// Polkadot-JS specific transaction rejection implementation
export async function rejectPolkadotJSTx(
  page: Page & { __extensionContext: BrowserContext, __extensionId: string },
): Promise<void> {
  const context = page.__extensionContext
  const extensionId = page.__extensionId

  await new Promise(resolve => setTimeout(resolve, 1000))
  const extensionPopup = await findExtensionPopup(context, extensionId)

  await extensionPopup.getByRole('link', { name: 'Cancel' }).click()

  console.log('✅ Polkadot-JS transaction rejected successfully')
}
