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

test('unlocks a prepared MetaMask profile and leaves the side panel open', async ({ page, wallets, walletContext }) => {
  const wallet = wallets.metamask
  const sidePanelUrl = `chrome-extension://${wallet.extensionId}/sidepanel.html`

  console.log('[INFO] wallets.metamask.unlock')
  await wallet.unlock()

  // unlock() must leave a sidepanel tab open so approve()/reject() can attach
  // without racing CDP targets after the unlock tab is torn down.
  const sidePanel = walletContext.pages().find((p) => {
    try {
      return !p.isClosed() && p.url().startsWith(sidePanelUrl)
    }
    catch {
      return false
    }
  })
  if (!sidePanel)
    throw new Error('Expected unlock() to leave a sidepanel.html tab open')
  await sidePanel.getByTestId('account-menu-icon').waitFor({ state: 'visible', timeout: 15_000 })

  // Idempotent: a second call must be a no-op on an already-unlocked session
  // and still keep the side panel available.
  await wallet.unlock()
  const sidePanelAfter = walletContext.pages().find((p) => {
    try {
      return !p.isClosed() && p.url().startsWith(sidePanelUrl)
    }
    catch {
      return false
    }
  })
  if (!sidePanelAfter)
    throw new Error('Expected unlock() to keep a sidepanel.html tab open on reuse')

  // Sanity-check the dapp still loads after unlock (does not assert wallet connect —
  // that path is covered by metamask.spec.ts on a fresh import session).
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: /Connect Wallet/i }).waitFor({ state: 'visible' })

  console.log('[INFO] unlock flow completed')
})
