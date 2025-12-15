import { createWalletTest } from '../src/index.js'

const POLKADOT_DAPP_URL = 'https://polkadot-starter-vue-dedot.vercel.app/'

const ACCOUNT_NAME = '// Alice'
const DOT_TEST_MNEMONIC = 'bottom drive obey lake curtain smoke basket hold race lonely fit walk'

const test = createWalletTest({
  headless: false,
})

test.beforeAll(async ({ wallets }) => {
  console.log('🚀 Starting test: polkadot-starter.spec.ts')

  await wallets['polkadot-js'].importMnemonic({
    seed: DOT_TEST_MNEMONIC,
    name: ACCOUNT_NAME,
  })
})

test.afterAll(async () => {
  console.log('✅ Finished test: polkadot-starter.spec.ts')
})

test('sign transaction on polkadot starter', async ({ page, wallets }) => {
  await page.goto(POLKADOT_DAPP_URL)
  await page.waitForLoadState('networkidle')

  await page.getByRole('button', { name: /Connect Wallet/i }).click()

  const modalVisible = await page.locator('h2:has-text("CONNECT WALLET")').isVisible()
  if (modalVisible) {
    // Click CONNECT button in modal
    await page.getByRole('button', { name: /CONNECT/i }).nth(2).click()
  }

  await wallets['polkadot-js'].authorize()
  await page.getByText(ACCOUNT_NAME).click()

  // Reject transaction
  await page.getByRole('button', { name: 'Sign Transaction' }).first().click()
  await wallets['polkadot-js'].rejectTx()
  await page.getByText('Error: Cancelled').waitFor({ state: 'visible' })
  await page.waitForTimeout(5000)

  // Sign transaction
  await page.getByRole('button', { name: 'Sign Transaction' }).nth(3).click()
  await wallets['polkadot-js'].approveTx()
  await page.getByText('Processing transaction...').waitFor({ state: 'visible' })
  await page.waitForTimeout(5000)
})
