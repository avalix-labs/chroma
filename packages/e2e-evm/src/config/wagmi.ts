import type { Chain } from '@wagmi/vue/chains'
import { createConfig, createStorage, http } from '@wagmi/vue'

export const passetHub = {
  id: 420420417,
  name: 'Polkadot Hub TestNet',
  nativeCurrency: {
    name: 'Paseo Token',
    symbol: 'PAS',
    decimals: 18,
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://blockscout-testnet.polkadot.io/',
    },
  },
  rpcUrls: {
    default: {
      http: ['https://services.polkadothub-rpc.com/testnet'],
    },
  },
  testnet: true,
} as const satisfies Chain

export const moonbaseAlpha = {
  id: 1287,
  name: 'Moonbase Alpha',
  nativeCurrency: {
    name: 'DEV',
    symbol: 'DEV',
    decimals: 18,
  },
  blockExplorers: {
    default: {
      name: 'Moonscan',
      url: 'https://moonbase.moonscan.io',
    },
  },
  rpcUrls: {
    default: {
      http: ['https://moonbase.public.curie.radiumblock.co/http'],
    },
  },
  testnet: true,
} as const satisfies Chain

export const config = createConfig({
  chains: [passetHub, moonbaseAlpha],
  storage: createStorage({ storage: localStorage, key: 'vite-vue' }),
  transports: {
    [passetHub.id]: http(),
    [moonbaseAlpha.id]: http(),
  },
})
