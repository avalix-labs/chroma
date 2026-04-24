# Issue Idea: 2026-04-24

**Title:** Add `beforeWalletAction` / `afterWalletAction` lifecycle hooks to wallet drivers

**Category:** developer-experience

---

## Summary

Allow test authors to register async callback hooks that fire before and after every wallet driver action (e.g., `approve`, `reject`, `signMessage`), enabling cross-cutting concerns such as logging, metrics, custom screenshots, or test-framework integrations to be wired in without modifying driver source code.

## Why it matters

- Many teams need to record telemetry, capture screenshots, or emit custom events for every wallet interaction in their CI pipelines, but currently must patch driver calls by hand at every call site.
- Lifecycle hooks establish a clean extension point so third-party integrations (Allure, Datadog CI Visibility, custom reporters) can instrument wallet actions without forking Chroma.
- They also make it possible to enforce project-level invariants (e.g., "always wait 500 ms after every wallet approval") in a single declaration rather than scattered `await page.waitForTimeout()` calls.

## Suggested scope

- Add an optional `hooks?: { beforeAction?: (action: string) => Promise<void>; afterAction?: (action: string, error?: Error) => Promise<void> }` field to `ChromaTestOptions` (or a per-driver `configure()` method).
- Call `hooks.beforeAction(actionName)` at the start and `hooks.afterAction(actionName, err?)` at the end of each public driver method, wrapping the call in `try/finally`.
- Document the hook API with a worked example showing how to attach an Allure step label around every wallet driver action.

## Optional notes

Hooks should receive the action name as a string (e.g., `"approve"`, `"signMessage"`) and optionally the serialised arguments, so hook implementations can make decisions based on action type. A future expansion could expose a richer `WalletActionContext` object (wallet name, page URL, timestamp) for more powerful integrations.
