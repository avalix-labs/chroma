import type { BrowserContext, Page } from '@playwright/test'
import type { WalletAccount } from './types.js'
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
function createExtendedPage(page: Page, context: BrowserContext, extensionId: string) {
  const extPage = page as Page & { __extensionContext: BrowserContext, __extensionId: string }
  extPage.__extensionContext = context
  extPage.__extensionId = extensionId
  return extPage
}

// Factory function for Polkadot-JS wallet
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

// Factory function for Talisman wallet
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

// Auto-inferred types from factory functions
export type PolkadotJsWalletInstance = ReturnType<typeof createPolkadotJsWallet>
export type TalismanWalletInstance = ReturnType<typeof createTalismanWallet>
export type WalletInstance = PolkadotJsWalletInstance | TalismanWalletInstance

// Create wallet instance based on type
export function createWalletInstance(
  walletType: string,
  extensionId: string,
  context: BrowserContext,
): WalletInstance {
  switch (walletType) {
    case 'polkadot-js':
      return createPolkadotJsWallet(extensionId, context)
    case 'talisman':
      return createTalismanWallet(extensionId, context)
    default:
      throw new Error(`Unsupported wallet type: ${walletType}`)
  }
}
