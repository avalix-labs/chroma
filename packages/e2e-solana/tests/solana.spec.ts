import { createWalletTest } from "@avalix/chroma";

const SEED_PHRASE =
  "test test test test test test test test test test test junk";

const test = createWalletTest({
  wallets: [{ type: "metamask" }],
});

test.beforeEach(() => {
  console.log("[spec] running playground-e2e/metamask-solana.spec.ts");
});

test.beforeAll(async ({ wallets }) => {
  console.log("[wallet] metamask.importSeedPhrase");
  await wallets.metamask.importSeedPhrase({ seedPhrase: SEED_PHRASE });
});

test("should connect Solana account on Privy demo", async ({
  page,
  wallets,
}) => {
  const metamask = wallets.metamask;

  await page.goto("http://localhost:5173");
  await page.bringToFront()
  await page.waitForLoadState('networkidle')

  await page.getByRole('button', { name: 'MetaMask Tap to connect' }).click();
  await page.waitForTimeout(1000)
  await metamask.approve()
  await page.getByText('oeYf6KAJkLYhBuR8CiGc6L4D4Xtfepr85fuDgA9kq96').waitFor({ state: 'visible' })

  await page.getByRole('button', { name: 'Sign message' }).click();
  await metamask.approve()
  await page.getByText('Signature (base58)').waitFor({ state: 'visible' })
});
