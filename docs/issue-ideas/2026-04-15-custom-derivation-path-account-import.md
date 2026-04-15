# Issue Idea: 2026-04-15

**Title:** Support custom derivation paths when importing accounts in Polkadot-JS and Talisman drivers

---

## Summary

When `chroma` imports a seed phrase into Polkadot-JS or Talisman during fixture setup, it always uses the default derivation path. Many real-world dApps and wallets use custom derivation paths (e.g. `//Alice//stash`, `//validator`, or EVM-compatible `m/44'/60'/0'/0/0`). There is no way today to specify an alternative path through the `WalletConfig` or the driver API, forcing teams to work around this limitation by pre-building wallet profiles manually.

---

## Why it matters

- **Parachain and multi-role test suites** frequently need accounts derived at specific paths (e.g. `//Alice` vs `//Alice//stash`) to represent distinct on-chain identities; there is currently no clean way to set that up through the chroma fixture.
- **Ethereum-compatible Substrate chains** (Moonbeam, Astar, Acala EVM+) require the `m/44'/60'/0'/0/0` ECDSA derivation path; mixing a Substrate sr25519 key at that path under a unified fixture would eliminate significant bootstrapping work.
- **Test reproducibility** suffers when derivation paths are handled outside chroma via pre-baked browser profiles, because profile staleness and wallet version drift become maintenance burdens.

---

## Suggested scope

- Extend `WalletConfig` (or a new `AccountConfig` sub-type) with an optional `derivationPath?: string` field.
- In the Polkadot-JS driver's account-import flow, if `derivationPath` is provided, append it to the mnemonic field (e.g. `"word1 word2 ... //custom//path"`) before submitting the create-account form.
- In the Talisman driver's account-import flow, locate the advanced/derivation-path input and populate it when the field is present in config.
- Add unit tests covering the path-appending logic and a Playwright fixture-level test verifying the derived account address matches the expected on-chain address for a known seed + path.

---

## Category

feature

---

## Optional notes

Polkadot-JS appends soft/hard derivation segments directly to the mnemonic string in its import UI, so implementation for that wallet should be straightforward. Talisman exposes a separate "derivation path" field in its advanced import panel which may require an extra UI interaction step. EVM derivation paths (`m/44'/60'/...`) would only apply when the wallet is configured in Ethereum-compatible mode; documenting this constraint clearly in the API docs is important to avoid user confusion.
