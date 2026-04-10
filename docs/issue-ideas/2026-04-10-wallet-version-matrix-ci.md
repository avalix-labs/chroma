# Issue Idea: Wallet Version Matrix Testing in CI

**Date:** 2026-04-10
**Category:** testing / CI/CD

---

## Title

Add wallet version matrix support to CI so tests run against multiple extension versions simultaneously

## Summary

Chroma pins each supported wallet to a single extension version (e.g. Polkadot-JS v0.62.6, MetaMask Flask v13.17.0), which means regressions introduced in newer wallet releases are only discovered after a manual version bump. A version matrix CI workflow would let maintainers and dApp authors run the full test suite against both the pinned version and the latest release of each wallet, catching breakage proactively.

## Why it matters

* Wallet UIs change frequently and without notice; a new release can silently break selectors, flow ordering, or permission dialogs — a matrix job surfaces this before it reaches users.
* dApp teams often pin Chroma to an older version precisely because they distrust unverified extension updates; a published compatibility matrix gives them concrete evidence to upgrade with confidence.
* For MetaMask Flask specifically, Snap API changes land frequently in minor releases, making version-matrix coverage especially valuable for `approveSnapInstall()` and related handlers.

## Suggested scope

* Add a `WALLET_VERSIONS` matrix environment variable (JSON or comma-separated) that `download-extensions` reads to build version-specific extension directories alongside the default pinned ones.
* Expose a GitHub Actions reusable workflow (`.github/workflows/wallet-matrix.yml`) that fans out parallel jobs for each `(wallet, version)` pair and publishes a summary compatibility table as a workflow artifact.
* Add a `chroma list-versions` CLI subcommand that queries the upstream GitHub Releases API for each supported wallet and prints the N most-recent available versions, making it easy to populate the matrix.

## Category

testing / CI/CD

## Optional notes

The matrix does not need to run on every commit — a nightly cron or a manual `workflow_dispatch` trigger is sufficient. Long term, the compatibility table could be auto-published to the Chroma docs site (e.g., as a JSON artifact consumed by Mintlify), giving ecosystem adopters a live "works with" badge per wallet version. This idea complements the existing extension download integrity verification (2026-04-01) since each version in the matrix should also have its SHA-256 verified.
