# @avalix/chroma

End-to-end testing library for Polkadot wallet interactions using Playwright.

## Documentation

We highly recommend you take a look at the [Chroma documentation](https://chroma-docs.up.railway.app/docs) to level up. It's a great resource for learning more about the library. It covers everything from getting started to advanced topics like CI/CD integration and Docker setup.

## Installation

```bash
npm install @avalix/chroma @playwright/test
```

**Note**: `@playwright/test` is a peer dependency and must be installed separately to avoid conflicts.

### Download Extensions

Before running your tests, you need to download the wallet extensions:

```bash
npx chroma download-extensions
```

This will download the wallet extensions (e.g. MetaMask, Polkadot JS, Talisman) to `./.chroma` directory in your project root.

**Tip**: Add this to your `package.json` scripts for convenience:

```json
{
  "scripts": {
    "test:prepare": "chroma download-extensions"
  }
}
```

**Important**: You must run this command before running Playwright tests. If the extension is not found, tests will fail with a helpful error message.

## Quick Start

```typescript
import { createWalletTest, expect } from '@avalix/chroma'

const test = createWalletTest({
  wallets: [{ type: 'metamask' }]
})

test('connect wallet and sign transaction', async ({ page, wallets }) => {
  const metamask = wallets.metamask

  await metamask.importSeedPhrase({
    seedPhrase: 'test test test test test test test test test test test junk'
  })

  await page.goto('http://localhost:3000')
  await page.click('button:has-text("Connect Wallet")')
  await metamask.authorize()

  await page.click('button:has-text("Send Transaction")')
  await metamask.confirm()

  await expect(page.locator('.transaction-success')).toBeVisible()
})
```

### Multiple Wallets

```typescript
import { createWalletTest } from '@avalix/chroma'

const test = createWalletTest({
  wallets: [{ type: 'metamask' }, { type: 'talisman' }]
})

test('multi-wallet test', async ({ page, wallets }) => {
  const metamask = wallets.metamask
  const talisman = wallets.talisman

  await metamask.importSeedPhrase({ seedPhrase: 'test test test test test test test test test test test junk' })
  await talisman.importEthPrivateKey({ privateKey: '0x...', name: 'Bob' })

  await page.goto('http://localhost:3000')
  await metamask.authorize()
})
```

### Setup Project Pattern

By default the browser context uses a temporary profile, so wallet state (imported accounts, unlocked passwords) is lost between runs. To import a seed phrase **once** and reuse the prepared state across all your specs, combine the `userDataDir` and `cloneUserDataDirFrom` options with [Playwright's setup project pattern](https://playwright.dev/docs/test-global-setup-teardown).

A setup project writes the prepared profile to a shared dir, and each test worker clones that dir to its own path before launching:

```typescript
// metamask.setup.ts
import { createWalletTest } from '@avalix/chroma'

const setupTest = createWalletTest({
  wallets: [{ type: 'metamask' }],
  userDataDir: '.cache/wallet-setup',
})

setupTest('seed metamask', async ({ wallets }) => {
  await wallets.metamask.importSeedPhrase({
    seedPhrase: 'test test test test test test test test test test test junk',
  })
})
```

```typescript
// fixtures.ts — shared by your spec files
import { createWalletTest } from '@avalix/chroma'

export const test = createWalletTest({
  wallets: [{ type: 'metamask' }],
  userDataDir: ({ workerIndex }) => `.cache/wallet-w${workerIndex}`,
  cloneUserDataDirFrom: '.cache/wallet-setup',
})
```

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'metamask',
      testMatch: /.*\.spec\.ts/,
      dependencies: ['setup'],
    },
  ],
})
```

The setup project runs once before any test, and each worker boots from a fresh copy of the prepared profile — so parallel workers stay isolated without re-importing the seed phrase per file.

## Features

- **Easy Extension Setup** - Download wallet extensions with a single command
- **Multi-Wallet Support** - Test with multiple wallet extensions simultaneously
- **TypeScript Support** - Full type safety and autocomplete
- **VS Code Integration** - Works with [Playwright Test for VS Code](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright)

## Requirements

- Node.js 24+
- @playwright/test ^1.55.0

## License

MIT
