# Issue Idea — 2026-04-01

Title: Add SHA-256 integrity verification for downloaded wallet extension ZIPs

Summary:
`chroma download-extensions` fetches ZIP archives from GitHub Releases over HTTPS but performs no checksum verification after download, leaving tests silently vulnerable to corrupted downloads, CDN cache poisoning, or accidental version drift.
Adding pinned SHA-256 digests to each wallet config and verifying them before extraction closes this supply-chain gap with minimal overhead.

Why it matters:

* Wallet extensions have access to seed phrases and private keys used in test environments; a tampered or corrupted ZIP that loads unexpected UI could silently alter test behaviour without any observable error.
* CI pipelines that cache `.chroma/` across runs (e.g. via `actions/cache`) have no way to detect a stale or corrupted cache entry today; a digest check at extraction time would surface corruption immediately.
* Many security-conscious teams already require reproducible, auditable artefact downloads (e.g. SLSA level 2+), and providing pinned digests in the Chroma codebase makes it straightforward to satisfy those requirements.

Suggested scope:

* Add a `sha256` field to each wallet config object (`METAMASK_CONFIG`, `POLKADOT_JS_CONFIG`, `TALISMAN_CONFIG`) holding the hex digest of the official release ZIP.
* In `downloadAndExtractExtension`, compute the SHA-256 of the downloaded buffer using Node's built-in `crypto.createHash('sha256')` and throw a descriptive error if it does not match the expected digest.
* Update the `chroma download-extensions` output to print the verified digest next to each extension name so CI logs provide a traceable audit trail.

Category:
developer-experience

Optional notes:
The pinned digests need to be updated whenever a wallet version is bumped; a small helper script (or a note in `CONTRIBUTING.md`) should document how to regenerate them.
Long-term, this could evolve into a `chroma verify` subcommand that checks an existing `.chroma/` directory against the expected digests without re-downloading, useful for validating cached CI artefacts.
The same pattern could apply to a future lockfile (`chroma.lock`) if the project ever moves toward user-configurable wallet versions.
