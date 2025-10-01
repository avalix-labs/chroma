# @avalix/chroma

End-to-end testing library for Polkadot wallet interactions using Playwright.

> **Current Status**: This library currently supports **Polkadot JS Extension** only. Support for other wallets like Talisman is planned for future releases.

## Installation

```bash
npm install @avalix/chroma @playwright/test
```

**Note**: `@playwright/test` is a peer dependency and must be installed separately to avoid conflicts.

## Quick Start

### Basic Usage

```typescript
import { expect, test } from '@avalix/chroma'

test('should connect wallet and sign transaction', async ({ page, wallets }) => {
  const polkadotJs = wallets['polkadot-js']

  // Import a test account
  await polkadotJs.importMnemonic({
    seed: 'bottom drive obey lake curtain smoke basket hold race lonely fit walk',
    name: 'Test Account',
    password: 'securePassword123'
  })

  // Navigate to your dApp
  await page.goto('http://localhost:3000')

  // Connect wallet
  await page.click('button:has-text("Connect Wallet")')
  await polkadotJs.authorize()

  // Perform transaction
  await page.click('button:has-text("Send Transaction")')
  await polkadotJs.approveTx({ password: 'securePassword123' })

  // Verify transaction success
  await expect(page.locator('.transaction-success')).toBeVisible()
})
```

### Custom Configuration

```typescript
import { createWalletTest, expect } from '@avalix/chroma'

// Single wallet with custom path
const singleWalletTest = createWalletTest({
  wallets: [
    {
      type: 'polkadot-js',
      customPath: './my-custom-extension'
    }
  ],
  headless: false,
  slowMo: 100
})

singleWalletTest('test with custom config', async ({ page, wallets }) => {
  const polkadotJs = wallets['polkadot-js']

  await polkadotJs.importMnemonic({
    seed: 'your seed phrase here...',
    name: 'My Test Account'
  })
  await page.goto('http://localhost:3000')
  await polkadotJs.authorize()
})
```

### Multiple Wallets

```typescript
import { createWalletTest, expect } from '@avalix/chroma'

// Test with multiple wallet extensions
const multiWalletTest = createWalletTest({
  wallets: [
    { type: 'polkadot-js' },
    { type: 'talisman' } // When available
  ],
  headless: false,
  slowMo: 150
})

multiWalletTest('test with multiple wallets', async ({ page, wallets }) => {
  const polkadotJs = wallets['polkadot-js']
  const talisman = wallets.talisman

  // Import to both wallets
  await polkadotJs.importMnemonic({
    seed: 'bottom drive obey lake curtain smoke basket hold race lonely fit walk',
    name: 'Alice'
  })

  await talisman.importMnemonic({
    seed: 'another seed phrase...',
    name: 'Bob'
  })

  await page.goto('http://localhost:3000')

  // Use specific wallet
  await polkadotJs.authorize()
  await polkadotJs.approveTx()
})
```

## Features

- 🔐 **Automatic Extension Setup**: Downloads and configures Polkadot JS extension automatically
- 🧪 **Test Fixtures**: Ready-to-use Playwright fixtures for wallet operations
- 📝 **Account Management**: Import accounts with seed phrases and custom names
- ✅ **Transaction Approval**: Approve transactions with password authentication
- 🔗 **dApp Authorization**: Connect wallet to decentralized applications
- 🔀 **Multi-Wallet Support**: Test with multiple wallet extensions simultaneously
- ⚙️ **Configurable**: Custom extension paths, headless mode, and slow motion settings

## API Reference

### Core Functions

#### `test` (Default Test Function)
Pre-configured test function with Polkadot JS extension.

```typescript
import { test } from '@avalix/chroma'

test('my wallet test', async ({ page, wallets }) => {
  const polkadotJs = wallets['polkadot-js']

  await polkadotJs.importMnemonic({ seed: '...' })
  await polkadotJs.authorize()
})
```

#### `createWalletTest(options?: ChromaTestOptions)`
Create a custom test function with specific configuration. Supports single and multi-wallet modes.

