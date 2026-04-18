# Issue Idea: Expose RPC Request Interceptor for Wallet Network Calls

**Date:** 2026-04-18
**Category:** developer-experience / testing

---

Title: Add opt-in RPC request interceptor to capture and assert wallet-initiated JSON-RPC calls

Summary:
When a wallet extension sends JSON-RPC requests to a node (e.g. `eth_sendTransaction`, `eth_call`, `personal_sign`) during a test, there is currently no built-in way to assert on those outgoing requests or mock responses at the network level. Adding an opt-in interceptor that captures wallet-originated RPC traffic would let test authors verify exactly what was sent to the chain, stub responses for offline testing, and detect unexpected calls (e.g. duplicate transaction submissions).

Why it matters:

* Tests can currently only observe on-chain side effects (e.g. a balance change), not the raw payload the wallet dispatched — making it hard to assert on gas limits, nonce, `data` fields, or custom EIP-712 domains without a live node.
* Mocking RPC responses allows entire wallet-interaction test suites to run without Anvil/Hardhat, dramatically cutting CI time and removing infra dependencies.
* Unexpected extra RPC calls (fee estimation, duplicate submissions, unsolicited `eth_getBalance` polling) are invisible today; surfacing them helps catch regressions in wallet behaviour across extension versions.

Suggested scope:

* Add a `createRpcInterceptor(page, rpcUrl)` helper that uses Playwright's `page.route()` to intercept requests to the configured RPC endpoint and records each JSON-RPC payload.
* Expose `rpcInterceptor.getRequests(method?)` returning the array of captured request bodies, and `rpcInterceptor.mockResponse(method, response)` for stubbing replies.
* Add a `clearRequests()` / `dispose()` lifecycle pair so interceptors can be scoped to a single test without leaking into the next one.

Category:
developer-experience

Optional notes:
This could ship as a standalone export (e.g. `import { createRpcInterceptor } from '@avalix/chroma/rpc'`) so it is tree-shaken for projects that don't need it. A future expansion could support WebSocket transports (used by Polkadot-JS provider) in addition to HTTP. Integration with the existing `WalletDriver` fixture (passing the interceptor alongside the driver) would be the natural ergonomic endpoint.
