#!/usr/bin/env node

import { spawn } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const command = process.argv[2]

if (command === 'download-extensions') {
  const scriptPath = path.join(__dirname, 'download-extensions.ts')

  // Use tsx to run TypeScript file
  const child = spawn('npx', ['tsx', scriptPath], {
    stdio: 'inherit',
    shell: true,
  })

  child.on('exit', (code) => {
    process.exit(code || 0)
  })
}
else {
  console.log('Unknown command:', command)
  console.log('\nAvailable commands:')
  console.log('  download-extensions - Download wallet extensions for testing')
  process.exit(1)
}
