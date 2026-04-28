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
  await metamask.approve()

  await page.click('button:has-text("Send Transaction")')
  await metamask.approve()

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
  await metamask.approve()
})
```

### Setup Project Pattern

By default the browser context uses a temporary profile, so wallet state (imported accounts, passwords) is lost between runs. To import a seed phrase **once** and reuse the prepared state across all your specs, combine the `userDataDir` and `cloneUserDataDirFrom` options with [Playwright's setup project pattern](https://playwright.dev/docs/test-global-setup-teardown).

A setup project writes the prepared profile to a shared dir; spec projects then point a `userDataDir` at it (or clone it per worker for parallelism).

#### 1. Setup project — seed once

The setup test guards onboarding with a sentinel file so re-running `playwright test` doesn't try to onboard an already-prepared profile (the second run would deadlock on a UI that no longer matches the import flow). Delete `.cache/wallet-setup` to force a fresh seed.

```typescript
// metamask.setup.ts
import fs from 'node:fs'
import path from 'node:path'
import { createWalletTest } from '@avalix/chroma'

const SETUP_DIR = '.cache/wallet-setup'
const SENTINEL = path.join(SETUP_DIR, '.chroma-onboarded')

const setup = createWalletTest({
  wallets: [{ type: 'metamask' }],
  userDataDir: SETUP_DIR,
})

setup('seed metamask', async ({ wallets }) => {
  if (fs.existsSync(SENTINEL))
    return

  await wallets.metamask.importSeedPhrase({
    seedPhrase: 'test test test test test test test test test test test junk',
  })
  fs.writeFileSync(SENTINEL, '')
})
```

#### 2. Shared spec fixtures

Spec files import a shared `test` factory pointed at the prepared profile. Because MetaMask boots into a locked state on a previously-onboarded profile, each spec must call `wallets.metamask.unlock()` once (it's idempotent — when MetaMask is already unlocked the call is a no-op). On unlock, the MetaMask side panel is left open for the rest of the test session.

```typescript
// fixtures.ts — shared by your spec files
import { createWalletTest } from '@avalix/chroma'

export const test = createWalletTest({
  wallets: [{ type: 'metamask' }],
  userDataDir: '.cache/wallet-setup',
})

export { expect } from '@playwright/test'
```

```typescript
// some.spec.ts
import { test } from './fixtures'

test('connect and sign', async ({ page, wallets }) => {
  const metamask = wallets.metamask

  await page.goto('http://localhost:3000')
  await metamask.unlock()

  await page.click('button:has-text("Connect Wallet")')
  await metamask.approve()

  await page.click('button:has-text("Sign Message")')
  await metamask.approve()
})
```

#### 3. Wire up the projects

```typescript
// playwright.config.ts
export default defineConfig({
  workers: 1,
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

#### Parallel workers (advanced)

Chrome locks `userDataDir`, so multiple workers can't share the same path concurrently. Use `cloneUserDataDirFrom` plus a per-worker `userDataDir` to give each worker its own copy of the prepared profile:

```typescript
export const test = createWalletTest({
  wallets: [{ type: 'metamask' }],
  userDataDir: ({ workerIndex }) => `.cache/wallet-w${workerIndex}`,
  cloneUserDataDirFrom: '.cache/wallet-setup',
})
```

Set `workers: undefined` (or higher) once you've validated parallel runs in your project — interaction between cloned profiles, MetaMask's locked-state recovery, and Playwright's side-panel detection is still being hardened.

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
