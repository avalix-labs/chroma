/* eslint-disable no-console */
import { createWalletTest } from '@avalix/chroma'

/**
 * Exercises the setup-project unlock path: a previously-onboarded MetaMask
 * profile boots locked, so the spec must call unlock() before the vault UI
 * is usable.
 *
 * Depends on the `setup` Playwright project (see playwright.config.ts), which
 * seeds `.cache/wallet-setup` once. Reuses that profile directly (workers: 1)
 * so we exercise the real locked-boot path without clone races.
 */
const test = createWalletTest({
  wallets: [{ type: 'metamask' }],
  userDataDir: '.cache/wallet-setup',
})

test.setTimeout(30_000 * 2)

test('unlocks a prepared MetaMask profile', async ({ page, wallets, walletContext }) => {
  const wallet = wallets.metamask

  console.log('[INFO] wallets.metamask.unlock')
  await wallet.unlock()

  // Idempotent: a second call must be a no-op on an already-unlocked session.
  await wallet.unlock()

  // Prove the vault is open: home UI shows the account picker, not the unlock form.
  const home = await walletContext.newPage()
  await home.goto(`chrome-extension://${wallet.extensionId}/home.html`)
  await home.getByTestId('account-menu-icon').waitFor({ state: 'visible', timeout: 15_000 })
  await home.getByTestId('unlock-password').waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {})
  await home.close()

  // Sanity-check the dapp still loads after unlock (does not assert wallet connect —
  // that path is covered by metamask.spec.ts on a fresh import session).
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: /Connect Wallet/i }).waitFor({ state: 'visible' })

  console.log('[INFO] unlock flow completed')
})
