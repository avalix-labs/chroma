# `lockWallet()` / `unlockWallet()` Helpers for Testing Locked-Wallet UX Flows

**Date:** 2026-04-12
**Category:** feature
**Package:** `@avalix/chroma`

---

## Title

Add `lockWallet()` and `unlockWallet()` driver methods to test dApp behaviour when the wallet is locked

## Summary

Many dApps must handle the case where the user's wallet is locked mid-session — e.g. after an idle timeout — and gracefully prompt re-authentication. There is currently no way to programmatically lock or unlock a wallet extension from within a Chroma test, making it impossible to exercise these code paths reliably.

## Why it matters

* **Untested real-user scenario:** Wallets lock after inactivity, a browser restart, or explicit user action. Without `lockWallet()` these flows can only be tested manually, leaving a significant gap in automated regression coverage.
* **dApp resilience:** Connection-required dApps need to detect the `wallet locked` or `no accounts available` state and re-trigger the connect flow; `lockWallet()` lets tests assert this behaviour deterministically.
* **Security regression prevention:** Locked-wallet enforcement is a security feature. An automated test that verifies a dApp cannot sign transactions while the wallet is locked guards against accidental regressions in permission-gating logic.

## Suggested scope

* Add `lockWallet(): Promise<void>` to each driver (MetaMask, Talisman, Polkadot-JS) that navigates to the extension settings page and clicks the lock button, or invokes `chrome.runtime.sendMessage` with the wallet's internal lock command where available.
* Add `unlockWallet(password: string): Promise<void>` that enters the password in the lock screen and confirms, leaving the extension in a fully unlocked state.
* Expose both methods on the shared `WalletDriver` interface so tests can be written against the common type without wallet-specific branching.
* Add a test fixture helper `lockedWallet` (analogous to the existing `wallet` fixture) that starts each test with the wallet already locked, reducing boilerplate for suites focused on this scenario.
* Document the methods in the driver API reference with a worked example showing a dApp that detects a locked wallet and shows a "Please unlock your wallet" banner.

## Category

feature

## Optional notes

Each wallet stores its lock state differently. MetaMask exposes a `lockMetaMask` background method callable via the extension's background service worker; Talisman and Polkadot-JS have a lock button in their settings UI that can be clicked via Playwright locators. The implementation may need to use different strategies per driver, but the public API should be uniform. A `isLocked(): Promise<boolean>` read method could be added as a follow-up to allow assertions without triggering state changes.
