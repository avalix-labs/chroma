/**
 * Shared wallet configuration
 * This file can be imported by both setup and test files
 */

// Path to store wallet state (like storageState but for extensions)
export const WALLET_STATE_DIR = '.chroma/wallet-state'

// Wallet credentials (for testing only!)
export const WALLET_CONFIG = {
  talisman: {
    accountName: 'Test Account',
    ethPrivateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    password: 'h3llop0lkadot!',
  },
  polkadotJs: {
    accountName: '// Alice',
    mnemonic: 'bottom drive obey lake curtain smoke basket hold race lonely fit walk',
    password: 'h3llop0lkadot!',
  },
  // For multi-wallet tests
  multi: {
    accountName: 'Test Account',
    ethPrivateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    mnemonic: 'bottom drive obey lake curtain smoke basket hold race lonely fit walk',
    password: 'h3llop0lkadot!',
  },
}
