/* eslint-disable no-console */
import { test } from './helpers/multi-chain-metamask'

const SEED_PHRASE = 'test test test test test test test test test test test junk'

test.setTimeout(30_000 * 2)

test.beforeAll(async ({ wallets }) => {
  console.log('[INFO] Testing with metamask extension')

  console.log('[INFO] wallets.metamask.importSeedPhrase')
  await wallets.metamask.importSeedPhrase({ seedPhrase: SEED_PHRASE })
})

test('test with metamask wallet', async ({ page, wallets, switchChain }) => {
  const wallet = wallets.metamask

  await page.goto('/')
  await page.waitForLoadState('networkidle')

  await page.getByRole('button', { name: /Connect Wallet/i }).click()

  const modalVisible = await page.locator('h2:has-text("CONNECT WALLET")').isVisible()
  if (modalVisible) {
    // Click CONNECT button in modal
    await page.getByRole('button', { name: /CONNECT/i }).nth(1).click()
  }
  console.log('[INFO] wallet.authorize')
  await wallet.authorize()
  console.log('[INFO] wallet.confirm')
  await wallet.confirm()

  const insertNumber = Math.floor(Math.random() * 10000)
  await page.getByPlaceholder('Enter a number').fill(insertNumber.toString())

  await page.getByRole('button', { name: 'Store' }).click()
  console.log('[INFO] wallet.reject')
  await wallet.reject()
  await page.getByText('User rejected the request.').waitFor({ state: 'visible' })
  await page.waitForTimeout(1000)

  await page.getByRole('button', { name: 'Store' }).click()
  console.log('[INFO] wallet.confirm')
  await wallet.confirm()

  // switch to moonbase alpha
  console.log('[INFO] switch to moonbase alpha and reject tx')
  await switchChain({ fromChain: 'Polkadot Hub TestNet', toChain: 'Moonbase Alpha', action: 'reject' })

  console.log('[INFO] switch to moonbase alpha and approve tx')
  await switchChain({ fromChain: 'Polkadot Hub TestNet', toChain: 'Moonbase Alpha', action: 'approve' })

  console.log('[INFO] Test completed')
})
