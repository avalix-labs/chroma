/* eslint-disable no-console */
import { createWalletTest } from '@avalix/chroma'

const ACCOUNT_NAME = '// Alice'
const DOT_TEST_MNEMONIC = 'bottom drive obey lake curtain smoke basket hold race lonely fit walk'
const DOT_TEST_PASSWORD = 'secure123!'

const test = createWalletTest({
  wallets: [{ type: 'talisman' }],
})

test.describe('test with talisman wallet', () => {
  test.beforeAll(async ({ wallets }) => {
    console.log('[INFO] Testing with talisman extension')

    console.log('[INFO] wallet.importPolkadotMnemonic')
    const wallet = wallets.talisman
    await wallet.importPolkadotMnemonic({
      seed: DOT_TEST_MNEMONIC,
      password: DOT_TEST_PASSWORD,
      name: ACCOUNT_NAME,
    })
  })

  test(`test with talisman wallet`, async ({ page, wallets }) => {
    const wallet = wallets.talisman
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await page.getByRole('heading', { name: 'Polkadot' }).waitFor({ state: 'visible' })
    await page.getByRole('heading', { name: 'Paseo Asset Hub' }).waitFor({ state: 'visible' })

    await page.getByRole('button', { name: /Connect Wallet/i }).click()

    const modalVisible = await page.locator('h2:has-text("CONNECT WALLET")').isVisible()
    if (modalVisible) {
      await page.getByRole('button', { name: /CONNECT/i }).nth(1).click()
    }

    console.log('[INFO] wallet.authorize')
    await wallet.authorize({ accountName: ACCOUNT_NAME })
    await page.getByText(ACCOUNT_NAME).click()

    console.log('[INFO] wallet.rejectTx')
    await page.getByRole('button', { name: 'Sign Transaction' }).first().click()
    await wallet.rejectTx()
    await page.getByText('Error: Cancelled').waitFor({ state: 'visible' })
    await page.waitForTimeout(3000)

    console.log('[INFO] wallet.approveTx')
    await page.getByRole('button', { name: 'Sign Transaction' }).nth(1).click()
    await wallet.approveTx()
    await page.getByText('Processing transaction...').waitFor({ state: 'visible' })

    console.log('[INFO] Test completed')
  })
})
