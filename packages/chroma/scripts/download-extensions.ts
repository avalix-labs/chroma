#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { downloadAndExtractExtension } from '../src/utils/download-extension.js'
import { parseWalletsFlag } from '../src/utils/parse-wallets-flag.js'
import { METAMASK_CONFIG } from '../src/wallets/metamask.js'
import { POLKADOT_JS_CONFIG } from '../src/wallets/polkadot-js.js'
import { TALISMAN_CONFIG } from '../src/wallets/talisman.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const WALLET_CONFIGS = {
  'polkadot-js': POLKADOT_JS_CONFIG,
  'talisman': TALISMAN_CONFIG,
  'metamask': METAMASK_CONFIG,
} as const

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

async function clearExtensionDirs(extensionNames: string[]): Promise<void> {
  const chromaDir = path.resolve(process.cwd(), '.chroma')
  console.log('🗑️ Clearing selected extensions from .chroma directory...')
  await Promise.all(extensionNames.map(name =>
    fs.promises.rm(path.join(chromaDir, name), { recursive: true, force: true }),
  ))
}

async function main() {
  const version = await getVersion()
  console.log(`\n🎨 Chroma v${version}`)

  try {
    const selected = parseWalletsFlag(process.argv.slice(2), Object.keys(WALLET_CONFIGS))
    const wallets = (selected ?? Object.keys(WALLET_CONFIGS)) as (keyof typeof WALLET_CONFIGS)[]
    const configs = wallets.map(wallet => WALLET_CONFIGS[wallet])

    console.log(`🚀 Downloading wallet extensions: ${wallets.join(', ')}...`)

    // Without a filter, wipe everything so stale extension versions don't pile up.
    // With a filter, only clear the selected wallets so the others stay usable.
    if (selected === null)
      await clearChromaDir()
    else
      await clearExtensionDirs(configs.map(config => config.extensionName))

    // Download all extensions in parallel — they're independent network ops
    await Promise.all(configs.map(config =>
      downloadAndExtractExtension({
        downloadUrl: config.downloadUrl,
        extensionName: config.extensionName,
      }),
    ))

    console.log('\n✅ All extensions downloaded successfully!')
    console.log('You can now run your Playwright tests.')
  }
  catch (error) {
    console.error('\n❌ Failed to download extensions:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

main()
