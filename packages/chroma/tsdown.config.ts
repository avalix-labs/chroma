import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    'index': './src/index.ts',
    'download-extensions': './scripts/download-extensions.ts',
  },
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
  ],
  dts: {},
})
