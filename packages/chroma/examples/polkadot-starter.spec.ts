import { createWalletTest } from '../src/index.js'

const POLKADOT_DAPP_URLS = [
  'https://polkadot-starter-vue-dedot.vercel.app/',
  'https://polkadot-starter-vue-papi.vercel.app/',
]

const ACCOUNT_NAME = '// Alice'
const DOT_TEST_MNEMONIC = 'bottom drive obey lake curtain smoke basket hold race lonely fit walk'
const DOT_TEST_PASSWORD = 'secure123!'

const test = createWalletTest({
  headless: false,
})

// increase playwright timeout
test.setTimeout(30_000 * 10) // default is 30000

test.beforeAll(async ({ wallets }) => {
  await wallets['polkadot-js'].importMnemonic({
    seed: DOT_TEST_MNEMONIC,
    password: DOT_TEST_PASSWORD,
    name: ACCOUNT_NAME,
  })
})

for (const url of POLKADOT_DAPP_URLS) {
  test(`sign transaction on ${url}`, async ({ page, wallets }) => {
    console.log(`🧪 Testing ${url}`)

    await page.goto(url)
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: /Connect Wallet/i }).click()

    const modalVisible = await page.locator('h2:has-text("CONNECT WALLET")').isVisible()
    if (modalVisible) {
      console.log('✅ Connect wallet modal opened')
      // Click CONNECT button in modal
      await page.getByRole('button', { name: /CONNECT/i }).nth(2).click()
      console.log('🔗 Clicked CONNECT button')
    }

    await wallets['polkadot-js'].authorize()

    await page.getByText(ACCOUNT_NAME).click()

    await page.getByRole('button', { name: 'Sign Transaction' }).nth(3).click()

    if (url.includes('papi'))
      await page.waitForTimeout(3000)
    await wallets['polkadot-js'].approveTx({ password: DOT_TEST_PASSWORD })
    await page.getByText('Processing transaction...').waitFor({ state: 'visible' })
    console.log(`🎉 Test completed successfully for ${url}!`)

    await page.waitForTimeout(5000)
  })
}
