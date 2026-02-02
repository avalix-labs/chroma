# @avalix/chroma

End-to-end testing library for Polkadot wallet interactions using Playwright.

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

This will download the wallet extensions (Polkadot JS and Talisman) to `./.chroma` directory in your project root.

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
  wallets: [{ type: 'polkadot-js' }]
})

test('connect wallet and sign transaction', async ({ page, wallets }) => {
  const polkadotJs = wallets['polkadot-js']

  await polkadotJs.importMnemonic({
    seed: 'bottom drive obey lake curtain smoke basket hold race lonely fit walk',
    name: 'Test Account',
    password: 'securePassword123'
  })

  await page.goto('http://localhost:3000')
  await page.click('button:has-text("Connect Wallet")')
  await polkadotJs.authorize()

  await page.click('button:has-text("Send Transaction")')
  await polkadotJs.approveTx({ password: 'securePassword123' })

  await expect(page.locator('.transaction-success')).toBeVisible()
})
```

### Multiple Wallets

```typescript
import { createWalletTest } from '@avalix/chroma'

const test = createWalletTest({
  wallets: [{ type: 'polkadot-js' }, { type: 'talisman' }]
})

test('multi-wallet test', async ({ page, wallets }) => {
  const polkadotJs = wallets['polkadot-js']
  const talisman = wallets.talisman

  await polkadotJs.importMnemonic({ seed: '...', name: 'Alice' })
  await talisman.importEthPrivateKey({ privateKey: '0x...', name: 'Bob' })

  await page.goto('http://localhost:3000')
  await polkadotJs.authorize()
})
```

## Features

- **Easy Extension Setup**: Simple command to download wallet extensions
- **Test Fixtures**: Ready-to-use Playwright fixtures for wallet operations
- **Account Management**: Import accounts with seed phrases and custom names
- **Transaction Approval**: Approve transactions with password authentication
- **dApp Authorization**: Connect wallet to decentralized applications
- **Multi-Wallet Support**: Test with multiple wallet extensions simultaneously

## Supported Chains

| Chain | Status |
|-------|--------|
| Polkadot | ✅ Supported |
| Ethereum | ✅ Supported |
| Solana | ⏳ Planned |

## Supported Wallets

| Wallet | Status | Version |
|--------|--------|---------|
| Polkadot JS Extension | ✅ Supported | v0.62.6 |
| Talisman | ✅ Supported | v3.1.13 |
| SubWallet | ⏳ Planned | - |
| MetaMask | ⏳ Planned | - |

## Requirements

- Node.js 24+
- @playwright/test ^1.55.0

## License

MIT
