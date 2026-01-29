/* eslint-disable no-console */
import { createWalletTest } from '@avalix/chroma'

const ACCOUNT_NAME = 'Test Account'
const ETH_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
const PASSWORD = 'h3llop0lkadot!'

const test = createWalletTest({
  wallets: [
    { type: 'talisman' },
  ] as const,
  headless: false,
})

test(`test with talisman wallet`, async ({ page, wallets }) => {
  console.log('[INFO] Testing with talisman extension')

  const wallet = wallets.talisman

  console.log('[INFO] wallet.importPrivateKey')
  await wallet.importEthPrivateKey({
    privateKey: ETH_PRIVATE_KEY,
    password: PASSWORD,
    name: ACCOUNT_NAME,
  })

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

  try {
    console.log('[INFO] wallet.approveTx (initial)')
    await wallet.approveTx()
  }
  catch {
    // No another popup found, skipping
  }

  const insertNumber = Math.floor(Math.random() * 10000)
  await page.getByPlaceholder('Enter a number').fill(insertNumber.toString())

  // TODO: to be done in milestone 2
  // await page.getByRole('button', { name: 'Store' }).click()
  // console.log('[INFO] wallet.rejectTx')
  // await wallet.rejectTx()
  // await page.getByText('User rejected the request.').waitFor({ state: 'visible' })

  await page.getByRole('button', { name: 'Store' }).click()
  console.log('[INFO] wallet.approveTx')
  await wallet.approveTx()
  await page.getByText(insertNumber.toString()).waitFor({ state: 'visible' })

  console.log('[INFO] Test completed')
})
