# Issue Idea: `sendTransaction()` with Gas / Fee Override Support for MetaMask Driver

**Date:** 2026-04-04
**Category:** feature

---

## Title

Add `sendTransaction()` with gas/fee override options to the MetaMask driver

## Summary

The MetaMask driver currently exposes `approveTransaction()` to confirm whatever transaction is pending in the popup, but it provides no way for the test to inspect or manipulate gas fields (gas limit, max fee, priority fee) before confirming. Adding a `sendTransaction({ gasLimit?, maxFee?, priorityFee? })` method — or an `overrideGas()` helper — would let test authors exercise dApps under specific fee conditions without depending on the live gas oracle.

## Why it matters

* Many dApps contain user-facing gas-edit flows (e.g. "Aggressive" / "Market" / "Custom" fee panels) that cannot currently be exercised at all with Chroma; real regression coverage requires interacting with those UI paths.
* CI test environments have no control over the gas oracle values MetaMask surfaces, causing non-deterministic transaction amounts that make assertion snapshots fragile.
* Teams building layer-2 bridges or gas-sensitive DeFi dApps need to verify that their frontends handle edge cases (extremely high gas, zero priority fee) gracefully, which requires injecting those values during the test.

## Suggested scope

* Add `overrideGas(page: Page, opts: { gasLimit?: number; maxFee?: number; priorityFee?: number }): Promise<void>` to `MetaMaskDriver` — it should open the "Edit gas fee" panel and fill the custom values before the caller calls `approveTransaction()`.
* Expose the method through the `WalletDriver` interface as optional (`overrideGas?: (...) => Promise<void>`) so the shared interface contract is not broken for Polkadot wallets.
* Add an integration test fixture that calls `overrideGas()` followed by `approveTransaction()` and asserts the transaction was submitted (does not need a live chain — using MetaMask's built-in test network or a `hardhat node` fork is sufficient).

## Category

feature

## Optional notes

This idea is distinct from the previously tracked `switchChain`/`addNetwork` (2026-03-10) and `signTypedData` (2026-03-31) work. A minimal first iteration could hard-code the MetaMask "Edit suggested gas fee" selector path for the Flask version already pinned in Chroma. A follow-on iteration could query `eth_gasPrice` from a configurable RPC and expose a `useEstimatedGas()` convenience wrapper. The feature is also a prerequisite for any future "simulate low-balance" or "gas spike" chaos-testing utilities.
