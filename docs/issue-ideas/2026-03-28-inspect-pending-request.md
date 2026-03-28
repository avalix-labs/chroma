# Add `getPendingRequest()` to Wallet Drivers to Inspect Popup Content Before Acting

**Date:** 2026-03-28
**Category:** feature / developer-experience

---

## Title

Add `getPendingRequest()` to wallet drivers to inspect the pending popup request before approving or rejecting

---

## Summary

Currently every wallet driver (`authorizeMetaMask`, `confirmMetaMask`, etc.) blindly clicks approve or reject without exposing the underlying request data to the test. Adding a `getPendingRequest()` method would let tests assert on *what* the wallet is being asked to sign or approve before deciding to act on it, enabling a whole class of correctness tests that are currently impossible.

---

## Why it matters

* **Correctness verification is impossible today.** Tests can only check that a dApp *sent* a request; they cannot verify that the wallet actually received the correct transaction target, value, or message. A bug in the dApp's request-building code would go undetected.
* **Security-sensitive dApp flows need assertion.** SIWE sign-in, permit2 approvals, and EIP-712 typed-data signing all require that the displayed data matches what the dApp intended — the exact problem `getPendingRequest()` would expose.
* **Reduces blind automation.** Wallet automation that always clicks "confirm" regardless of content is a weaker testing signal than automation that first validates what is being confirmed, mirroring how a careful human user would behave.

---

## Suggested scope

* Add a `getPendingRequest(): Promise<PendingWalletRequest>` method to each wallet driver (`MetaMaskDriver`, `PolkadotJsDriver`, `TalismanDriver`).
* Define a shared `PendingWalletRequest` type (in `wallets/types.ts` or the shared `WalletDriver` interface) with at minimum: `type` (`'connect' | 'sign' | 'transaction' | 'switchChain' | 'unknown'`), `origin` (requesting dApp origin), and `raw` (the full text or structured data visible in the popup for wallet-specific detail).
* For MetaMask, implement by navigating to the side-panel page and scraping the displayed data using the existing `findExtensionPopup` helper before any button is clicked; for Polkadot-JS and Talisman, read the request detail from the approve popup.
* Add unit tests with mock popup pages asserting the shape of the returned `PendingWalletRequest` object.

---

## Category

feature / developer-experience

---

## Optional notes

A natural follow-on is a higher-level assertion helper such as `assertPendingRequest(expected)` that wraps `getPendingRequest()` with a built-in `expect` check, keeping test code terse. This issue focuses only on the read primitive.

The `raw` field should be typed loosely (`string | Record<string, unknown>`) to accommodate the variety of data formats across wallets (plain-text messages, EIP-712 JSON, Polkadot extrinsic detail), while still being structured enough to write assertions against.

Implementation will need care around timing: the popup may still be rendering when `getPendingRequest()` is called, so the method should apply the same retry/timeout logic used by `findExtensionPopup`.
