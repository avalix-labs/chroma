# Issue Idea — 2026-04-27

Title: Add `handleNextRequest()` helper for sequential wallet request queue dispatch

Summary:
Many dApp flows trigger several wallet popups back-to-back (e.g. connect → sign → send transaction). Currently, tests must call each approval method individually in the right order; a `handleNextRequest(action)` helper would let tests declare a single handler that auto-dispatches `approve` or `reject` to whatever popup appears next, making sequential multi-request flows dramatically easier to orchestrate.

Why it matters:

* Real dApp flows routinely chain multiple wallet interactions — connection approval, signature requests, and transaction confirmations — forcing verbose, fragile boilerplate in every test.
* The current model requires the test author to know the exact popup type in advance; `handleNextRequest()` decouples test logic from popup ordering, improving resilience to minor UI changes.
* A queue-based dispatch model unlocks higher-level test patterns like "approve all pending requests" or "reject the next N requests", which are currently impossible without custom wrapper code.

Suggested scope:

* Introduce `handleNextRequest(action: 'approve' | 'reject', options?: HandleRequestOptions): Promise<WalletRequest>` on the wallet driver base interface — it waits for the next popup, identifies its type (connect, sign, transaction, network-change, etc.), dispatches the appropriate approve/reject method, and returns a typed `WalletRequest` descriptor.
* Add `drainRequestQueue(action: 'approve' | 'reject'): Promise<WalletRequest[]>` as a convenience wrapper that repeatedly calls `handleNextRequest` until no pending popup is found within the configured `popupTimeout`.
* Document both helpers with a multi-step dApp example (connect + sign + send) in the README and add unit-level tests that assert each known popup type routes to the correct underlying driver method.

Category:
feature

Optional notes:
The `WalletRequest` return type (containing `type`, `payload`, and optionally `txHash` for transactions) could serve as the foundation for the structured JSON report attachment feature (2026-04-20) — both features share the same request classification logic. A future `handleNextRequest({ filter: ['transaction'] })` option could let tests target only specific popup types and let others pass through, useful for dApps with optional prompts (e.g. wallet_watchAsset) that appear non-deterministically.
