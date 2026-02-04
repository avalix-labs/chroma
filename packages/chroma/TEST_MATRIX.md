# Test Matrix

This document maps each deliverable feature to its corresponding tests.

## Core Features

| Feature | Unit Tests | E2E Tests | Status |
|---------|------------|-----------|--------|
| Extension Download | `download-extension.test.ts` | `download-extension.integration.test.ts` | ✅ |
| Polkadot-JS Wallet Setup | `polkadot-js.test.ts` | `e2e-polkadot-js/polkadot.spec.ts` | ✅ |
| Talisman Wallet Setup | `talisman.test.ts` | `e2e-evm/example.spec.ts` | ✅ |
| Multi-Wallet Support | `wallet-factory.test.ts` | `e2e-polkadot-js/polkadot.spec.ts` | ✅ |
| Wallet Factory | `wallet-factory.test.ts` | - | ✅ |
| Test Fixtures | `index.test.ts` | All E2E specs | ✅ |

## Wallet Operations

| Operation | Polkadot-JS | Talisman | Test File |
|-----------|-------------|----------|-----------|
| Import Mnemonic | ✅ | ✅ | `e2e-polkadot-js/polkadot.spec.ts` |
| Import ETH Private Key | - | ✅ | `e2e-evm/example.spec.ts` |
| Authorize Connection | ✅ | ✅ | All E2E specs |
| Approve Transaction | ✅ | ✅ | `e2e-polkadot-js/polkadot.spec.ts` |
| Reject Transaction | ✅ | ✅ | `e2e-polkadot-js/polkadot.spec.ts` |

## Chain Support

| Chain | Wallet | Test File | Status |
|-------|--------|-----------|--------|
| Polkadot/Substrate | Polkadot-JS | `e2e-polkadot-js/polkadot.spec.ts` | ✅ |
| Polkadot/Substrate | Talisman | `e2e-polkadot-js/polkadot.spec.ts` | ✅ |
| Ethereum/EVM | Talisman | `e2e-evm/example.spec.ts` | ✅ |

## Test Coverage Summary

| Module | Statements | Branches | Functions | Lines |
|--------|------------|----------|-----------|-------|
| `context-playwright/` | 100% | 100% | 100% | 100% |
| `wallets/` | 100% | 100% | 100% | 100% |
| `utils/` | 97.56% | 88.88% | 50% | 97.5% |
| **Overall** | **98.46%** | **94.44%** | **70%** | **98.43%** |

## E2E Test Suites

| Suite | Tests | Environment | Description |
|-------|-------|-------------|-------------|
| `packages/e2e-polkadot-js/` | 1 spec | Local + Docker | Polkadot dApp integration |
| `packages/e2e-evm/` | 1 spec | Docker | EVM dApp integration |

## Test Files Overview

### Unit Tests (`src/**/*.test.ts`)

| File | Description | Tests |
|------|-------------|-------|
| `download-extension.test.ts` | Extension download logic | 6 |
| `download-extension.integration.test.ts` | Download integration tests | 4 |
| `polkadot-js.test.ts` | Polkadot-JS config & path | 7 |
| `talisman.test.ts` | Talisman config & path | 7 |
| `wallet-factory.test.ts` | Wallet factory functions | 6 |
| `index.test.ts` | Main exports | 5 |
| `context-playwright/index.test.ts` | Playwright fixtures | 13 |
| **Total** | | **48** |

### E2E Tests

| Package | File | Description | Wallets Tested |
|---------|------|-------------|----------------|
| `e2e-polkadot-js` | `polkadot.spec.ts` | Polkadot dApp flow | Polkadot-JS, Talisman |
| `e2e-evm` | `example.spec.ts` | EVM dApp flow | Talisman |

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
```
