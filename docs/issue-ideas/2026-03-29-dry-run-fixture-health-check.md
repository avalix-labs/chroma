# Add `dryRun` / fixture smoke-test mode to validate wallet setup without a dApp

**Date:** 2026-03-29
**Category:** developer-experience

---

## Title

Add `dryRun` option to `ChromaTestOptions` for fixture-level wallet health checks

## Summary

Introduce a `dryRun: true` flag in `ChromaTestOptions` that exercises the full wallet fixture lifecycle — extension download check, browser launch, extension load, onboarding, and account import — without requiring a dApp URL or any test-specific interactions. This gives teams a fast, standalone way to verify that the Chroma setup is healthy in a new environment or after a wallet version bump.

## Why it matters

- **Faster feedback on environment issues:** Onboarding or extension-load failures surface immediately when running `chroma dry-run` (or a dedicated test file), instead of being discovered mid-suite after many minutes of CI time.
- **Wallet version upgrade confidence:** When bumping `TALISMAN_CONFIG.VERSION` or `METAMASK_CONFIG.downloadUrl`, a dry-run job can gate the version bump PR without needing a full dApp to be deployed.
- **Easier contributor onboarding:** New contributors can verify their local setup is correct with a single command rather than having to run the full E2E suite against a live dApp.

## Suggested scope

- Add `dryRun?: boolean` to `ChromaTestOptions` in `context-playwright/types.ts`.
- When `dryRun` is `true`, the fixture skips navigating to any dApp URL; instead, after wallet setup completes it asserts the extension popup is reachable (e.g. opens the extension's `dashboard.html` or `home.html` and checks for a known element).
- Expose a `chroma dry-run` CLI subcommand in `scripts/cli.js` that generates and runs a minimal Playwright project exercising dry-run mode for each configured wallet, then exits with code 0 on success.

## Category

developer-experience

## Optional notes

- The dry-run check can be structured as a reusable internal helper (`assertWalletReady(context, extensionId, walletType)`) so future wallet drivers can implement it without duplicating logic.
- A secondary use case is CI: a lightweight `dry-run` job (no dApp, no network calls beyond extension download) can run on every PR in under 60 seconds and block merges when the wallet fixture is broken.
- Consider making the dry-run output machine-readable (JSON) so it can be consumed by status dashboards or `gh` actions summary steps.
