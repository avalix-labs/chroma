import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getSubWalletExtensionPath,
  SUBWALLET_CONFIG,
} from './subwallet.js'

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

describe('subwallet wallet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('subwallet_config', () => {
    it('should have correct extension name format', () => {
      expect(SUBWALLET_CONFIG.extensionName).toMatch(/^subwallet-extension-\d+\.\d+\.\d+$/)
    })

    it('should have valid download URL', () => {
      expect(SUBWALLET_CONFIG.downloadUrl).toContain('github.com')
      expect(SUBWALLET_CONFIG.downloadUrl).toContain('SubWallet')
      expect(SUBWALLET_CONFIG.downloadUrl.endsWith('.zip')).toBe(true)
    })
  })

  describe('getSubWalletExtensionPath', () => {
    const mockReaddir = () => vi.mocked(fs.promises.readdir) as unknown as ReturnType<typeof vi.fn>

    it('should return extension path when extension exists', async () => {
      mockReaddir().mockResolvedValueOnce(['manifest.json'])

      const result = await getSubWalletExtensionPath()

      expect(result).toContain('.chroma')
      expect(result).toContain(SUBWALLET_CONFIG.extensionName)
      expect(fs.promises.readdir).toHaveBeenCalled()
    })

    it('should throw error when extension directory does not exist', async () => {
      mockReaddir().mockRejectedValueOnce(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))

      await expect(getSubWalletExtensionPath()).rejects.toThrow(
        'SubWallet extension not found',
      )
    })

    it('should throw error when extension directory is empty', async () => {
      mockReaddir().mockResolvedValueOnce([])

      await expect(getSubWalletExtensionPath()).rejects.toThrow(
        'SubWallet extension not found',
      )
    })

    it('should include download instructions in error message', async () => {
      mockReaddir().mockRejectedValueOnce(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))

      await expect(getSubWalletExtensionPath()).rejects.toThrow(
        'npx @avalix/chroma download-extensions',
      )
    })

    it('should use correct path structure', async () => {
      mockReaddir().mockResolvedValueOnce(['manifest.json'])

      const result = await getSubWalletExtensionPath()

      const expectedPath = path.join(process.cwd(), '.chroma', SUBWALLET_CONFIG.extensionName)
      expect(result).toBe(expectedPath)
    })
  })
})
