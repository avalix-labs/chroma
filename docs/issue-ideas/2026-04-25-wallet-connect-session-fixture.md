# Add WalletConnect v2 Session Fixture for dApps That Use WalletConnect Instead of Native Extensions

**Date:** 2026-04-25
**Category:** feature

---

## Title

Add WalletConnect v2 session fixture for testing dApps that use WalletConnect instead of injected wallet extensions

---

## Summary

Many dApps offer WalletConnect as their primary connection method alongside browser extension injection. Chroma has no support for WalletConnect v2 sessions today, leaving teams unable to test the QR-code / deep-link connection flow end-to-end in CI. A new `walletConnectFixture` (or an opt-in mode on existing fixtures) should programmatically pair a Chroma-controlled wallet with a dApp's WalletConnect v2 URI so the full approval lifecycle can be automated without requiring a physical mobile device.

---

## Why it matters

- WalletConnect v2 (Sign v2 / Web3Modal) is the dominant out-of-band connection protocol for EVM dApps, yet it is entirely untestable with any existing Playwright wallet-testing tool.
- Mobile-wallet users represent a large and growing share of real dApp traffic; CI coverage that only tests extension-injected wallets misses entire classes of bugs in the WalletConnect code path.
- Pairing a WalletConnect session in code (without a real QR scanner) requires no new browser setup; Chroma can drive the pairing handshake via the WalletConnect SDK directly, keeping tests hermetic and fast.

---

## Suggested scope

- Expose a `walletConnectUri` helper on the `chromaFixture` context that reads the `wc:` URI from the dApp page (via `page.evaluate` or a regex on network requests) and returns it as a string.
- Add a `WalletConnectSession` class (or a new driver) that accepts the `wc:` URI, performs the WalletConnect v2 pairing handshake using `@walletconnect/sign-client`, and exposes `approveSession()` / `rejectSession()` / `approveRequest()` / `rejectRequest()` methods consistent with the existing `WalletDriver` interface.
- Write an integration test in `packages/e2e-evm` that spins up a minimal WalletConnect-enabled dApp (using a local HTML fixture), pairs via the fixture, and approves a `personal_sign` request end-to-end.

---

## Optional notes

- The implementation should work in headless CI without requiring any WebSocket relay infrastructure beyond the public WalletConnect relay (`wss://relay.walletconnect.com`). An opt-in local relay (e.g. via `@walletconnect/relay-server`) could be added later for fully offline runs.
- Session pairing state (namespaces, accounts, chainId) should be configurable in `WalletConfig` to remain consistent with how Chroma configures native extension wallets.
- Long-term, this could expand to cover WalletConnect v2 session persistence (reconnect tests), session expiry flows, and multi-account namespace negotiation.
