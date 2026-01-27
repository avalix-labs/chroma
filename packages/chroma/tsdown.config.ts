import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/index.ts'],
  platform: 'node',
  // Disable failing build on warnings (playwright dependency warning is expected)
  failOnWarn: false,
  external: [
    '@playwright/test',
    'playwright',
    'playwright-core',
    'node:fs',
    'node:path',
    'node:stream/promises',
    'unzipper',
  ],
  dts: {
    // oxc: true, // Disabled to avoid isolatedDeclarations requirement
  },
})
