# Issue Idea — 2026-05-03

Title: Add custom Playwright `expect` matchers for wallet state assertions

Summary:
Extend Playwright's `expect` with chroma-specific matchers such as `toBeConnected()`, `toHaveAccount()`, and `toBeOnNetwork()` so test authors can express wallet preconditions and postconditions as readable, auto-retrying assertions rather than imperative getter calls wrapped in manual `expect(await …).toBe(…)` patterns.

Why it matters:

* Playwright's built-in `expect` matchers auto-retry until the configured timeout, giving tests natural resilience against timing races (e.g., wallet state updating slightly after a popup closes) without manual polling loops.
* Replacing verbose patterns like `expect(await wallet.getConnected()).toBe(true)` with `await expect(wallet).toBeConnected()` makes test intent immediately legible at a glance, reducing cognitive overhead for reviewers and new contributors.
* Custom matchers produce structured diff output on failure (actual vs. expected), which is far easier to diagnose in CI logs than a raw `false !== true` assertion buried inside a helper.

Suggested scope:

* Define a `ChromaMatchers<T>` interface and call `expect.extend(chromaMatchers)` inside an exported `chromaExpect` setup function so users opt-in without polluting the global `expect` for unrelated test files.
* Implement an initial set of matchers: `toBeConnected()`, `toHaveAccount(address: string)`, `toBeOnNetwork(nameOrChainId: string | number)`, and `toHavePendingRequests(count?: number)`.
* Ship TypeScript module augmentation (`declare module '@playwright/test'`) so `expect(wallet).toBeConnected()` is fully typed and all matchers appear in IDE autocomplete with JSDoc descriptions.

Category:
developer-experience

Optional notes:
Matchers should delegate to the existing `WalletDriver` interface getters (`getConnected`, `getAccounts`, `getCurrentNetwork`) so every driver (MetaMask, Polkadot-JS, Talisman) benefits automatically without per-driver matcher logic. The retry loop should respect the per-driver `popupTimeout` option already in `ChromaTestOptions`. A follow-up could expose a `chromaExpect.extend()` API so third-party driver authors can register their own wallet-specific matchers under the same ergonomic pattern.
