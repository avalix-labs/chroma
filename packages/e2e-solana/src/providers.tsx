import type { PropsWithChildren } from 'react'
import { autoDiscover, createClient } from '@solana/client'
import { SolanaProvider } from '@solana/react-hooks'

const client = createClient({
  endpoint: 'https://api.devnet.solana.com',
  walletConnectors: autoDiscover(),
})

export function Providers({ children }: PropsWithChildren) {
  return <SolanaProvider client={client}>{children}</SolanaProvider>
}
