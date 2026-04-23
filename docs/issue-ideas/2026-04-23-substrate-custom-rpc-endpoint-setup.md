# Issue Idea — 2026-04-23

Title: Add `addCustomEndpoint()` / `selectEndpoint()` helpers for Polkadot-JS and Talisman drivers to manage custom Substrate RPC nodes

Summary:
When testing dApps that connect to private Substrate nodes (local Zombienet, Chopsticks, or custom parachains), testers must manually navigate the wallet UI to add and select a custom RPC endpoint before any test can run. Providing `addCustomEndpoint(networkName, rpcUrl)` and `selectEndpoint(networkName, rpcUrl)` driver methods would let tests wire up wallets to local or CI-ephemeral Substrate nodes programmatically as part of the fixture setup.

Why it matters:

* Substrate-based dApp tests often rely on Zombienet or Chopsticks spinning up fresh nodes on dynamic ports; manually managing this in tests today forces brittle workarounds and is a common pain point for parachain teams adopting Chroma.
* Without a driver method for this, fixture setup must inject CSS/click paths that break across wallet versions, undermining Chroma's value as a stable abstraction layer.
* Supporting custom RPC management natively unblocks realistic integration tests against local devnets that mirror production Substrate topology, improving test fidelity.

Suggested scope:

* Add `addCustomEndpoint(networkName: string, rpcUrl: string): Promise<void>` to `PolkadotJsDriver` and `TalismanDriver`, navigating the wallet settings UI to register the endpoint.
* Add `selectEndpoint(networkName: string, rpcUrl: string): Promise<void>` to switch the active network endpoint for a specific chain.
* Document a usage example pairing these methods with a Zombienet/Chopsticks `globalSetup` script that starts a local node, extracts the RPC port, and passes it into Chroma fixtures.

Category:
feature

Optional notes:
The Polkadot-JS extension exposes endpoint management under Settings → Networks. Talisman exposes it under Settings → Networks → Manage Network RPC. Selector stability should be guarded by version-aware element strategies consistent with the existing driver patterns. A future extension could add `removeCustomEndpoint()` for cleanup in `globalTeardown`. Consider pairing this with the previously proposed `globalSetup` Anvil/Hardhat helper (2026-04-08) to form a unified "local devnet wiring" story across both EVM and Substrate wallets.
