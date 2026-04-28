# Issue Idea: `exportWalletState()` / `importWalletState()` for Portable Wallet Fixtures

**Date:** 2026-04-28
**Category:** feature

---

Title: Add `exportWalletState()` / `importWalletState()` for portable, versioned wallet fixture snapshots

Summary:
Provide two driver-level helpers — `exportWalletState()` and `importWalletState()` — that serialise and restore a wallet's full profile (accounts, settings, and connected sites) as a self-contained fixture file. This lets teams commit reproducible wallet states to version control and restore them in CI without running through the full setup flow on every run.

Why it matters:

* Wallet setup sequences (creating an account, adding a custom RPC, approving a site) are slow and fragile; exporting a pre-configured state eliminates repeated UI traversal in every suite.
* State files checked into the repo act as living documentation of the exact wallet configuration under test, making failures reproducible across machines, operating systems, and CI providers without special environment setup.
* Versioned fixture files make it straightforward to test wallet migrations — import a state from a previous wallet version and assert that accounts and settings survive an extension upgrade.

Suggested scope:

* Add `exportWalletState(destPath: string): Promise<void>` to `WalletDriver` that zips the wallet's Chromium profile directory and writes it to `destPath`.
* Add `importWalletState(srcPath: string): Promise<void>` to `WalletDriver` that unpacks the zip into a fresh temporary profile directory before the extension loads, replacing the default empty profile.
* Expose a `walletStateFile` shorthand in `createWalletTest` / `ChromaTestOptions` so a fixture file is loaded automatically during test setup without calling `importWalletState()` manually in every file.

Category:
feature

Optional notes:
The zip format should be documented and kept stable across minor releases so that fixture files remain usable after Chroma upgrades. A `chroma snapshot` CLI subcommand could wrap `exportWalletState()` for non-programmatic use (e.g. a developer runs it once locally and commits the result). Care is needed on Windows vs. Linux profile paths; the implementation should normalise path separators inside the zip. Long-term, this could pair with the wallet version matrix CI idea (2026-04-10) to test state migration across wallet extension versions automatically.
