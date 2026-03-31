# Issue Idea: 2026-03-31

Title: Add `signTypedData()` support for EIP-712 structured data signing in MetaMask driver

Summary:
Many modern dApps rely on EIP-712 typed data signing for permit flows (EIP-2612), gasless relayer approvals, and off-chain order books — yet the MetaMask driver only supports basic `eth_sign`/`personal_sign` via `signMessage()`. Adding a dedicated `signTypedData()` method would let test suites cover these high-value interaction paths end-to-end.

Why it matters:

* EIP-712 signing is ubiquitous in DeFi (token permits, gasless swaps, OpenSea-style orders, Safe multi-sig) — without it, any dApp relying on typed data cannot be fully E2E tested with Chroma.
* The MetaMask popup UI for `eth_signTypedData_v4` is meaningfully different from a plain `personal_sign` prompt (it renders labelled fields and domain info), so existing `signMessage()` selectors will not match and a dedicated driver method is required.
* Supporting typed-data flows rounds out the MetaMask driver into a complete signing surface, making Chroma a viable drop-in for full DeFi regression suites.

Suggested scope:

* Add `signTypedData(options?: { timeout?: number }): Promise<void>` to the MetaMask driver that detects the `eth_signTypedData_v4` popup and clicks the **Sign** button.
* Add a corresponding `rejectTypedData(options?: { timeout?: number }): Promise<void>` for negative-path tests.
* Add an E2E test in `packages/e2e-evm` that triggers an EIP-712 `eth_signTypedData_v4` request from a minimal test page and asserts the resolved signature is a valid 65-byte hex string.

Category:
feature

Optional notes:
MetaMask renders typed-data popups differently across versions (the legacy v1/v3 UI vs. the redesigned v4/v4+ UI). The initial implementation can target the current production MetaMask version pinned in the test matrix; a follow-up can add version-aware selector branching. Consider exposing a `getTypedDataFields(): Promise<Record<string, string>>` helper alongside so tests can assert on the displayed domain/message values before signing — matching the spirit of the existing `getPendingRequest()` proposal.
