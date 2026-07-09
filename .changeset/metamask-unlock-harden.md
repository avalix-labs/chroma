---
'@avalix/chroma': patch
---

Harden MetaMask `unlock()` for setup-project profiles: detect the unlock form via the password field (not URL alone), wait for onboarding persistence before closing, and leave `sidepanel.html` open so approve/reject can attach without a consumer-side workaround
