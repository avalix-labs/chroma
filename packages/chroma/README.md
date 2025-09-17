# @avalix/chroma

End-to-end testing library for Polkadot wallet interactions using Playwright. Supports multiple wallet types including Polkadot.js and Talisman.

## Installation

```bash
npm install @avalix/chroma @playwright/test
```

**Note**: `@playwright/test` is a peer dependency and must be installed separately to avoid conflicts.

## Quick Start

### Using Default Polkadot JS Wallet

```typescript
import { expect, test } from '@avalix/chroma'

test('should connect wallet and sign transaction', async ({ page, importAccount, authorize, approveTx }) => {
  // Import a test account
  await importAccount({
    seed: 'bottom drive obey lake curtain smoke basket hold race lonely fit walk',
    name: 'Test Account'
  })

  // Navigate to your dApp
  await page.goto('http://localhost:3000')

  // Connect wallet
  await page.click('button:has-text("Connect Wallet")')
  await authorize()

  // Perform transaction
  await page.click('button:has-text("Send Transaction")')
  await approveTx()

  // Verify transaction success
  await expect(page.locator('.transaction-success')).toBeVisible()
})
```

### Using Different Wallets

```typescript
import { createWalletTest, expect } from '@avalix/chroma'

// Create test with Polkadot JS wallet (default)
const polkadotTest = createWalletTest({
  walletType: 'polkadot-js'
})

// Create test with Talisman wallet
const talismanTest = createWalletTest({
  walletType: 'talisman'
})

// Create test with custom extension path
const customTest = createWalletTest({
  walletType: 'polkadot-js',
  walletConfig: {
    customPath: './my-custom-extension'
  }
})

polkadotTest('test with Polkadot JS', async ({ page, walletType, walletConfig, importAccount }) => {
  console.log('Using wallet:', walletType) // 'polkadot-js'
  // ... your test code
})

talismanTest('test with Talisman', async ({ page, walletType, importAccount, authorize, approveTx }) => {
  await importAccount({
    seed: 'bottom drive obey lake curtain smoke basket hold race lonely fit walk',
    name: 'Talisman Test Account'
  })
  
  await page.goto('http://localhost:3000')
  await page.click('button:has-text("Connect Wallet")')
  await authorize()
  
  await page.click('button:has-text("Send Transaction")')
  await approveTx()
})
```

## Features

- 🔐 **Multi-Wallet Support**: Supports Polkadot.js and Talisman wallets
- 🧪 **Wallet Fixtures**: Ready-to-use fixtures for wallet operations
- 📝 **Account Management**: Import accounts with seed phrases
- ✅ **Transaction Approval**: Approve transactions with password
- 🔗 **dApp Authorization**: Connect wallet to decentralized applications
- 📦 **Automatic Extension Setup**: Downloads and configures extensions automatically

## API Reference

### Test Fixtures

#### `importAccount(options: WalletAccount)`
Import a wallet account using seed phrase.

```typescript
await importAccount({
  seed: 'your twelve word seed phrase here...',
  name: 'My Test Account',
  password: 'securePassword123'
})
```

#### `authorize()`
Authorize the dApp to connect with the wallet.

```typescript
await authorize()
```

#### `approveTx(options?)`
Approve a transaction with the wallet password.

```typescript
await approveTx({ password: 'myPassword' })
```

### Utility Functions

#### `downloadAndExtractPolkadotExtension(targetDir?)`
Download and extract Polkadot JS extension to specified directory.

```typescript
import { downloadAndExtractPolkadotExtension } from '@avalix/chroma'

// Download to custom directory
const extensionPath = await downloadAndExtractPolkadotExtension('./my-extensions')

// Download to default directory (./chroma)
const extensionPath = await downloadAndExtractPolkadotExtension()
```

#### `extractTalismanExtension(targetDir?)`
Extract the bundled Talisman extension to specified directory.

```typescript
import { extractTalismanExtension } from '@avalix/chroma'

// Extract to custom directory
const extensionPath = await extractTalismanExtension('./my-extensions')

// Extract to default directory (./chroma)
const extensionPath = await extractTalismanExtension()
```

## Configuration

Extensions will be automatically downloaded/extracted to `./.chroma` directory in your project root. You can customize this by passing a different path to the extraction functions.

## Requirements

- Node.js 18+
- Playwright

## License

MIT
