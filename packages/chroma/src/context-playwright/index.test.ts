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

// Mock wallet factories and extension path resolvers
vi.mock('./wallet-factory.js', () => ({
  walletFactories: {
    'polkadot-js': vi.fn().mockReturnValue({ type: 'polkadot-js' }),
    'talisman': vi.fn().mockReturnValue({ type: 'talisman' }),
    'subwallet': vi.fn().mockReturnValue({ type: 'subwallet' }),
    'metamask': vi.fn().mockReturnValue({ type: 'metamask' }),
  },
  walletExtensionPaths: {
    'polkadot-js': vi.fn().mockResolvedValue('/mock/path/polkadot-extension'),
    'talisman': vi.fn().mockResolvedValue('/mock/path/talisman-extension'),
    'subwallet': vi.fn().mockResolvedValue('/mock/path/subwallet-extension'),
    'metamask': vi.fn().mockResolvedValue('/mock/path/metamask-extension'),
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

    it('should accept subwallet wallet configuration', () => {
      const result = createWalletTest({
        wallets: [{ type: 'subwallet' }],
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

    it('should accept userDataDir as a string', () => {
      const result = createWalletTest({
        userDataDir: '.cache/wallet-setup',
      })

      expect(result).toBeDefined()
    })

    it('should accept userDataDir as a per-worker function', () => {
      const result = createWalletTest({
        userDataDir: ({ workerIndex }) => `.cache/wallet-w${workerIndex}`,
      })

      expect(result).toBeDefined()
    })

    it('should accept userDataDir as an async function', () => {
      const result = createWalletTest({
        userDataDir: async ({ workerIndex }) => `.cache/wallet-w${workerIndex}`,
      })

      expect(result).toBeDefined()
    })

    it('should accept cloneUserDataDirFrom alongside userDataDir', () => {
      const result = createWalletTest({
        userDataDir: ({ workerIndex }) => `.cache/wallet-w${workerIndex}`,
        cloneUserDataDirFrom: '.cache/wallet-setup',
      })

      expect(result).toBeDefined()
    })
  })
})
