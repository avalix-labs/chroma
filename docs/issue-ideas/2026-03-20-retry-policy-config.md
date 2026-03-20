# Issue: Make wallet popup polling configurable via `ChromaTestOptions` (timeout + retry interval)

**Date:** 2026-03-20
**Category:** developer-experience / enhancement

---

## Title

Add configurable `popupTimeout` and `retryInterval` to `ChromaTestOptions` for wallet popup polling

## Summary

Every wallet driver hardcodes `maxAttempts = 10` with a `retryDelay = 500 ms`, giving a fixed 5-second ceiling before a test fails with a cryptic "popup not found" error. Test suites running against slow CI machines, remote DevTools endpoints, or high-`slowMo` values frequently need more headroom, while fast local runs would benefit from tighter loops. Exposing these knobs through `ChromaTestOptions` lets users tune retry behaviour without forking the library.

## Why it matters

* **Flaky CI failures on slow runners.** On resource-constrained GitHub-hosted or Docker runners the wallet service worker can take 6–10 seconds to surface a popup, which silently exceeds the current 5-second cap and produces misleading timeout errors with no actionable context.
* **Developer UX on fast machines.** Developers running tests locally with `slowMo: 0` hit the 500 ms retry interval even when the popup is already ready, adding unnecessary latency to the feedback loop.
* **One config, consistent behaviour.** Today the same `maxAttempts`/`retryDelay` literals are copy-pasted into `metamask.ts`, `polkadot-js.ts`, and `talisman.ts`. Centralising them prevents per-driver drift where one wallet gets a bug fix but the others do not.

## Suggested scope

* Add two optional fields to `ChromaTestOptions` in `context-playwright/types.ts`:

  ```ts
  popupTimeout?: number   // total ms to wait for a wallet popup, default 5000
  retryInterval?: number  // ms between polling attempts, default 500
  ```

* Thread the resolved values from `createWalletTest` down into each wallet driver call site (or into a shared `findExtensionPopup` utility) so `maxAttempts` is computed as `Math.ceil(popupTimeout / retryInterval)`.

* Update the timeout-exceeded error message to include the configured values, e.g.:
  `MetaMask side panel not found for ID: <id> (waited 10000 ms with 500 ms interval)`.

* Add a brief entry to the README's "Configuration" section documenting the two new options with an example for CI environments.

## Category

developer-experience / enhancement

## Optional notes

A natural follow-up would be to surface these values as environment variables (`CHROMA_POPUP_TIMEOUT`, `CHROMA_RETRY_INTERVAL`) so they can be overridden in CI without touching test code. The PR implementing this could also consolidate the duplicated `maxAttempts`/`retryDelay` constants across the three wallet drivers into a single shared helper, reducing future maintenance surface.
