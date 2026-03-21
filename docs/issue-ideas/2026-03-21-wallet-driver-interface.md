# Issue: Define a shared `WalletDriver` interface to unify the transaction API across all wallet drivers

**Date generated:** 2026-03-21

---

Title: Define a shared `WalletDriver` interface to unify the transaction approval API across all wallet drivers

Summary:
The three wallet drivers — Polkadot-JS, Talisman, and MetaMask — expose structurally similar but inconsistently named methods: Polkadot-JS and Talisman use `approveTx()`/`rejectTx()`, while MetaMask uses `confirm()`/`reject()`. Introducing a shared `WalletDriver` TypeScript interface with a canonical method set would allow multi-wallet tests to handle any wallet polymorphically without switching on wallet type.

Why it matters:

* Multi-wallet tests (`createWalletTest({ wallets: [...] as const, ... })`) currently require wallet-type-specific branches for any approval or rejection step, increasing boilerplate and cognitive load.
* The lack of a contract type means TypeScript cannot catch method-name mistakes at compile time when iterating over a collection of mixed wallet instances.
* Adding a new wallet driver in the future has no formal specification to conform to, making it easy to introduce yet another naming convention.

Suggested scope:

* Define a `WalletDriver` base interface in `src/context-playwright/types.ts` with at minimum `authorize(): Promise<void>`, `approveTx(): Promise<void>`, and `rejectTx(): Promise<void>`.
* Rename MetaMask's `confirm` → `approveTx` and `reject` → `rejectTx` in `wallet-factory.ts` and `wallets/metamask.ts`, keeping backward-compatible aliases with a deprecation JSDoc comment for one minor version.
* Update `WalletInstance` to be `PolkadotJsWalletInstance | TalismanWalletInstance | MetaMaskWalletInstance` with each constrained to extend `WalletDriver`, surfacing any remaining gaps as compile-time errors.

Category:
developer-experience

Optional notes:
The interface could also include optional members such as `importAccount?()` and `unlock?()` (only present on drivers that support them) using TypeScript optional properties, so callers can still benefit from the shared contract without requiring every driver to implement every method. A follow-up could introduce a `hasApproveTx(wallet: WalletInstance): wallet is WalletDriver` type guard helper for clean narrowing in generic test utilities.
