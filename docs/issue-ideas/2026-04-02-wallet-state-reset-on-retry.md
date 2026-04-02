# Wallet State Reset on Playwright Test Retry

**Date:** 2026-04-02
**Category:** developer-experience

---

Title: Add wallet state reset hook for Playwright test retries

Summary:
When Playwright retries a flaky test (`retries` > 0), the wallet extension remains in whatever state the previous attempt left it — pending approval popups, open modals, a partially-signed transaction, or a locked wallet. This causes cascading failures on retries that are unrelated to the actual test logic, making test results unreliable and hard to diagnose.

Why it matters:

* Retried tests that hit a wallet in a dirty state will fail for a different reason than the original failure, hiding the true root cause and producing misleading CI results.
* Developers running suites with `--retries` lose confidence in retry semantics — a test that "passed on the second attempt" may have passed only because state was already partially set up from the first attempt, not because the test itself is reliable.
* Without a reset mechanism, teams are forced to either disable retries entirely (losing flakiness recovery) or manually tear down and rebuild the entire browser context, which is slow and loses the benefit of worker-scoped context reuse.

Suggested scope:

* Add an optional `onRetry` hook (or a `resetWalletState` fixture option) in `ChromaTestOptions` that is called by the fixture before each retry attempt, allowing drivers to dismiss open popups and close dangling extension pages.
* Implement a `resetState()` method on each wallet driver (`MetaMaskWalletInstance`, `PolkadotJsWalletInstance`, `TalismanWalletInstance`) that closes all open extension pages belonging to that wallet and navigates back to the wallet's default home/lock screen.
* Document the retry interaction model in the README, including a recommended `playwright.config.ts` snippet showing how `retries` and the reset hook work together.

Category:
developer-experience

Optional notes:
The reset could be implemented as a shallow page-level cleanup (close all open `chrome-extension://<id>/` pages) rather than a full context teardown, keeping it fast. For MetaMask specifically, reset could navigate to `home.html` to dismiss any pending confirmation UI. A future expansion could allow users to supply a custom `onRetry` async callback so advanced scenarios (e.g., re-importing a seed phrase after a botched onboarding retry) are also supported without changing the fixture API. This complements the existing per-test wallet state isolation idea (2026-03-27) but targets a different failure mode: recovery after failure rather than pre-test isolation.
