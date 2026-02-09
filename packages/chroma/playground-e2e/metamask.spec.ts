import { createWalletTest } from '../src/index.js'

const ACCOUNT_NAME = 'Test Account'
const ETH_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

const test = createWalletTest({
  wallets: [{ type: 'metamask' }],
})

test.setTimeout(30_000 * 2)

// // Cari semua data-testid
// document.querySelectorAll('[data-testid]').forEach(el => console.log(el.dataset.testid, el.tagName, el.textContent?.trim().slice(0, 50)))
test('should import account and connect MetaMask wallet', async ({ page, wallets }) => {
  const wallet = wallets.metamask

  // Import Ethereum account into MetaMask wallet
  await wallet.importEthPrivateKey({
    privateKey: ETH_PRIVATE_KEY,
    name: ACCOUNT_NAME,
  })

  await page.goto('https://demo.privy.io')

  await page.getByRole('button', { name: 'REJECT ALL' }).click()
  await page.waitForTimeout(3000)

  await wallet.unlock()
  await page.getByRole('button', { name: 'Continue with a wallet' }).click()
  await page.pause()
  await page.getByRole('button', { name: 'MetaMask' }).click()
  await page.getByRole('button', { name: 'MetaMask' }).first().click()
  await page.pause()
})
