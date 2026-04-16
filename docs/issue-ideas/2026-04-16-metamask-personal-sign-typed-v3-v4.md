# Add `signTypedDataV3()` / `signTypedDataV4()` Variants to the MetaMask Driver

**Date:** 2026-04-16
**Category:** feature

---

## Title

Add `signTypedDataV3()` / `signTypedDataV4()` variants and differentiate them from `signTypedData()` in the MetaMask driver

## Summary

MetaMask internally distinguishes between `eth_signTypedData_v3` and `eth_signTypedData_v4` RPC calls, each of which produces a different popup UI.
Chroma's existing `signTypedData()` helper (EIP-712) does not account for this distinction, leaving dApps that call the v3 or v4 variants unable to drive or assert the popup correctly.

## Why it matters

* Many production dApps (permit2, Seaport, Uniswap, OpenSea) use `eth_signTypedData_v4`; tests against those dApps fail silently or hit wrong selectors when only a generic `signTypedData()` exists.
* `v3` and `v4` differ in how MetaMask labels the popup and which fields are displayed — blindly reusing the same selectors causes intermittent test failures that are hard to diagnose.
* Explicit, version-aware helpers make test intent clear and prevent future regressions when MetaMask updates its popup UI for one version but not another.

## Suggested scope

* Add `signTypedDataV3(options?: SignTypedDataOptions): Promise<void>` and `signTypedDataV4(options?: SignTypedDataOptions): Promise<void>` methods to the MetaMask driver, each targeting the correct popup locators for that version.
* Keep the existing `signTypedData()` as an alias for `signTypedDataV4()` (most common case) and emit a deprecation notice in its JSDoc so consumers can migrate gradually.
* Add unit tests (mock popup HTML) for each variant and a brief entry in the MetaMask driver API reference documenting the difference between v3 and v4.

## Category

feature

## Optional notes

`eth_signTypedData` (v1) and `eth_signTypedData_v3` are rarely used in new dApps but some legacy contracts still issue them.
A future follow-up could add `signTypedDataV1()` for completeness.
Consider exposing a `SignTypedDataVersion` enum (`V1 | V3 | V4`) so the three helpers can share a single implementation internally while remaining individually testable.
This pairs naturally with the existing `signTypedData()` / `rejectTypedData()` work (see `2026-03-31`) and should reuse the same `SignTypedDataOptions` type where possible.
