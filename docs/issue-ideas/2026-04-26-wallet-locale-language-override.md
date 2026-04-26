# Issue Idea: 2026-04-26

**Title:** Add `locale` option to `createWalletTest` to override wallet extension UI language

## Summary

Wallet extensions (MetaMask, Talisman, Polkadot-JS) render their popup UI in the browser's locale, which in CI often defaults to a system language that mismatches the selectors Chroma relies on. Adding a `locale` option to `createWalletTest` that forwards the value to Playwright's `BrowserContext` configuration would make tests locale-agnostic and predictable across environments.

## Why it matters

- **CI environment drift**: CI runners may be provisioned with non-English system locales, causing Chroma's hardcoded text-based selectors (e.g., `"Approve"`, `"Sign"`, `"Confirm"`) to fail silently with unhelpful timeouts.
- **International dApp developers**: Teams building dApps for non-English markets need to verify that wallet copy matches their translated UI, which requires running Chroma tests in a specific locale without globally changing the runner's OS settings.
- **Reproducibility**: Pinning a locale in `createWalletTest` makes the entire test run deterministic regardless of where it executes, removing a whole class of environment-specific flakiness.

## Suggested scope

- Accept an optional `locale` string (BCP 47, e.g., `"en-US"`, `"fr-FR"`) in the `ChromaTestOptions` / `createWalletTest` config object.
- Forward the value to Playwright's [`BrowserContextOptions.locale`](https://playwright.dev/docs/api/class-browser#browser-new-context-option-locale) when launching each wallet's persistent browser context.
- Default to `"en-US"` if not set, so existing tests are unaffected and selectors remain stable by default.

## Category

developer-experience

## Optional notes

- A complementary `timezoneId` option (also a `BrowserContextOptions` field) could be bundled in the same PR as it addresses the same category of environment-drift issue.
- If Chroma ever gains selector-adapters that read live wallet UI text rather than hardcoding strings, locale pinning becomes less critical for correctness—but still valuable for deterministic screenshots and Playwright traces.
- This is a low-risk, small-surface-area change with high leverage: a single config field eliminates an entire category of CI-only test failures.
