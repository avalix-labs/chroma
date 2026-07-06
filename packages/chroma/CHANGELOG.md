# @avalix/chroma

## 1.1.0

### Minor Changes

- [#99](https://github.com/avalix-labs/chroma/pull/99) [`f087451`](https://github.com/avalix-labs/chroma/commit/f087451b3902bcf6a3a6f9be065a8b4c5eac0627) Thanks [@preschian](https://github.com/preschian)! - Upgrade Talisman to 3.7.1: select the Substrate platform on the redesigned recovery phrase import screen, and wait for the dashboard to settle after onboarding before navigating to settings

### Patch Changes

- [#86](https://github.com/avalix-labs/chroma/pull/86) [`c6746cd`](https://github.com/avalix-labs/chroma/commit/c6746cd923382a58a356aec189a07bd7b177f902) Thanks [@preschian](https://github.com/preschian)! - Map wallet extension IDs deterministically from the extension path instead of pairing service workers with wallet configs by array index, and fail with a descriptive error when a wallet's service worker does not register within the deadline

- [#91](https://github.com/avalix-labs/chroma/pull/91) [`f673104`](https://github.com/avalix-labs/chroma/commit/f6731041e24a849ef7f2abc94c949475dd5a6019) Thanks [@preschian](https://github.com/preschian)! - Declare an explicit `types` condition in the exports map, drop the redundant `module` field, and declare `engines.node >= 20`

- [#88](https://github.com/avalix-labs/chroma/pull/88) [`5c52b19`](https://github.com/avalix-labs/chroma/commit/5c52b19b8f06880b0bc0f558cca2a958ce19698b) Thanks [@preschian](https://github.com/preschian)! - Pre-build the `download-extensions` CLI command into `dist` so it no longer downloads and runs tsx at runtime; the published package also no longer ships `src`

- [#97](https://github.com/avalix-labs/chroma/pull/97) [`d394d52`](https://github.com/avalix-labs/chroma/commit/d394d52b02829e3e087d097bb89a89587118d745) Thanks [@preschian](https://github.com/preschian)! - Bound extension downloads with a timeout (default 5 minutes, overridable via `timeoutMs`) so a hung connection fails instead of blocking forever

- [#85](https://github.com/avalix-labs/chroma/pull/85) [`c7d9d6e`](https://github.com/avalix-labs/chroma/commit/c7d9d6e04be61372e945cb4c63a692aebcad59bb) Thanks [@preschian](https://github.com/preschian)! - Add TypeScript typechecking (tsconfig + `typecheck` script + CI step) and fix stream typing in extension download

- [#96](https://github.com/avalix-labs/chroma/pull/96) [`f1724f3`](https://github.com/avalix-labs/chroma/commit/f1724f3511803adf69c8451a0c51e3ab587e96f3) Thanks [@preschian](https://github.com/preschian)! - Internal cleanup: consolidate per-wallet extension path resolvers with the wallet factories into one registry file, and document the intentionally ignored second Talisman popup during authorization

## 1.0.2

### Patch Changes

- [#80](https://github.com/avalix-labs/chroma/pull/80) [`ee0d20a`](https://github.com/avalix-labs/chroma/commit/ee0d20a9ca2f2ab68d4d7dc3de91263cc3e6a2c9) Thanks [@preschian](https://github.com/preschian)! - Bump the supported `@playwright/test` peer dependency to `^1.61.0` (latest), and update the Playwright Docker base image to `v1.61.0-noble`.

- [#78](https://github.com/avalix-labs/chroma/pull/78) [`c3e84c2`](https://github.com/avalix-labs/chroma/commit/c3e84c279864d274471519d033615c29b042ea75) Thanks [@preschian](https://github.com/preschian)! - Internal refactor: dedupe the extension-path resolution shared by the Polkadot-JS, Talisman, and MetaMask wallets into a single helper, reuse the `findExtensionPopup` util in MetaMask, and drop redundant non-null assertions. No behavior change.

- [#84](https://github.com/avalix-labs/chroma/pull/84) [`fdd3b23`](https://github.com/avalix-labs/chroma/commit/fdd3b238b9962d866fda2e515c64a8c87bde4067) Thanks [@preschian](https://github.com/preschian)! - Update the documentation links in the README files to the current docs site at `https://chroma.avalix.dev/docs` (was the old `chroma-docs.up.railway.app` Railway URL).

- [#82](https://github.com/avalix-labs/chroma/pull/82) [`364bffa`](https://github.com/avalix-labs/chroma/commit/364bffaada841194ff69414d7607f717ede99edb) Thanks [@preschian](https://github.com/preschian)! - Point the package `homepage` to the current docs site at `https://chroma.avalix.dev/docs` (was the old `chroma-docs.up.railway.app` Railway URL).

- [#81](https://github.com/avalix-labs/chroma/pull/81) [`635ef4c`](https://github.com/avalix-labs/chroma/commit/635ef4c59608a4d30f9d13bc8d99b17e661a6930) Thanks [@preschian](https://github.com/preschian)! - Update bundled MetaMask extension to v13.35.1 and adapt the wallet flows to its UI changes: skip the new passkey setup onboarding step and use the renamed `confirm-footer-cancel-button` test id when rejecting transactions. Also harden `approve()`/`reject()` against the side panel occasionally getting stuck on its loading skeleton on slow CI — each click attempt is now time-bounded and a stuck panel is reopened in a fresh tab instead of blocking until the test times out.

## 1.0.1

### Patch Changes

- [#76](https://github.com/avalix-labs/chroma/pull/76) [`2f73d1d`](https://github.com/avalix-labs/chroma/commit/2f73d1de98c9289b5ac4e8e4f7d2d5785d1b0b6c) Thanks [@preschian](https://github.com/preschian)! - Update package description to reflect multi-chain support (Polkadot, Ethereum, and Solana).

## 1.0.0

### Major Changes

- [#71](https://github.com/avalix-labs/chroma/pull/71) [`286e9ae`](https://github.com/avalix-labs/chroma/commit/286e9aec8f40fce403ec232cb628df1da3ec2064) Thanks [@preschian](https://github.com/preschian)! - feat(chroma): support Solana flows via MetaMask

### Patch Changes

- [#73](https://github.com/avalix-labs/chroma/pull/73) [`9af6cdb`](https://github.com/avalix-labs/chroma/commit/9af6cdb1b31ff81c1c2a28a88eab1e8ed35ec8c8) Thanks [@preschian](https://github.com/preschian)! - Bump `@playwright/test` to `^1.59.1` in both `peerDependencies` and `devDependencies`.

- [#72](https://github.com/avalix-labs/chroma/pull/72) [`565b43f`](https://github.com/avalix-labs/chroma/commit/565b43f4bf3efe4bd26fe895624cf9f9b1385d00) Thanks [@preschian](https://github.com/preschian)! - Pin `@playwright/test` devDependency to `1.58.0` so the workspace shares a single hoisted Playwright copy whose browser binaries match the `mcr.microsoft.com/playwright:v1.58.0-noble` Docker base image used in CI.

- [#67](https://github.com/avalix-labs/chroma/pull/67) [`8f37cdd`](https://github.com/avalix-labs/chroma/commit/8f37cdd7c8149d1003e4419d0e4120f9c36c4177) Thanks [@preschian](https://github.com/preschian)! - Refactor wallet factory to pass context directly to wallet functions

## 0.0.16

### Patch Changes

- [#65](https://github.com/avalix-labs/chroma/pull/65) [`e628625`](https://github.com/avalix-labs/chroma/commit/e628625694bbb381bffdd75f4d987b7763ba5acf) Thanks [@preschian](https://github.com/preschian)! - docs: update README with MetaMask support and wallet tables

## 0.0.15

### Patch Changes

- [#60](https://github.com/avalix-labs/chroma/pull/60) [`d477730`](https://github.com/avalix-labs/chroma/commit/d477730d0208ab6ced832b818f6379deec8d04ce) Thanks [@preschian](https://github.com/preschian)! - chore: upgrade Talisman wallet extension to v3.2.0

- [#61](https://github.com/avalix-labs/chroma/pull/61) [`7d7ccaa`](https://github.com/avalix-labs/chroma/commit/7d7ccaa7fe0a68373777c183f73bd9e48ce51bd6) Thanks [@preschian](https://github.com/preschian)! - feat: add metamask wallet

## 0.0.14

### Patch Changes

- [#59](https://github.com/avalix-labs/chroma/pull/59) [`106e968`](https://github.com/avalix-labs/chroma/commit/106e968139cdba4b65545d2dd36706534d36ca8c) Thanks [@preschian](https://github.com/preschian)! - fix: reject switch multi-chain

- [#56](https://github.com/avalix-labs/chroma/pull/56) [`3d5b8fe`](https://github.com/avalix-labs/chroma/commit/3d5b8fef8034166ce9c3298183daff6080e8f4a9) Thanks [@preschian](https://github.com/preschian)! - chore: adjust playground e2e

## 0.0.13

### Patch Changes

- [#54](https://github.com/avalix-labs/chroma/pull/54) [`73deb92`](https://github.com/avalix-labs/chroma/commit/73deb92b7a6bf4ad3aad88970376f191752cc100) Thanks [@preschian](https://github.com/preschian)! - test: more coverage

## 0.0.12

### Patch Changes

- [#53](https://github.com/avalix-labs/chroma/pull/53) [`5ec154d`](https://github.com/avalix-labs/chroma/commit/5ec154d36c75009ebbeed8c1f848ea3d379e5647) Thanks [@preschian](https://github.com/preschian)! - docs: simplify chroma README

- [#52](https://github.com/avalix-labs/chroma/pull/52) [`712e2cc`](https://github.com/avalix-labs/chroma/commit/712e2cc33f136e1a46b498a9caec0336f7daba32) Thanks [@preschian](https://github.com/preschian)! - fix: add timeout before clicking account button in Talisman auth

- [#51](https://github.com/avalix-labs/chroma/pull/51) [`3aa47a6`](https://github.com/avalix-labs/chroma/commit/3aa47a636bddbf4bb418295a347ea2dea5ead90d) Thanks [@preschian](https://github.com/preschian)! - test: disable Talisman risk scan toggle for testing

- [#49](https://github.com/avalix-labs/chroma/pull/49) [`5022462`](https://github.com/avalix-labs/chroma/commit/50224621280ae2dec0694dca99a262d0044b93c1) Thanks [@preschian](https://github.com/preschian)! - feat: add Polkadot account import support for Talisman wallet

## 0.0.11

### Patch Changes

- [#47](https://github.com/avalix-labs/chroma/pull/47) [`362ca9b`](https://github.com/avalix-labs/chroma/commit/362ca9b3ef7bd56548e1a77fdaa50376c1b31fc9) Thanks [@preschian](https://github.com/preschian)! - test: add vitest unit tests for download-extension utility

- [#39](https://github.com/avalix-labs/chroma/pull/39) [`3a23a1b`](https://github.com/avalix-labs/chroma/commit/3a23a1bf626a22bb3bf5a2fb4fc453e2471ca4c8) Thanks [@preschian](https://github.com/preschian)! - fix: resolve Docker build failures in tsdown configuration

## 0.0.10

### Patch Changes

- [#29](https://github.com/avalix-labs/chroma/pull/29) [`4adfa16`](https://github.com/avalix-labs/chroma/commit/4adfa160ae126e803b3d034c3629e8fd161ef880) Thanks [@preschian](https://github.com/preschian)! - chore: rename testDir

- [#36](https://github.com/avalix-labs/chroma/pull/36) [`801dd42`](https://github.com/avalix-labs/chroma/commit/801dd426f2b0378e8d77ffdf5fbfc3b77365b623) Thanks [@preschian](https://github.com/preschian)! - refactor: move examples to packages directory

- [#22](https://github.com/avalix-labs/chroma/pull/22) [`e6f0fc6`](https://github.com/avalix-labs/chroma/commit/e6f0fc639e54f4cff584fe758fb953a9a17450fe) Thanks [@preschian](https://github.com/preschian)! - feat: improve CLI command and update documentation

- [#24](https://github.com/avalix-labs/chroma/pull/24) [`4e1d559`](https://github.com/avalix-labs/chroma/commit/4e1d559b50c09173c8439ddd9de8981138e45459) Thanks [@preschian](https://github.com/preschian)! - chore: update wallet extension versions

- [#30](https://github.com/avalix-labs/chroma/pull/30) [`4027d2a`](https://github.com/avalix-labs/chroma/commit/4027d2aa73f8b97b5d875adefbd67c91b9e1c7b3) Thanks [@preschian](https://github.com/preschian)! - chore: replace chromium with chrome-testing

- [#35](https://github.com/avalix-labs/chroma/pull/35) [`b797e3b`](https://github.com/avalix-labs/chroma/commit/b797e3b5dec043cbdb2e019b834d4b5e3be07dd7) Thanks [@preschian](https://github.com/preschian)! - fix: add multi-dapp tests for polkadot-js wallet

## 0.0.9

### Patch Changes

- [#19](https://github.com/avalix-labs/chroma/pull/19) [`f5c9e16`](https://github.com/avalix-labs/chroma/commit/f5c9e167e2a1daf537727eda3c15e006fcd4cf5d) Thanks [@preschian](https://github.com/preschian)! - feat: add rejectTx method and Talisman ETH import support

- [#21](https://github.com/avalix-labs/chroma/pull/21) [`f2ecae5`](https://github.com/avalix-labs/chroma/commit/f2ecae55f9d7476c64b4ffadb086c89277260971) Thanks [@preschian](https://github.com/preschian)! - refactor: replace fixed timeouts with retry logic in wallet implementations

## 0.0.8

### Patch Changes

- [#17](https://github.com/avalix-labs/chroma/pull/17) [`854a6ba`](https://github.com/avalix-labs/chroma/commit/854a6ba36157db041682ef610264106bd70b43b3) Thanks [@preschian](https://github.com/preschian)! - fix: include src folder in npm package for download-extensions script

## 0.0.7

### Patch Changes

- [#14](https://github.com/avalix-labs/chroma/pull/14) [`6e7a6e1`](https://github.com/avalix-labs/chroma/commit/6e7a6e1afdc9f8c2f602b0bbab559d99169c9cc1) Thanks [@preschian](https://github.com/preschian)! - feat: add extension download CLI and prepare multi-wallet support

- [#16](https://github.com/avalix-labs/chroma/pull/16) [`f8b4627`](https://github.com/avalix-labs/chroma/commit/f8b46277b6e99de0917d30ede0abecff442407fa) Thanks [@preschian](https://github.com/preschian)! - feat(wallets): add Talisman wallet support

## 0.0.6

### Patch Changes

- [#12](https://github.com/avalix-labs/chroma/pull/12) [`c5f219f`](https://github.com/avalix-labs/chroma/commit/c5f219f1924e4a15693ce285ea0fe83347ae14d3) Thanks [@preschian](https://github.com/preschian)! - test: add Polkadot dApp integration test

## 0.0.5

### Patch Changes

- [#10](https://github.com/avalix-labs/chroma/pull/10) [`1b15767`](https://github.com/avalix-labs/chroma/commit/1b15767f285f3ac4f450dc85444ce4d2106644db) Thanks [@preschian](https://github.com/preschian)! - chore: adjust readme

## 0.0.4

### Patch Changes

- [#7](https://github.com/avalix-labs/chroma/pull/7) [`ee3dbce`](https://github.com/avalix-labs/chroma/commit/ee3dbcee6f2aaeb972a137d55970f78ba0c9207f) Thanks [@preschian](https://github.com/preschian)! - revert: back to .chroma

## 0.0.3

### Patch Changes

- [#5](https://github.com/avalix-labs/chroma/pull/5) [`50aa1b7`](https://github.com/avalix-labs/chroma/commit/50aa1b7dbe158a7d0c82d82c488b5798db0bd7d7) Thanks [@preschian](https://github.com/preschian)! - chore: update default directory

## 0.0.2

### Patch Changes

- [#3](https://github.com/avalix-labs/chroma/pull/3) [`fd99af6`](https://github.com/avalix-labs/chroma/commit/fd99af6fbc8d94a70dac1abe5b2b6ba3c565c9f8) Thanks [@preschian](https://github.com/preschian)! - fix: prepublish build

## 0.0.1

### Patch Changes

- [#1](https://github.com/avalix-labs/chroma/pull/1) [`aa77722`](https://github.com/avalix-labs/chroma/commit/aa77722da658e28be7f6147765392cf65d539240) Thanks [@preschian](https://github.com/preschian)! - chore: setup linter
