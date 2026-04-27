import type { BrowserContext, Page } from '@playwright/test'
import type { WalletAccount } from './types.js'
import {
  authorizeMetaMask,
  confirmMetaMask,
  importSeedPhrase as importMetaMaskSeedPhrase,
  rejectMetaMask,
  unlockMetaMask,
} from '../wallets/metamask.js'
import {
  approvePolkadotJSTx,
  authorizePolkadotJS,
  importPolkadotJSAccount,
  rejectPolkadotJSTx,
} from '../wallets/polkadot-js.js'
import {
  approveTalismanTx,
  authorizeTalisman,
  importEthPrivateKey,
  importPolkadotMnemonic,
  rejectTalismanTx,
} from '../wallets/talisman.js'

// Helper: pick or create a page on the context and tag it with extension info.
/* c8 ignore start */
async function getOrCreateExtendedPage(context: BrowserContext, extensionId: string) {
  const page = (context.pages()[0] || await context.newPage()) as Page & {
    __extensionContext: BrowserContext
    __extensionId: string
  }
  page.__extensionContext = context
  page.__extensionId = extensionId
  return page
}
/* c8 ignore stop */

/*
 * Factory function for Polkadot-JS wallet
 * Coverage excluded: methods interact with Chrome extension APIs via browser context.
 */
/* c8 ignore start */
export function createPolkadotJsWallet(extensionId: string, context: BrowserContext) {
  return {
    extensionId,
    type: 'polkadot-js' as const,
    importMnemonic: async (options: WalletAccount) => {
      await importPolkadotJSAccount(await getOrCreateExtendedPage(context, extensionId), options)
    },
    authorize: async () => {
      await authorizePolkadotJS(await getOrCreateExtendedPage(context, extensionId))
    },
    approveTx: async (options: { password?: string } = {}) => {
      await approvePolkadotJSTx(await getOrCreateExtendedPage(context, extensionId), options)
    },
    rejectTx: async () => {
      await rejectPolkadotJSTx(await getOrCreateExtendedPage(context, extensionId))
    },
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
    importPolkadotMnemonic: async (options: WalletAccount) => {
      importedAccountName = options.name || 'Test Account'
      await importPolkadotMnemonic(await getOrCreateExtendedPage(context, extensionId), options)
    },
    importEthPrivateKey: async (options: { privateKey: string, name?: string, password?: string }) => {
      importedAccountName = options.name || 'Test Account'
      await importEthPrivateKey(await getOrCreateExtendedPage(context, extensionId), {
        seed: options.privateKey,
        name: options.name,
        password: options.password,
      })
    },
    authorize: async (options: { accountName?: string } = {}) => {
      const accountName = options.accountName || importedAccountName
      await authorizeTalisman(await getOrCreateExtendedPage(context, extensionId), { accountName })
    },
    approveTx: async () => {
      await approveTalismanTx(await getOrCreateExtendedPage(context, extensionId))
    },
    rejectTx: async () => {
      await rejectTalismanTx(await getOrCreateExtendedPage(context, extensionId))
    },
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
    importSeedPhrase: async (options: { seedPhrase: string }) => {
      await importMetaMaskSeedPhrase(await getOrCreateExtendedPage(context, extensionId), { seedPhrase: options.seedPhrase })
    },
    unlock: async () => {
      await unlockMetaMask(await getOrCreateExtendedPage(context, extensionId))
    },
    authorize: async () => {
      await authorizeMetaMask(await getOrCreateExtendedPage(context, extensionId))
    },
    reject: async () => {
      await rejectMetaMask(await getOrCreateExtendedPage(context, extensionId))
    },
    confirm: async () => {
      await confirmMetaMask(await getOrCreateExtendedPage(context, extensionId))
    },
  }
}
/* c8 ignore stop */

// Wallet factories map - auto-inferred types
export const walletFactories = {
  'polkadot-js': createPolkadotJsWallet,
  'talisman': createTalismanWallet,
  'metamask': createMetaMaskWallet,
}

// Auto-inferred types from factory functions
export type PolkadotJsWalletInstance = ReturnType<typeof createPolkadotJsWallet>
export type TalismanWalletInstance = ReturnType<typeof createTalismanWallet>
export type MetaMaskWalletInstance = ReturnType<typeof createMetaMaskWallet>
