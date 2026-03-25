# Add `rejectWithReason()` to wallet drivers for testing dApp rejection-handling flows

**Date:** 2026-03-25
**Category:** feature / developer-experience

---

## Title

Add `rejectWithReason()` to wallet drivers for testing dApp rejection-handling flows

## Summary

All three wallet drivers currently expose only a silent `reject()` / `rejectTx()` method that closes the popup without providing any signal to the dApp about _why_ the request was declined. A new `rejectWithReason(reason: string)` helper should let test authors simulate MetaMask's `4001 USER_REJECTED_REQUEST` (and equivalent Substrate `cancelled` codes), enabling end-to-end coverage of the dApp error-handling paths that users hit every day.

## Why it matters

* **Real users reject transactions with specific error codes.** dApps are expected to catch `4001` / `UserRejectedRequestError` and display a friendly message. Without a way to trigger that exact path in tests, this entire UI branch is untested and regressions go undetected.
* **EIP-1193 and Polkadot provider specs define standardised rejection codes.** Tests that assert on the propagated error code (not just the absence of success) are far more specification-compliant and trustworthy.
* **Unlocks negative-path test scenarios.** A `rejectWithReason()` primitive enables test patterns like "confirm the dApp shows a 'Transaction cancelled' toast", "verify the Submit button re-enables after rejection", and "check that nonce is not consumed on the wallet side" — none of which are currently automatable with Chroma.

## Suggested scope

* Add `rejectWithReason(reason?: string)` to `MetaMaskWallet` that clicks the reject button and optionally injects the EIP-1193 error code / message into the response before dismissal.
* Add the equivalent `rejectTxWithReason(reason?: string)` to `PolkadotJsWallet` and `TalismanWallet` using the Substrate `cancelled` signalling path.
* Export a `WalletRejectionReason` enum / constant set (e.g. `USER_REJECTED`, `CHAIN_NOT_SUPPORTED`, `UNAUTHORIZED`) so callers reference symbolic names rather than raw strings.
* Add unit tests asserting that the correct reason propagates to the in-page provider mock.
* Document the feature in the wallet-specific README sections with a minimal test example.

## Category

feature / developer-experience

## Optional notes

This builds naturally on the previously proposed `WalletDriver` shared interface (#2026-03-21); `rejectWithReason` should be part of that interface so callers can reject uniformly across wallet types. A future extension could support custom error objects (e.g. `{ code, message, data }`) for wallets that surface structured errors to the dApp. The feature is particularly valuable for teams building wallet-connect flows where the rejection UX is a first-class concern (e.g. NFT minting UIs, DeFi approval flows).
