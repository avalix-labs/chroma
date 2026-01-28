/* eslint-disable no-console */
import { test } from '@avalix/chroma'

const ACCOUNT_NAME = '// Alice'
const DOT_TEST_MNEMONIC = 'bottom drive obey lake curtain smoke basket hold race lonely fit walk'
const DOT_TEST_PASSWORD = 'secure123!'

test(`test with polkadot-js wallet`, async ({ page, wallets }) => {
  const wallet = wallets['polkadot-js']

  // cover importMnemonic function
  await wallet.importMnemonic({
    seed: DOT_TEST_MNEMONIC,
    password: DOT_TEST_PASSWORD,
    name: ACCOUNT_NAME,
  })

  await page.goto('/')
  await page.waitForLoadState('networkidle')

  await page.getByRole('button', { name: /Connect Wallet/i }).click()

  const modalVisible = await page.locator('h2:has-text("CONNECT WALLET")').isVisible()
  if (modalVisible) {
    console.log('✅ Connect wallet modal opened')
    // Click CONNECT button in modal
    await page.getByRole('button', { name: /CONNECT/i }).nth(2).click()
    console.log('🔗 Clicked CONNECT button')
  }

  // cover authorize function
  await wallet.authorize()
  await page.getByText(ACCOUNT_NAME).click()

  // cover rejectTx function
  await page.getByRole('button', { name: 'Sign Transaction' }).first().click()
  await wallets['polkadot-js'].rejectTx()
  await page.getByText('Error: Cancelled').waitFor({ state: 'visible' })
  await page.waitForTimeout(3000)

  // cover approveTx function
  await page.getByRole('button', { name: 'Sign Transaction' }).nth(3).click()
  await wallet.approveTx({ password: DOT_TEST_PASSWORD })
  await page.getByText('Processing transaction...').waitFor({ state: 'visible' })

  console.log(`🎉 Test completed successfully!`)
})
