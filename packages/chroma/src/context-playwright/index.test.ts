import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createWalletTest } from './index.js'

// Mock @playwright/test
vi.mock('@playwright/test', () => {
  const mockExtend = vi.fn().mockReturnValue({
    extend: vi.fn(),
  })

  return {
    test: {
      extend: mockExtend,
    },
    chromium: {
      launchPersistentContext: vi.fn(),
    },
    expect: vi.fn(),
  }
})

// Mock wallet extension paths
vi.mock('../wallets/polkadot-js.js', () => ({
  getPolkadotJSExtensionPath: vi.fn().mockResolvedValue('/mock/path/polkadot-extension'),
}))

vi.mock('../wallets/talisman.js', () => ({
  getTalismanExtensionPath: vi.fn().mockResolvedValue('/mock/path/talisman-extension'),
}))

vi.mock('../wallets/metamask.js', () => ({
  getMetaMaskExtensionPath: vi.fn().mockResolvedValue('/mock/path/metamask-extension'),
}))

// Mock wallet factories
vi.mock('./wallet-factory.js', () => ({
  walletFactories: {
    'polkadot-js': vi.fn().mockReturnValue({ type: 'polkadot-js' }),
    'talisman': vi.fn().mockReturnValue({ type: 'talisman' }),
    'metamask': vi.fn().mockReturnValue({ type: 'metamask' }),
  },
}))

describe('context-playwright/index', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createWalletTest', () => {
    it('should create a test function', () => {
      const result = createWalletTest()

      expect(result).toBeDefined()
    })

    it('should accept empty options', () => {
      const result = createWalletTest({})

      expect(result).toBeDefined()
    })

    it('should accept headless option', () => {
      const result = createWalletTest({ headless: true })

      expect(result).toBeDefined()
    })

    it('should accept slowMo option', () => {
      const result = createWalletTest({ slowMo: 200 })

      expect(result).toBeDefined()
    })

    it('should accept single wallet configuration', () => {
      const result = createWalletTest({
        wallets: [{ type: 'polkadot-js' }],
      })

      expect(result).toBeDefined()
    })

    it('should accept talisman wallet configuration', () => {
      const result = createWalletTest({
        wallets: [{ type: 'talisman' }],
      })

      expect(result).toBeDefined()
    })

    it('should accept multi-wallet configuration', () => {
      const result = createWalletTest({
        wallets: [
          { type: 'polkadot-js' },
          { type: 'talisman' },
        ],
      })

      expect(result).toBeDefined()
    })

    it('should accept all options combined', () => {
      const result = createWalletTest({
        headless: true,
        slowMo: 100,
        wallets: [{ type: 'polkadot-js' }],
      })

      expect(result).toBeDefined()
    })

    it('should default to polkadot-js when wallets array is empty', () => {
      const result = createWalletTest({
        wallets: [],
      })

      expect(result).toBeDefined()
    })

  })
})
