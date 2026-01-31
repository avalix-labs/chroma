/* eslint-disable no-console */
import { createWalletTest } from '@avalix/chroma'

const ACCOUNT_NAME = '// Alice'
const DOT_TEST_MNEMONIC = 'bottom drive obey lake curtain smoke basket hold race lonely fit walk'
const DOT_TEST_PASSWORD = 'secure123!'

const test = createWalletTest({
  wallets: [{ type: 'polkadot-js' }],
})

test.describe('test with polkadot-js wallet', () => {
  test.beforeAll(async ({ wallets }) => {
    console.log('[INFO] Testing with polkadot-js extension')

    console.log('[INFO] wallet.importMnemonic')
    const wallet = wallets['polkadot-js']
    await wallet.importMnemonic({
      seed: DOT_TEST_MNEMONIC,
      password: DOT_TEST_PASSWORD,
      name: ACCOUNT_NAME,
    })
  })

  test(`test with polkadot-js wallet`, async ({ page, wallets }) => {
    const wallet = wallets['polkadot-js']
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: /Connect Wallet/i }).click()

    const modalVisible = await page.locator('h2:has-text("CONNECT WALLET")').isVisible()
    if (modalVisible) {
      await page.getByRole('button', { name: /CONNECT/i }).nth(2).click()
    }

    console.log('[INFO] wallet.authorize')
    await wallet.authorize()
    await page.getByText(ACCOUNT_NAME).click()

    console.log('[INFO] wallet.rejectTx')
    await page.getByRole('button', { name: 'Sign Transaction' }).first().click()
    await wallet.rejectTx()
    await page.getByText('Error: Cancelled').waitFor({ state: 'visible' })
    await page.waitForTimeout(3000)

    console.log('[INFO] wallet.approveTx')
    await page.getByRole('button', { name: 'Sign Transaction' }).nth(2).click()
    await wallet.approveTx({ password: DOT_TEST_PASSWORD })
    await page.getByText('Processing transaction...').waitFor({ state: 'visible' })

    console.log('[INFO] Test completed')
  })
})
