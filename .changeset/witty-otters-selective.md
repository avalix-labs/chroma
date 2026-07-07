---
"@avalix/chroma": minor
---

Add a `--wallets` flag to `chroma download-extensions` for downloading only selected wallet extensions (e.g. `--wallets metamask,talisman`). Without the flag all wallets are downloaded as before. When a filter is given, only the selected extensions are cleared and re-downloaded, so previously downloaded wallets stay usable
