import fs from 'node:fs'
import path from 'node:path'
import { createWalletTest } from '@avalix/chroma'

const SETUP_DIR = '.cache/wallet-setup'
const SENTINEL = path.join(SETUP_DIR, '.chroma-onboarded')
const SEED_PHRASE = 'test test test test test test test test test test test junk'

const setup = createWalletTest({
  wallets: [{ type: 'metamask' }],
  userDataDir: SETUP_DIR,
})

setup.setTimeout(30_000 * 2)

setup('seed metamask profile for unlock specs', async ({ wallets }) => {
  if (fs.existsSync(SENTINEL))
    return

  await wallets.metamask.importSeedPhrase({ seedPhrase: SEED_PHRASE })

  // Give Chrome time to flush MetaMask's LevelDB before the context closes —
  // otherwise the unlock project reopens a half-written profile that boots
  // into `#/onboarding/unlock` instead of the normal locked unlock screen.
  await new Promise(resolve => setTimeout(resolve, 2_000))

  fs.mkdirSync(SETUP_DIR, { recursive: true })
  fs.writeFileSync(SENTINEL, '')
})
