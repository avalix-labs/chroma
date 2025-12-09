import { createWalletTest, expect } from '../../src/index.js'

const ACCOUNT_NAME = 'Test Account'
const DOT_TEST_MNEMONIC = 'bottom drive obey lake curtain smoke basket hold race lonely fit walk'
const ETH_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
const PASSWORD = 'h3llop0lkadot!'

const test = createWalletTest({
  wallets: [{ type: 'talisman' }, { type: 'polkadot-js' }],
})

test.beforeAll(async () => {
  console.log('🚀 Starting test: dapp/turtle-cool.spec.ts')
})

test.afterAll(async () => {
  console.log('✅ Finished test: dapp/turtle-cool.spec.ts')
})

test('Can connect wallet with multiple wallets', async ({ page, wallets }) => {
  const talisman = wallets.talisman
  const polkadotJs = wallets['polkadot-js']
  const accountName = ACCOUNT_NAME

  // Import accounts to both wallets
  await Promise.all([
    talisman.importEthPrivateKey({
      privateKey: ETH_PRIVATE_KEY,
      name: accountName,
      password: PASSWORD,
    }),
    polkadotJs.importMnemonic({
      seed: DOT_TEST_MNEMONIC,
      password: PASSWORD,
      name: accountName,
    }),
  ])

  await page.goto('https://app.turtle.cool/')
  await page.waitForLoadState('networkidle')

  // Select Ethereum
  await page.getByTestId('chain-select-trigger-from').locator('div').nth(1).click()
  await page.getByRole('listitem').filter({ hasText: 'Ethereum' }).click()
  await page.getByText('ETH', { exact: true }).click()

  // Connect Talisman Ethereum
  await page.getByTestId('chain-select-trigger-from').getByRole('button', { name: 'Connect' }).click()
  await page.getByRole('button', { name: 'Talisman Talisman installed' }).click()
  await talisman.authorize()
  await expect(page.getByRole('button', { name: 'Disconnect' })).toBeVisible()

  // Select Asset Hub
  await page.getByTestId('chain-select-trigger-to').locator('div').nth(1).click()
  await page.getByRole('listitem').filter({ hasText: 'Asset Hub' }).click()
  await page.getByRole('listitem').filter({ hasText: 'DOT' }).click()
  await page.getByTestId('chain-select-trigger-to').getByRole('button', { name: 'Connect' }).click()

  // Connect Polkadot.js
  await polkadotJs.authorize()
  await talisman.rejectTx() // somehow talisman popup appears, let's reject it for now
  await page.getByRole('button', { name: 'Polkadot.js INSTALLED' }).click()
  await page.getByRole('button', { name: 'Test Account 5dfh...qrzv' }).click()
  await expect(page.getByTestId('chain-select-trigger-to').getByRole('button', { name: 'Disconnect' })).toBeVisible()
})
