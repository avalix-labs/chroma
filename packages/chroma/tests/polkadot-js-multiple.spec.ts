import { createWalletTest } from '../src/index.js'

const POLKADOT_DAPP_URLS = [
  'https://polkadot-starter-next-dedot.vercel.app/',
  'https://polkadot-starter-next-papi.vercel.app/',
  'https://polkadot-starter-nuxt-dedot.vercel.app/',
  'https://polkadot-starter-nuxt-papi.vercel.app/',
  'https://polkadot-starter-react-dedot.vercel.app/',
  'https://polkadot-starter-react-papi.vercel.app/',
  'https://polkadot-starter-vue-dedot.vercel.app/',
  'https://polkadot-starter-vue-papi.vercel.app/',
]

const ACCOUNT_NAME = '// Alice'
const DOT_TEST_MNEMONIC = 'bottom drive obey lake curtain smoke basket hold race lonely fit walk'
const DOT_TEST_PASSWORD = 'secure123!'

const test = createWalletTest({
  headless: false,
})

test.describe.configure({ mode: 'default' })

// increase playwright timeout
test.setTimeout(30_000 * 2)

test.beforeEach(async ({ wallets }) => {
  const wallet = wallets['polkadot-js']
  await wallet.importMnemonic({
    seed: DOT_TEST_MNEMONIC,
    password: DOT_TEST_PASSWORD,
    name: ACCOUNT_NAME,
  })
})

for (const POLKADOT_DAPP_URL of POLKADOT_DAPP_URLS) {
  test(`sign transaction on ${POLKADOT_DAPP_URL}`, async ({ page, wallets }) => {
    console.log(`🧪 Testing ${POLKADOT_DAPP_URL}`)

    const wallet = wallets['polkadot-js']

    await page.goto(POLKADOT_DAPP_URL)
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: /Connect Wallet/i }).click()

    const modalVisible = await page.locator('h2:has-text("CONNECT WALLET")').isVisible()
    if (modalVisible) {
      await page.getByRole('button', { name: /CONNECT/i }).nth(2).click()
    }

    await wallet.authorize()

    await page.getByText(ACCOUNT_NAME).click()

    await page.getByRole('button', { name: 'Sign Transaction' }).nth(3).click()

    if (POLKADOT_DAPP_URL.includes('papi'))
      await page.waitForTimeout(3000)
    await wallet.approveTx({ password: DOT_TEST_PASSWORD })
    await page.getByText('Processing transaction...').waitFor({ state: 'visible' })

    console.log(`🎉 Test completed successfully for ${POLKADOT_DAPP_URL}!`)

    await page.waitForTimeout(3000)
  })
}
