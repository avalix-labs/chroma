import { createWalletTest, expect } from '../src/index.js'

const ACCOUNT_NAME = 'Test Account'
const DOT_TEST_MNEMONIC = 'bottom drive obey lake curtain smoke basket hold race lonely fit walk'
const ETH_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
const PASSWORD = 'h3llop0lkadot!'

// Create a test suite with Talisman wallet
const test = createWalletTest({
  wallets: [{ type: 'talisman' }],
})

test.setTimeout(30_000 * 2)

test('should import account and connect Talisman wallet', async ({ page, wallets }) => {
  const wallet = wallets.talisman
  const accountName = 'Test Account'

  // Import Ethereum account into Talisman wallet
  await wallet.importEthPrivateKey({
    privateKey: ETH_PRIVATE_KEY,
    name: ACCOUNT_NAME,
    password: PASSWORD,
  })

  // Navigate to Polkadot JS Apps
  await page.goto('https://gm-test-2.netlify.app/')
  await page.waitForLoadState('domcontentloaded')

  await page.getByRole('button', { name: 'Connect Wallet' }).click()

  const modalVisible = await page.locator('h2:has-text("CONNECT WALLET")').isVisible()
  if (modalVisible) {
    console.log('✅ Connect wallet modal opened')
    // Click CONNECT button in modal
    await page.getByRole('button', { name: /CONNECT/i }).nth(1).click()
    console.log('🔗 Clicked CONNECT button')
  }
  await wallet.authorize({ accountName })

  try {
    await wallet.approveTx()
  }
  catch {
    console.log('No another popup found, skipping')
  }

  // Test the dApp
  const insertNumber = Math.floor(Math.random() * 10000)
  await page.getByRole('textbox', { name: 'Share your thoughts with the' }).fill(`gm Polkadot! - ${insertNumber}`)
  await page.getByRole('button', { name: 'Post' }).click()

  // Sign transaction
  await wallet.approveTx()

  // Verify transaction
  await page.locator('div').filter({ hasText: new RegExp(`^gm Polkadot! - ${insertNumber}$`) }).waitFor({ state: 'visible' })

  console.log('🎉 Talisman test completed successfully!')
  await page.waitForTimeout(3000)
})

const multipleWallet = createWalletTest({
  wallets: [{ type: 'talisman' }, { type: 'polkadot-js' }],
})

multipleWallet('Can connect wallet with multiple wallets', async ({ page, wallets }) => {
  const talisman = wallets.talisman
  const polkadotJs = wallets['polkadot-js']
  const accountName = ACCOUNT_NAME

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
  await expect(page.getByRole('button', { name: 'Connect' })).toBeDisabled()

  await page.getByTestId('chain-select-trigger-from').getByText('Chain').click()
  await page.getByRole('listitem').filter({ hasText: 'Ethereum' }).click()
  await page.getByText('ETH', { exact: true }).click()
  await page.click('body')

  await expect(page.getByTestId('chain-select-trigger-from').getByRole('button', { name: 'Connect' })).toBeEnabled()
  await page.getByTestId('chain-select-trigger-from').getByRole('button', { name: 'Connect' }).click()

  await page.getByRole('button', { name: 'Talisman Talisman installed' }).click()
  await talisman.authorize()

  await expect(page.getByRole('button', { name: 'Disconnect' })).toBeVisible()

  // Select Asset Hub
  await page.getByTestId('chain-select-trigger-to').locator('div').nth(1).click()
  await page.getByRole('listitem').filter({ hasText: 'Asset Hub' }).click()
  await page.getByRole('listitem').filter({ hasText: 'DOT' }).click()
  await page.getByTestId('chain-select-trigger-to').getByRole('button', { name: 'Connect' }).click()

  await polkadotJs.authorize()
  await talisman.rejectTx() // somehow talisman popup appears, let's reject it for now
  await page.getByRole('button', { name: 'Polkadot.js INSTALLED' }).click()
  await page.getByRole('button', { name: 'Test Account 5dfh...qrzv' }).click()

  await expect(page.getByTestId('chain-select-trigger-to').getByRole('button', { name: 'Disconnect' })).toBeVisible()
})
