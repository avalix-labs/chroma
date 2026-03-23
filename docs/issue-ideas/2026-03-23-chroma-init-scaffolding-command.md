# Issue Idea – 2026-03-23

**Title:** Add a `chroma init` CLI subcommand to scaffold new projects

---

## Summary

New adopters currently have to manually wire up `playwright.config.ts`, call `download-extensions`, and write their first fixture — with no starter template to follow. A `chroma init` CLI subcommand should automate this bootstrapping step by generating a minimal, working project scaffold in one command.

## Why it matters

* **Reduces time-to-first-green-test.** The current onboarding gap (figuring out the right Playwright config, where to put fixtures, which wallet type to start with) is a significant barrier for new users evaluating the library.
* **Prevents misconfiguration.** A generated `playwright.config.ts` snippet with `--load-extension` args and a worker-scoped context avoids the most common setup mistakes seen in support requests.
* **Drives adoption.** Projects like Hardhat, Wagmi, and Vite all ship `init` commands; matching this convention signals maturity and makes `@avalix/chroma` feel like a first-class tool in the dApp testing ecosystem.

## Suggested scope

* Add an `init` subcommand to the existing CLI entry point that accepts a `--wallet` flag (e.g., `npx @avalix/chroma init --wallet polkadot-js`) and writes three files: `playwright.config.ts` (or a mergeable snippet), `tests/wallet.setup.ts` (fixture file with `createWalletTest`), and `tests/example.spec.ts` (a minimal connect-wallet test).
* Append `.chroma/` to `.gitignore` if the file exists, or create one if not, so the downloaded extension artifacts are never accidentally committed.
* After scaffolding, automatically invoke `download-extensions` for the chosen wallet type so the project is immediately runnable without a separate manual step.

## Category

developer-experience

## Optional notes

A `--template` flag could offer preset scaffolds for common dApp stacks (e.g., `--template wagmi`, `--template polkadot-api`). The command should be idempotent — re-running it should warn before overwriting existing files rather than silently clobbering them. Long-term, `init` could also generate a GitHub Actions workflow file with caching for `.chroma/` artifacts (complementing the earlier `cache-key` subcommand idea).