```typescript
import { createWalletTest } from '@avalix/chroma'

// Single wallet (default)
const test = createWalletTest()

// Single wallet with custom config
const customTest = createWalletTest({
  wallets: [
    {
      type: 'polkadot-js',
      customPath: './custom-extension',
      downloadUrl: 'https://...'
    }
  ],
  headless: false,
  slowMo: 150
})

// Multiple wallets
const multiTest = createWalletTest({
  wallets: [
    { type: 'polkadot-js' },
    { type: 'talisman', customPath: './talisman-ext' }
  ]
})

// Usage
test('example', async ({ page, wallets }) => {
  const polkadotJs = wallets['polkadot-js']

  await polkadotJs.importMnemonic({ seed: '...' })
  await polkadotJs.authorize()
  await polkadotJs.approveTx()
})
```

### Test Fixtures

#### `page`
Playwright page instance with wallet extension(s) loaded.

#### `wallets`
Typed object containing wallet instances for each configured wallet. Provides full TypeScript autocomplete.

```typescript
// Base wallet instance (common methods)
interface BaseWalletInstance {
  extensionId: string
  importMnemonic: (options: WalletAccount) => Promise<void>
  authorize: () => Promise<void>
  approveTx: (options?: { password?: string }) => Promise<void>
}

// Polkadot-JS wallet instance
interface PolkadotJsWalletInstance extends BaseWalletInstance {
  type: 'polkadot-js'
}

// Talisman wallet instance (with additional methods)
interface TalismanWalletInstance extends BaseWalletInstance {
  type: 'talisman'
  importPrivateKey: (options: { privateKey: string, name?: string, password?: string }) => Promise<void>
}

// Wallets collection - each wallet has its specific type
interface Wallets {
  'polkadot-js': PolkadotJsWalletInstance
  'talisman': TalismanWalletInstance
}

interface WalletAccount {
  seed: string
  name?: string // Default: 'Test Account'
  password?: string // Default: 'h3llop0lkadot!'
}
```

**Usage:**

```typescript
test('example', async ({ page, wallets }) => {
  const polkadotJs = wallets['polkadot-js'] // Type: PolkadotJsWalletInstance

  // Import mnemonic (available on all wallets)
  await polkadotJs.importMnemonic({
    seed: 'bottom drive obey lake curtain smoke basket hold race lonely fit walk',
    name: 'Test Account',
    password: 'securePassword123'
  })

  await page.goto('http://localhost:3000')
  await polkadotJs.authorize()
  await polkadotJs.approveTx({ password: 'securePassword123' })
})

// Talisman-specific features
test('talisman example', async ({ page, wallets }) => {
  const talisman = wallets.talisman // Type: TalismanWalletInstance

  // Talisman-specific method: import private key
  await talisman.importPrivateKey({
    privateKey: '0x...',
    name: 'My Account',
    password: 'mypassword'
  })

  // Common methods also available
  await talisman.authorize()
  await talisman.approveTx()
})
```

### Utility Functions

#### `downloadAndExtractPolkadotExtension(targetDir?)`
Download and extract Polkadot JS extension to specified directory.

```typescript
import { downloadAndExtractPolkadotExtension } from '@avalix/chroma'

// Download to custom directory
const extensionPath = await downloadAndExtractPolkadotExtension('./my-extensions')

// Download to default directory (./.chroma)
const extensionPath = await downloadAndExtractPolkadotExtension()
```

## Configuration

### Default Directory
The Polkadot JS extension will be automatically downloaded to `./.chroma` directory in your project root. You can customize this by:

1. Using `downloadAndExtractPolkadotExtension('./custom-path')`
2. Using `createWalletTest()` with `walletConfig.customPath`

### Browser Settings
- **Headless Mode**: Disabled by default for better debugging
- **Slow Motion**: 150ms delay between actions (configurable)
- **Extension Loading**: Automatically loads only the Polkadot JS extension

## Supported Wallets

| Wallet | Status | Version |
|--------|--------|---------|
| Polkadot JS Extension | ✅ Supported | v0.61.7 |
| Talisman | ⏳ Planned | - |
| SubWallet | ⏳ Planned | - |

## Requirements

- Node.js 18+
- @playwright/test ^1.55.0

## Contributing

This project is in active development. Currently focusing on:
- Polkadot JS Extension support
- Core testing fixtures
- Documentation improvements

## License

MIT
