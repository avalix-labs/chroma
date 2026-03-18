# Attach wallet extension popup screenshots to Playwright report on test failure

## Summary

When a wallet popup interaction fails in CI, Playwright automatically captures a screenshot of the main dApp page — but any open extension popup pages (opened via `context.newPage()`) are not captured. Engineers debugging flaky CI runs get zero visual evidence of what the MetaMask, Talisman, or Polkadot-JS popup looked like at the point of failure.

## Why it matters

* Extension popup pages are separate `Page` instances from the main test page; Playwright's built-in screenshot-on-failure only captures the fixture `page`, leaving the wallet popup interaction entirely invisible in the HTML report.
* Debugging failures like "MetaMask side panel not found" or a mis-clicked button inside the popup currently requires pure guesswork without a screenshot or video of the extension page at the time of failure.
* Adding automatic popup screenshots to the Playwright test report would collapse the feedback loop for CI failures from hours of manual reproduction to a single image inspection.

## Suggested scope

* In the `page` fixture inside `createWalletTest`, wrap the `use()` call so that after the test, if `testInfo.status !== testInfo.expectedStatus`, all pages in `walletContext` matching `chrome-extension://` are screenshotted and attached via `testInfo.attach('wallet-popup-<wallet>-<index>', { body, contentType: 'image/png' })`.
* Add an `attachFailureScreenshots` boolean option to `ChromaTestOptions` (default `true`) so users can opt out if they manage their own tracing.
* Document the feature in the README under a new "Debugging" section, showing a sample Playwright HTML report with attached wallet popup screenshots.

## Category

developer-experience

## Optional notes

This can be implemented without breaking the existing fixture contract — the screenshot attachment happens after `use()` returns, within the same fixture teardown. Because `walletContext` is worker-scoped and `testInfo` is test-scoped, the fixture teardown for `page` (which is test-scoped) has access to both. Care should be taken to handle the case where a popup was already closed before teardown (swallow the `context.pages()` filter gracefully). A future expansion could enable Playwright trace recording for extension pages specifically, since `context.tracing` currently traces the context as a whole but trace viewers may not render extension page frames correctly.
