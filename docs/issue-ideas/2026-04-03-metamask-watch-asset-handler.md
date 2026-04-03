# Add `watchAsset()` / `dismissWatchAsset()` helpers for MetaMask's `wallet_watchAsset` popup

**Date:** 2026-04-03
**Category:** feature

---

## Title

Add `watchAsset()` and `dismissWatchAsset()` helpers to the MetaMask driver for `wallet_watchAsset` (EIP-747) popups

---

## Summary

Many dApps call `wallet_watchAsset` (EIP-747) after a token swap, deployment, or bridging operation to prompt the user to add a custom token to their MetaMask asset list. The current MetaMask driver in `@avalix/chroma` has no dedicated handler for this popup, leaving test authors to write fragile ad-hoc automation or silently skip the confirmation step.

---

## Why it matters

- **Coverage gap in common dApp flows.** Token-related operations (DEX swaps, bridge UI, NFT mints) almost always trigger a `wallet_watchAsset` popup as the final step; skipping it in tests means the post-confirmation UX is never exercised end-to-end.
- **Current workaround is brittle.** Developers who need to handle this today must duplicate the `findExtensionPopup` + button-click logic themselves, tightly coupling their tests to internal MetaMask UI details that can change between extension versions.
- **Symmetry with existing driver API.** The driver already has `authorizeMetaMask`, `confirmMetaMask`, and `rejectMetaMask`; adding `watchAsset` / `dismissWatchAsset` keeps the API surface consistent and predictable for new users.

---

## Suggested scope

- Add `watchAsset(page)` to `metamask.ts` — opens the MetaMask side panel, clicks the **"Add token"** button in the `wallet_watchAsset` confirmation popup, then closes the popup page.
- Add `dismissWatchAsset(page)` to `metamask.ts` — same popup discovery flow but clicks **"Cancel"**, enabling tests that verify a dApp handles user refusal gracefully.
- Export both functions from the package index and document them in the README alongside the existing MetaMask driver functions, with a usage example showing the typical "swap → watch asset" sequence.

---

## Category

feature

---

## Optional notes

The `wallet_watchAsset` popup in MetaMask Flask appears as a side-panel target (same as other confirmation popups) so the existing `findExtensionPopup` CDP-based helper in `metamask.ts` should be reusable without modification. The primary implementation effort is identifying the correct `data-testid` attributes for the **"Add token"** and **"Cancel"** buttons in the current Flask build (v13.x). If MetaMask exposes the popup as a separate `notification.html` target in some versions, a fallback page-scan strategy (similar to the Talisman/Polkadot-JS drivers) may be needed. Longer-term, this helper could be generalized to inspect which asset is being requested — useful for tests that assert the dApp proposes the correct token contract address after deployment.
