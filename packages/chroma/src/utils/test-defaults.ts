/**
 * Default password used by chroma to bootstrap wallets in tests.
 *
 * Wallet methods accept an explicit `password` option that overrides this
 * value, so callers that already supply their own password are unaffected.
 */
export const DEFAULT_TEST_PASSWORD = 'h3llop0lkadot!'
