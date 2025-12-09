/**
 * Tests that use pre-configured Polkadot.js wallet state
 */
import { createWalletTest } from '../src/index.js'
import { WALLET_CONFIG, WALLET_STATE_DIR } from './wallet.config.js'

const POLKADOT_DAPP_URL = 'https://polkadot-starter-vue-dedot.vercel.app/'

const test = createWalletTest({
  wallets: [{ type: 'polkadot-js' }],
  userDataDir: `${WALLET_STATE_DIR}-polkadot-js`, // <-- Reuses wallet state from setup!
  headless: false,
})

// increase playwright timeout
test.setTimeout(30_000 * 2) // default is 30000

test('sign transaction on polkadot starter', async ({ page, wallets }) => {
  console.log(`🧪 Testing ${POLKADOT_DAPP_URL}`)

  await page.goto(POLKADOT_DAPP_URL)
  await page.waitForLoadState('networkidle')

  await page.getByRole('button', { name: /Connect Wallet/i }).click()

  const modalVisible = await page.locator('h2:has-text("CONNECT WALLET")').isVisible()
  if (modalVisible) {
    console.log('✅ Connect wallet modal opened')
    // Click CONNECT button in modal
    await page.getByRole('button', { name: /CONNECT/i }).nth(2).click()
    console.log('🔗 Clicked CONNECT button')
  }

  await wallets['polkadot-js'].authorize()
  await page.getByText(WALLET_CONFIG.polkadotJs.accountName).click()

  // Reject transaction
  await page.getByRole('button', { name: 'Sign Transaction' }).first().click()
  await wallets['polkadot-js'].rejectTx()
  await page.getByText('Error: Cancelled').waitFor({ state: 'visible' })
  await page.waitForTimeout(5000)

  // Sign transaction
  await page.getByRole('button', { name: 'Sign Transaction' }).nth(3).click()
  await wallets['polkadot-js'].approveTx({ password: WALLET_CONFIG.polkadotJs.password })
  await page.getByText('Processing transaction...').waitFor({ state: 'visible' })
  console.log(`🎉 Test completed successfully for ${POLKADOT_DAPP_URL}!`)

  await page.waitForTimeout(5000)
})
