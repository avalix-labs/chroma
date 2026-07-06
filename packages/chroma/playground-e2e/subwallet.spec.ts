import type { Server } from 'node:http'
import { createServer } from 'node:http'
import { createWalletTest } from '../src/index.js'

const ACCOUNT_NAME = 'Test Account'
const DOT_TEST_MNEMONIC = 'bottom drive obey lake curtain smoke basket hold race lonely fit walk'
const DAPP_PORT = 18432

const test = createWalletTest({
  wallets: [{ type: 'subwallet' }],
})

test.setTimeout(30_000 * 2)

// The public playground dapp is offline, so serve a bare page and drive the
// standard injectedWeb3 API directly: enable() opens the connect popup and
// signRaw() opens the signature popup, which is all the wallet methods need.
let server: Server

test.beforeAll(async ({ wallets }) => {
  server = createServer((_req, res) => {
    res.setHeader('content-type', 'text/html')
    res.end('<html><body><h1>chroma subwallet playground</h1></body></html>')
  })
  await new Promise<void>(resolve => server.listen(DAPP_PORT, resolve))

  await wallets.subwallet.importPolkadotMnemonic({
    seed: DOT_TEST_MNEMONIC,
    name: ACCOUNT_NAME,
  })
})

test.afterAll(async () => {
  // Drop keep-alive connections so close() doesn't hang until their timeout
  server.closeAllConnections()
  await new Promise<void>(resolve => server.close(() => resolve()))
})

test('authorize, reject and approve a signature request', async ({ page, wallets }) => {
  await page.goto(`http://localhost:${DAPP_PORT}/`)

  // Connect: enable() resolves only after the popup is approved
  const accountsPromise = page.evaluate(async () => {
    const injected = (window as any).injectedWeb3['subwallet-js']
    const extension = await injected.enable('chroma playground')
    const accounts = await extension.accounts.get()
    ;(window as any).__signer = extension.signer
    ;(window as any).__address = accounts[0]?.address
    return accounts
  })
  await wallets.subwallet.authorize({ accountName: ACCOUNT_NAME })
  const accounts = await accountsPromise
  test.expect(accounts).toHaveLength(1)
  test.expect(accounts[0].name).toBe(ACCOUNT_NAME)

  // Reject a signature request
  const rejectedPromise = page.evaluate(async () => {
    const signer = (window as any).__signer
    try {
      await signer.signRaw({ address: (window as any).__address, data: '0x1234', type: 'bytes' })
      return 'signed'
    }
    catch (error) {
      return `rejected: ${error}`
    }
  })
  await wallets.subwallet.rejectTx()
  test.expect(await rejectedPromise).toContain('Rejected by user')

  // Approve a signature request
  const signedPromise = page.evaluate(async () => {
    const signer = (window as any).__signer
    const result = await signer.signRaw({ address: (window as any).__address, data: '0x1234', type: 'bytes' })
    return result.signature as string
  })
  await wallets.subwallet.approveTx()
  test.expect(await signedPromise).toMatch(/^0x/)
})
