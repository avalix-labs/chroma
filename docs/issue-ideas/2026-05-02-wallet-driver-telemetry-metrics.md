# Issue Idea: Opt-in Timing Telemetry for Wallet Driver Operations

**Date generated:** 2026-05-02
**Category:** developer-experience

---

## Title

Add opt-in timing telemetry to wallet driver operations for slow-test diagnosis

## Summary

Wallet driver operations (popup detection, approval, rejection) can silently become the bottleneck in E2E suites, yet there is currently no way to measure how long each individual wallet interaction takes. Adding opt-in timing telemetry — emitted via Playwright's `testInfo.attachments` or a structured log channel — would let teams pinpoint which wallet steps account for the most wall-clock time across CI runs.

## Why it matters

* **Invisible latency:** When a test suite takes 5 minutes, developers cannot tell whether the wallet popup is slow to appear, the dApp is slow to respond, or the test assertions are the bottleneck. Per-operation timing removes this guesswork.
* **Regression detection:** A wallet extension upgrade may quietly double the time it takes to render the approval popup. Without baseline metrics, this regression goes undetected until the CI timeout fires.
* **Actionable optimizations:** Teams that *can* see wallet timing data can act on it — for example by pre-warming profiles in `globalSetup`, tuning `popupTimeout`, or batching requests — but they need the data first.

## Suggested scope

* Add a `telemetry: boolean` (default `false`) field to `ChromaTestOptions`; when enabled, wrap each wallet driver public method in a `performance.now()` start/end pair.
* Emit timing records as a Playwright attachment (JSON) on each test, structured as `{ operation, walletType, durationMs, timestamp }` so CI reporters can parse or visualise them.
* Expose a `onTelemetry(record: TelemetryRecord) => void` callback in `ChromaTestOptions` for teams that want to forward metrics to an external observability platform (DataDog, Grafana, etc.) rather than file attachments.

## Category

developer-experience

## Optional notes

The telemetry wrapper should be a thin decorator over existing driver methods — no changes to the core interaction logic. A future enhancement could aggregate per-operation p50/p95 across a run and print a summary table at the end of the test session (similar to how Playwright prints slow-test warnings). The `onTelemetry` callback pattern also sets a useful foundation for an eventual `chroma bench` command that runs wallet operations in isolation to produce repeatable latency benchmarks.
