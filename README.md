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

## Running Tests with Docker

You can run the Playwright tests in a Docker container for consistent CI/CD environments.

```bash
# Build the Docker image
docker build -t chroma-test .

# Run e2e-polkadot-js tests
docker run --rm --shm-size=2gb -e E2E_TARGET=polkadot-js chroma-test

# Run e2e-evm tests
docker run --rm --shm-size=2gb -e E2E_TARGET=evm chroma-test

# Interactive debugging
docker run -it --rm --shm-size=2gb chroma-test bash
```

## Documentation

See [@avalix/chroma](./packages/chroma) for detailed documentation.

## License

MIT
