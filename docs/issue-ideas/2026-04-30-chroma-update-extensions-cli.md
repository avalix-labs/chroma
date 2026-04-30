# Issue Idea — 2026-04-30

**Title:** Add `chroma update-extensions` CLI command to automate wallet extension version bumps

---

## Summary

Introduce a `chroma update-extensions` subcommand that queries a maintained version manifest, determines which wallet extensions (Polkadot-JS, Talisman, MetaMask Flask) have newer releases available, and automatically updates the pinned version references in the project's Chroma config (or prints a diff for review). This removes the manual, error-prone process of discovering new extension releases and hand-editing version strings in config files.

## Why it matters

* Wallet extensions update frequently; today, version bumps require a developer to manually check GitHub releases for each wallet, update config/download URLs by hand, and open a PR—adding friction that causes teams to fall behind on wallet versions and potentially miss compatibility fixes.
* Stale extension versions in test suites mean E2E tests may pass against an outdated wallet UI that no longer matches what real users see in production, reducing the value of the test coverage.
* An automated update workflow lowers the barrier for projects to adopt Chroma across their CI pipelines, since keeping the wallet fixture current becomes a one-command operation rather than a maintenance burden.

## Suggested scope

* Add a `chroma update-extensions` command (alongside the existing `chroma download-extensions`) that fetches the latest published release version for each supported wallet from their respective GitHub Releases APIs and compares it against the currently pinned version.
* Print a human-readable table showing current vs. latest version for each wallet, and emit a non-zero exit code when any wallet has a newer release (enabling CI scheduling: `chroma update-extensions --check`).
* Include a `--write` flag that patches the version pin in the consumer's Chroma config file (or `chroma.config.ts`) in place, so teams can run the command locally or in an automated PR bot workflow without manually editing files.

## Category

developer-experience

## Optional notes

A future expansion could include a GitHub Actions workflow template (`chroma-update.yml`) that runs `chroma update-extensions --check` on a weekly schedule and opens a PR when outdated versions are detected, similar to Dependabot but scoped to wallet extensions. The manifest lookup could be implemented as a lightweight fetch against each wallet's GitHub Releases JSON endpoint (no dedicated registry server needed). Care should be taken to handle Flask vs. stable MetaMask version channels separately, since Flask (the Snaps-enabled build) follows a different release cadence than mainline MetaMask.
