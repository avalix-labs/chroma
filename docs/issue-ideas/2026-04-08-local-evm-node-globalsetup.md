# Issue Idea: 2026-04-08

Title: Add `globalSetup` helper to launch a local Anvil/Hardhat node and pre-configure MetaMask against it

Summary:
dApp E2E tests almost always need a deterministic local EVM chain (Anvil or Hardhat). Provide an optional `chromaGlobalSetup` utility that spawns a local node, derives its RPC URL and chain ID, and injects them into MetaMask during the wallet fixture's `setup` phase — so tests start with MetaMask already pointing at the correct local network without any manual `addNetwork` calls in each test.

Why it matters:

* Without this, every project must wire up their own Anvil/Hardhat lifecycle, duplicate `addNetwork` calls across test files, and risk tests hitting the wrong network (mainnet, a public testnet) if configuration drifts.
* A first-class fixture-level integration removes the most common source of flaky MetaMask tests: the wallet not being on the expected chain when the first test begins.
* It lowers the onboarding barrier significantly — new users can write a working MetaMask E2E test against a local chain in under ten minutes without needing deep Playwright `globalSetup` knowledge.

Suggested scope:

* Export a `withLocalEvmNode(options)` wrapper for `playwright.config.ts`'s `globalSetup` that starts Anvil (via `viem/node` or direct CLI) or Hardhat, waits for the RPC endpoint to be ready, and stores the RPC URL + chain ID in `process.env` for the Chroma fixture to consume.
* Extend `MetaMaskDriver.setup()` (or the `ChromaTestOptions` type) to accept `{ localNode: true }` which automatically calls `addNetwork` using the env vars set above, then switches MetaMask to that network before the test body runs.
* Document the full setup in a new `guides/local-evm-node.md` page with a minimal `playwright.config.ts` + `fixture.ts` example using Anvil, including how to obtain the pre-funded accounts for use in tests.

Category:
developer-experience

Optional notes:
Anvil (part of Foundry) is fast enough to start in < 1 s and is the de-facto standard for EVM E2E testing, making it the primary target. Hardhat's `hardhat node` can be supported as a secondary option by detecting a `hardhat.config.*` file or via an explicit `runtime: "hardhat"` option. A future extension could expose `anvil.snapshot()` / `anvil.revert()` through the driver so tests can checkpoint and roll back chain state between test cases without a full node restart.
