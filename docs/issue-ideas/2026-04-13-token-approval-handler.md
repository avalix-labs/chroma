# Issue Idea: 2026-04-13

Title: Add `approveTokenAllowance()` / `rejectTokenAllowance()` for MetaMask ERC-20 approval flows

Summary:
Many dApps require users to sign an ERC-20 `approve()` transaction before interacting with a protocol (DEXes, lending platforms, NFT marketplaces). Currently there is no dedicated driver method to handle the MetaMask "Set spending cap" / "Approve" popup that arises from these flows, forcing test authors to fall back on generic click helpers with brittle selectors.

Why it matters:

* ERC-20 token approval is one of the most common on-chain interactions in DeFi dApps; without first-class support, authors must hand-roll fragile automation for every approval popup they encounter.
* The MetaMask approval UI changed significantly in v11+ (introduced a "Set spending cap" step before the final "Approve" button), making ad-hoc selectors break silently across extension upgrades.
* Providing `approveTokenAllowance({ spendingCap?: string | 'max' })` as a driver primitive lets tests assert on or override the allowance amount, enabling security-relevant test scenarios (e.g. verifying the dApp requests only the minimum required amount).

Suggested scope:

* Add `approveTokenAllowance(options?: { spendingCap?: string | 'max' }): Promise<void>` to the MetaMask driver — navigates through the "Set spending cap" screen (optionally editing the amount), then clicks "Approve".
* Add `rejectTokenAllowance(): Promise<void>` that dismisses the popup via the "Reject" button at any step.
* Expose `getRequestedSpendingCap(): Promise<string>` to read the dApp-requested value before approving, enabling assertions like `expect(await metamask.getRequestedSpendingCap()).toBe('1000')`.

Category:
feature

Optional notes:
The MetaMask approval flow for ERC-20s is multi-step: (1) an informational screen showing the token and requested amount, (2) a "Set spending cap" editing screen, (3) a final confirmation. The implementation must handle both the v11+ multi-step flow and the legacy single-confirm flow for older pinned extension versions. Integration with the wallet version matrix CI (see 2026-04-10) would let us validate both paths automatically. A follow-up could extend the same pattern to NFT `setApprovalForAll()` popups, which have a similar but distinct UI.
