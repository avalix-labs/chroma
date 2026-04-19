# Add `onRequest()` Event Listener Hooks for Passive Wallet Popup Monitoring

**Date:** 2026-04-19
**Category:** feature
**Package:** `@avalix/chroma`

---

## Title

Add `onRequest()` event listener hooks for passive wallet popup monitoring

## Summary

Introduce an `onRequest(type, handler)` hook on wallet driver instances that passively listens for incoming wallet popup requests (e.g., `connect`, `sign`, `transaction`) and invokes a user-supplied callback instead of requiring explicit `await` calls at exact points in test flow. This enables event-driven test patterns where the popup arrival time is indeterminate or driven by a background process.

## Why it matters

- **Async dApp flows are hard to sequence**: In many dApps, wallet popups appear as a side-effect of a background operation (e.g., a relayer signing on behalf of the user, or a multi-step wizard). Polling or hardcoding `await approve()` calls at fixed points is fragile and causes race conditions.
- **Listener-based patterns match real usage**: Developers already use `page.on('dialog', ...)` in Playwright for browser dialogs. A similar `wallet.onRequest('sign', handler)` API is immediately intuitive and mirrors the mental model of real-user interaction with a wallet.
- **Enables headless automation for background transactions**: dApp integrations that queue transactions asynchronously (e.g., batch minting, relayer networks) cannot be tested with synchronous step-by-step patterns alone. Passive listeners unblock this entire class of tests.

## Suggested scope

- Add `onRequest(type: WalletRequestType, handler: (request: PendingRequest) => Promise<void>): () => void` method to the `WalletDriver` interface, returning an unsubscribe function.
- Internally poll (or watch for new pages/popups) and invoke registered handlers when a matching popup appears; deduplicate so the same popup is not dispatched twice.
- Support `once: true` option (e.g., `onRequest('sign', handler, { once: true })`) for one-shot listeners that auto-unsubscribe after the first invocation.

## Category

feature

## Optional notes

- Initial implementation can reuse the existing popup detection logic inside `findExtensionPopup` as the underlying detector, with the handler dispatch layer on top.
- A `removeAllListeners()` utility would be useful in `afterEach` to avoid listener leaks across tests.
- Long-term, this could evolve into a declarative fixture-level `requests` map: `{ sign: 'approve', transaction: 'reject' }`, turning wallet interaction into pure configuration for simple scenarios.
- The `WalletRequestType` union (`'connect' | 'sign' | 'transaction' | 'typedData' | 'snapInstall' | ...`) should mirror the existing request taxonomy and be extensible.
