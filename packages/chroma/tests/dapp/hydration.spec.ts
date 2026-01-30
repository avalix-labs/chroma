import { createWalletTest } from '../../src/index.js'

const DOT_MNEMONIC = 'bottom drive obey lake curtain smoke basket hold race lonely fit walk'
const ETH_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
const PASSWORD = 'h3llop0lkadot!'
const ethAccount = 'Eth Test Account'
const dotAccount = 'Dot Test Account'

const test = createWalletTest({
  wallets: [{ type: 'talisman' }],
})

// test.setTimeout(30_000 * 3)

test.beforeAll(async ({ wallets }) => {
  const talisman = wallets.talisman

  // Import accounts to both wallets
  await talisman.importEthPrivateKey({
    privateKey: ETH_PRIVATE_KEY,
    name: ethAccount,
    password: PASSWORD,
  })
  await talisman.importPolkadotMnemonic({
    seed: DOT_MNEMONIC,
    password: PASSWORD,
    name: dotAccount,
  })
})

test('Hydration', async ({ page, wallets }) => {
  const talisman = wallets.talisman

  await page.goto('https://app.hydration.net/trade/swap')
  await page.waitForLoadState('domcontentloaded')

  // Connect Ethereum Wallet
  await page.getByRole('button', { name: 'Connect wallet', exact: true }).click()
  await page.getByRole('button', { name: 'EVM EVM' }).click()
  await page.getByRole('button', { name: 'Talisman Logo EVM Talisman' }).click()
  await talisman.authorize({ accountName: ethAccount })
  await page.getByText('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266').isVisible()

  // Connect Polkadot Wallet
  await page.getByRole('button', { name: 'Manage wallets' }).click()
  await page.getByRole('button', { name: 'Polkadot Polkadot' }).click()
  await page.getByRole('button', { name: 'Talisman Logo Talisman Connect' }).click()
  await talisman.authorize({ accountName: dotAccount })
  await page.getByText('12bzRJfh7arnnfPPUZHeJUaE62QLEwhK48QnH9LXeK2m1iZU').isVisible()
})
