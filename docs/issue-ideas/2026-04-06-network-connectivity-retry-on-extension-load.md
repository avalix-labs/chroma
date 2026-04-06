# Issue Idea — 2026-04-06

**Title:** Add configurable retry logic for wallet extension load failures in flaky CI environments

---

## Summary

When Chroma loads a wallet browser extension in a headless CI environment, transient failures (extension service worker crash, race between extension initialization and the first fixture call) cause the entire test run to abort rather than transparently retrying. Adding configurable extension-load retry logic would make `@avalix/chroma` significantly more resilient in ephemeral, resource-constrained CI runners.

## Why it matters

* **CI flakiness is the #1 adoption barrier** — developers who hit "extension not ready" failures on their first run often abandon the tool before ever seeing a passing test; retrying silently eliminates these false negatives.
* **Service worker lifecycle is non-deterministic** — Chrome's MV3 service workers can be killed and restarted by the browser at any time, and the window between "extension installed" and "service worker ready to handle messages" is variable, especially under CPU load on shared CI machines.
* **Fixes a whole class of bugs without requiring per-extension workarounds** — rather than each `WalletDriver` implementing its own polling loop, a single retry layer at the fixture bootstrap level benefits all current and future wallet integrations uniformly.

## Suggested scope

* Add `extensionLoadRetries` (default: `2`) and `extensionLoadRetryDelay` (default: `1500` ms) fields to `ChromaTestOptions` / `WalletConfig`.
* In the fixture bootstrap (wherever `findExtensionPopup` / the extension ID probe currently runs), wrap the load attempt in a retry loop that catches "extension not found" / timeout errors and re-launches the browser context before re-trying.
* Emit a `console.warn` (or Playwright `test.info()` annotation) whenever a retry is triggered so developers can see the flakiness without having to enable debug mode.

## Category

developer-experience

## Optional notes

This overlaps slightly with the 2026-03-11 idea (enriching `findExtensionPopup` timeout errors with diagnostics) but is orthogonal — diagnostics tell you *what* failed; retry logic *recovers* from it automatically. A follow-up could expose retry statistics via `test.info().annotations` so they surface in Playwright HTML reports. Long-term, the retry count could feed into a flakiness dashboard if Chroma ever ships telemetry.
