---
"@avalix/chroma": patch
---

Pin `@playwright/test` devDependency to `1.58.0` so the workspace shares a single hoisted Playwright copy whose browser binaries match the `mcr.microsoft.com/playwright:v1.58.0-noble` Docker base image used in CI.
