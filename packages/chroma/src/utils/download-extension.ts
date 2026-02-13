import fs, { createWriteStream } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { pipeline } from 'node:stream/promises'
import AdmZip from 'adm-zip'

export interface DownloadExtensionOptions {
  downloadUrl: string
  extensionName: string
  targetDir?: string
}

function unzipFile(zipPath: string, destDir: string): void {
  const zip = new AdmZip(zipPath)
  zip.extractAllTo(destDir, true)
}

/**
 * Move extracted contents to the final destination.
 * If the source directory contains a single subdirectory, unwrap it
 * (move the subdirectory contents up) so the extension files live
 * directly inside `destDir`.
 */
async function moveExtractedToFinal(sourceDir: string, destDir: string): Promise<void> {
  const entries = await fs.promises.readdir(sourceDir)

  if (entries.length === 1) {
    const singleEntry = path.join(sourceDir, entries[0])
    const stat = await fs.promises.stat(singleEntry)
    if (stat.isDirectory()) {
      // Unwrap: move the single subdirectory to the final destination
      await fs.promises.rename(singleEntry, destDir)
      await fs.promises.rm(sourceDir, { recursive: true, force: true })
      return
    }
  }

  // No unwrapping needed, just rename the whole directory
  await fs.promises.rename(sourceDir, destDir)
}

export async function downloadAndExtractExtension(options: DownloadExtensionOptions): Promise<string> {
  const { downloadUrl, extensionName, targetDir } = options

  // Default to a directory in the user's project, not relative to this package
  const extensionsDir = targetDir || path.resolve(process.cwd(), '.chroma')
  const extensionDir = path.join(extensionsDir, extensionName)
  const zipPath = path.join(extensionsDir, `${extensionName}.zip`)
  const tempExtractDir = path.join(extensionsDir, `${extensionName}-temp`)

  // Create extensions directory if it doesn't exist
  await fs.promises.mkdir(extensionsDir, { recursive: true })

  // Check if extension is already downloaded and extracted
  if (fs.existsSync(extensionDir) && fs.readdirSync(extensionDir).length > 0) {
    console.log(`✅ ${extensionName} already exists at:`, extensionDir)
    return extensionDir
  }

  try {
    console.log(`\n📥 Downloading ${extensionName}...`)

    // Download the ZIP file
    const response = await fetch(downloadUrl)
    if (!response.ok) {
      throw new Error(`Failed to download extension: ${response.status} ${response.statusText}`)
    }

    // Save ZIP file
    const writeStream = createWriteStream(zipPath)
    await pipeline(response.body!, writeStream)

    console.log('📦 Extracting extension...')

    // Extract to temp directory first
    await fs.promises.mkdir(tempExtractDir, { recursive: true })
    unzipFile(zipPath, tempExtractDir)

    // Move extracted contents to final destination (unwrapping single dir if needed)
    await moveExtractedToFinal(tempExtractDir, extensionDir)

    // Clean up ZIP file
    await fs.promises.unlink(zipPath)

    console.log(`✅ ${extensionName} downloaded and extracted to:`, extensionDir)
    return extensionDir
  }
  catch (error) {
    // Clean up on error
    for (const dir of [zipPath, extensionDir, tempExtractDir]) {
      if (fs.existsSync(dir)) {
        await fs.promises.rm(dir, { recursive: true, force: true }).catch(() => {})
      }
    }

    throw new Error(`Failed to download/extract ${extensionName}: ${error instanceof Error ? error.message : String(error)}`)
  }
}
