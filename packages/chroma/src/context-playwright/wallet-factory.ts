import type { BrowserContext, Page } from '@playwright/test'
import type {
  PolkadotJsWalletInstance,
  TalismanWalletInstance,
  WalletAccount,
  WalletInstance,
} from './types.js'
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

// Create wallet instance helper with proper typing
export function createWalletInstance(
  walletType: string,
  extensionId: string,
  context: BrowserContext,
): WalletInstance {
  // Store the imported account name for later use
  let importedAccountName: string | undefined

  switch (walletType) {
    case 'polkadot-js':
      return {
        extensionId,
        type: 'polkadot-js',
        importMnemonic: async (options: WalletAccount) => {
          const page = context.pages()[0] || await context.newPage()
          const extPage = createExtendedPage(page, context, extensionId)
          importedAccountName = options.name || 'Test Account'
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
      } as PolkadotJsWalletInstance

    case 'talisman':
      return {
        extensionId,
        type: 'talisman',
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
      } as TalismanWalletInstance

    default:
      throw new Error(`Unsupported wallet type: ${walletType}`)
  }
}
