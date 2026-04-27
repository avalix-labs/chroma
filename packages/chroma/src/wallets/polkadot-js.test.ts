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
      promises: {
        ...actual.promises,
        readdir: vi.fn(),
      },
    },
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
    const mockReaddir = () => vi.mocked(fs.promises.readdir) as unknown as ReturnType<typeof vi.fn>

    it('should return extension path when extension exists', async () => {
      mockReaddir().mockResolvedValueOnce(['manifest.json'])

      const result = await getPolkadotJSExtensionPath()

      expect(result).toContain('.chroma')
      expect(result).toContain(POLKADOT_JS_CONFIG.extensionName)
      expect(fs.promises.readdir).toHaveBeenCalled()
    })

    it('should throw error when extension directory does not exist', async () => {
      mockReaddir().mockRejectedValueOnce(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))

      await expect(getPolkadotJSExtensionPath()).rejects.toThrow(
        'Polkadot-JS extension not found',
      )
    })

    it('should throw error when extension directory is empty', async () => {
      mockReaddir().mockResolvedValueOnce([])

      await expect(getPolkadotJSExtensionPath()).rejects.toThrow(
        'Polkadot-JS extension not found',
      )
    })

    it('should include download instructions in error message', async () => {
      mockReaddir().mockRejectedValueOnce(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))

      await expect(getPolkadotJSExtensionPath()).rejects.toThrow(
        'npx @avalix/chroma download-extensions',
      )
    })

    it('should use correct path structure', async () => {
      mockReaddir().mockResolvedValueOnce(['manifest.json'])

      const result = await getPolkadotJSExtensionPath()

      const expectedPath = path.join(process.cwd(), '.chroma', POLKADOT_JS_CONFIG.extensionName)
      expect(result).toBe(expectedPath)
    })
  })
})
