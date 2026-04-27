import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getMetaMaskExtensionPath,
  METAMASK_CONFIG,
} from './metamask.js'

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

describe('metamask wallet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('metamask_config', () => {
    it('should have correct extension name format', () => {
      expect(METAMASK_CONFIG.extensionName).toMatch(/^metamask-extension-\d+\.\d+\.\d+$/)
    })

    it('should have valid download URL', () => {
      expect(METAMASK_CONFIG.downloadUrl).toContain('github.com')
      expect(METAMASK_CONFIG.downloadUrl).toContain('metamask')
      expect(METAMASK_CONFIG.downloadUrl.endsWith('.zip')).toBe(true)
    })
  })

  describe('getMetaMaskExtensionPath', () => {
    const mockReaddir = () => vi.mocked(fs.promises.readdir) as unknown as ReturnType<typeof vi.fn>

    it('should return extension path when extension exists', async () => {
      mockReaddir().mockResolvedValueOnce(['manifest.json'])

      const result = await getMetaMaskExtensionPath()

      expect(result).toContain('.chroma')
      expect(result).toContain(METAMASK_CONFIG.extensionName)
      expect(fs.promises.readdir).toHaveBeenCalled()
    })

    it('should throw error when extension directory does not exist', async () => {
      mockReaddir().mockRejectedValueOnce(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))

      await expect(getMetaMaskExtensionPath()).rejects.toThrow(
        'MetaMask extension not found',
      )
    })

    it('should throw error when extension directory is empty', async () => {
      mockReaddir().mockResolvedValueOnce([])

      await expect(getMetaMaskExtensionPath()).rejects.toThrow(
        'MetaMask extension not found',
      )
    })

    it('should include download instructions in error message', async () => {
      mockReaddir().mockRejectedValueOnce(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))

      await expect(getMetaMaskExtensionPath()).rejects.toThrow(
        'npx @avalix/chroma download-extensions',
      )
    })

    it('should use correct path structure', async () => {
      mockReaddir().mockResolvedValueOnce(['manifest.json'])

      const result = await getMetaMaskExtensionPath()

      const expectedPath = path.join(process.cwd(), '.chroma', METAMASK_CONFIG.extensionName)
      expect(result).toBe(expectedPath)
    })
  })
})
