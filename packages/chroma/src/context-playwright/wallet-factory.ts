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
import {
  approveTalismanTx,
  authorizeTalisman,
  importEthPrivateKey,
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

  // Common methods for all wallets
  const baseInstance: BaseWalletInstance = {
    extensionId,
    importMnemonic: async (options: WalletAccount) => {
      const page = context.pages()[0] || await context.newPage()
      const extPage = createExtendedPage(page, context, extensionId)

      // Store the account name for future authorize calls
      importedAccountName = options.name || 'Test Account'

      switch (walletType) {
        case 'polkadot-js':
          await importPolkadotJSAccount(extPage, options)
          break
        case 'talisman':
          throw new Error('Talisman importMnemonic is not yet implemented.')
        default:
          throw new Error(`Unsupported wallet type: ${walletType}`)
      }
    },
    authorize: async (options: { accountName?: string } = {}) => {
      const page = context.pages()[0] || await context.newPage()
      const extPage = createExtendedPage(page, context, extensionId)

      // Use provided account name or fall back to the imported one
      const accountName = options.accountName || importedAccountName

      switch (walletType) {
        case 'polkadot-js':
          await authorizePolkadotJS(extPage)
          break
        case 'talisman':
          await authorizeTalisman(extPage, { accountName })
          break
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
          await approveTalismanTx(extPage)
          break
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
        importEthPrivateKey: async (options: { privateKey: string, name?: string, password?: string }) => {
          const page = context.pages()[0] || await context.newPage()
          const extPage = createExtendedPage(page, context, extensionId)

          // Store the account name for future authorize calls
          importedAccountName = options.name || 'Test Account'

          // Use the seed property to pass the private key
          await importEthPrivateKey(extPage, {
            seed: options.privateKey,
            name: options.name,
            password: options.password,
          })
        },
      } as TalismanWalletInstance

    default:
      throw new Error(`Unsupported wallet type: ${walletType}`)
  }
}
