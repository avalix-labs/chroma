#!/usr/bin/env node

import process from 'node:process'

const command = process.argv[2]

if (command === 'download-extensions') {
  // Pre-built by tsdown from scripts/download-extensions.ts; runs on import
  await import('../dist/download-extensions.mjs')
}
else {
  console.log('Unknown command:', command)
  console.log('\nAvailable commands:')
  console.log('  download-extensions [--wallets <names>] - Download wallet extensions for testing')
  console.log('    --wallets  Comma-separated list of wallets to download (default: all)')
  console.log('               e.g. --wallets metamask,talisman')
  process.exit(1)
}
