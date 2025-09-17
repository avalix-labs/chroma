import { createWalletTest } from '@avalix/chroma';

const POLKADOT_DAPP_URL = 'http://localhost:5173/'
const DOT_TEST_MNEMONIC = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
const DOT_TEST_PASSWORD = 'secure123!'

// Create a test with Talisman wallet
const test = createWalletTest({ 
  walletType: 'talisman',
  headless: false,
  slowMo: 200
});

test('sign transaction with Talisman', async ({ page, importAccount, authorize, approveTx }) => {
  test.setTimeout(600000); // 10 minutes timeout
  await importAccount({
    seed: DOT_TEST_MNEMONIC,
    password: DOT_TEST_PASSWORD,
    name: 'Talisman Account 1',
  })

  await page.goto(POLKADOT_DAPP_URL)
  await page.waitForLoadState('networkidle')
  
  await page.getByRole('button', { name: 'Connect Wallet' }).click()

  const modalVisible = await page.locator('h2:has-text("CONNECT WALLET")').isVisible()
  if (modalVisible) {
    console.log('✅ Connect wallet modal opened')
    // Click CONNECT button in modal
    await page.getByRole('button', { name: /CONNECT/i }).nth(1).click()
    console.log('🔗 Clicked CONNECT button')
  }

  await authorize()

  // Test the dApp
  const insertNumber = Math.floor(Math.random() * 10000)
  await page.getByPlaceholder('Enter a number').fill(insertNumber.toString())
  await page.getByRole('button', { name: 'Store Number' }).click()

  // Sign transaction
  await approveTx()

  // Verify transaction
  await page.waitForTimeout(10000)
  await page.reload()
  await page.getByPlaceholder('Enter a number').fill(insertNumber.toString())
  await page.getByText(`contract value: ${insertNumber}`).waitFor({ state: 'visible' })

  // await page.pause()

  console.log('🎉 Talisman test completed successfully!')
});
