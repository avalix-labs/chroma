<script setup lang="ts">
import type { Connector } from '@wagmi/vue'
import type { Chain } from '@wagmi/vue/chains'
import { useAccount, useChainId, useChains, useConnect, useDisconnect, useSwitchChain } from '@wagmi/vue'
import { computed, ref } from 'vue'
import { shortenAddress } from '../utils/formatters'

// Popular wallets for when no connectors are available
const popularWallets = [
  {
    id: 'metamask',
    name: 'MetaMask',
    downloadUrl: 'https://metamask.io/download/',
  },
  {
    id: 'talisman',
    name: 'Talisman Wallet',
    downloadUrl: 'https://talisman.xyz/',
  },
]

const connectModal = ref<HTMLDialogElement | null>(null)
const chainSelectorOpen = ref(false)
const switchingChain = ref(false)
const chainId = useChainId()
const chains = useChains()
const { connect, connectors, error, status } = useConnect()
const { disconnect } = useDisconnect()
const { address, isConnected, connector } = useAccount()
const { switchChainAsync } = useSwitchChain()

// Get the connected chain instead of using config
const connectedChain = computed(() => {
  return chains.value.find((chain: Chain) => chain.id === chainId.value) || chains.value[0]
})

// Filter connectors to show only MetaMask and Talisman
const filteredConnectors = computed(() => {
  return connectors.filter((connector) => {
    const id = connector.id.toLowerCase()
    return id.includes('metamask') || id.includes('talisman')
  })
})

function openConnectModal() {
  connectModal.value?.showModal()
}

function closeConnectModal() {
  connectModal.value?.close()
}

function toggleChainSelector() {
  chainSelectorOpen.value = !chainSelectorOpen.value
}

function closeChainSelector() {
  chainSelectorOpen.value = false
}

async function handleSwitchChain(chain: Chain) {
  if (chain.id === chainId.value) {
    closeChainSelector()
    return
  }

  switchingChain.value = true
  try {
    // wagmi's switchChainAsync handles adding + switching the chain
    // since all chains are already configured in the wagmi config
    await switchChainAsync({ chainId: chain.id })
  }
  catch (err) {
    console.error('Failed to switch chain:', err)
  }
  finally {
    switchingChain.value = false
    closeChainSelector()
  }
}

async function handleConnect(conn: Connector) {
  try {
    connect({ connector: conn, chainId: connectedChain.value.id })
    closeConnectModal()
  }
  catch (err) {
    console.error('Failed to connect:', err)
    closeConnectModal()
  }
}

function handleDisconnect() {
  disconnect()
  localStorage.clear()
}
</script>

