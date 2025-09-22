import { createWalletTest } from '@avalix/chroma';

const POLKADOT_DAPP_URL = 'http://localhost:5173/'
const DOT_TEST_MNEMONIC = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
const DOT_TEST_PASSWORD = 'secure123!'

// Create a test with Talisman wallet
const test = createWalletTest({ 
  walletType: 'talisman',
  headless: false,
  slowMo: 100
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
  
  // Ensure wallet objects are injected, reload if needed
  for (let i = 0; i < 3; i++) {
    const hasWalletObjects = await page.evaluate(() => 
      (window as any).injectedWeb3 && (window as any).talismanEth
    )
    if (hasWalletObjects) break
    
    console.log('⚠️ Wallet objects not found, reloading...')
    await page.reload()
    await page.waitForLoadState('networkidle')
  }
  
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
  await page.getByRole('textbox', { name: 'Share your thoughts with the' }).fill(`gm Polkadot! - ${insertNumber}`)
  await page.getByRole('button', { name: 'Post' }).click()

  // Sign transaction
  await approveTx()

  // Verify transaction
  await page.locator('div').filter({ hasText: new RegExp(`^gm Polkadot! - ${insertNumber}$`) }).waitFor({ state: 'visible' })

  console.log('🎉 Talisman test completed successfully!')
  await page.waitForTimeout(3000)
});

// thirdweb and privy.io embedded wallet
test('embedded wallets', async ({ page, importAccount, authorize, approveTx }) => {
  await importAccount({
    seed: DOT_TEST_MNEMONIC,
    password: DOT_TEST_PASSWORD,
    name: 'Talisman Account 1',
  })

  await page.goto('https://playground.thirdweb.com/wallets/sign-in/embed')
  await page.waitForLoadState('networkidle')

  await page.getByRole('button', { name: 'Connect a Wallet' }).click()
  await page.getByRole('button', { name: 'Talisman Installed' }).click()
  await authorize()

  await page.locator('[data-test="connected-wallet-details"]').click()

  console.log('🎉 Thirdweb embedded wallet test completed successfully!')
  await page.waitForTimeout(3000)

  await page.goto('https://demo.privy.io/')
  await page.getByRole('button', { name: 'REJECT ALL' }).click()
  await page.getByRole('button', { name: 'Continue with a wallet' }).click()
  await page.getByPlaceholder('Search wallets').fill('Talisman')
  await page.getByRole('button', { name: 'Talisman' }).click()
  await page.getByRole('button', { name: 'Talisman' }).first().click()
  await authorize()
  await approveTx()
  await page.getByText('0xf39...266').waitFor({ state: 'visible' })

  console.log('🎉 Privy.io embedded wallet test completed successfully!')
  await page.waitForTimeout(3000)
})
