/**
 * Wallet Setup Project
 *
 * This file sets up wallet accounts ONCE before all tests run.
 * Similar to Playwright's auth setup pattern: https://playwright.dev/docs/auth
 *
 * The wallet state is stored in `.chroma/wallet-state` directory.
 * A marker file `.chroma/.setup-complete` indicates setup is done.
 */
import fs from 'node:fs'
import { createWalletTest } from '../src/index.js'
import { WALLET_CONFIG, WALLET_STATE_DIR } from './wallet.config.js'

// Marker file to indicate setup is complete
const SETUP_MARKER_FILE = '.chroma/.setup-complete'

// Create setup test with persistent user data directory
const setup = createWalletTest({
  wallets: [{ type: 'talisman' }],
  userDataDir: WALLET_STATE_DIR,
})

setup('setup talisman wallet', async ({ wallets, page }) => {
  // Check if setup marker exists - skip if already configured!
  if (fs.existsSync(SETUP_MARKER_FILE)) {
    console.log('✅ Setup marker found, wallet is already configured!')
    console.log('⏭️  Skipping setup...')
    // Wait a bit for extension to initialize before closing
    await page.waitForTimeout(1000)
    return
  }

  const wallet = wallets.talisman

  console.log('🔧 Setting up Talisman wallet...')

  // Import account - this only needs to happen once!
  await wallet.importEthPrivateKey({
    privateKey: WALLET_CONFIG.ethPrivateKey,
    name: WALLET_CONFIG.accountName,
    password: WALLET_CONFIG.password,
  })

  // Create marker file to indicate setup is complete
  fs.writeFileSync(SETUP_MARKER_FILE, `Setup completed at: ${new Date().toISOString()}\n`)

  console.log('✅ Talisman wallet setup complete!')
  console.log(`📁 Wallet state saved to: ${WALLET_STATE_DIR}`)
  console.log(`📝 Marker file created: ${SETUP_MARKER_FILE}`)
})