<template>
  <!-- Connect/Disconnect Buttons -->
  <div class="flex items-center gap-2">
    <!-- Chain Selector (only shown when connected) -->
    <div v-if="isConnected" class="relative">
      <button
        class="btn btn-outline btn-sm font-mono gap-1"
        :disabled="switchingChain"
        @click="toggleChainSelector"
      >
        <span class="icon-[mdi--swap-horizontal] w-4 h-4" />
        <span class="hidden sm:block">{{ connectedChain.name }}</span>
        <span
          class="icon-[mdi--chevron-down] w-4 h-4 transition-transform"
          :class="{ 'rotate-180': chainSelectorOpen }"
        />
      </button>

      <!-- Chain Dropdown -->
      <Transition
        enter-active-class="transition ease-out duration-150"
        enter-from-class="opacity-0 scale-95 -translate-y-1"
        enter-to-class="opacity-100 scale-100 translate-y-0"
        leave-active-class="transition ease-in duration-100"
        leave-from-class="opacity-100 scale-100 translate-y-0"
        leave-to-class="opacity-0 scale-95 -translate-y-1"
      >
        <div
          v-if="chainSelectorOpen"
          class="absolute right-0 top-full mt-2 z-50 min-w-56 rounded-lg border border-base-300 bg-base-100 shadow-lg"
        >
          <div class="px-3 py-2 border-b border-base-300">
            <p class="text-xs text-gray-500 uppercase tracking-wider font-medium">
              Select Network
            </p>
          </div>
          <ul class="py-1">
            <li
              v-for="chain in chains"
              :key="chain.id"
              class="px-1"
            >
              <button
                class="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm transition-colors"
                :class="chain.id === chainId
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'hover:bg-base-200 text-base-content'"
                :disabled="switchingChain"
                @click="handleSwitchChain(chain)"
              >
                <span
                  class="w-2 h-2 rounded-full shrink-0"
                  :class="chain.id === chainId ? 'bg-primary' : 'bg-gray-300'"
                />
                <span class="truncate">{{ chain.name }}</span>
                <span
                  v-if="chain.id === chainId"
                  class="icon-[mdi--check] w-4 h-4 ml-auto shrink-0"
                />
                <span
                  v-if="switchingChain && chain.id !== chainId"
                  class="icon-[mdi--loading] w-4 h-4 ml-auto animate-spin shrink-0"
                />
              </button>
            </li>
          </ul>
        </div>
      </Transition>

      <!-- Backdrop to close dropdown -->
      <div
        v-if="chainSelectorOpen"
        class="fixed inset-0 z-40"
        @click="closeChainSelector"
      />
    </div>

    <!-- Connect / Address Button -->
    <button
      class="btn btn-outline btn-sm font-mono"
      @click="openConnectModal"
    >
      <div v-if="!isConnected" class="flex items-center gap-2">
        <span class="icon-[mdi--wallet] w-4 h-4" />
        <span>Connect Wallet</span>
      </div>
      <div v-else class="flex items-center gap-2">
        <img
          v-if="connector?.icon"
          :src="connector.icon"
          :alt="connector.name"
          class="w-4 h-4"
        >
        <span v-else class="icon-[mdi--wallet] w-4 h-4" />
        <span class="hidden sm:block">{{ address ? shortenAddress(address) : '' }}</span>
      </div>
    </button>

    <!-- Disconnect Button (only shown when connected) -->
    <button
      v-if="isConnected"
      class="btn btn-outline btn-sm font-mono"
      @click="handleDisconnect"
    >
      <span class="icon-[mdi--logout] w-4 h-4" />
    </button>
  </div>

  <!-- Modal -->
  <dialog ref="connectModal" class="modal modal-bottom sm:modal-middle">
    <div class="modal-box max-w-md">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-lg font-medium text-black uppercase tracking-wider">
            CONNECT WALLET
          </h2>
          <p class="text-xs text-gray-500 mt-1">
            Network: {{ connectedChain.name }}
          </p>
        </div>
        <button class="btn btn-sm btn-circle btn-ghost" @click="closeConnectModal">
          <span class="icon-[mdi--close] w-4 h-4" />
        </button>
      </div>

      <!-- Available Connectors -->
      <div v-if="filteredConnectors.length" class="mb-6">
        <h3 class="text-xs text-gray-500 uppercase tracking-wider mb-3">
          Available Wallets
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            v-for="conn in filteredConnectors"
            :key="conn.id"
            class="card card-compact bg-base-100 border border-base-300 hover:border-primary hover:shadow-md transition-all cursor-pointer"
            @click="handleConnect(conn)"
          >
            <div class="card-body items-center text-center">
              <div class="flex items-center justify-center w-12 h-12 mb-2">
                <img
                  v-if="conn.icon"
                  :src="conn.icon"
                  :alt="conn.name"
                  class="w-8 h-8"
                >
                <span v-else class="icon-[mdi--wallet-outline] w-8 h-8" />
              </div>
              <div class="text-sm font-medium text-black">
                {{ conn.name }}
              </div>
              <button
                :disabled="status === 'pending'"
                class="btn btn-neutral btn-sm w-32 uppercase tracking-wider mt-2"
              >
                <span v-if="status === 'pending'" class="icon-[mdi--loading] animate-spin" />
                <span v-if="status === 'pending'">Connecting</span>
                <span v-else>Connect</span>
                <span v-if="status !== 'pending'" class="icon-[mdi--chevron-right]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- No Connectors Available - Show Popular Wallets -->
      <div v-else class="space-y-3">
        <div class="text-center mb-4">
          <div class="icon-[mdi--wallet-outline] w-16 h-16 mx-auto text-gray-300 mb-2" />
          <p class="text-sm text-gray-500">
            No wallet extensions detected
          </p>
          <p class="text-xs text-gray-400">
            Download a wallet to get started
          </p>
        </div>

        <h3 class="text-xs text-gray-500 uppercase tracking-wider mb-3">
          Popular Wallets
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            v-for="wallet in popularWallets"
            :key="wallet.id"
            class="card card-compact bg-base-100 border border-base-300 hover:border-primary hover:shadow-md transition-all"
          >
            <div class="card-body items-center text-center">
              <div class="text-sm font-medium text-black mb-3">
                {{ wallet.name }}
              </div>
              <a
                :href="wallet.downloadUrl"
                target="_blank"
                class="btn btn-neutral btn-sm w-32 uppercase tracking-wider"
              >
                <span>Download</span>
                <span class="icon-[mdi--download] w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Display -->
      <div v-if="error" class="alert alert-error mt-4">
        <span>{{ error.message }}</span>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
</template>
