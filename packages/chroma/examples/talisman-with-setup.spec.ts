/**
 * Tests that use pre-configured wallet state
 *
 * These tests depend on the setup project (wallet.setup.ts) to import wallet first.
 * The wallet is already imported, so we can skip the import step!
 */
import { createWalletTest } from '../src/index.js'
import { WALLET_CONFIG, WALLET_STATE_DIR } from './wallet.config.js'

// Use the SAME userDataDir as the setup project
const test = createWalletTest({
  wallets: [{ type: 'talisman' }],
  userDataDir: WALLET_STATE_DIR, // <-- Reuses wallet state from setup!
})

test.setTimeout(30_000 * 2)

// Test 1: Wallet is already set up, just connect and use it!
test('should connect pre-configured Talisman wallet', async ({ page, wallets }) => {
  const wallet = wallets.talisman

  // Navigate to app - wallet is already imported from setup project!
  await page.goto('https://gm-test-2.netlify.app/')
  await page.waitForLoadState('networkidle')

  // Check if wallet is already connected (button shows address like "Talisman 0xf39F...2266")
  // Wait a bit for the wallet connection state to be restored
  const walletConnectedButton = page.getByRole('button', { name: /Talisman 0x/ })
  const walletConnected = await walletConnectedButton.waitFor({ state: 'visible', timeout: 3000 }).then(() => true).catch(() => false)

  if (walletConnected) {
    console.log('✅ Wallet already connected from persistent state')
  }
  else {
    // Connect wallet
    await page.getByRole('button', { name: 'Connect Wallet' }).click()

    const modalVisible = await page.locator('h2:has-text("CONNECT WALLET")').isVisible()
    if (modalVisible) {
      console.log('✅ Connect wallet modal opened')
      await page.getByRole('button', { name: /CONNECT/i }).nth(1).click()
      console.log('🔗 Clicked CONNECT button')
    }

    // Authorize - wallet already has the account imported!
    await wallet.authorize({ accountName: WALLET_CONFIG.accountName, password: WALLET_CONFIG.password })

    try {
      await wallet.approveTx()
    }
    catch {
      console.log('No popup found, skipping')
    }
  }

  // Post a message
  const insertNumber = Math.floor(Math.random() * 10000)
  await page.getByRole('textbox', { name: 'Share your thoughts with the' }).fill(`gm Polkadot! - ${insertNumber}`)
  await page.getByRole('button', { name: 'Post' }).click()

  await wallet.approveTx({ password: WALLET_CONFIG.password })

  await page.locator('div').filter({ hasText: new RegExp(`^gm Polkadot! - ${insertNumber}$`) }).waitFor({ state: 'visible' })

  console.log('🎉 Test 1 completed!')
})

// Test 2: Another test using the same pre-configured wallet
test('should post another message', async ({ page, wallets }) => {
  const wallet = wallets.talisman

  await page.goto('https://gm-test-2.netlify.app/')
  await page.waitForLoadState('networkidle')

  // Check if wallet is already connected (button shows address like "Talisman 0xf39F...2266")
  const walletConnectedButton = page.getByRole('button', { name: /Talisman 0x/ })
  const walletConnected = await walletConnectedButton.waitFor({ state: 'visible', timeout: 3000 }).then(() => true).catch(() => false)

  if (walletConnected) {
    console.log('✅ Wallet already connected')
  }
  else {
    // Connect wallet
    await page.getByRole('button', { name: 'Connect Wallet' }).click()
    const modalVisible = await page.locator('h2:has-text("CONNECT WALLET")').isVisible()
    if (modalVisible) {
      await page.getByRole('button', { name: /CONNECT/i }).nth(1).click()
    }
    await wallet.authorize({ accountName: WALLET_CONFIG.accountName, password: WALLET_CONFIG.password })
    try {
      await wallet.approveTx()
    }
    catch {
      console.log('No popup found')
    }
  }

  // Post message
  const insertNumber = Math.floor(Math.random() * 10000)
  await page.getByRole('textbox', { name: 'Share your thoughts with the' }).fill(`Hello again! - ${insertNumber}`)
  await page.getByRole('button', { name: 'Post' }).click()

  await wallet.approveTx({ password: WALLET_CONFIG.password })

  await page.locator('div').filter({ hasText: new RegExp(`^Hello again! - ${insertNumber}$`) }).waitFor({ state: 'visible' })

  console.log('🎉 Test 2 completed!')
})
