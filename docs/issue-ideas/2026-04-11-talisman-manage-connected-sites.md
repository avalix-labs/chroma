# Add `getConnectedSites()` / `disconnectSite()` helpers for Talisman and Polkadot-JS drivers

**Date:** 2026-04-11
**Category:** feature

---

Title: Add `getConnectedSites()` and `disconnectSite()` helpers to Talisman and Polkadot-JS drivers

Summary:
Chroma currently has no way to inspect or revoke dApp site authorisations inside wallet extensions. Adding `getConnectedSites()` and `disconnectSite(url)` methods to the Talisman and Polkadot-JS drivers would allow tests to assert on connection state and to perform clean teardown without relying on a full profile reset.

Why it matters:

* Tests that verify "disconnect wallet" flows in a dApp need a first-class way to confirm the wallet side also reflects the disconnection, which is currently impossible without a full browser-profile wipe.
* Long-running worker-scoped fixtures accumulate site authorisations across tests; a targeted `disconnectSite()` call is far cheaper than recreating the entire browser context, improving suite speed.
* Coverage for the permission-management surface of wallet extensions is a widely requested feature in dApp testing workflows and would differentiate Chroma from lower-level Playwright scripting approaches.

Suggested scope:

* Implement `getConnectedSites(): Promise<string[]>` on the `PolkadotJsWalletInstance` by navigating to the extension's "Authorized accounts" settings page and reading the displayed origins.
* Implement `disconnectSite(url: string): Promise<void>` on both `PolkadotJsWalletInstance` and `TalismanWalletInstance` by locating the matching origin row in the extension UI and clicking the revoke/forget button.
* Export the two method signatures from the shared `WalletDriver` interface (once that interface is formalised) and add unit tests using mocked Playwright `Page` responses.

Category:
feature

Optional notes:
The Polkadot-JS extension renders connected sites at `chrome-extension://<id>/index.html#/auth-list`; Talisman exposes equivalent UI under its Settings > Connected Sites page. Both are already opened programmatically in the respective drivers, so navigation patterns are established. A future enhancement could add `disconnectAllSites()` as a convenience teardown helper and expose the same API on the MetaMask driver via its "Connected sites" permission panel.
