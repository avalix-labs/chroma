# Add Structured JSON Report Attachment for Wallet Operations per Test

**Date:** 2026-04-20
**Category:** developer-experience

---

Title: Add structured JSON report attachment for wallet operations per test

Summary:
After each Playwright test, Chroma should emit a machine-readable JSON attachment containing a timestamped log of every wallet operation that occurred (e.g. `importSeedPhrase`, `authorize`, `confirm`, `reject`). This gives CI pipelines, test analytics dashboards, and debugging workflows a reliable, structured audit trail of wallet interactions beyond what Playwright's default reporter captures.

Why it matters:

* Teams running large dApp test suites in CI have no structured way to understand which wallet steps succeeded or failed across dozens of tests — only raw console output or screenshots. A JSON attachment turns wallet interactions into queryable, aggregatable data.
* When a test flakes intermittently, it is currently impossible to tell whether the failure was in the dApp UI or in a wallet step without manually reading trace files. A per-operation log with timings and outcomes enables fast triage.
* Third-party test observability tools (Allure, TestRail, DataDog CI Visibility) ingest Playwright attachments natively; a structured wallet log attachment can be consumed by these tools with zero extra configuration.

Suggested scope:

* Add an internal `OperationLogger` class that each wallet driver writes to on every public method call (operation name, wallet type, start/end timestamps, outcome: `success` | `error`, and optional error message).
* Expose a `attachWalletReport` fixture helper that serialises the logger's collected entries as a JSON attachment on the Playwright `testInfo` object using `testInfo.attach('wallet-operations', { contentType: 'application/json', body: ... })`.
* Document the attachment schema (a simple JSON array of operation entries) in the README and provide a small example showing how to read the attachment in a custom Playwright reporter.

Category:
developer-experience

Optional notes:
The `OperationLogger` should be opt-in via `ChromaTestOptions` (e.g. `walletReport: true | 'always' | 'on-failure'`) to avoid performance overhead in projects that do not need it. A future expansion could include a `chroma report` CLI subcommand that reads all `wallet-operations` attachments from a Playwright JSON results file and prints a cross-test wallet operation summary table to stdout.
