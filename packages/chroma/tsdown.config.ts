import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/index.ts'],
  platform: 'node',
  external: [
    '@playwright/test',
    'node:fs',
    'node:path', 
    'node:stream/promises',
    'unzipper'
  ],
  dts: {
    oxc: true,
  },
})
