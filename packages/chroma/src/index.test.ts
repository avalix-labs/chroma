import { describe, expect, it, vi } from 'vitest'

// Mock playwright before importing
vi.mock('@playwright/test', () => ({
  test: {
    extend: vi.fn().mockReturnValue({}),
  },
  chromium: {
    launchPersistentContext: vi.fn(),
  },
  expect: vi.fn(),
}))

vi.mock('./wallets/polkadot-js.js', () => ({
  getPolkadotJSExtensionPath: vi.fn().mockResolvedValue('/mock/path'),
}))

vi.mock('./wallets/talisman.js', () => ({
  getTalismanExtensionPath: vi.fn().mockResolvedValue('/mock/path'),
}))

vi.mock('./context-playwright/wallet-factory.js', () => ({
  walletFactories: {
    'polkadot-js': vi.fn(),
    'talisman': vi.fn(),
  },
}))

describe('index exports', () => {
  it('should export createWalletTest function', async () => {
    const { createWalletTest } = await import('./index.js')
    expect(createWalletTest).toBeDefined()
    expect(typeof createWalletTest).toBe('function')
  })

  it('should export test function', async () => {
    const { test } = await import('./index.js')
    expect(test).toBeDefined()
  })

  it('should export expect function', async () => {
    const { expect: playwrightExpect } = await import('./index.js')
    expect(playwrightExpect).toBeDefined()
  })

  it('should be able to call createWalletTest', async () => {
    const { createWalletTest } = await import('./index.js')
    const result = createWalletTest()
    expect(result).toBeDefined()
  })

  it('should be able to call createWalletTest with options', async () => {
    const { createWalletTest } = await import('./index.js')
    const result = createWalletTest({ headless: true })
    expect(result).toBeDefined()
  })
})
