/**
 * Wallet Setup Project
 *
 * This file sets up wallet accounts ONCE before all tests run.
 * Similar to Playwright's auth setup pattern: https://playwright.dev/docs/auth
 *
 * A marker file `.chroma/.setup-complete` indicates setup is done.
 */
import fs from 'node:fs'
import { createWalletTest } from '../src/index.js'
import { WALLET_CONFIG } from './wallet.config.js'

// Marker file to indicate setup is complete
const SETUP_MARKER_FILE = '.chroma/wallet-state/.setup-complete'

// Setup both Talisman and Polkadot.js wallets
const setup = createWalletTest({
  wallets: [{ type: 'talisman' }, { type: 'polkadot-js' }],
})

setup('setup wallets', async ({ wallets, page }) => {
  if (fs.existsSync(SETUP_MARKER_FILE)) {
    console.log('✅ Setup marker found, wallets are already configured!')
    console.log('⏭️  Skipping setup...')
    await page.waitForTimeout(1000)
    return
  }

  console.log('🔧 Setting up Talisman and Polkadot.js wallets...')

  // Import accounts to both wallets
  await Promise.all([
    wallets.talisman.importEthPrivateKey({
      privateKey: WALLET_CONFIG.talisman.ethPrivateKey,
      name: WALLET_CONFIG.talisman.accountName,
    }),
    wallets['polkadot-js'].importMnemonic({
      seed: WALLET_CONFIG.polkadotJs.mnemonic,
      name: WALLET_CONFIG.polkadotJs.accountName,
    }),
  ])

  fs.mkdirSync('.chroma', { recursive: true })
  fs.writeFileSync(SETUP_MARKER_FILE, `Setup completed at: ${new Date().toISOString()}\n`)

  console.log('✅ Wallets setup complete!')
})
