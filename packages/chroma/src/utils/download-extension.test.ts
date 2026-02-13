import type { Mock } from 'vitest'
import type { DownloadExtensionOptions } from './download-extension.js'
import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadAndExtractExtension } from './download-extension.js'

/**
 * Unit Tests (with mocks) - Fast, no network required
 * Tests error handling, cleanup logic, and path resolution
 */

// Mock adm-zip
const mockExtractAllTo = vi.fn()
vi.mock('adm-zip', () => {
  const MockAdmZip = vi.fn(function (this: any) {
    this.extractAllTo = mockExtractAllTo
  })
  return { default: MockAdmZip }
})

// Mock fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Mock stream/promises pipeline
vi.mock('node:stream/promises', () => ({
  pipeline: vi.fn().mockResolvedValue(undefined),
}))

// Mock fs module
// - `fs.existsSync`, `fs.readdirSync`, `fs.promises.*` are accessed via the default import
// - `createWriteStream` is accessed as a named import
vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs')
  return {
    ...actual,
    default: {
      ...actual,
      existsSync: vi.fn(),
      readdirSync: vi.fn(),
      promises: {
        mkdir: vi.fn().mockResolvedValue(undefined),
        rm: vi.fn().mockResolvedValue(undefined),
        rename: vi.fn().mockResolvedValue(undefined),
        unlink: vi.fn().mockResolvedValue(undefined),
        readdir: vi.fn().mockResolvedValue([]),
        stat: vi.fn().mockResolvedValue({ isDirectory: () => true }),
      },
    },
    createWriteStream: vi.fn().mockReturnValue({
      on: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
    }),
  }
})

describe('downloadAndExtractExtension (unit tests)', () => {
  const mockOptions: DownloadExtensionOptions = {
    downloadUrl: 'https://example.com/extension.zip',
    extensionName: 'test-extension',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('when extension already exists', () => {
    it('should skip download and return existing path', async () => {
      const mockedFs = vi.mocked(fs)
      mockedFs.existsSync.mockReturnValue(true)
      mockedFs.readdirSync.mockReturnValue(['manifest.json'] as any)

      const result = await downloadAndExtractExtension(mockOptions)

      expect(result).toContain('test-extension')
      expect(mockFetch).not.toHaveBeenCalled()
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('already exists'),
        expect.any(String),
      )
    })
  })

  describe('when extension does not exist', () => {
    beforeEach(() => {
      const mockedFs = vi.mocked(fs)
      mockedFs.existsSync.mockReturnValue(false)
      mockedFs.readdirSync.mockReturnValue([])
    })

    it('should throw error when download fails with bad status', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      await expect(downloadAndExtractExtension(mockOptions)).rejects.toThrow(
        'Failed to download/extract test-extension',
      )
    })

    it('should throw error when fetch throws network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      await expect(downloadAndExtractExtension(mockOptions)).rejects.toThrow(
        'Failed to download/extract test-extension: Network error',
      )
    })

    it('should cleanup files on error', async () => {
      const mockedFs = vi.mocked(fs)

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      mockedFs.existsSync.mockImplementation((p: fs.PathLike) => {
        const pathStr = p.toString()
        if (pathStr.endsWith('test-extension') && !pathStr.includes('.zip')) {
          return false
        }
        return true
      })

      await expect(downloadAndExtractExtension(mockOptions)).rejects.toThrow()

      expect(mockedFs.promises.rm).toHaveBeenCalled()
    })
  })

  describe('successful download and extraction', () => {
    beforeEach(() => {
      const mockedFs = vi.mocked(fs)
      mockedFs.existsSync.mockReturnValue(false)
      mockedFs.readdirSync.mockReturnValue([])

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        body: new ReadableStream(),
      })
    })

    it('should extract and return correct path', async () => {
      const mockedFs = vi.mocked(fs)
      const mockReaddir = mockedFs.promises.readdir as unknown as Mock

      mockReaddir.mockResolvedValue(['manifest.json', 'popup.html'])

      const result = await downloadAndExtractExtension({
        ...mockOptions,
        targetDir: '/tmp/test',
      })

      expect(result).toBe(path.join('/tmp/test', 'test-extension'))

      // AdmZip called once for extraction
      const AdmZip = (await import('adm-zip')).default
      expect(AdmZip).toHaveBeenCalledTimes(1)
    })

    it('should unwrap single wrapper directory', async () => {
      const mockedFs = vi.mocked(fs)
      const mockReaddir = mockedFs.promises.readdir as unknown as Mock
      const mockStat = mockedFs.promises.stat as unknown as Mock

      // readdir returns a single directory -> unwrap
      mockReaddir.mockResolvedValue(['extension-folder'])
      mockStat.mockResolvedValue({ isDirectory: () => true })

      const result = await downloadAndExtractExtension({
        ...mockOptions,
        targetDir: '/tmp/test',
      })

      expect(result).toBe(path.join('/tmp/test', 'test-extension'))

      // Should rename the subdirectory (unwrap) and clean up source
      expect(mockedFs.promises.rename).toHaveBeenCalledWith(
        expect.stringContaining('extension-folder'),
        expect.stringContaining('test-extension'),
      )
      expect(mockedFs.promises.rm).toHaveBeenCalledWith(
        expect.stringContaining('test-extension-temp'),
        expect.objectContaining({ recursive: true, force: true }),
      )
    })

    it('should not unwrap when single entry is a file', async () => {
      const mockedFs = vi.mocked(fs)
      const mockReaddir = mockedFs.promises.readdir as unknown as Mock
      const mockStat = mockedFs.promises.stat as unknown as Mock

      mockReaddir.mockResolvedValue(['only-file.dat'])
      mockStat.mockResolvedValue({ isDirectory: () => false })

      const result = await downloadAndExtractExtension({
        ...mockOptions,
        targetDir: '/tmp/test',
      })

      expect(result).toBe(path.join('/tmp/test', 'test-extension'))

      // Should rename the temp dir directly (no unwrap)
      expect(mockedFs.promises.rename).toHaveBeenCalledWith(
        expect.stringContaining('test-extension-temp'),
        expect.stringContaining('test-extension'),
      )
    })
  })

  describe('targetDir option', () => {
    it('should use custom targetDir when provided', async () => {
      const mockedFs = vi.mocked(fs)
      mockedFs.existsSync.mockReturnValue(true)
      mockedFs.readdirSync.mockReturnValue(['manifest.json'] as any)

      const customOptions: DownloadExtensionOptions = {
        ...mockOptions,
        targetDir: '/custom/path',
      }

      const result = await downloadAndExtractExtension(customOptions)

      expect(result).toBe(path.join('/custom/path', 'test-extension'))
    })

    it('should use default .chroma directory when targetDir not provided', async () => {
      const mockedFs = vi.mocked(fs)
      mockedFs.existsSync.mockReturnValue(true)
      mockedFs.readdirSync.mockReturnValue(['manifest.json'] as any)

      const result = await downloadAndExtractExtension(mockOptions)

      expect(result).toContain('.chroma')
      expect(result).toContain('test-extension')
    })
  })
})
