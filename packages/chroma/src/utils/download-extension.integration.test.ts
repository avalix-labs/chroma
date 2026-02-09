import type { DownloadExtensionOptions } from './download-extension.js'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { downloadAndExtractExtension } from './download-extension.js'

/**
 * Integration Tests (real download) - Requires network
 * Tests actual download and extraction with real extension files
 *
 * Important test cases:
 * - Nested zip extraction (Talisman has a zip inside a zip)
 * - Standard zip extraction (Polkadot-JS)
 * - Standard zip extraction (MetaMask)
 * - Skip download if already exists
 * - Error handling for invalid URLs
 */
describe('downloadAndExtractExtension (integration tests)', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `chroma-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    await fs.promises.mkdir(tempDir, { recursive: true })
  })

  afterEach(async () => {
    if (tempDir && fs.existsSync(tempDir)) {
      await fs.promises.rm(tempDir, { recursive: true, force: true })
    }
  })

  it('should handle nested zip extraction (Talisman)', async () => {
    // Talisman extension has a nested zip structure
    const VERSION = '3.1.13'
    const options: DownloadExtensionOptions = {
      downloadUrl: `https://github.com/avalix-labs/polkadot-wallets/raw/refs/heads/main/talisman/talisman-${VERSION}.zip`,
      extensionName: `talisman-extension-${VERSION}`,
      targetDir: tempDir,
    }

    const result = await downloadAndExtractExtension(options)

    expect(result).toBe(path.join(tempDir, `talisman-extension-${VERSION}`))
    expect(fs.existsSync(result)).toBe(true)

    // Talisman should have manifest.json after nested extraction
    const files = await fs.promises.readdir(result)
    expect(files).toContain('manifest.json')
  }, 60000)

  it('should handle standard zip extraction (Polkadot-JS)', async () => {
    const VERSION = '0.62.6'
    const options: DownloadExtensionOptions = {
      downloadUrl: `https://github.com/polkadot-js/extension/releases/download/v${VERSION}/master-chrome-build.zip`,
      extensionName: `polkadot-extension-${VERSION}`,
      targetDir: tempDir,
    }

    const result = await downloadAndExtractExtension(options)

    expect(result).toBe(path.join(tempDir, `polkadot-extension-${VERSION}`))
    expect(fs.existsSync(result)).toBe(true)

    const files = await fs.promises.readdir(result)
    expect(files).toContain('manifest.json')
  }, 60000)

  it('should handle standard zip extraction (MetaMask)', async () => {
    const VERSION = '13.17.0'
    const options: DownloadExtensionOptions = {
      downloadUrl: `https://github.com/MetaMask/metamask-extension/releases/download/v${VERSION}/metamask-chrome-${VERSION}.zip`,
      extensionName: `metamask-extension-${VERSION}`,
      targetDir: tempDir,
    }

    const result = await downloadAndExtractExtension(options)

    expect(result).toBe(path.join(tempDir, `metamask-extension-${VERSION}`))
    expect(fs.existsSync(result)).toBe(true)

    const files = await fs.promises.readdir(result)
    expect(files).toContain('manifest.json')
  }, 60000)

  it('should skip download if extension already exists', async () => {
    const extensionDir = path.join(tempDir, 'existing-extension')
    await fs.promises.mkdir(extensionDir, { recursive: true })
    await fs.promises.writeFile(path.join(extensionDir, 'manifest.json'), '{"name": "test"}')

    const options: DownloadExtensionOptions = {
      downloadUrl: 'https://example.com/should-not-be-called.zip',
      extensionName: 'existing-extension',
      targetDir: tempDir,
    }

    const result = await downloadAndExtractExtension(options)

    expect(result).toBe(extensionDir)
  })

  it('should throw error for invalid URL', async () => {
    const options: DownloadExtensionOptions = {
      downloadUrl: 'https://github.com/invalid-user-12345/nonexistent-repo/releases/download/v0.0.0/nonexistent.zip',
      extensionName: 'invalid-extension',
      targetDir: tempDir,
    }

    await expect(downloadAndExtractExtension(options)).rejects.toThrow(
      /Failed to download\/extract invalid-extension/,
    )
  }, 15000)
})
