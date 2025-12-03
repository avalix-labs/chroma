import { createWalletTest } from '@avalix/chroma'

const DOT_TEST_MNEMONIC = 'bottom drive obey lake curtain smoke basket hold race lonely fit walk'
const ETH_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

const test = createWalletTest({
  wallets: [{ type: 'talisman' }],
})

test.setTimeout(30_000 * 2)

test('Hydration', async ({ page, wallets }) => {
  const talisman = wallets.talisman

  // Import accounts to both wallets
  const dotAccountName = 'Dot account'
  const ethAccountName = 'Eth account'
  await talisman.importEthPrivateKey({
    privateKey: ETH_PRIVATE_KEY,
    name: ethAccountName,
  })
  await talisman.importMnemonic({
    seed: DOT_TEST_MNEMONIC,
    name: dotAccountName,
  })

  await page.goto('https://app.hydration.net/trade/swap')

  // Connect Ethereum Wallet
  await page.getByRole('button', { name: 'Connect wallet', exact: true }).click()
  await page.getByRole('button', { name: 'EVM EVM' }).click()
  await page.getByRole('button', { name: 'Talisman Logo EVM Talisman' }).click()
  await talisman.authorize({ accountName: ethAccountName })
  await page.getByText('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266').click()

  // Connect Polkadot Wallet
  await page.locator('div').filter({ hasText: /^0xf39F\.\.\.b92266$/ }).first().click()
  await page.getByRole('button', { name: 'Manage wallets' }).click()
  await page.getByRole('button', { name: 'Polkadot Polkadot' }).click()
  await page.getByRole('button', { name: 'Talisman Logo Talisman Connect' }).click()
  await talisman.authorize({ accountName: dotAccountName })
  await page.locator('div').filter({ hasText: /^Dot account\$012bzRJfh7arnnfPPUZHeJUaE62QLEwhK48QnH9LXeK2m1iZU$/ }).first().click()
})
