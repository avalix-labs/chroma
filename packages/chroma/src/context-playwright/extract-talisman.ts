import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { pipeline } from 'node:stream/promises'
import { Extract } from 'unzipper'

export async function extractTalismanExtension(targetDir?: string): Promise<string> {
  // Default to a directory in the user's project, not relative to this package
  const extensionsDir = targetDir || path.resolve(process.cwd(), '.chroma')
  const extensionDir = path.join(extensionsDir, 'talisman-extension-chrome')

  // Path to the bundled Talisman extension zip file
  const zipPath = path.resolve(__dirname, '../src/talisman_extension_d7936c7d_chrome.zip')

  // Create extensions directory if it doesn't exist
  await fs.promises.mkdir(extensionsDir, { recursive: true })

  // Check if extension is already extracted
  if (fs.existsSync(extensionDir) && fs.readdirSync(extensionDir).length > 0) {
    console.log('✅ Talisman extension already exists at:', extensionDir)
    return extensionDir
  }

  try {
    console.log('📦 Extracting Talisman extension...')

    // Check if the zip file exists
    if (!fs.existsSync(zipPath)) {
      throw new Error(`Talisman extension zip file not found at: ${zipPath}`)
    }

    // Extract ZIP file
    await pipeline(
      fs.createReadStream(zipPath),
      Extract({ path: extensionDir }),
    )

    console.log('✅ Talisman extension extracted to:', extensionDir)
    return extensionDir
  }
  catch (error) {
    // Clean up on error
    if (fs.existsSync(extensionDir)) {
      await fs.promises.rmdir(extensionDir, { recursive: true }).catch(() => {})
    }

    throw new Error(`Failed to extract Talisman extension: ${error instanceof Error ? error.message : String(error)}`)
  }
}
