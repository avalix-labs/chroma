<!-- Generated: 2026-03-19 -->

Title: Add `waitForAuthorizeRequest()` and `waitForSignatureRequest()` helpers to wallet drivers

Summary:
Tests currently call `wallet.authorize()` or `wallet.approveTx()` without any way to assert that
the dApp actually triggered the wallet popup. Adding `waitFor*` helpers that resolve when the
popup first appears would make tests explicit about dApp → wallet interactions and eliminate a
silent class of integration bugs where the popup never shows up.

Why it matters:

* A test that calls `wallet.authorize()` will silently time out and fail with a generic
  "Element not found" error if the dApp never opened the popup — there is no assertion that the
  popup was triggered at all, making failures hard to diagnose.
* Explicit `await Promise.all([page.click('#connect'), wallet.waitForAuthorizeRequest()])` patterns
  mirror Playwright's own idioms (`waitForEvent`, `waitForResponse`) and communicate the causal
  relationship between a user action and a wallet response in the test code.
* Tests written this way surface dApp-side bugs (e.g. a broken `window.injectedWeb3` call or a
  race condition in the dApp's connect handler) immediately rather than after a long timeout on an
  unrelated assertion.

Suggested scope:

* Add `waitForAuthorizeRequest(options?: { timeout?: number }): Promise<void>` to each wallet
  driver (`polkadot-js`, `talisman`, `metamask`) — resolves as soon as the authorization popup
  page is detected, without clicking anything.
* Add `waitForSignatureRequest(options?: { timeout?: number }): Promise<void>` — resolves when a
  transaction / sign popup is detected (reuses the same CDP / page polling already inside
  `findExtensionPopup`).
* Refactor the shared polling logic inside `findExtensionPopup` into an internal
  `pollForExtensionPage()` utility so all four methods (`waitForAuthorizeRequest`,
  `waitForSignatureRequest`, `authorize`, `approveTx`) share the same implementation and retry
  parameters.

Category:
feature / developer-experience

Optional notes:
The groundwork for this already exists: `findExtensionPopup` in each wallet driver implements
a polling loop with configurable `maxAttempts` and `retryDelay`. This issue is mainly about
surfacing that loop as a public, awaitable API rather than keeping it as an internal
implementation detail. A follow-on could accept a predicate to match a specific popup URL
fragment (e.g. distinguish a "sign message" popup from a "send transaction" popup), enabling
fine-grained assertions about which kind of wallet interaction was triggered.
