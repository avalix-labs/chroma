#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { downloadAndExtractExtension } from '../src/utils/download-extension.js'
import { METAMASK_CONFIG } from '../src/wallets/metamask.js'
import { POLKADOT_JS_CONFIG } from '../src/wallets/polkadot-js.js'
import { TALISMAN_CONFIG } from '../src/wallets/talisman.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function getVersion(): Promise<string> {
  const packageJsonPath = path.resolve(__dirname, '../package.json')
  const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf-8'))
  return packageJson.version
}

async function clearChromaDir(): Promise<void> {
  const chromaDir = path.resolve(process.cwd(), '.chroma')
  console.log('🗑️ Clearing existing .chroma directory...')
  await fs.promises.rm(chromaDir, { recursive: true, force: true })
}

async function main() {
  const version = await getVersion()
  console.log(`\n🎨 Chroma v${version}`)
  console.log('🚀 Downloading wallet extensions...')

  try {
    // Clear existing .chroma directory
    await clearChromaDir()

    // Download all extensions in parallel — they're independent network ops
    await Promise.all([
      downloadAndExtractExtension({
        downloadUrl: POLKADOT_JS_CONFIG.downloadUrl,
        extensionName: POLKADOT_JS_CONFIG.extensionName,
      }),
      downloadAndExtractExtension({
        downloadUrl: TALISMAN_CONFIG.downloadUrl,
        extensionName: TALISMAN_CONFIG.extensionName,
      }),
      downloadAndExtractExtension({
        downloadUrl: METAMASK_CONFIG.downloadUrl,
        extensionName: METAMASK_CONFIG.extensionName,
      }),
    ])

    console.log('\n✅ All extensions downloaded successfully!')
    console.log('You can now run your Playwright tests.')
  }
  catch (error) {
    console.error('\n❌ Failed to download extensions:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

main()
