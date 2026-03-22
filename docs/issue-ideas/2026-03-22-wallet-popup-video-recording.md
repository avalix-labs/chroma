# Issue Idea — 2026-03-22

**Title:** Add opt-in video recording for wallet extension popups during test runs

---

## Summary

Playwright's built-in `video` option only captures the main dApp page; wallet extension popup pages opened by Chroma are navigated in separate `Page` objects and are never recorded. Adding an opt-in `recordVideo` field to `ChromaTestOptions` would let Chroma wrap every wallet `Page` it creates with Playwright's `page.video()` API and attach the resulting `.webm` files to the test report, giving developers a replay of exactly what the wallet UI did during a failure.

## Why it matters

* Wallet extension popups are the hardest part of an E2E test to debug — they open and close in milliseconds, and the only evidence of what went wrong is a cryptic timeout or `locator not found` error. A video replay eliminates that blind spot.
* CI environments (GitHub Actions, Docker) are headless, making manual reproduction impossible; recorded video is the only way to confirm whether a popup appeared at all, what state it was in, and whether a wrong button was clicked.
* Other Playwright-native utilities (e.g. `attachments`, `testInfo.attach()`) already support video; hooking into the same mechanism keeps the developer experience consistent and makes videos show up automatically in the HTML report.

## Suggested scope

* Add `recordVideo?: boolean | Playwright.RecordVideoOptions` to `ChromaTestOptions` (in `src/context-playwright/types.ts`).
* In the wallet factory / fixture setup, when `recordVideo` is truthy, call `context.newPage()` with the video option (or use `page.video()` post-creation) for every popup page Chroma opens internally (onboarding, sidepanel, unlock pages).
* After each test, collect video paths via `page.video()?.path()` and attach them to `testInfo` using `testInfo.attach('metamask-popup-video', { path, contentType: 'video/webm' })` so they appear in the Playwright HTML report.

## Category

developer-experience

## Optional notes

Playwright records video per-`Page` when `recordVideo` is set on the browser context, but Chroma opens popup pages on an *already-created* context, so the straightforward path is to pass `recordVideo` when creating the `BrowserContext` in the worker fixture and ensure all subsequently opened pages inherit it automatically. A follow-up could add a `--record-video` CLI flag to the `npx @avalix/chroma` toolchain to enable this without editing `playwright.config.ts`.
