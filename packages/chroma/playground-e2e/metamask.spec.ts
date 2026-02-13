import { createWalletTest } from '../src/index.js'

const ACCOUNT_NAME = 'Test Account'
const SEED_PHRASE = 'test test test test test test test test test test test junk'

const test = createWalletTest({
  wallets: [{ type: 'metamask' }],
})

test.setTimeout(30_000 * 2)

test('should import account and connect MetaMask wallet', async ({ page, wallets }) => {
  const wallet = wallets.metamask

  // Import Ethereum account into MetaMask wallet
  await wallet.importSeedPhrase({
    seedPhrase: SEED_PHRASE,
    name: ACCOUNT_NAME,
  })

  await page.goto('https://demo.privy.io')
  await page.waitForLoadState('domcontentloaded')
  await page.bringToFront()

  await page.getByRole('button', { name: 'REJECT ALL' }).click()
  await page.waitForTimeout(3000)

  await page.getByRole('button', { name: 'Continue with a wallet' }).click()
  await page.getByPlaceholder('Search wallets').click()
  await page.getByPlaceholder('Search wallets').fill('metamask flask')
  await page.getByRole('button', { name: 'MetaMask Flask' }).click()
  await page.getByRole('button', { name: 'MetaMask Flask' }).first().click()
  await wallet.authorize()
  await wallet.confirm()

  await page.getByText('0x646...E85').first().waitFor({ state: 'visible' })
})
