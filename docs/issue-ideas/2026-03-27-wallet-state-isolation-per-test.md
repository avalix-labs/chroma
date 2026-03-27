# Issue Idea: Add Per-Test Wallet State Isolation via Profile Cloning

**Date:** 2026-03-27
**Category:** developer-experience

---

Title: Add per-test wallet state isolation via browser profile cloning

Summary:
Currently the `walletContext` fixture is worker-scoped, meaning all tests in a worker share the same persisted wallet state. This causes test pollution when one test modifies wallet settings, connected accounts, or network configuration, silently affecting subsequent tests. Introducing an opt-in `isolateWalletState` mode that snapshots and restores (or clones) the browser profile directory between tests would give teams reliable, order-independent test suites.

Why it matters:

* Worker-scoped context is efficient but brittle — a test that connects a dApp, switches networks, or adds a custom token leaves state that bleeds into every test that runs afterward in the same worker, causing flaky failures that are hard to diagnose.
* Explicit per-test isolation removes the need for manual teardown in `afterEach` hooks, which are error-prone and fragile against test timeouts.
* Teams writing large E2E suites (20+ tests per suite) hit this problem early; solving it would significantly lower the adoption barrier for `@avalix/chroma` in production CI pipelines.

Suggested scope:

* Add an `isolateWalletState?: boolean` flag to `ChromaTestOptions`; when `true`, snapshot the extension profile directory after the worker's initial `walletContext` setup by copying it to a temp directory.
* At the start of each test, restore the snapshot by replacing the live profile directory with a fresh copy before Playwright creates a new page (using Playwright's `beforeEach` hook within the fixture or a new test-scoped `page` factory that re-launches `launchPersistentContext` from the snapshot).
* Document the performance trade-off (a full profile copy per test adds ~50–200 ms overhead) and recommend the flag for integration-level tests while keeping the default worker-scoped behaviour for speed-critical smoke suites.

Category:
developer-experience

Optional notes:
An alternative lighter-weight approach would be to expose a `wallets.reset()` method that programmatically restores each wallet driver to its post-setup state (disconnect all sites, reset network to default) via UI automation rather than filesystem cloning. This would be faster but harder to maintain as wallet UIs evolve. The filesystem snapshot approach is more robust and wallet-agnostic. A future extension could offer a `chromaSnapshot()` / `chromaRestore()` pair as first-class test helpers for use in `beforeEach`/`afterEach`, similar to how database test libraries expose transaction rollback helpers.
