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

test('should connect wallet and sign transaction', async ({ page, importAccount, authorize, approveTx }) => {
  // Import a test account
  await importAccount({
    seed: 'bottom drive obey lake curtain smoke basket hold race lonely fit walk',
    name: 'Test Account',
    password: 'securePassword123'
  })

  // Navigate to your dApp
  await page.goto('http://localhost:3000')

  // Connect wallet
  await page.click('button:has-text("Connect Wallet")')
  await authorize()

  // Perform transaction
  await page.click('button:has-text("Send Transaction")')
  await approveTx({ password: 'securePassword123' })

  // Verify transaction success
  await expect(page.locator('.transaction-success')).toBeVisible()
})
```

### Custom Configuration

```typescript
import { createWalletTest, expect } from '@avalix/chroma'

// Create test with custom configuration
const customTest = createWalletTest({
  walletType: 'polkadot-js',
  walletConfig: {
    customPath: './my-custom-extension'
  },
  headless: false,
  slowMo: 100
})

customTest('test with custom config', async ({ page, importAccount, authorize }) => {
  // Your test code here
  await importAccount({
    seed: 'your seed phrase here...',
    name: 'My Test Account'
  })
  // ... rest of your test
})
```

## Features

- 🔐 **Automatic Extension Setup**: Downloads and configures Polkadot JS extension automatically
- 🧪 **Test Fixtures**: Ready-to-use Playwright fixtures for wallet operations
- 📝 **Account Management**: Import accounts with seed phrases and custom names
- ✅ **Transaction Approval**: Approve transactions with password authentication
- 🔗 **dApp Authorization**: Connect wallet to decentralized applications
- ⚙️ **Configurable**: Custom extension paths, headless mode, and slow motion settings

## API Reference

### Core Functions

#### `test` (Default Test Function)
Pre-configured test function with Polkadot JS extension.

```typescript
import { test } from '@avalix/chroma'

test('my wallet test', async ({ page, importAccount, authorize, approveTx }) => {
  // Test implementation
})
```

#### `createWalletTest(options?: ChromaTestOptions)`
Create a custom test function with specific configuration.

```typescript
import { createWalletTest } from '@avalix/chroma'

const customTest = createWalletTest({
  walletType: 'polkadot-js', // Currently only 'polkadot-js' is supported
  walletConfig: {
    customPath: './custom-extension', // Optional: path to custom extension
    downloadUrl: 'https://...' // Optional: custom download URL
  },
  headless: true, // Optional: run in headless mode
  slowMo: 150 // Optional: slow motion delay in ms (default: 150)
})
```

### Test Fixtures

#### `importAccount(options: WalletAccount)`
Import a wallet account using seed phrase.

```typescript
interface WalletAccount {
  seed: string
  name?: string // Default: 'Test Account'
  password?: string // Default: 'h3llop0lkadot!'
}

await importAccount({
  seed: 'your twelve word seed phrase here...',
  name: 'My Test Account',
  password: 'securePassword123'
})
```

#### `authorize()`
Authorize the dApp to connect with the wallet. Call this after triggering wallet connection from your dApp.

```typescript
await authorize()
```

#### `approveTx(options?)`
Approve a transaction with the wallet password.

```typescript
await approveTx({ password: 'myPassword' })

// Or use default password
await approveTx()
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

### TypeScript Types

```typescript
import type {
  ChromaTestOptions,
  WalletAccount,
  WalletConfig,
  WalletFixtures,
  WalletType
} from '@avalix/chroma'
```

## Configuration

### Default Directory
The Polkadot JS extension will be automatically downloaded to `./.chroma` directory in your project root. You can customize this by:

1. Using `downloadAndExtractPolkadotExtension('./custom-path')`
2. Using `createWalletTest()` with `walletConfig.customPath`

### Browser Settings
- **Headless Mode**: Supported via `channel: 'chromium'` (disabled by default for better debugging)
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
