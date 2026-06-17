---
"@avalix/chroma": patch
---

Internal refactor: dedupe the extension-path resolution shared by the Polkadot-JS, Talisman, and MetaMask wallets into a single helper, reuse the `findExtensionPopup` util in MetaMask, and drop redundant non-null assertions. No behavior change.
