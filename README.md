# Chroma

End-to-end testing library for Polkadot wallet interactions using Playwright.

## Quick Start

```bash
npm install @avalix/chroma @playwright/test
npx chroma download-extensions
```

```typescript
import { test } from '@avalix/chroma'

test('connect wallet', async ({ page, wallets }) => {
  const polkadotJs = wallets['polkadot-js']

  await polkadotJs.importMnemonic({
    seed: 'bottom drive obey lake curtain smoke basket hold race lonely fit walk'
  })

  await page.goto('http://localhost:3000')
  await polkadotJs.authorize()
  await polkadotJs.approveTx()
})
```

## Supported Chains

| Chain | Status |
|-------|--------|
| Polkadot | Supported |
| Ethereum | Supported |
| Solana | Planned |

## Supported Wallets

| Wallet | Status |
|--------|--------|
| Polkadot JS | Supported |
| Talisman | Supported |
| SubWallet | Planned |

## Documentation

See [@avalix/chroma](./packages/chroma) for detailed documentation.

## License

MIT
