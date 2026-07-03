import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import path from 'node:path'
import process from 'node:process'

/**
 * Compute the extension ID Chrome assigns to an unpacked extension loaded
 * from `extensionPath`.
 *
 * Chrome derives the ID deterministically from the absolute extension
 * directory (crx_file/id_util.cc): SHA-256 of the path bytes, first 16 bytes
 * mapped from hex to the a-p alphabet. On Windows the path is lowercased and
 * hashed as UTF-16LE (FilePath is a wide string there); on POSIX it is hashed
 * as UTF-8 verbatim.
 *
 * This lets us know each wallet's extension ID up front instead of guessing
 * which registered service worker belongs to which wallet.
 */
export function getUnpackedExtensionId(extensionPath: string): string {
  const absolutePath = path.resolve(extensionPath)

  const pathBytes = process.platform === 'win32'
    ? Buffer.from(absolutePath.toLowerCase(), 'utf16le')
    : Buffer.from(absolutePath, 'utf8')

  const hash = createHash('sha256').update(pathBytes).digest('hex')

  // Map each hex digit (0-f) to the extension ID alphabet (a-p)
  return hash
    .slice(0, 32)
    .replace(/./g, char => String.fromCharCode(97 + Number.parseInt(char, 16)))
}
