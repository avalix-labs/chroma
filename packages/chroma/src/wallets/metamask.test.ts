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
      existsSync: vi.fn(),
      readdirSync: vi.fn(),
    },
    existsSync: vi.fn(),
    readdirSync: vi.fn(),
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
    it('should return extension path when extension exists', async () => {
      const mockedFs = vi.mocked(fs)
      mockedFs.existsSync.mockReturnValue(true)
      mockedFs.readdirSync.mockReturnValue(['manifest.json'] as any)

      const result = await getMetaMaskExtensionPath()

      expect(result).toContain('.chroma')
      expect(result).toContain(METAMASK_CONFIG.extensionName)
      expect(mockedFs.existsSync).toHaveBeenCalled()
    })

    it('should throw error when extension directory does not exist', async () => {
      const mockedFs = vi.mocked(fs)
      mockedFs.existsSync.mockReturnValue(false)

      await expect(getMetaMaskExtensionPath()).rejects.toThrow(
        'MetaMask extension not found',
      )
    })

    it('should throw error when extension directory is empty', async () => {
      const mockedFs = vi.mocked(fs)
      mockedFs.existsSync.mockReturnValue(true)
      mockedFs.readdirSync.mockReturnValue([])

      await expect(getMetaMaskExtensionPath()).rejects.toThrow(
        'MetaMask extension not found',
      )
    })

    it('should include download instructions in error message', async () => {
      const mockedFs = vi.mocked(fs)
      mockedFs.existsSync.mockReturnValue(false)

      await expect(getMetaMaskExtensionPath()).rejects.toThrow(
        'npx @avalix/chroma download-extensions',
      )
    })

    it('should use correct path structure', async () => {
      const mockedFs = vi.mocked(fs)
      mockedFs.existsSync.mockReturnValue(true)
      mockedFs.readdirSync.mockReturnValue(['manifest.json'] as any)

      const result = await getMetaMaskExtensionPath()

      const expectedPath = path.join(process.cwd(), '.chroma', METAMASK_CONFIG.extensionName)
      expect(result).toBe(expectedPath)
    })
  })
})
