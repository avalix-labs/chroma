import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

/**
 * Resolve the on-disk path of a downloaded wallet extension.
 *
 * Looks under `<cwd>/.chroma/<extensionName>` and throws a helpful error
 * (pointing at the download command) when the extension is missing or empty.
 */
export async function resolveExtensionPath(extensionName: string, displayName: string): Promise<string> {
  const extensionDir = path.join(process.cwd(), '.chroma', extensionName)

  // readdir rejects if the directory is missing → treat as empty
  const entries = await fs.promises.readdir(extensionDir).catch(() => [] as string[])
  if (entries.length === 0) {
    throw new Error(
      `${displayName} extension not found at: ${extensionDir}\n\n`
      + `Please download the extension first by running:\n`
      + `  npx @avalix/chroma download-extensions\n`,
    )
  }

  return extensionDir
}
