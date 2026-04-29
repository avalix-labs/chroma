# Issue: Add `grantPermissions()` / `revokePermissions()` helpers for EIP-2255 wallet permissions in MetaMask driver

**Date:** 2026-04-29
**Category:** feature

---

## Title

Add `grantPermissions()` / `revokePermissions()` helpers for EIP-2255 `wallet_requestPermissions` / `wallet_revokePermissions` flows in MetaMask driver

## Summary

Many dApps use the EIP-2255 `wallet_requestPermissions` and `wallet_revokePermissions` JSON-RPC methods to manage fine-grained access to accounts and JSON-RPC methods. The MetaMask driver currently has no dedicated helpers for approving or rejecting these permission dialogs, leaving test authors to fall back on raw page interaction or skip testing these flows entirely.

## Why it matters

* Permission-gated dApps (e.g. those that ask for access to only a subset of accounts or restrict method scopes) cannot be fully tested without driving the MetaMask permissions approval popup — critical flows like "grant access to account A only" or "re-request permissions after revocation" are currently untestable with Chroma.
* `wallet_revokePermissions` (introduced in MetaMask 11+) enables dApps to implement a clean disconnect flow; without a `revokePermissions()` helper, E2E tests cannot verify that the dApp correctly resets its connected state after revocation.
* Adding these helpers keeps the MetaMask driver in parity with MetaMask's own capabilities, reducing the gap between what Chroma supports and what production dApps actually use.

## Suggested scope

* Add `grantPermissions(accounts?: string[])` to the `MetaMaskDriver` — opens and approves the `wallet_requestPermissions` popup, optionally selecting a specific subset of accounts before confirming.
* Add `rejectPermissionsRequest()` to the `MetaMaskDriver` — dismisses the `wallet_requestPermissions` popup so tests can assert dApp behaviour on denial.
* Add `revokePermissions()` to the `MetaMaskDriver` — triggers `wallet_revokePermissions` via the MetaMask activity/connections UI and confirms, enabling tests to verify the dApp's disconnect/re-connect cycle.

## Category

feature

## Optional notes

EIP-2255 (`wallet_requestPermissions`) has been supported in MetaMask since v7 and is the canonical way to request `eth_accounts` access. The `wallet_revokePermissions` method landed in MetaMask v11. Both are also present in MetaMask Flask, which Chroma already targets. Implementation should locate the permissions popup using the same `findExtensionPopup` pattern already used by `approveTransaction()` and `signMessage()`. Account-selection logic in `grantPermissions()` can reuse or delegate to the existing account-import UI selectors. A future expansion could expose `getGrantedPermissions()` as a read-only helper to assert which permissions are currently active before and after the flow.
