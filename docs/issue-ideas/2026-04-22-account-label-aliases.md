# Issue Idea: Named Account Aliases for Multi-Account Test Flows

**Date:** 2026-04-22
**Category:** developer-experience

---

## Title

Add named account aliases to `WalletConfig` for readable multi-account E2E test flows

## Summary

Allow test authors to assign human-readable aliases (e.g. `"alice"`, `"deployer"`, `"user"`) to wallet accounts inside `WalletConfig`, then reference those aliases when calling `switchAccount()` or asserting the active account — instead of using raw addresses or positional indices that are fragile and hard to read in test code.

## Why it matters

- **Readability**: `wallet.switchAccount("alice")` communicates intent immediately; `wallet.switchAccount(0)` or `wallet.switchAccount("0x1a2b…")` does not, especially when tests grow to span dozens of steps.
- **Maintainability**: When a seed phrase changes during local development the raw address changes too, but the alias `"alice"` stays stable — only the config needs updating.
- **Multi-party dApp testing**: Workflows that simulate buyer/seller, voter/admin, or LP/trader roles become self-documenting when accounts have role names rather than indices.

## Suggested scope

- Extend `WalletConfig` with an optional `accounts` map: `{ [alias: string]: { mnemonic?: string; address?: string; derivationPath?: string } }`.
- Update `switchAccount(alias: string)` in each driver (MetaMask, Polkadot-JS, Talisman) to resolve the alias through the config map before performing the UI switch.
- Expose a `resolveAccount(alias: string): AccountInfo` helper on the driver for test-assertion use (e.g., `expect(await wallet.resolveAccount("alice").address).toBe(…)`).
- Emit a clear error when an unknown alias is passed, listing available aliases to aid debugging.
- Document the pattern with a worked two-role dApp example in the README.

## Category

developer-experience

## Optional notes

This builds naturally on the existing `switchAccount()` feature (issue from 2026-03-24) and the `account` field in `WalletConfig` (issue from 2026-03-14) without breaking their APIs. A future extension could allow aliases to be declared in a shared `chroma.config.ts` file so they are accessible across multiple test files without repetition. The alias map could also feed into the structured JSON report attachment (issue from 2026-04-20) to make per-account operation logs human-readable.
