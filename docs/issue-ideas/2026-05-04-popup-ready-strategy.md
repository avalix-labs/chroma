# Issue Idea — 2026-05-04

**Title:** Add configurable popup-ready strategy to eliminate race conditions when wallet popups open

**Category:** developer-experience

---

## Summary

Wallet extension popups can have race conditions between the moment the browser opens them and the moment their UI is actually interactive, causing flaky `ElementNotFound` or `TimeoutError` failures in CI. Adding a configurable `popupReadyStrategy` option — with built-in strategies such as `networkidle`, `domcontentloaded`, and a custom locator wait — would let users match Chroma's waiting behavior to each wallet's real loading characteristics.

## Why it matters

- Race conditions between popup open and UI interactability are one of the most common sources of flaky Chroma tests in CI environments, where machines are slower than developer laptops.
- Currently, users must manually sprinkle `page.waitForLoadState()` or `page.waitForSelector()` calls between `findExtensionPopup` and driver actions, which is boilerplate that duplicates knowledge of each wallet's loading behavior.
- A first-class `popupReadyStrategy` makes test reliability a configurable concern at the fixture level, rather than scattered throughout individual tests.

## Suggested scope

- Add a `popupReadyStrategy` option to `ChromaTestOptions` (or per-wallet config) accepting `'networkidle' | 'domcontentloaded' | 'load' | { waitForSelector: string }`.
- Apply the strategy inside `findExtensionPopup` after the popup page is obtained, before returning it to the caller.
- Default to `'domcontentloaded'` (current implicit behavior) so existing tests are unaffected; document the option with per-wallet recommendations (e.g., MetaMask benefits from `networkidle`, Polkadot-JS from a specific locator).
- Add unit tests covering each strategy variant and a mock popup that intentionally delays its load event.

## Optional notes

A `{ waitForSelector: string }` custom strategy is especially useful for newer wallet versions that restructure their loading behavior — testers can pin to a stable landmark element (e.g., the approve button container) rather than relying on network or DOM lifecycle events. In the future this could be extended to a `{ waitForFunction: string }` escape hatch for more complex readiness checks.
