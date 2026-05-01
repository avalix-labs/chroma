# Add per-version CSS selector override map for wallet popup UI changes

**Date:** 2026-05-01
**Category:** developer-experience

---

## Title

Add per-version CSS selector override map to wallet drivers to survive extension UI changes between versions

## Summary

Wallet extension UI layouts change between versions, causing hardcoded CSS selectors inside Chroma's drivers to break silently when a new extension version ships. Adding a `selectorOverrides` map to each wallet driver — keyed by extension semver range — lets maintainers patch broken selectors without requiring a new Chroma release, and lets users opt-in to custom selectors when running non-standard extension builds.

## Why it matters

* Wallet extensions release frequently (MetaMask, Talisman, Polkadot-JS all ship minor/patch updates every few weeks); a single renamed CSS class or restructured DOM tree breaks an entire test suite with no actionable error message.
* Teams that pin extension versions for CI stability are blocked from upgrading until Chroma also ships a driver update — decoupling selector maps from driver code allows both parties to move independently.
* Users running custom or pre-release extension builds (e.g. MetaMask Flask nightly) have no current mechanism to adapt selectors without forking the driver code.

## Suggested scope

* Add an optional `selectorOverrides?: Partial<Record<string, string>>` field to the per-wallet driver options type (e.g. `MetaMaskDriverOptions`, `TalismanDriverOptions`), allowing callers to override named selector constants by key.
* Expose the internal selector constants each driver uses (e.g. `METAMASK_SELECTORS`, `TALISMAN_SELECTORS`) as a named export so users can inspect and partially override them without guessing key names.
* Add a `selectorOverridesFile?: string` path option that loads a JSON map at test startup, enabling teams to maintain a repo-local `selectors.json` that is updated independently from Chroma upgrades.

## Category

developer-experience

## Optional notes

A longer-term extension of this idea would be a `chroma verify-selectors` CLI command that opens a wallet extension popup in a headless browser and dry-runs each selector against it, reporting which selectors are no longer matching — giving maintainers an automated compatibility check before cutting a release. Selector maps could also be published as a separate versioned JSON artifact (e.g. `@avalix/chroma-selectors`) so the community can contribute version-specific patches without touching driver logic.
