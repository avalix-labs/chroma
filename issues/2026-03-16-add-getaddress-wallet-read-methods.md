# Issue: Add `getAddress()` / `getAccounts()` Read Methods to Wallet Instances

**Date generated:** 2026-03-16  
**Category:** feature

---

Title: Add `getAddress()` and `getAccounts()` read methods to wallet driver instances

Summary:
All current wallet instance methods (`authorize`, `approveTx`, `importSeedPhrase`, etc.) are action-based — there is no way for a test to query wallet state. Adding `getAddress()` and `getAccounts()` read methods would allow tests to assert which account is connected to a dApp, enabling meaningful correctness checks beyond just "the operation didn't throw".

Why it matters:

* Tests currently cannot verify *which* account signed a transaction or authorized a connection — a critical assertion for dApp correctness (e.g. ensuring the right address is displayed in the UI after connecting).
* Without read methods, wallets are black boxes during testing; a mismatched account silently passes all action-based checks.
* Enables a common pattern in E2E dApp tests: `expect(await wallets.metamask.getAddress()).toMatch(/^0x/)` or asserting the displayed address in the UI matches the wallet's reported address.

Suggested scope:

* Add `getAddress(): Promise<string>` to `MetaMaskWalletInstance` — navigate to the MetaMask extension home page via CDP or `chrome-extension://${extensionId}/home.html` and read the selected account address from the DOM.
* Add `getAccounts(): Promise<string[]>` to `PolkadotJsWalletInstance` and `TalismanWalletInstance` — open the extension popup and scrape the list of imported account addresses/names.
* Export the new return types from `@avalix/chroma` and document them in the README with a usage example showing address assertion.

Category:
feature

Optional notes:
A lighter-weight alternative is to expose raw `extensionId` and `walletContext` on wallet instances (they are already present but typed as internal), letting power users build their own queries. However, first-class `getAddress()` / `getAccounts()` methods are more ergonomic and keep implementation details encapsulated. Long-term, this opens the door for additional read methods: `getChainId()`, `getBalance()`, and `isLocked()` — all of which are frequently needed in dApp E2E suites to set up preconditions or assert postconditions.
