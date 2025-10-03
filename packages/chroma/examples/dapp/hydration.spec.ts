import { createWalletTest, expect } from '../../src/index.js'

const ACCOUNT_NAME = 'Test Account'
const DOT_TEST_MNEMONIC = 'bottom drive obey lake curtain smoke basket hold race lonely fit walk'
const ETH_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
const PASSWORD = 'h3llop0lkadot!'

const test = createWalletTest({
  wallets: [{ type: 'talisman' }, { type: 'polkadot-js' }],
})

test.setTimeout(30_000 * 2)

test('Hydration', async ({ page, wallets }) => {
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

  await page.goto('https://app.hydration.net/trade/swap')

  // Connect Ethereum Wallet
  await page.getByRole('button', { name: 'Connect wallet', exact: true }).click()
  await page.getByRole('button', { name: 'EVM EVM' }).click()
  await page.getByRole('button', { name: 'Talisman Logo EVM Talisman' }).click()
  await talisman.authorize()
  await page.getByText('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266').click()

  // Connect Polkadot Wallet
  await page.locator('div').filter({ hasText: /^0xf39F\.\.\.b92266$/ }).first().click()
  await page.getByRole('button').nth(3).click()
  await page.getByRole('button', { name: 'Polkadot Polkadot' }).click()
  await page.getByRole('button', { name: 'Polkadotjs Logo Polkadot.js' }).click()
  await polkadotJs.authorize()

  expect(page.getByText('connected')).toHaveText('2 connected')
})
