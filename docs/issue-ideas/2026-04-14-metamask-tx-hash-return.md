# Return Transaction Hash from `approveTransaction()` in MetaMask Driver

**Date:** 2026-04-14
**Category:** feature

---

## Title

Return the transaction hash from `approveTransaction()` so tests can assert on-chain outcomes

## Summary

After calling `approveTransaction()` on the MetaMask driver, there is no built-in way to retrieve the resulting transaction hash. Tests must resort to polling the dApp UI or querying the RPC node independently, which is brittle. Returning the `txHash` (or a promise that resolves to it) from `approveTransaction()` would let tests assert on-chain state without side-channel workarounds.

## Why it matters

* **On-chain assertions become first-class.** Test authors can call `provider.getTransactionReceipt(txHash)` immediately after approval rather than guessing at timing or scraping the UI.
* **Fewer flaky workarounds.** Current practice of waiting for a toast message or URL change to extract the hash is fragile against minor UI updates and slow networks.
* **Better developer experience parity with ethers/wagmi test utilities.** Libraries like `@wagmi/test` return transaction receipts directly; Chroma should offer an equivalent ergonomic path for real-browser wallet flows.

## Suggested scope

* After the MetaMask driver clicks "Confirm" on the transaction popup, read the activity/history tab of the extension to extract the most recent transaction hash before closing the popup.
* Return the hash as `Promise<string | null>` from `approveTransaction()`, keeping null as the fallback for environments where extraction is not yet possible.
* Add a `waitForTransactionHash(timeout?)` helper on the MetaMask driver that polls the extension activity log until a new entry appears, as a standalone utility for callers who approve via a separate path.
* Document the new return value and the helper in the MetaMask driver API reference with a worked example showing `provider.waitForTransaction(txHash)`.

## Category

feature

## Optional notes

Extracting the hash from the extension activity log requires navigating to `chrome-extension://<id>/home.html#activity` or reading from the MetaMask background service worker via `chrome.scripting`. A simpler interim approach is to intercept the `eth_sendTransaction` JSON-RPC response from the injected provider via Playwright's `page.on('response', ...)` on the dApp page, which does not require any changes to how the extension popup is driven. The implementation could start with the RPC-intercept approach and graduate to native extension parsing in a follow-up.

Future expansion: once `approveTransaction()` returns a hash, a `waitForConfirmation(txHash, confirmations?)` helper would complete the story for tests that need to wait for block finality.
