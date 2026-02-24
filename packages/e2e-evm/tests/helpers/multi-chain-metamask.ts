import type { Page } from '@playwright/test'
import { createWalletTest } from '@avalix/chroma'

interface SwitchChainOptions {
  /** The Chroma MetaMask wallet instance */
  wallet: { confirm: () => Promise<void>, reject: () => Promise<void> }
  /** Playwright Page instance */
  page: Page
  /** Chain name currently displayed in the UI */
  fromChain: string
  /** Target chain name to switch to */
  toChain: string
  /** Whether to approve or reject the switch (defaults to 'approve') */
  action?: 'approve' | 'reject'
}

/**
 * Switches from one chain to another by interacting with the chain selector UI
 * and handling the wallet confirmation popup.
 *
 * @example
 * await switchChain({
 *   wallet,
 *   page,
 *   fromChain: 'Polkadot Hub TestNet',
 *   toChain: 'Moonbase Alpha',
 * })
 */
export async function switchChain({
  wallet,
  page,
  fromChain,
  toChain,
  action = 'approve',
}: SwitchChainOptions): Promise<void> {
  // Open chain selector and pick the target chain
  await page.getByRole('button', { name: fromChain }).first().click()
  await page.getByRole('button', { name: toChain }).click()
  await page.waitForTimeout(1000)

  // Handle wallet confirmation
  if (action === 'approve') {
    await wallet.confirm()
  }
  else {
    await wallet.reject()
  }

  // Verify the UI reflects the expected chain
  const expectedChain = action === 'approve' ? toChain : fromChain
  await page
    .getByRole('paragraph')
    .filter({ hasText: expectedChain })
    .waitFor({ state: 'visible' })
}

/**
 * Test extension for chain switching (MetaMask)
 */
const baseTest = createWalletTest({
  wallets: [{ type: 'metamask' }] as const,
})

type ChainSwitcher = (opts: {
  fromChain: string
  toChain: string
  action?: 'approve' | 'reject'
}) => Promise<void>

export const test = baseTest.extend<{
  switchChain: ChainSwitcher
}>({
  switchChain: async ({ page, wallets }, use) => {
    const wallet = wallets.metamask
    await use(({ fromChain, toChain, action }) =>
      switchChain({ wallet, page, fromChain, toChain, action }),
    )
  },
})
