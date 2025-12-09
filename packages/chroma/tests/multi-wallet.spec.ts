/**
 * Example: Using Multiple Wallet Extensions in Tests
 *
 * This example demonstrates how to use the unified createWalletTest API
 * for both single and multiple wallet extensions.
 */

import { createWalletTest } from '../src/index.js'

// Constants
const ACCOUNT_NAME = '// Alice'
const DOT_TEST_MNEMONIC = 'bottom drive obey lake curtain smoke basket hold race lonely fit walk'
const DOT_TEST_PASSWORD = 'h3llop0lkadot!'

// Single wallet test (default)
const singleWalletTest = createWalletTest()
singleWalletTest.setTimeout(30_000 * 10)

singleWalletTest.beforeAll(async () => {
  console.log('🚀 Starting test: multi-wallet.spec.ts - Single Wallet Example')
})

singleWalletTest.afterAll(async () => {
  console.log('✅ Finished test: multi-wallet.spec.ts - Single Wallet Example')
})

singleWalletTest('single wallet example', async ({ page, wallets }) => {
  const polkadotJs = wallets['polkadot-js']

  await polkadotJs.importMnemonic({
    seed: DOT_TEST_MNEMONIC,
    name: ACCOUNT_NAME,
    password: DOT_TEST_PASSWORD,
  })

  const url = 'https://polkadot-starter-vue-dedot.vercel.app/'
  await page.goto(url)
  await page.waitForLoadState('networkidle')

  await page.getByRole('button', { name: /Connect Wallet/i }).click()

  const modalVisible = await page.locator('h2:has-text("CONNECT WALLET")').isVisible()
  if (modalVisible) {
    // Click CONNECT button in modal
    await page.getByRole('button', { name: /CONNECT/i }).nth(2).click()
  }

  await polkadotJs.authorize()

  await page.getByText(ACCOUNT_NAME).click()

  await page.getByRole('button', { name: 'Sign Transaction' }).nth(3).click()

  if (url.includes('papi'))
    await page.waitForTimeout(3000)
  await polkadotJs.approveTx({ password: DOT_TEST_PASSWORD })
  await page.getByText('Processing transaction...').waitFor({ state: 'visible' })

  await page.waitForTimeout(5000)
})

// Multi-wallet test
const multiWalletTest = createWalletTest({
  wallets: [
    { type: 'polkadot-js' },
    { type: 'talisman' },
  ] as const,
  headless: false,
  slowMo: 150,
})

multiWalletTest.describe('Multi-Wallet Tests', () => {
  multiWalletTest.beforeAll(async () => {
    console.log('🚀 Starting test: multi-wallet.spec.ts - Multi-Wallet Tests')
  })

  multiWalletTest.afterAll(async () => {
    console.log('✅ Finished test: multi-wallet.spec.ts - Multi-Wallet Tests')
  })

  multiWalletTest('should import accounts to multiple wallets', async ({ wallets }) => {
    const polkadotJs = wallets['polkadot-js']

    // Import account to Polkadot-JS
    await polkadotJs.importMnemonic({
      seed: 'bottom drive obey lake curtain smoke basket hold race lonely fit walk',
      name: 'Alice (Polkadot-JS)',
      password: 'h3llop0lkadot!',
    })

    // Import to Talisman
    const talisman = wallets.talisman
    await talisman.importEthPrivateKey({
      privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      name: 'Bob (Talisman)',
      password: 'h3llop0lkadot!',
    })
  })

  multiWalletTest('should connect with specific wallet', async ({ page, wallets }) => {
    const polkadotJs = wallets['polkadot-js']

    // Import account first
    await polkadotJs.importMnemonic({
      seed: 'bottom drive obey lake curtain smoke basket hold race lonely fit walk',
      name: 'Test Account',
    })

    // Navigate to dApp
    await page.goto('https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Fwestend-rpc.polkadot.io#/explorer')
    await page.waitForTimeout(2000)

    // Authorize with Polkadot-JS
    await polkadotJs.authorize()
  })
})
