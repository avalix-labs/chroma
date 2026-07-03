---
"@avalix/chroma": patch
---

Map wallet extension IDs deterministically from the extension path instead of pairing service workers with wallet configs by array index, and fail with a descriptive error when a wallet's service worker does not register within the deadline
