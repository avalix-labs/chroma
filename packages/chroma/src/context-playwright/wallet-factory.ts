import type { BrowserContext } from '@playwright/test'
import type { WalletAccount } from './types.js'
import {
  approveMetaMask,
  getMetaMaskExtensionPath,
  importSeedPhrase as importMetaMaskSeedPhrase,
  rejectMetaMask,
  unlockMetaMask,
} from '../wallets/metamask.js'
import {
  approvePolkadotJSTx,
  authorizePolkadotJS,
  getPolkadotJSExtensionPath,
  importPolkadotJSAccount,
  rejectPolkadotJSTx,
} from '../wallets/polkadot-js.js'
import {
  approveSubWalletTx,
  authorizeSubWallet,
  getSubWalletExtensionPath,
  importSubWalletMnemonic,
  rejectSubWalletTx,
} from '../wallets/subwallet.js'
import {
  approveTalismanTx,
  authorizeTalisman,
  getTalismanExtensionPath,
  importEthPrivateKey,
  importPolkadotMnemonic,
  rejectTalismanTx,
} from '../wallets/talisman.js'

/*
 * Factory function for Polkadot-JS wallet
 * Coverage excluded: methods interact with Chrome extension APIs via browser context.
 */
/* c8 ignore start */
export function createPolkadotJsWallet(extensionId: string, context: BrowserContext) {
  return {
    extensionId,
    type: 'polkadot-js' as const,
    importMnemonic: (options: WalletAccount) => importPolkadotJSAccount(context, extensionId, options),
    authorize: () => authorizePolkadotJS(context, extensionId),
    approveTx: (options: { password?: string } = {}) => approvePolkadotJSTx(context, extensionId, options),
    rejectTx: () => rejectPolkadotJSTx(context, extensionId),
  }
}
/* c8 ignore stop */

/*
 * Factory function for Talisman wallet
 * Coverage excluded: methods interact with Chrome extension APIs via browser context.
 */
/* c8 ignore start */
export function createTalismanWallet(extensionId: string, context: BrowserContext) {
  let importedAccountName: string | undefined

  return {
    extensionId,
    type: 'talisman' as const,
    importPolkadotMnemonic: (options: WalletAccount) => {
      importedAccountName = options.name || 'Test Account'
      return importPolkadotMnemonic(context, extensionId, options)
    },
    importEthPrivateKey: (options: { privateKey: string, name?: string, password?: string }) => {
      importedAccountName = options.name || 'Test Account'
      return importEthPrivateKey(context, extensionId, {
        seed: options.privateKey,
        name: options.name,
        password: options.password,
      })
    },
    authorize: (options: { accountName?: string } = {}) => {
      const accountName = options.accountName || importedAccountName
      return authorizeTalisman(context, extensionId, { accountName })
    },
    approveTx: () => approveTalismanTx(context, extensionId),
    rejectTx: () => rejectTalismanTx(context, extensionId),
  }
}
/* c8 ignore stop */

/*
 * Factory function for SubWallet wallet
 * Coverage excluded: methods interact with Chrome extension APIs via browser context.
 */
/* c8 ignore start */
export function createSubWalletWallet(extensionId: string, context: BrowserContext) {
  let importedAccountName: string | undefined

  return {
    extensionId,
    type: 'subwallet' as const,
    importPolkadotMnemonic: (options: WalletAccount) => {
      importedAccountName = options.name || 'Test Account'
      return importSubWalletMnemonic(context, extensionId, options)
    },
    authorize: (options: { accountName?: string } = {}) => {
      const accountName = options.accountName || importedAccountName
      return authorizeSubWallet(context, extensionId, { accountName })
    },
    approveTx: () => approveSubWalletTx(context, extensionId),
    rejectTx: () => rejectSubWalletTx(context, extensionId),
  }
}
/* c8 ignore stop */

/*
 * Factory function for MetaMask wallet
 * Coverage excluded: methods interact with Chrome extension APIs via browser context.
 */
/* c8 ignore start */
export function createMetaMaskWallet(extensionId: string, context: BrowserContext) {
  return {
    extensionId,
    type: 'metamask' as const,
    importSeedPhrase: (options: { seedPhrase: string }) => importMetaMaskSeedPhrase(context, extensionId, options),
    unlock: () => unlockMetaMask(context, extensionId),
    approve: () => approveMetaMask(context, extensionId),
    reject: () => rejectMetaMask(context, extensionId),
  }
}
/* c8 ignore stop */

// Wallet factories map - auto-inferred types
export const walletFactories = {
  'polkadot-js': createPolkadotJsWallet,
  'talisman': createTalismanWallet,
  'subwallet': createSubWalletWallet,
  'metamask': createMetaMaskWallet,
}

// Extension path resolvers per wallet type. `satisfies` keeps the keys in
// lockstep with walletFactories, so adding a wallet means extending both maps
// here in one file.
export const walletExtensionPaths = {
  'polkadot-js': getPolkadotJSExtensionPath,
  'talisman': getTalismanExtensionPath,
  'subwallet': getSubWalletExtensionPath,
  'metamask': getMetaMaskExtensionPath,
} satisfies Record<keyof typeof walletFactories, () => Promise<string>>

// Auto-inferred types from factory functions
export type PolkadotJsWalletInstance = ReturnType<typeof createPolkadotJsWallet>
export type TalismanWalletInstance = ReturnType<typeof createTalismanWallet>
export type SubWalletWalletInstance = ReturnType<typeof createSubWalletWallet>
export type MetaMaskWalletInstance = ReturnType<typeof createMetaMaskWallet>
