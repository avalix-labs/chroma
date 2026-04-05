# Support `importPrivateKey()` for MetaMask Driver

**Date:** 2026-04-05
**Category:** feature

---

Title: Add `importPrivateKey()` to MetaMask driver for EVM private-key account import

Summary:
The MetaMask driver currently only supports wallet setup via a 12/24-word seed phrase (`importSeedPhrase`). Many EVM testing workflows — especially those using hardhat/anvil dev accounts — work with raw private keys rather than mnemonics. Adding an `importPrivateKey(privateKey)` method would let teams onboard well-known test accounts (e.g. `0xac09...` Hardhat account #0) without generating and managing a full mnemonic.

Why it matters:

* Hardhat and Anvil ship with deterministic private keys, not mnemonics; teams must either derive the mnemonic offline or maintain a separate mapping — both are error-prone.
* Private key import is a one-click MetaMask flow (Account menu → Import account → Paste key), making it straightforward to automate and lower-risk than seed-phrase import.
* Exposing `importPrivateKey` alongside `importSeedPhrase` aligns the API with how real users add test accounts, making example apps and documentation more approachable for EVM developers new to the library.

Suggested scope:

* Add `importPrivateKey(page, { privateKey }: { privateKey: string }): Promise<void>` in `packages/chroma/src/wallets/metamask.ts` that navigates to the MetaMask "Import account" page and completes the private-key import flow.
* Expose `importPrivateKey` on the `MetaMaskWalletInstance` returned by the fixture, following the same pattern as the existing `importSeedPhrase` method.
* Add a unit test in `metamask.test.ts` using the same mocking approach as existing tests, and a playground E2E spec entry in `chroma/playground-e2e/metamask.spec.ts`.

Category:
feature

Optional notes:
MetaMask's "Import account" page is accessible at `chrome-extension://<id>/home.html#/import-account`; the flow requires selecting "Private Key" from the type dropdown, pasting the key, and clicking "Import". A future extension could support importing JSON Keystore files (the third import type MetaMask supports), but private key is the highest-priority case for dev/test environments. The `privateKey` parameter should be validated as a 32-byte hex string before passing it to the extension to give early, clear error messages.
