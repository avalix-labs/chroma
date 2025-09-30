import { createWalletTest } from '@avalix/chroma';

const POLKADOT_DAPP_URL = 'https://polkadot-starter-next-dedot.vercel.app/'
const DOT_TEST_MNEMONIC = 'test test test test test test test test test test test junk'
const DOT_TEST_PASSWORD = 'secure123!'

const test = createWalletTest({ 
  walletType: 'polkadot-js',
  headless: true,
  slowMo: 100
});

test('sign transaction', async ({ page, importAccount, authorize, approveTx }) => {
  await importAccount({
    seed: DOT_TEST_MNEMONIC,
    password: DOT_TEST_PASSWORD,
    name: 'Account 1',
  })

  await page.goto(POLKADOT_DAPP_URL)
  await page.waitForLoadState('networkidle')

  await page.getByRole('button', { name: /Connect Wallet/i }).click()

  const modalVisible = await page.locator('h2:has-text("CONNECT WALLET")').isVisible()
  if (modalVisible) {
    console.log('✅ Connect wallet modal opened')
    // Click CONNECT button in modal
    await page.getByRole('button', { name: /CONNECT/i }).nth(2).click()
    console.log('🔗 Clicked CONNECT button')
  }

  await authorize()

  await page.getByText('Account 1').click()

  await page.getByRole('button', { name: 'Sign Transaction' }).nth(3).click()

  await approveTx({ password: DOT_TEST_PASSWORD })
  await page.getByText('Processing transaction...').waitFor({ state: 'visible' })

  console.log('🎉 Test completed successfully!')

  await page.waitForTimeout(3000)
});
