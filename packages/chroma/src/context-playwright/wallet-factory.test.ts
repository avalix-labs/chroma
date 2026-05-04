import type { BrowserContext, Page } from '@playwright/test'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createMetaMaskWallet,
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

vi.mock('../wallets/metamask.js', () => ({
  importSeedPhrase: vi.fn(),
  unlockMetaMask: vi.fn(),
  approveMetaMask: vi.fn(),
  rejectMetaMask: vi.fn(),
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

    it('should have metamask factory', () => {
      expect(walletFactories.metamask).toBeDefined()
      expect(typeof walletFactories.metamask).toBe('function')
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

  describe('createMetaMaskWallet', () => {
    const extensionId = 'test-extension-id'
    let mockContext: BrowserContext

    beforeEach(() => {
      mockContext = createMockContext()
    })

    it('should create wallet with correct type and extensionId', () => {
      const wallet = createMetaMaskWallet(extensionId, mockContext)

      expect(wallet.type).toBe('metamask')
      expect(wallet.extensionId).toBe(extensionId)
    })

    it('should have all required methods', () => {
      const wallet = createMetaMaskWallet(extensionId, mockContext)

      expect(typeof wallet.importSeedPhrase).toBe('function')
      expect(typeof wallet.unlock).toBe('function')
      expect(typeof wallet.approve).toBe('function')
      expect(typeof wallet.reject).toBe('function')
    })
  })
})
