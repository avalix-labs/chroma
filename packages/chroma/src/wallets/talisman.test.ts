import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getTalismanExtensionPath,
  TALISMAN_CONFIG,
} from './talisman.js'

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

describe('talisman wallet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('talisman_config', () => {
    it('should have correct extension name format', () => {
      expect(TALISMAN_CONFIG.extensionName).toMatch(/^talisman-extension-\d+\.\d+\.\d+$/)
    })

    it('should have valid download URL', () => {
      expect(TALISMAN_CONFIG.downloadUrl).toContain('github.com')
      expect(TALISMAN_CONFIG.downloadUrl).toContain('talisman')
      expect(TALISMAN_CONFIG.downloadUrl.endsWith('.zip')).toBe(true)
    })
  })

  describe('getTalismanExtensionPath', () => {
    const mockReaddir = () => vi.mocked(fs.promises.readdir) as unknown as ReturnType<typeof vi.fn>

    it('should return extension path when extension exists', async () => {
      mockReaddir().mockResolvedValueOnce(['manifest.json'])

      const result = await getTalismanExtensionPath()

      expect(result).toContain('.chroma')
      expect(result).toContain(TALISMAN_CONFIG.extensionName)
      expect(fs.promises.readdir).toHaveBeenCalled()
    })

    it('should throw error when extension directory does not exist', async () => {
      mockReaddir().mockRejectedValueOnce(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))

      await expect(getTalismanExtensionPath()).rejects.toThrow(
        'Talisman extension not found',
      )
    })

    it('should throw error when extension directory is empty', async () => {
      mockReaddir().mockResolvedValueOnce([])

      await expect(getTalismanExtensionPath()).rejects.toThrow(
        'Talisman extension not found',
      )
    })

    it('should include download instructions in error message', async () => {
      mockReaddir().mockRejectedValueOnce(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))

      await expect(getTalismanExtensionPath()).rejects.toThrow(
        'npx @avalix/chroma download-extensions',
      )
    })

    it('should use correct path structure', async () => {
      mockReaddir().mockResolvedValueOnce(['manifest.json'])

      const result = await getTalismanExtensionPath()

      const expectedPath = path.join(process.cwd(), '.chroma', TALISMAN_CONFIG.extensionName)
      expect(result).toBe(expectedPath)
    })
  })
})
