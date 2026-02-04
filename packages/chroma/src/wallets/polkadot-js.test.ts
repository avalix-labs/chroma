import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getPolkadotJSExtensionPath,
  POLKADOT_JS_CONFIG,
} from './polkadot-js.js'

// Mock node:fs module
vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs')
  return {
    ...actual,
    default: {
      ...actual,
      existsSync: vi.fn(),
      readdirSync: vi.fn(),
    },
    existsSync: vi.fn(),
    readdirSync: vi.fn(),
  }
})

describe('polkadot-js wallet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('polkadot_js_config', () => {
    it('should have correct extension name format', () => {
      expect(POLKADOT_JS_CONFIG.extensionName).toMatch(/^polkadot-extension-\d+\.\d+\.\d+$/)
    })

    it('should have valid download URL', () => {
      expect(POLKADOT_JS_CONFIG.downloadUrl).toContain('github.com')
      expect(POLKADOT_JS_CONFIG.downloadUrl).toContain('polkadot-js/extension')
      expect(POLKADOT_JS_CONFIG.downloadUrl.endsWith('.zip')).toBe(true)
    })
  })

  describe('getPolkadotJSExtensionPath', () => {
    it('should return extension path when extension exists', async () => {
      const mockedFs = vi.mocked(fs)
      mockedFs.existsSync.mockReturnValue(true)
      mockedFs.readdirSync.mockReturnValue(['manifest.json'] as any)

      const result = await getPolkadotJSExtensionPath()

      expect(result).toContain('.chroma')
      expect(result).toContain(POLKADOT_JS_CONFIG.extensionName)
      expect(mockedFs.existsSync).toHaveBeenCalled()
    })

    it('should throw error when extension directory does not exist', async () => {
      const mockedFs = vi.mocked(fs)
      mockedFs.existsSync.mockReturnValue(false)

      await expect(getPolkadotJSExtensionPath()).rejects.toThrow(
        'Polkadot-JS extension not found',
      )
    })

    it('should throw error when extension directory is empty', async () => {
      const mockedFs = vi.mocked(fs)
      mockedFs.existsSync.mockReturnValue(true)
      mockedFs.readdirSync.mockReturnValue([])

      await expect(getPolkadotJSExtensionPath()).rejects.toThrow(
        'Polkadot-JS extension not found',
      )
    })

    it('should include download instructions in error message', async () => {
      const mockedFs = vi.mocked(fs)
      mockedFs.existsSync.mockReturnValue(false)

      await expect(getPolkadotJSExtensionPath()).rejects.toThrow(
        'npx @avalix/chroma download-extensions',
      )
    })

    it('should use correct path structure', async () => {
      const mockedFs = vi.mocked(fs)
      mockedFs.existsSync.mockReturnValue(true)
      mockedFs.readdirSync.mockReturnValue(['manifest.json'] as any)

      const result = await getPolkadotJSExtensionPath()

      const expectedPath = path.join(process.cwd(), '.chroma', POLKADOT_JS_CONFIG.extensionName)
      expect(result).toBe(expectedPath)
    })
  })
})
