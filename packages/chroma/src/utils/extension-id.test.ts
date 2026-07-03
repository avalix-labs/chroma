import process from 'node:process'
import { describe, expect, it } from 'vitest'
import { getUnpackedExtensionId } from './extension-id.js'

const posixOnly = process.platform === 'win32' ? it.skip : it

describe('getUnpackedExtensionId', () => {
  it('returns a 32-character ID using only the a-p alphabet', () => {
    const id = getUnpackedExtensionId('/some/extension/dir')
    expect(id).toMatch(/^[a-p]{32}$/)
  })

  it('is deterministic for the same path', () => {
    expect(getUnpackedExtensionId('/some/extension/dir'))
      .toBe(getUnpackedExtensionId('/some/extension/dir'))
  })

  it('differs for different paths', () => {
    expect(getUnpackedExtensionId('/some/extension/dir'))
      .not
      .toBe(getUnpackedExtensionId('/some/other/dir'))
  })

  // Fixed vectors guard against accidental changes to the derivation
  // (hash input encoding, hex-to-alphabet mapping, truncation length).
  posixOnly('matches known Chrome-derived IDs on POSIX', () => {
    expect(getUnpackedExtensionId('/Users/test/.chroma/metamask-extension-13.35.1'))
      .toBe('afgepcepfmfjhkcffhbhmbiipddbikch')
    expect(getUnpackedExtensionId('/tmp/ext'))
      .toBe('lcfjooiecahccmjaipimfaidcnaihadb')
  })

  posixOnly('resolves relative paths before hashing', () => {
    const cwdRelative = getUnpackedExtensionId('some-dir')
    const absolute = getUnpackedExtensionId(`${process.cwd()}/some-dir`)
    expect(cwdRelative).toBe(absolute)
  })
})
