import { describe, expect, it } from 'vitest'
import { parseWalletsFlag } from './parse-wallets-flag.js'

const VALID = ['polkadot-js', 'talisman', 'metamask']

describe('parseWalletsFlag', () => {
  it('returns null when the flag is absent', () => {
    expect(parseWalletsFlag([], VALID)).toBeNull()
    expect(parseWalletsFlag(['node', 'cli.js', 'download-extensions'], VALID)).toBeNull()
  })

  it('parses a single wallet with space-separated syntax', () => {
    expect(parseWalletsFlag(['--wallets', 'metamask'], VALID)).toEqual(['metamask'])
  })

  it('parses multiple wallets with equals syntax', () => {
    expect(parseWalletsFlag(['--wallets=metamask,talisman'], VALID))
      .toEqual(['metamask', 'talisman'])
  })

  it('trims whitespace and drops empty entries', () => {
    expect(parseWalletsFlag(['--wallets', ' metamask , talisman ,'], VALID))
      .toEqual(['metamask', 'talisman'])
  })

  it('deduplicates repeated wallets', () => {
    expect(parseWalletsFlag(['--wallets', 'metamask,metamask'], VALID))
      .toEqual(['metamask'])
  })

  it('throws on unknown wallets, listing valid options', () => {
    expect(() => parseWalletsFlag(['--wallets', 'phantom'], VALID))
      .toThrow(/Unknown wallet\(s\): phantom.*polkadot-js, talisman, metamask/)
  })

  it('throws when the flag has no value', () => {
    expect(() => parseWalletsFlag(['--wallets', ''], VALID))
      .toThrow(/--wallets requires a comma-separated list/)
  })

  it('uses the last occurrence when the flag is repeated', () => {
    expect(parseWalletsFlag(['--wallets', 'talisman', '--wallets', 'metamask'], VALID))
      .toEqual(['metamask'])
  })
})
