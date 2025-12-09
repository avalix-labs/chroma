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

// Setup for Talisman wallet
const talismanSetup = createWalletTest({
  wallets: [{ type: 'talisman' }],
  userDataDir: `${WALLET_STATE_DIR}-talisman`,
})

talismanSetup('setup talisman wallet', async ({ wallets, page }) => {
  const markerFile = `${SETUP_MARKER_FILE}-talisman`

  if (fs.existsSync(markerFile)) {
    console.log('✅ Talisman setup marker found, wallet is already configured!')
    console.log('⏭️  Skipping setup...')
    await page.waitForTimeout(1000)
    return
  }

  const wallet = wallets.talisman
  console.log('🔧 Setting up Talisman wallet...')

  await wallet.importEthPrivateKey({
    privateKey: WALLET_CONFIG.talisman.ethPrivateKey,
    name: WALLET_CONFIG.talisman.accountName,
    password: WALLET_CONFIG.talisman.password,
  })

  fs.mkdirSync('.chroma', { recursive: true })
  fs.writeFileSync(markerFile, `Setup completed at: ${new Date().toISOString()}\n`)

  console.log('✅ Talisman wallet setup complete!')
})

// Setup for Polkadot.js wallet
const polkadotJsSetup = createWalletTest({
  wallets: [{ type: 'polkadot-js' }],
  userDataDir: `${WALLET_STATE_DIR}-polkadot-js`,
})

polkadotJsSetup('setup polkadot-js wallet', async ({ wallets, page }) => {
  const markerFile = `${SETUP_MARKER_FILE}-polkadot-js`

  if (fs.existsSync(markerFile)) {
    console.log('✅ Polkadot.js setup marker found, wallet is already configured!')
    console.log('⏭️  Skipping setup...')
    await page.waitForTimeout(1000)
    return
  }

  const wallet = wallets['polkadot-js']
  console.log('🔧 Setting up Polkadot.js wallet...')

  await wallet.importMnemonic({
    seed: WALLET_CONFIG.polkadotJs.mnemonic,
    name: WALLET_CONFIG.polkadotJs.accountName,
    password: WALLET_CONFIG.polkadotJs.password,
  })

  fs.mkdirSync('.chroma', { recursive: true })
  fs.writeFileSync(markerFile, `Setup completed at: ${new Date().toISOString()}\n`)

  console.log('✅ Polkadot.js wallet setup complete!')
})

// Setup for multi-wallet tests
const multiWalletSetup = createWalletTest({
  wallets: [{ type: 'talisman' }, { type: 'polkadot-js' }],
  userDataDir: `${WALLET_STATE_DIR}-multi`,
})

multiWalletSetup('setup multi-wallet', async ({ wallets, page }) => {
  const markerFile = `${SETUP_MARKER_FILE}-multi`

  if (fs.existsSync(markerFile)) {
    console.log('✅ Multi-wallet setup marker found, wallets are already configured!')
    console.log('⏭️  Skipping setup...')
    await page.waitForTimeout(1000)
    return
  }

  console.log('🔧 Setting up multiple wallets...')

  await Promise.all([
    wallets.talisman.importEthPrivateKey({
      privateKey: WALLET_CONFIG.multi.ethPrivateKey,
      name: WALLET_CONFIG.multi.accountName,
      password: WALLET_CONFIG.multi.password,
    }),
    wallets['polkadot-js'].importMnemonic({
      seed: WALLET_CONFIG.multi.mnemonic,
      name: WALLET_CONFIG.multi.accountName,
      password: WALLET_CONFIG.multi.password,
    }),
  ])

  fs.mkdirSync('.chroma', { recursive: true })
  fs.writeFileSync(markerFile, `Setup completed at: ${new Date().toISOString()}\n`)

  console.log('✅ Multi-wallet setup complete!')
})
