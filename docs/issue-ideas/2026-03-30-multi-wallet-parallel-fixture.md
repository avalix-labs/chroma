# Add Multi-Wallet Fixture Support for Testing Multi-Party dApp Flows

**Date:** 2026-03-30
**Category:** feature

---

## Title

Add multi-wallet fixture support for testing multi-party dApp flows (e.g. multi-sig, governance)

## Summary

Many real-world dApps require interactions from more than one distinct wallet within a single test — for example, a multi-sig requiring two signers, a DAO governance flow where a proposer and a voter must both act, or an NFT marketplace trade between a buyer and seller. Currently, `@avalix/chroma` fixtures only surface a single wallet context per test, making it impossible to orchestrate such flows without manual boilerplate.

## Why it matters

* **Multi-sig and DAO contracts are among the most commonly audited and tested contract types.** Developers building on them need a clean way to drive two (or more) independent wallets in one Playwright test, each with its own browser context and extension profile.
* **Without first-class support, teams resort to fragile workarounds** such as spawning separate test processes, sharing browser profiles across parallel workers (causing interference), or skipping E2E coverage entirely for multi-party flows — leaving critical paths untested.
* **Establishing this pattern now sets the foundation** for future enhancements like role-based fixtures (`{ alice, bob }`) and multi-network testing, making `@avalix/chroma` the go-to library for complex dApp E2E scenarios.

## Suggested scope

* Add a `multiWalletFixture` export (or extend `chromaFixture`) that accepts a named map of wallet configs, e.g. `{ alice: { wallet: 'polkadot-js', ... }, bob: { wallet: 'talisman', ... } }`, and surfaces each as an independent, fully-initialised wallet driver.
* Ensure each wallet runs in an isolated `BrowserContext` with its own extension profile directory so that state, approvals, and accounts do not bleed between participants.
* Provide a runnable example test in `packages/e2e-polkadot-js` (or a new `packages/e2e-multiwallet`) demonstrating a two-signer approval flow against a local test dApp.

## Category

feature

## Optional notes

The implementation should be careful about resource usage: each wallet participant requires its own browser context and service worker, so a two-wallet test will effectively double browser overhead. Documenting the performance implications and recommending `test.setTimeout` adjustments will be important. A longer-term follow-up could introduce a `sharedBrowser` option that reuses the same browser process while keeping contexts isolated, reducing startup cost for larger participant counts. This also pairs well with the previously proposed `Per-test wallet state isolation via browser profile cloning` issue.
