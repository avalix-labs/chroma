# Issue Idea: 2026-04-09

**Title:** Add `signRaw()` / `rejectSignRaw()` support for Polkadot-JS and Talisman drivers (off-chain message signing)

---

Title: Add `signRaw()` / `rejectSignRaw()` helpers for off-chain message signing in Polkadot-JS and Talisman drivers

Summary:
The Polkadot `@polkadot/extension-dapp` API exposes a `signRaw()` method that lets dApps request a wallet to sign arbitrary bytes off-chain — used by SIWE-equivalent flows on Substrate (e.g. login with wallet, identity proofs, governance auth). Neither the Polkadot-JS driver nor the Talisman driver in `@avalix/chroma` currently exposes helpers to approve or reject these raw-signing popups, forcing test authors to interact with the extension UI manually via raw Playwright locators.

Why it matters:

* Off-chain message signing (`signRaw`) is widely used in Substrate dApps for authentication flows (e.g. "Sign in with Polkadot"), NFT minting gating, and identity verification — all of which are critical user journeys that need E2E coverage.
* Without a first-class helper, test authors must duplicate brittle, hardcoded UI interactions inside each test suite, making tests fragile across extension version upgrades.
* The existing `approvePolkadotJSTx` / `approveTalismanTx` helpers target extrinsic signing (which requires a password unlock); raw-signing popups have a different UI flow and do not always require the password, making them incompatible with the existing helpers.

Suggested scope:

* Add `approvePolkadotJSSignRaw(page)` and `rejectPolkadotJSSignRaw(page)` functions to `src/wallets/polkadot-js.ts` that locate the raw-sign popup and click the appropriate confirm/cancel button.
* Add `approveTalismanSignRaw(page)` and `rejectTalismanSignRaw(page)` functions to `src/wallets/talisman.ts` targeting the Talisman "Sign" confirmation popup for raw-byte requests.
* Export the new helpers from `src/index.ts` and add a corresponding entry to `TEST_MATRIX.md` listing the raw-sign flow as a tested interaction.

Category:
feature

Optional notes:
In Polkadot-JS extension the raw-sign popup renders at the same `chrome-extension://<id>/index.html` URL as the extrinsic popup, but shows a "Sign the message" button instead of "Sign the transaction". The implementation can reuse `findExtensionPopup` and distinguish the flow by looking for that button label. For Talisman, the raw-signing confirmation is rendered in the standard side-panel popup under a "Sign" heading without a password field. A future expansion could expose a `getSignRawPayload(page)` helper to let tests assert the message content before confirming, closing the gap with the `getPendingRequest()` concept already proposed for MetaMask.
