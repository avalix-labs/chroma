/**
 * Example: Using Multiple Wallet Extensions with Pre-configured Setup
 *
 * These tests use pre-configured wallet state from wallet.setup.ts
 */

import { createWalletTest } from '../src/index.js'
import { WALLET_CONFIG, WALLET_STATE_DIR } from './wallet.config.js'

// Single wallet test using setup
const singleWalletTest = createWalletTest({
  wallets: [{ type: 'polkadot-js' }],
  userDataDir: WALLET_STATE_DIR,
})
singleWalletTest.setTimeout(30_000 * 10)

singleWalletTest('single wallet example with setup', async ({ page, wallets }) => {
  const polkadotJs = wallets['polkadot-js']

  const url = 'https://polkadot-starter-vue-dedot.vercel.app/'
  await page.goto(url)
  await page.waitForLoadState('networkidle')

  await page.getByRole('button', { name: /Connect Wallet/i }).click()

  const modalVisible = await page.locator('h2:has-text("CONNECT WALLET")').isVisible()
  if (modalVisible) {
    console.log('✅ Connect wallet modal opened')
    // Click CONNECT button in modal
    await page.getByRole('button', { name: /CONNECT/i }).nth(2).click()
    console.log('🔗 Clicked CONNECT button')
  }

  await polkadotJs.authorize()

  await page.getByText(WALLET_CONFIG.polkadotJs.accountName).click()

  await page.getByRole('button', { name: 'Sign Transaction' }).nth(3).click()

  if (url.includes('papi'))
    await page.waitForTimeout(3000)
  await polkadotJs.approveTx({ password: WALLET_CONFIG.polkadotJs.password })
  await page.getByText('Processing transaction...').waitFor({ state: 'visible' })
  console.log(`🎉 Test completed successfully for ${url}!`)

  await page.waitForTimeout(5000)
})

// Multi-wallet test using setup
const multiWalletTest = createWalletTest({
  wallets: [
    { type: 'polkadot-js' },
    { type: 'talisman' },
  ] as const,
  userDataDir: WALLET_STATE_DIR,
  headless: false,
  slowMo: 150,
})

multiWalletTest.describe('Multi-Wallet Tests', () => {
  multiWalletTest('should use pre-configured wallets', async ({ wallets }) => {
    const polkadotJs = wallets['polkadot-js']
    const talisman = wallets.talisman

    console.log('✅ Wallets are already configured from setup!')
    console.log('Polkadot-JS Extension ID:', polkadotJs.extensionId)
    console.log('Talisman Extension ID:', talisman.extensionId)
  })

  multiWalletTest('should connect with polkadot-js wallet', async ({ page, wallets }) => {
    const polkadotJs = wallets['polkadot-js']

    // Navigate to dApp - wallet already has account imported!
    await page.goto('https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Fwestend-rpc.polkadot.io#/explorer')
    await page.waitForTimeout(2000)

    // Authorize with Polkadot-JS
    await polkadotJs.authorize()

    console.log('✅ Connected with Polkadot-JS wallet')
  })
})
