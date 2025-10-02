import type { BrowserContext, Page } from '@playwright/test'
import type {
  BaseWalletInstance,
  PolkadotJsWalletInstance,
  TalismanWalletInstance,
  WalletAccount,
  WalletInstance,
} from './types.js'
import {
  approvePolkadotJSTx,
  authorizePolkadotJS,
  importPolkadotJSAccount,
} from '../wallets/polkadot-js.js'

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
  // Common methods for all wallets
  const baseInstance: BaseWalletInstance = {
    extensionId,
    importMnemonic: async (options: WalletAccount) => {
      const page = context.pages()[0] || await context.newPage()
      const extPage = createExtendedPage(page, context, extensionId)

      switch (walletType) {
        case 'polkadot-js':
          await importPolkadotJSAccount(extPage, options)
          break
        case 'talisman':
          throw new Error('Talisman account import is not yet implemented.')
        default:
          throw new Error(`Unsupported wallet type: ${walletType}`)
      }
    },
    authorize: async () => {
      const page = context.pages()[0] || await context.newPage()
      const extPage = createExtendedPage(page, context, extensionId)

      switch (walletType) {
        case 'polkadot-js':
          await authorizePolkadotJS(extPage)
          break
        case 'talisman':
          throw new Error('Talisman authorization is not yet implemented.')
        default:
          throw new Error(`Unsupported wallet type: ${walletType}`)
      }
    },
    approveTx: async (options: { password?: string } = {}) => {
      const page = context.pages()[0] || await context.newPage()
      const extPage = createExtendedPage(page, context, extensionId)

      switch (walletType) {
        case 'polkadot-js':
          await approvePolkadotJSTx(extPage, options)
          break
        case 'talisman':
          throw new Error('Talisman transaction approval is not yet implemented.')
        default:
          throw new Error(`Unsupported wallet type: ${walletType}`)
      }
    },
  }

  // Return wallet-specific instance with type discriminator
  switch (walletType) {
    case 'polkadot-js':
      return {
        ...baseInstance,
        type: 'polkadot-js',
      } as PolkadotJsWalletInstance

    case 'talisman':
      return {
        ...baseInstance,
        type: 'talisman',
        importPrivateKey: async (_options: { privateKey: string, name?: string, password?: string }) => {
          // TODO: Implement Talisman private key import
          throw new Error('Talisman importPrivateKey is not yet implemented.')
        },
      } as TalismanWalletInstance

    default:
      throw new Error(`Unsupported wallet type: ${walletType}`)
  }
}
