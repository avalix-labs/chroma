# Chroma

End-to-end testing library for Polkadot wallet interactions using Playwright.

## Quick Start

```bash
npm install @avalix/chroma @playwright/test
npx chroma download-extensions
```

```typescript
import { createWalletTest } from '@avalix/chroma'

const test = createWalletTest({
  wallets: [{ type: 'polkadot-js' }]
})

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

For detailed tutorials and guides, visit the [Documentation](https://chroma-docs.up.railway.app/docs)

## Supported Wallets & Chains

### Supported Chains

| Chain | Status |
|-------|--------|
| Polkadot | Supported |
| Ethereum | Supported |
| Solana | Planned |

### Supported Wallets

| Wallet | Status |
|--------|--------|
| Polkadot JS | Supported |
| Talisman | Supported |
| SubWallet | Planned |

## Test Matrix

For detailed test coverage and mapping of features to tests, see [TEST_MATRIX.md](./packages/chroma/TEST_MATRIX.md).

## Running Tests

### Unit Tests

```bash
cd packages/chroma
bun run test:unit:coverage
```

### E2E Tests (Local)

```bash
# Polkadot-JS dApp
cd packages/e2e-polkadot-js
bun run test

# EVM dApp
cd packages/e2e-evm
bun run test
```

### E2E Tests (Docker)

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

## Project Structure

```
packages/
├── chroma/                       # Main library
│   ├── src/                      # Source code
│   │   ├── context-playwright/   # Playwright fixtures
│   │   ├── wallets/              # Wallet implementations
│   │   └── utils/                # Utilities
│   └── tests/                    # E2E tests playground for the library
├── e2e-polkadot-js/              # Polkadot dApp example
└── e2e-evm/                      # EVM dApp example
```

## License

MIT
