import type { BrowserContext, Page } from '@playwright/test'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createPolkadotJsWallet,
  createTalismanWallet,
  walletFactories,
} from './wallet-factory.js'

// Mock wallet implementations
vi.mock('../wallets/polkadot-js.js', () => ({
  importPolkadotJSAccount: vi.fn(),
  authorizePolkadotJS: vi.fn(),
  approvePolkadotJSTx: vi.fn(),
  rejectPolkadotJSTx: vi.fn(),
}))

vi.mock('../wallets/talisman.js', () => ({
  importPolkadotMnemonic: vi.fn(),
  importEthPrivateKey: vi.fn(),
  authorizeTalisman: vi.fn(),
  approveTalismanTx: vi.fn(),
  rejectTalismanTx: vi.fn(),
}))

// Create mock browser context
function createMockContext(): BrowserContext {
  const mockPage = {
    url: () => 'https://example.com',
    __extensionContext: null,
    __extensionId: '',
  } as unknown as Page

  return {
    pages: vi.fn().mockReturnValue([mockPage]),
    newPage: vi.fn().mockResolvedValue(mockPage),
  } as unknown as BrowserContext
}

describe('wallet-factory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('walletFactories', () => {
    it('should have polkadot-js factory', () => {
      expect(walletFactories['polkadot-js']).toBeDefined()
      expect(typeof walletFactories['polkadot-js']).toBe('function')
    })

    it('should have talisman factory', () => {
      expect(walletFactories.talisman).toBeDefined()
      expect(typeof walletFactories.talisman).toBe('function')
    })
  })

  describe('createPolkadotJsWallet', () => {
    const extensionId = 'test-extension-id'
    let mockContext: BrowserContext

    beforeEach(() => {
      mockContext = createMockContext()
    })

    it('should create wallet with correct type and extensionId', () => {
      const wallet = createPolkadotJsWallet(extensionId, mockContext)

      expect(wallet.type).toBe('polkadot-js')
      expect(wallet.extensionId).toBe(extensionId)
    })

    it('should have all required methods', () => {
      const wallet = createPolkadotJsWallet(extensionId, mockContext)

      expect(typeof wallet.importMnemonic).toBe('function')
      expect(typeof wallet.authorize).toBe('function')
      expect(typeof wallet.approveTx).toBe('function')
      expect(typeof wallet.rejectTx).toBe('function')
    })
  })

  describe('createTalismanWallet', () => {
    const extensionId = 'test-extension-id'
    let mockContext: BrowserContext

    beforeEach(() => {
      mockContext = createMockContext()
    })

    it('should create wallet with correct type and extensionId', () => {
      const wallet = createTalismanWallet(extensionId, mockContext)

      expect(wallet.type).toBe('talisman')
      expect(wallet.extensionId).toBe(extensionId)
    })

    it('should have all required methods', () => {
      const wallet = createTalismanWallet(extensionId, mockContext)

      expect(typeof wallet.importPolkadotMnemonic).toBe('function')
      expect(typeof wallet.importEthPrivateKey).toBe('function')
      expect(typeof wallet.authorize).toBe('function')
      expect(typeof wallet.approveTx).toBe('function')
      expect(typeof wallet.rejectTx).toBe('function')
    })
  })
})
