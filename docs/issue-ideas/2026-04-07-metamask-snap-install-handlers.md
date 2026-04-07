# Issue Idea: 2026-04-07

## Title: Add `approveSnapInstall()` / `rejectSnapInstall()` handlers for MetaMask Flask Snap installation popups

---

**Title:** Add `approveSnapInstall()` / `rejectSnapInstall()` handlers for MetaMask Flask Snap installation popups

**Summary:**
`@avalix/chroma` already ships MetaMask Flask as its MetaMask implementation, meaning every project using the package is working in a Snaps-capable environment. However, there are no driver methods for handling the Snap installation popup that appears when a dApp calls `wallet_requestSnaps` — leaving this critical interaction untestable with the current API.

**Why it matters:**

* MetaMask Flask is specifically designed for Snap development and testing, so omitting Snap-related popup handlers means the full value of using Flask is inaccessible to `@avalix/chroma` users.
* The Snap install popup is a multi-step flow (review permissions → approve/reject) that is materially different from a standard `authorize` or `confirm` call and cannot be handled with the existing `authorizeMetaMask` / `confirmMetaMask` helpers.
* As Snaps adoption grows across the ecosystem (e.g., account abstraction Snaps, key management Snaps, cross-chain interop Snaps), dApp maintainers will increasingly need reliable E2E coverage of this install flow, and Chroma is uniquely positioned to provide it.

**Suggested scope:**

* Add `approveSnapInstall(snapId?: string)` to the MetaMask driver that clicks through the permissions review screen and confirms the Snap installation popup (locating the popup via the existing `findExtensionPopup` CDP helper with a `requestPermissions`/Snap-specific URL pattern).
* Add `rejectSnapInstall(snapId?: string)` that dismisses the same popup by clicking the cancel/reject button, to support testing the dApp's error-handling branch when a user declines Snap installation.
* Add an optional `snapId` parameter to both methods so tests can assert that the correct Snap is being installed before approving (e.g., check popup heading against `@metamask/example-snap`), guarding against accidentally auto-approving unexpected permission prompts.

**Category:** feature

**Optional notes:**
The Snap install popup URL in MetaMask Flask typically contains a path like `/snap-install` or query params referencing the Snap ID, which should be detectable in the CDP `Target.getTargets` response the same way `sidepanel` targets are already detected. A follow-on issue could add `approveSnapUpdate()` for the separate "Snap update available" popup that appears on version bumps. If Chroma ever adds a `WalletDriver` interface (see related issue), `approveSnapInstall` / `rejectSnapInstall` should be optional methods on that interface since they are Flask-specific.
