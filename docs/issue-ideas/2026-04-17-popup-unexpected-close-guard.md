# Detect and surface unexpected wallet popup closures with a descriptive error

**Date:** 2026-04-17
**Category:** developer-experience

---

Title: Detect and surface unexpected wallet popup closures with a descriptive error

Summary:
When a wallet popup closes before the test has a chance to interact with it (e.g., the extension auto-dismissed the request, the popup window crashed, or the user accidentally closed it during manual debugging), Chroma currently hangs until a Playwright timeout fires and emits a generic locator-not-found error. Add a popup-lifetime guard that detects early closure and immediately throws a clear, actionable error message.

Why it matters:

* Timeout-based failures on popup interactions are the hardest class of Chroma errors to diagnose; a "popup closed unexpectedly" message cuts debugging time dramatically compared to a raw `locator.click() - waiting for element to be visible` timeout.
* Wallet extensions frequently auto-dismiss popups after a short idle timeout or when another request supersedes the current one — this is a real, recurring source of flakiness in CI that is currently invisible at the Chroma level.
* A clear early-exit error makes it obvious whether the issue is in the dApp (request never triggered), the wallet (popup opened then self-closed), or the test (interaction was too slow) — giving developers a concrete next step instead of a wall of Playwright stack frames.

Suggested scope:

* In `findExtensionPopup` (or the equivalent per-driver helper), attach a `page.on('close', ...)` listener before yielding the popup page reference; if the page closes while the caller is still interacting with it, reject the in-flight promise with `ChromaPopupClosedError: wallet popup closed unexpectedly before <action> could complete`.
* Expose a `ChromaPopupClosedError` class (extending `Error`) so tests can `catch (e) { if (e instanceof ChromaPopupClosedError) ... }` and optionally retry or fail with a custom message.
* Add a `popupCloseTimeout` option to `ChromaTestOptions` (default: wait indefinitely, i.e. existing behaviour) so teams can opt into a hard deadline after which an un-interacted popup is treated as a failure rather than a hang.

Category:
developer-experience

Optional notes:
The popup close event can be detected in Playwright via `page.on('close', handler)` on the popup `Page` object. The guard should be implemented at the driver base layer so every wallet driver (Polkadot-JS, Talisman, MetaMask) benefits automatically without per-driver changes. A follow-up could wire the guard into the Playwright trace so the trace viewer shows a "popup closed" annotation at the precise timestamp, making replay debugging even faster.
