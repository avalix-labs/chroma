---
'@avalix/chroma': patch
---

Harden MetaMask `unlock()` for setup-project profiles: detect the unlock form via the password field (not URL alone), wait for onboarding persistence before closing, and avoid CDP races after unlock tab teardown
