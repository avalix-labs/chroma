---
"@avalix/chroma": patch
---

Verify wallet extension downloads against pinned SHA-256 checksums before extraction, and bound the download with a timeout so a hung connection fails instead of blocking forever
