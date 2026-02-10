/* eslint-disable no-console */
import { createWalletTest } from '@avalix/chroma'

const ACCOUNT_NAME = 'Test Account'
const ETH_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
const PASSWORD = 'h3llop0lkadot!'

const test = createWalletTest({ wallets: [{ type: 'talisman' }] as const })

test.setTimeout(30_000 * 2)

test.beforeAll(async ({ wallets }) => {
  console.log('[INFO] Testing with talisman extension')

  console.log('[INFO] wallets.talisman.importPrivateKey')
  await wallets.talisman.importEthPrivateKey({
    privateKey: ETH_PRIVATE_KEY,
    password: PASSWORD,
    name: ACCOUNT_NAME,
  })
})

test(`test with talisman wallet`, async ({ page, wallets }) => {
  const wallet = wallets.talisman

  await page.goto('/')
  await page.waitForLoadState('networkidle')

  await page.getByRole('button', { name: /Connect Wallet/i }).click()

  const modalVisible = await page.locator('h2:has-text("CONNECT WALLET")').isVisible()
  if (modalVisible) {
    // Click CONNECT button in modal
    await page.getByRole('button', { name: /CONNECT/i }).nth(1).click()
  }
  console.log('[INFO] wallet.authorize')
  await wallet.authorize({ accountName: ACCOUNT_NAME })

  const insertNumber = Math.floor(Math.random() * 10000)
  await page.getByPlaceholder('Enter a number').fill(insertNumber.toString())

  await page.getByRole('button', { name: 'Store' }).click()
  console.log('[INFO] wallet.rejectTx')
  await wallet.rejectTx()
  await page.getByText('User rejected the request.').waitFor({ state: 'visible' })

  await page.getByRole('button', { name: 'Store' }).click()
  console.log('[INFO] wallet.approveTx')
  await wallet.approveTx()

  // switch to moonbase alpha
  console.log('[INFO] switch to moonbase alpha and reject tx')
  await page.getByRole('button', { name: 'Polkadot Hub TestNet' }).click()
  await page.getByRole('button', { name: 'Moonbase Alpha' }).click()
  await wallet.rejectTx()
  await page.getByRole('paragraph').filter({ hasText: 'Polkadot Hub TestNet' }).isVisible()

  console.log('[INFO] switch to moonbase alpha and approve tx')
  await page.getByRole('button', { name: 'Polkadot Hub TestNet' }).first().click()
  await page.getByRole('button', { name: 'Moonbase Alpha' }).click()
  await wallet.approveTx()
  await page.getByRole('paragraph').filter({ hasText: 'Moonbase Alpha' }).isVisible()

  console.log('[INFO] Test completed')
})
