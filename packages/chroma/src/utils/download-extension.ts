import fs, { createWriteStream } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { pipeline } from 'node:stream/promises'
import { Extract } from 'unzipper'

export interface DownloadExtensionOptions {
  downloadUrl: string
  extensionName: string
  targetDir?: string
}

export async function downloadAndExtractExtension(options: DownloadExtensionOptions): Promise<string> {
  const { downloadUrl, extensionName, targetDir } = options

  // Default to a directory in the user's project, not relative to this package
  const extensionsDir = targetDir || path.resolve(process.cwd(), '.chroma')
  const extensionDir = path.join(extensionsDir, extensionName)
  const zipPath = path.join(extensionsDir, `${extensionName}.zip`)

  // Create extensions directory if it doesn't exist
  await fs.promises.mkdir(extensionsDir, { recursive: true })

  // Check if extension is already downloaded and extracted
  if (fs.existsSync(extensionDir) && fs.readdirSync(extensionDir).length > 0) {
    console.log(`✅ ${extensionName} already exists at:`, extensionDir)
    return extensionDir
  }

  try {
    console.log(`📥 Downloading ${extensionName}...`)

    // Download the ZIP file
    const response = await fetch(downloadUrl)
    if (!response.ok) {
      throw new Error(`Failed to download extension: ${response.status} ${response.statusText}`)
    }

    // Save ZIP file
    const writeStream = createWriteStream(zipPath)
    await pipeline(response.body!, writeStream)

    console.log('📦 Extracting extension...')

    // Standard zip extraction
    await pipeline(
      fs.createReadStream(zipPath),
      Extract({ path: extensionDir }),
    )

    // Clean up ZIP file
    await fs.promises.unlink(zipPath)

    console.log(`✅ ${extensionName} downloaded and extracted to:`, extensionDir)
    return extensionDir
  }
  catch (error) {
    // Clean up on error
    if (fs.existsSync(zipPath)) {
      await fs.promises.unlink(zipPath).catch(() => {})
    }
    if (fs.existsSync(extensionDir)) {
      await fs.promises.rm(extensionDir, { recursive: true, force: true }).catch(() => {})
    }

    throw new Error(`Failed to download/extract ${extensionName}: ${error instanceof Error ? error.message : String(error)}`)
  }
}
