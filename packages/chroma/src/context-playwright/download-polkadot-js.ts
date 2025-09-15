import fs, { createWriteStream } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { pipeline } from 'node:stream/promises'
import { Extract } from 'unzipper'

// https://github.com/polkadot-js/extension/releases
const POLKADOT_JS_EXTENSION = 'https://github.com/polkadot-js/extension/releases/download/v0.61.7/master-chrome-build.zip'

export async function downloadAndExtractPolkadotExtension(targetDir?: string): Promise<string> {
  // Default to a directory in the user's project, not relative to this package
  const extensionsDir = targetDir || path.resolve(process.cwd(), 'node_modules/.chroma')
  const extensionDir = path.join(extensionsDir, 'polkadot-extension-chrome')
  const zipPath = path.join(extensionsDir, 'polkadot-extension.zip')

  // Create extensions directory if it doesn't exist
  await fs.promises.mkdir(extensionsDir, { recursive: true })

  // Check if extension is already downloaded and extracted
  if (fs.existsSync(extensionDir) && fs.readdirSync(extensionDir).length > 0) {
    console.log('✅ Polkadot extension already exists at:', extensionDir)
    return extensionDir
  }

  try {
    console.log('📥 Downloading Polkadot JS extension...')

    // Download the ZIP file
    const response = await fetch(POLKADOT_JS_EXTENSION)
    if (!response.ok) {
      throw new Error(`Failed to download extension: ${response.status} ${response.statusText}`)
    }

    // Save ZIP file
    const writeStream = createWriteStream(zipPath)
    await pipeline(response.body!, writeStream)

    console.log('📦 Extracting extension...')

    // Extract ZIP file
    await pipeline(
      fs.createReadStream(zipPath),
      Extract({ path: extensionDir }),
    )

    // Clean up ZIP file
    await fs.promises.unlink(zipPath)

    console.log('✅ Polkadot extension downloaded and extracted to:', extensionDir)
    return extensionDir
  }
  catch (error) {
    // Clean up on error
    if (fs.existsSync(zipPath)) {
      await fs.promises.unlink(zipPath).catch(() => {})
    }
    if (fs.existsSync(extensionDir)) {
      await fs.promises.rmdir(extensionDir, { recursive: true }).catch(() => {})
    }

    throw new Error(`Failed to download/extract Polkadot extension: ${error instanceof Error ? error.message : String(error)}`)
  }
}
