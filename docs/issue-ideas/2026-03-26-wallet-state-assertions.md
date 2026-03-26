# Issue Idea: 2026-03-26

**Title:** Add `assertConnected()` and `assertNetworkIs()` wallet state assertion helpers

## Summary

After a dApp connects to a wallet or switches chains, there is currently no built-in way to assert the resulting wallet state from within a Chroma test — developers either skip the assertion entirely or write brittle, ad-hoc CDP queries. Chroma should expose lightweight `assertConnected()` and `assertNetworkIs()` helpers on each wallet driver that internally inspect extension state and throw a descriptive error if the expected condition is not met.

## Why it matters

- **Catches silent failures early.** A `confirmMetaMask()` call can succeed at the UI level (button clicked, popup closed) yet the dApp may still be in a disconnected state due to a race condition or extension bug; an assertion helper surfaces this immediately rather than at the next operation.
- **Reduces boilerplate in every test suite.** Every real-world dApp test needs to verify "wallet is connected to chain X before submitting a transaction"; without a built-in helper, each project duplicates the same fragile CDP inspection or DOM-scraping logic.
- **Improves error messages.** A helper that knows about wallet internals can produce a message like `Expected MetaMask to be connected to Ethereum Mainnet (1) but was on Sepolia (11155111)` instead of a generic Playwright `locator.click()` timeout deep in a downstream assertion.

## Suggested scope

- Add `assertConnected(page)` to MetaMask driver: navigates to `home.html`, checks that the "Account connected" indicator is present for the current tab origin.
- Add `assertNetworkIs(page, { chainId })` to MetaMask driver: reads the active network badge via CDP or by navigating to the extension home page and comparing the displayed chain ID.
- Add `assertConnected(page)` to Polkadot-JS and Talisman drivers: checks that at least one account has been authorised for the current tab by inspecting the extension's authorization list page.
- Document all helpers in the README under a new "Wallet Assertions" section with copy-pasteable examples.

## Category

feature / developer-experience

## Optional notes

The MetaMask implementation can read network state from the background service worker's `localStorage` via a CDP `Runtime.evaluate` call on the extension context, avoiding the need to open a new visible tab. For Polkadot-JS, the `chrome-extension://<id>/index.html#/accounts` page already lists per-origin authorizations and can be scraped without any additional permissions. A follow-up could expose a generic `assertWalletState(page, predicate)` escape-hatch for custom checks, following the pattern of Playwright's `expect.poll`.
