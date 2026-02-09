import type { BrowserContext, Page } from '@playwright/test'
import type { WalletAccount } from './types.js'
import {
  importEthPrivateKey as importMetaMaskEthPrivateKey,
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

// Helper to create extended page with wallet context
/* c8 ignore start */
function createExtendedPage(page: Page, context: BrowserContext, extensionId: string) {
  const extPage = page as Page & { __extensionContext: BrowserContext, __extensionId: string }
  extPage.__extensionContext = context
  extPage.__extensionId = extensionId
  return extPage
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
      const page = context.pages()[0] || await context.newPage()
      const extPage = createExtendedPage(page, context, extensionId)
      await importPolkadotJSAccount(extPage, options)
    },
    authorize: async () => {
      const page = context.pages()[0] || await context.newPage()
      const extPage = createExtendedPage(page, context, extensionId)
      await authorizePolkadotJS(extPage)
    },
    approveTx: async (options: { password?: string } = {}) => {
      const page = context.pages()[0] || await context.newPage()
      const extPage = createExtendedPage(page, context, extensionId)
      await approvePolkadotJSTx(extPage, options)
    },
    rejectTx: async () => {
      const page = context.pages()[0] || await context.newPage()
      const extPage = createExtendedPage(page, context, extensionId)
      await rejectPolkadotJSTx(extPage)
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
      const page = context.pages()[0] || await context.newPage()
      const extPage = createExtendedPage(page, context, extensionId)
      importedAccountName = options.name || 'Test Account'
      await importPolkadotMnemonic(extPage, options)
    },
    importEthPrivateKey: async (options: { privateKey: string, name?: string, password?: string }) => {
      const page = context.pages()[0] || await context.newPage()
      const extPage = createExtendedPage(page, context, extensionId)
      importedAccountName = options.name || 'Test Account'
      await importEthPrivateKey(extPage, {
        seed: options.privateKey,
        name: options.name,
        password: options.password,
      })
    },
    authorize: async (options: { accountName?: string } = {}) => {
      const page = context.pages()[0] || await context.newPage()
      const extPage = createExtendedPage(page, context, extensionId)
      const accountName = options.accountName || importedAccountName
      await authorizeTalisman(extPage, { accountName })
    },
    approveTx: async () => {
      const page = context.pages()[0] || await context.newPage()
      const extPage = createExtendedPage(page, context, extensionId)
      await approveTalismanTx(extPage)
    },
    rejectTx: async () => {
      const page = context.pages()[0] || await context.newPage()
      const extPage = createExtendedPage(page, context, extensionId)
      await rejectTalismanTx(extPage)
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
    importEthPrivateKey: async (options: { privateKey: string, name?: string, password?: string }) => {
      const page = context.pages()[0] || await context.newPage()
      const extPage = createExtendedPage(page, context, extensionId)
      await importMetaMaskEthPrivateKey(extPage, {
        seed: options.privateKey,
        name: options.name,
        password: options.password,
      })
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
export type WalletInstance = PolkadotJsWalletInstance | TalismanWalletInstance | MetaMaskWalletInstance
