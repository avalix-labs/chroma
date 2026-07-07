/**
 * Parse the `--wallets` CLI flag from argv.
 *
 * Supports both `--wallets metamask,talisman` and `--wallets=metamask,talisman`.
 * Returns `null` when the flag is absent (meaning: download all wallets).
 * Throws on an empty value or unknown wallet names.
 */
export function parseWalletsFlag(argv: string[], validWallets: string[]): string[] | null {
  let raw: string | undefined

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--wallets') {
      // A trailing `--wallets` with no value falls through to the empty-list error
      raw = argv[i + 1] ?? ''
    }
    else if (arg.startsWith('--wallets=')) {
      raw = arg.slice('--wallets='.length)
    }
  }

  if (raw === undefined)
    return null

  const wallets = raw.split(',').map(w => w.trim()).filter(Boolean)

  if (wallets.length === 0) {
    throw new Error(`--wallets requires a comma-separated list. Valid options: ${validWallets.join(', ')}`)
  }

  const unknown = wallets.filter(w => !validWallets.includes(w))
  if (unknown.length > 0) {
    throw new Error(`Unknown wallet(s): ${unknown.join(', ')}. Valid options: ${validWallets.join(', ')}`)
  }

  return [...new Set(wallets)]
}
