#!/usr/bin/env node
import process from 'node:process'
import { downloadAndExtractExtension } from '../src/utils/download-extension.js'
import { POLKADOT_JS_CONFIG } from '../src/wallets/polkadot-js.js'
import { TALISMAN_CONFIG } from '../src/wallets/talisman.js'

async function main() {
  console.log('🚀 Downloading Chroma wallet extensions...\n')

  try {
    // Download Polkadot-JS extension
    await downloadAndExtractExtension({
      downloadUrl: POLKADOT_JS_CONFIG.downloadUrl,
      extensionName: POLKADOT_JS_CONFIG.extensionName,
    })

    // Download Talisman extension
    await downloadAndExtractExtension({
      downloadUrl: TALISMAN_CONFIG.downloadUrl,
      extensionName: TALISMAN_CONFIG.extensionName,
    })

    console.log('\n✅ All extensions downloaded successfully!')
    console.log('You can now run your Playwright tests.')
  }
  catch (error) {
    console.error('\n❌ Failed to download extensions:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

main()
