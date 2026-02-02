/* eslint-disable no-console */
import { createWalletTest } from '@avalix/chroma'

const ACCOUNT_NAME = 'Alice'
const DOT_TEST_MNEMONIC = 'bottom drive obey lake curtain smoke basket hold race lonely fit walk'
const DOT_TEST_PASSWORD = 'secure123!'

const test = createWalletTest({
  wallets: [{ type: 'polkadot-js' }, { type: 'talisman' }],
})

test.setTimeout(30_000 * 2)

test.describe('test with polkadot-js wallet', () => {
  test.beforeAll(async ({ wallets }) => {
    console.log('[INFO] Testing with polkadot-js extension')

    console.log(`[INFO] wallets['polkadot-js'].importMnemonic`)
    await wallets['polkadot-js'].importMnemonic({
      seed: DOT_TEST_MNEMONIC,
      password: DOT_TEST_PASSWORD,
      name: ACCOUNT_NAME,
    })

    console.log(`[INFO] wallets.talisman.importPolkadotMnemonic`)
    await wallets.talisman.importPolkadotMnemonic({
      seed: DOT_TEST_MNEMONIC,
      password: DOT_TEST_PASSWORD,
      name: ACCOUNT_NAME,
    })
  })

  test(`test with polkadot-js wallet`, async ({ page, wallets }) => {
    const polkadotJsWallet = wallets['polkadot-js']
    const talismanWallet = wallets.talisman

    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await page.getByRole('heading', { name: 'Polkadot' }).waitFor({ state: 'visible' })
    await page.getByRole('heading', { name: 'Paseo Asset Hub' }).waitFor({ state: 'visible' })

    await page.getByRole('button', { name: /Connect Wallet/i }).click()

    const modalVisible = await page.locator('h2:has-text("CONNECT WALLET")').isVisible()
    if (modalVisible) {
      await page.getByRole('button', { name: /CONNECT/i }).nth(3).click()
    }

    console.log(`[INFO] polkadotJsWallet.authorize`)
    await polkadotJsWallet.authorize()
    await page.getByText(ACCOUNT_NAME).click()

    console.log(`[INFO] polkadotJsWallet.rejectTx`)
    await page.getByRole('button', { name: 'Sign Transaction' }).first().click()
    await polkadotJsWallet.rejectTx()
    await page.getByText('Error: Cancelled').waitFor({ state: 'visible' })
    await page.waitForTimeout(3000)

    console.log(`[INFO] polkadotJsWallet.approveTx`)
    await page.getByRole('button', { name: 'Sign Transaction' }).nth(1).click()
    await polkadotJsWallet.approveTx({ password: DOT_TEST_PASSWORD })
    await page.getByText('Processing transaction...').waitFor({ state: 'visible' })

    /*
     * test with talisman wallet
     * */
    await page.getByRole('button').filter({ hasText: /^$/ }).click()
    await page.getByRole('button', { name: /Connect Wallet/i }).click()

    const talismanModalVisible = await page.locator('h2:has-text("CONNECT WALLET")').isVisible()
    if (talismanModalVisible) {
      await page.getByRole('button', { name: /CONNECT/i }).nth(1).click()
    }

    console.log('[INFO] talismanWallet.authorize')
    await talismanWallet.authorize({ accountName: ACCOUNT_NAME })
    await page.getByText(ACCOUNT_NAME).click()

    console.log(`[INFO] talismanWallet.rejectTx`)
    await page.getByRole('button', { name: 'Sign Transaction' }).first().click()
    await talismanWallet.rejectTx()
    await page.getByText('Error: Cancelled').waitFor({ state: 'visible' })
    await page.waitForTimeout(3000)

    console.log(`[INFO] talismanWallet.approveTx`)
    await page.getByRole('button', { name: 'Sign Transaction' }).nth(1).click()
    await talismanWallet.approveTx()
    await page.getByText('Processing transaction...').waitFor({ state: 'visible' })

    console.log('[INFO] Test completed')
  })
})
