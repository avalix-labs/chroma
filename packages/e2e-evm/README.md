# e2e-evm

Playground dApp for Chroma's EVM end-to-end tests. A Vue 3 + [wagmi](https://wagmi.sh) app that the Playwright suites drive with real wallet extensions (MetaMask and Talisman): connect, switch chains, sign, and interact with the MessageBoard contract.

See [CONTRACT_SETUP.md](./CONTRACT_SETUP.md) for deploying the MessageBoard contract used by the app.

## Running the tests

```bash
# from the repo root
bun install

# build the chroma package first
cd packages/chroma && bun run build

cd ../e2e-evm
bun run test:prepare   # download wallet extensions
bun run test           # runs Playwright (starts the dev server itself)
```

`bun run dev` starts the app on its own if you want to poke at it manually.
