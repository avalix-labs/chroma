Title: Add `cache-key` CLI subcommand and GitHub Actions caching example for `.chroma/` extension artifacts

Summary:
Every CI run currently re-downloads all wallet extensions from GitHub Releases, adding network round-trips and non-determinism to test pipelines. A `npx @avalix/chroma cache-key` subcommand that outputs a deterministic string based on the pinned extension names and versions would let CI systems cache the `.chroma/` directory between runs with a single `actions/cache` step.

Why it matters:

* Each wallet extension is 10–50 MB; re-downloading three extensions on every CI run wastes bandwidth and adds minutes of latency that compound across a project's full run history
* Network-dependent downloads introduce a hidden flakiness vector — a transient GitHub Releases outage during CI setup will fail unrelated test runs
* Providing an official caching pattern in the README lowers the adoption barrier for teams who want to add `@avalix/chroma` to an existing CI pipeline without tuning infrastructure concerns themselves

Suggested scope:

* Add a `cache-key` subcommand to the existing CLI entry-point (alongside `download-extensions`) that prints a stable, versioned string derived from all bundled extension names and versions — e.g. `chroma-v1-<sha256(extensionName1+extensionName2+...)>`
* Guard `download-extensions` with a `--skip-if-cached` flag (or auto-detect) that exits early when the `.chroma/` directory already contains the expected extension folders, so the cached artifacts are not re-extracted unnecessarily
* Add a "CI Caching" section to the README (or docs site) with a ready-to-paste GitHub Actions YAML snippet using `actions/cache` keyed on the output of `npx @avalix/chroma cache-key`

Category:
developer-experience

Optional notes:
The cache key string should be stable across machines and include the `@avalix/chroma` package version as a namespace prefix (e.g. `chroma-v1-...`) so that a library upgrade automatically busts the cache. Future work could extend the `cache-key` command to accept a subset of wallet names (e.g. `cache-key --wallets polkadot-js,talisman`) so teams that only use a subset of wallets get a narrower cache scope. The same deterministic hash could later feed a checksum-verification step inside `download-extensions` to detect corrupted or tampered local artifacts before tests run.
