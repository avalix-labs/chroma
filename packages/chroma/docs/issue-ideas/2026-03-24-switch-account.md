# Issue Idea: 2026-03-24

Title: Add `switchAccount()` method to all wallet drivers to support multi-account dApp test flows

Summary:
Chroma can import multiple accounts into a wallet during setup, but there is no driver method to change the active account mid-test.
Adding `switchAccount(nameOrAddress)` to each wallet driver would let test authors simulate real user flows that involve switching between accounts — such as testing role-based UIs, multi-sig approvals, or same-browser concurrent sessions.

Why it matters:

* Many dApps expose different UI states depending on the connected account (admin vs. regular user, funded vs. unfunded); without `switchAccount()` these scenarios require separate browser context launches, dramatically slowing CI.
* Polkadot-JS and Talisman natively support multiple imported accounts shown in a list inside the extension popup — the switching interaction is already automatable via existing Playwright selectors, it just needs to be wrapped.
* MetaMask Flask also supports multiple accounts via the account selector dropdown; a consistent `switchAccount()` API across all three drivers lets test code stay wallet-agnostic.

Suggested scope:

* Add `switchAccount(nameOrAddress: string): Promise<void>` to the `WalletDriver` interface (see #21 for the shared interface proposal) and implement it in `polkadot-js.ts`, `talisman.ts`, and `metamask.ts`.
* For Polkadot-JS: open the extension popup, locate the account row matching `nameOrAddress` by display name or encoded address, and click its radio/select control.
* Add a playground spec (`polkadot-js-multiple.spec.ts` already partially exercises multiple accounts) that imports two mnemonics and calls `switchAccount()` between two `authorize()` interactions.

Category:
feature

Optional notes:
The `nameOrAddress` parameter should accept either a human-readable account name (as set during `importMnemonic`) or a raw SS58/hex address, with the driver preferring name matching first.
A future enhancement could expose `getActiveAccount(): Promise<string>` so tests can assert which account is selected before and after the switch.
This is a prerequisite for higher-level helpers like `switchAccountAndSign()` that combine the two operations into a single atomic step.
