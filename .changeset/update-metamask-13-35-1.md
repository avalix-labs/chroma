---
"@avalix/chroma": patch
---

Update bundled MetaMask extension to v13.35.1 and adapt the wallet flows to its UI changes: skip the new passkey setup onboarding step and use the renamed `confirm-footer-cancel-button` test id when rejecting transactions. Also harden `approve()`/`reject()` against the side panel occasionally getting stuck on its loading skeleton on slow CI — each click attempt is now time-bounded and a stuck panel is reopened in a fresh tab instead of blocking until the test times out.
