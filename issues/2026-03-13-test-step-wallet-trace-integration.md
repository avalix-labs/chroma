# Wrap wallet driver operations in `test.step()` for Playwright trace and report integration

**Date:** 2026-03-13
**Category:** developer-experience

---

## Title

Wrap wallet driver operations in `test.step()` for Playwright trace and report integration

## Summary

Every wallet operation (`importSeedPhrase`, `unlock`, `authorize`, `confirm`, `reject`) currently runs as an unstructured sequence of raw Playwright actions with no named grouping. Wrapping each public wallet method in Playwright's built-in `test.step()` would surface them as labeled, collapsible steps in the HTML reporter and trace viewer, making CI failures dramatically easier to diagnose without any changes to test author code.

## Why it matters

* Currently failing CI runs show a flat, hard-to-navigate list of locator interactions inside wallet methods — there is no visual boundary between the wallet interaction phase and the test's own dApp logic, forcing engineers to manually count actions to find where a wallet popup failed.
* Playwright's HTML reporter and trace viewer have first-class support for `test.step()`: steps appear as expandable sections with their own start/end timestamps, inline screenshots, and network activity; adopting them costs nothing for existing test authors.
* Teams debugging flaky wallet popups on CI (slow extension load, popup timing races) spend significant time correlating raw action lines to the responsible wallet driver method; named steps make this instant and turn traces into self-documenting artifacts.

## Suggested scope

* Wrap each exported wallet action function (`importSeedPhrase`, `unlock`, `authorize`, `confirm`, `reject`) in a `test.step('walletType: methodName', async () => { ... })` call using a consistent naming scheme (e.g., `"metamask: authorize"`, `"talisman: importSeedPhrase"`).
* Import and thread `test` from `@playwright/test` into the wallet driver functions (or accept it as a parameter) so `test.step()` is available without requiring users to pass it in.
* Document the step naming convention in the API reference so teams can write deterministic trace assertions or search Playwright trace JSON files predictably in CI scripts.

## Category

developer-experience

## Optional notes

`test.step()` nests naturally — users who already structure their own tests with steps will see wallet operations appear as sub-steps in the trace viewer, preserving the hierarchy. For a v1 implementation a fixed naming scheme (`"<walletType>: <methodName>"`) is sufficient; a future enhancement could accept an optional `stepLabel` override per call for teams with custom tracing conventions. The fixture setup phase (extension loading, service-worker ID resolution) could also be wrapped in steps in a follow-up, giving complete end-to-end trace coverage from browser launch through the first wallet interaction.
