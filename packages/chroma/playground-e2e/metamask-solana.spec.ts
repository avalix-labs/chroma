import { createWalletTest } from '../src/index.js'

const SEED_PHRASE = 'test test test test test test test test test test test junk'

const test = createWalletTest({
  wallets: [{ type: 'metamask' }],
})

test.beforeEach(() => {
  console.log('[spec] running playground-e2e/metamask-solana.spec.ts')
})

test.beforeAll(async ({ wallets }) => {
  console.log('[wallet] metamask.importSeedPhrase')
  await wallets.metamask.importSeedPhrase({ seedPhrase: SEED_PHRASE })
})

test('should connect Solana account on Privy demo', async ({ page, wallets }) => {
  const metamask = wallets.metamask

  await page.goto('https://demo.privy.io')
  await page.bringToFront()

  await page.getByRole('button', { name: 'REJECT ALL' }).click()
  await page.waitForTimeout(2000)

  await page.getByRole('button', { name: 'Continue with a wallet' }).click()
  // Privy shows the wallet count in the placeholder ("Search through 602
  // wallets"); match loosely so the test survives count changes.
  const search = page.getByPlaceholder(/Search.*wallets?/i)
  await search.click()
  await search.fill('metamask')
  await page.getByRole('button', { name: 'MetaMask' }).click()
  await page.getByRole('button', { name: 'MetaMask' }).nth(1).click()

  console.log('[wallet] metamask.approve')
  await metamask.approve()
  console.log('[wallet] metamask.approve')
  await metamask.approve()
  await page.waitForTimeout(1000)

  await page.getByRole('button', { name: 'Sign a Message' }).click()
  await page.getByRole('button', { name: 'Sign and continue' }).click()
  await page.getByRole('button', { name: 'Dismiss' }).click()
})

test('should sign and reject Solana transactions on EW demo', async ({ page, wallets }) => {
  const metamask = wallets.metamask

  await page.goto('https://ew-demo.metamask.io/')
  await page.bringToFront()

  await page.getByRole('button', { name: 'MetaMask Installed arrow' }).click()
  await page.getByRole('button', { name: 'chain-solana solana arrow' }).click()

  console.log('[wallet] metamask.approve')
  await metamask.approve()

  await page.getByRole('button', { name: 'Sign Message' }).click()
  console.log('[wallet] metamask.approve')
  await metamask.approve()
  await page.getByText('Signature:').first().waitFor({ state: 'visible' })
  await page.waitForTimeout(1000)

  await page.getByRole('button', { name: 'Get Balance' }).click()
  await page.getByRole('button', { name: 'Sign & Send Tx' }).click()
  console.log('[wallet] metamask.reject')
  await metamask.reject()
  await page.locator('span').filter({ hasText: 'User rejected the request.' }).waitFor({ state: 'visible' })
})
