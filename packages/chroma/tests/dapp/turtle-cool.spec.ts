import { createWalletTest, expect } from '../../src/index.js'

const DOT_MNEMONIC = 'bottom drive obey lake curtain smoke basket hold race lonely fit walk'
const ETH_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
const PASSWORD = 'h3llop0lkadot!'

const test = createWalletTest({
  wallets: [{ type: 'talisman' }],
})

test('Can connect wallet with multiple wallets', async ({ page, wallets }) => {
  const talisman = wallets.talisman

  // Import accounts to both wallets
  await talisman.importPolkadotMnemonic({
    seed: DOT_MNEMONIC,
    password: PASSWORD,
    name: 'Dot Test Account',
  })
  await talisman.importEthPrivateKey({
    privateKey: ETH_PRIVATE_KEY,
    password: PASSWORD,
    name: 'Eth Test Account',
  })

  await page.goto('https://app.turtle.cool/')
  await page.waitForLoadState('networkidle')

  // scroll to middle of the page
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight / 2)
  })

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
  await talisman.authorize()
  await talisman.rejectTx() // somehow talisman popup appears, let's reject it for now
  await page.getByRole('button', { name: 'Polkadot.js INSTALLED' }).click()
  await page.getByRole('button', { name: 'Test Account 5dfh...qrzv' }).click()
  await expect(page.getByTestId('chain-select-trigger-to').getByRole('button', { name: 'Disconnect' })).toBeVisible()
})
