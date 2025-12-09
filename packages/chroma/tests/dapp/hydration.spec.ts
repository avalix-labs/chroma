/**
 * Hydration test using pre-configured multi-wallet setup
 */
import { createWalletTest } from '../../src/index.js'
import { WALLET_CONFIG, WALLET_STATE_DIR } from '../wallet.config.js'

const test = createWalletTest({
  wallets: [{ type: 'talisman' }, { type: 'polkadot-js' }],
  userDataDir: `${WALLET_STATE_DIR}-multi`,
})

test.setTimeout(30_000 * 2)

test('Hydration', async ({ page, wallets }) => {
  const talisman = wallets.talisman
  const polkadotJs = wallets['polkadot-js']

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
})
