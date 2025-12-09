/**
 * Turtle.cool test using pre-configured multi-wallet setup
 */
import { createWalletTest, expect } from '../../src/index.js'
import { WALLET_CONFIG, WALLET_STATE_DIR } from '../wallet.config.js'

const test = createWalletTest({
  wallets: [{ type: 'talisman' }, { type: 'polkadot-js' }],
  userDataDir: `${WALLET_STATE_DIR}-multi`,
})

test('Can connect wallet with multiple wallets', async ({ page, wallets }) => {
  const talisman = wallets.talisman
  const polkadotJs = wallets['polkadot-js']

  await page.goto('https://app.turtle.cool/')

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
  await page.getByRole('button', { name: `${WALLET_CONFIG.multi.accountName} 5dfh...qrzv` }).click()
  await expect(page.getByTestId('chain-select-trigger-to').getByRole('button', { name: 'Disconnect' })).toBeVisible()
})
