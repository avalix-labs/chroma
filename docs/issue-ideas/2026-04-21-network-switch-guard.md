# Issue Idea: 2026-04-21

Title: Add `expectNetworkChangeRequest()` / `approveNetworkChange()` helpers for MetaMask `wallet_switchEthereumChain` popups

Summary:
Many dApps automatically trigger a `wallet_switchEthereumChain` (or `wallet_addEthereumChain`) RPC request when the connected wallet is on the wrong network. Today, tests have no first-class way to anticipate and handle these popups, so they either race-condition past them or hang silently.

Why it matters:

* Network-switch popups are one of the most common causes of flaky E2E tests against MetaMask because the popup opens asynchronously relative to the dApp's page actions, and there is no built-in hook to wait for it.
* Teams that test multi-chain dApps (e.g., a DEX that operates on both Ethereum mainnet and an L2) must hand-roll brittle `page.waitForSelector` polling just to handle these popups, duplicating logic that belongs in the wallet driver.
* Providing `expectNetworkChangeRequest()` unifies network-switch handling with the same ergonomic promise-based pattern already used for `approveTransaction()` and `signMessage()`, making multi-chain test flows easy to read and maintain.

Suggested scope:

* Add `approveNetworkChange(options?: { timeout?: number }): Promise<void>` to `MetaMaskWalletInstance` — waits for the `wallet_switchEthereumChain` or `wallet_addEthereumChain` popup to open, then clicks "Approve" / "Switch network".
* Add `rejectNetworkChange(options?: { timeout?: number }): Promise<void>` — same popup discovery logic, clicks "Cancel".
* Export a `NetworkChangeRequest` type describing the detected popup metadata (chainId, chainName) and expose it via an optional callback argument so tests can assert the requested network before approving.

Category:
feature

Optional notes:
MetaMask distinguishes between `wallet_switchEthereumChain` (network already known) and `wallet_addEthereumChain` (new custom network requiring "Add" confirmation). The implementation should handle both flows, ideally with a single internal popup-detection routine that inspects the popup title/button text to branch. A future enhancement could surface the detected chain metadata (EIP-3085 `AddEthereumChainParameter`) in the `NetworkChangeRequest` type, allowing tests to do a strict assertion like `expect(req.chainId).toBe('0xa')` before approving.
