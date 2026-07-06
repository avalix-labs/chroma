# e2e-solana

Playground dApp for Chroma's Solana end-to-end tests. A React app built on [`@solana/react-hooks`](https://www.npmjs.com/package/@solana/react-hooks) that the Playwright suite drives with the MetaMask extension: connect a Solana account and sign a message.

Bootstrapped from the [create-solana-dapp](https://github.com/solana-foundation/templates) kit template.

## Running the tests

```bash
# from the repo root
bun install

# build the chroma package first
cd packages/chroma && bun run build

cd ../e2e-solana
bun run test:prepare   # download wallet extensions
bun run test           # runs Playwright (starts the dev server itself)
```

`bun run dev` starts the app on its own if you want to poke at it manually.
