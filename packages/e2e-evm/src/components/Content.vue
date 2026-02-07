<script setup lang="ts">
import type { Chain } from '@wagmi/vue/chains'
import { useAccount, useChainId, useChains, useReadContract, useWaitForTransactionReceipt, useWriteContract } from '@wagmi/vue'
import { computed, ref, watch } from 'vue'
import { STORAGE_ADDRESS, StorageABI } from '../config/contracts'
import { moonbaseAlpha, passetHub } from '../config/wagmi'
import { shortenAddress } from '../utils/formatters'
import Balance from './Balance.vue'

// Faucet URLs per chain
const faucetMap: Record<number, { url: string, label: string }> = {
  [passetHub.id]: { url: 'https://faucet.polkadot.io/?parachain=1111', label: 'Get Testnet PAS' },
  [moonbaseAlpha.id]: { url: 'https://faucet.moonbeam.network', label: 'Get Testnet DEV' },
}

// Account and contract hooks
const { address, isConnected } = useAccount()
const chainId = useChainId()
const chains = useChains()

// Get the connected chain instead of using config
const connectedChain = computed(() => {
  return chains.value.find((chain: Chain) => chain.id === chainId.value) || chains.value[0]
})

// Faucet info for current chain
const faucetInfo = computed(() => {
  return faucetMap[chainId.value] ?? faucetMap[passetHub.id]
})

// Block explorer URL for current chain
const explorerUrl = computed(() => {
  return connectedChain.value.blockExplorers?.default?.url ?? 'https://blockscout-testnet.polkadot.io/'
})

// Chain icon class
const chainIconClass = computed(() => {
  const iconMap: Record<number, string> = {
    [passetHub.id]: 'icon-[token-branded--polkadot]',
    [moonbaseAlpha.id]: 'icon-[token-branded--moonbeam]',
  }
  return iconMap[chainId.value] ?? 'icon-[mdi--currency-eth]'
})
const { writeContract, data: writeData, isPending: isWritePending, error: writeError } = useWriteContract()

// Common contract config
const contractConfig = {
  abi: StorageABI,
  address: STORAGE_ADDRESS as `0x${string}`,
}

// Contract read operations
const { data: storedNumber, isLoading: isLoadingNumber, refetch: refetchNumber } = useReadContract({
  ...contractConfig,
  functionName: 'retrieve',
})

// Wait for transaction confirmation
const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
  hash: writeData,
})

const newNumber = ref('')
const toastMessage = ref('')
const showToast = ref(false)

// Storing state - combines write pending and confirmation
const isStoring = computed(() => isWritePending.value || isConfirming.value)

// Account display helpers
const displayAddress = computed(() =>
  address.value ? shortenAddress(address.value) : 'Not connected',
)

// Toast notification utility
function showToastNotification(message: string) {
  toastMessage.value = message
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// Handle copying address to clipboard
function copyAddress() {
  if (address.value) {
    navigator.clipboard.writeText(address.value)
    showToastNotification('Address copied to clipboard!')
  }
}

// Handle storing new number
async function handleStoreNumber() {
  if (!newNumber.value || !isConnected.value)
    return

  const num = Number(newNumber.value)
  if (Number.isNaN(num) || num < 0)
    return

  try {
    writeContract({
      ...contractConfig,
      functionName: 'store',
      args: [BigInt(num)],
    })
  }
  catch (error) {
    console.error('Error storing number:', error)
  }
}

// Watch for successful transaction and refresh data
watch(isConfirmed, (confirmed) => {
  if (confirmed) {
    newNumber.value = ''
    refetchNumber()
    showToastNotification('Number stored successfully!')
  }
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100/30">
    <div class="container mx-auto px-4 py-12 max-w-4xl">
      <!-- Hero Section -->
      <div class="text-center mb-12">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-800 to-black mb-6 shadow-lg shadow-black/25">
          <span class="icon-[mdi--cube-outline] w-8 h-8 text-white" />
        </div>
        <h1 class="text-3xl md:text-4xl font-semibold text-gray-900 mb-3">
          Storage DApp
        </h1>
        <p class="text-gray-500 max-w-md mx-auto">
          A simple smart contract to store and retrieve numbers on the Polkadot blockchain
        </p>
      </div>

      <!-- Main Card -->
      <div class="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-200 overflow-hidden mb-8">
        <!-- Stored Value Section -->
        <div class="p-8 md:p-10 border-b border-gray-200 bg-gradient-to-b from-gray-50/50 to-white">
          <div class="text-center">
            <p class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
              Current Value
            </p>

            <!-- Loading State -->
            <div v-if="isLoadingNumber" class="py-4">
              <span class="icon-[mdi--loading] animate-spin w-10 h-10 text-gray-600" />
            </div>

            <!-- Value Display -->
            <div v-else class="relative">
              <div class="text-7xl md:text-8xl font-light text-gray-900 tabular-nums tracking-tight">
                {{ storedNumber ?? 0 }}
              </div>
              <button
                class="absolute -right-2 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-100 transition-colors"
                :disabled="isLoadingNumber"
                @click="refetchNumber()"
              >
                <span class="icon-[mdi--refresh] w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <p class="text-sm text-gray-400 mt-3">
              Stored on blockchain
            </p>
          </div>
        </div>

        <!-- Input Section -->
        <div class="p-8 md:p-10">
          <!-- Not Connected State -->
          <div v-if="!isConnected" class="text-center py-6">
            <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
              <span class="icon-[mdi--wallet-outline] w-6 h-6 text-gray-500" />
            </div>
            <p class="text-gray-600 font-medium mb-1">
              Wallet Not Connected
            </p>
            <p class="text-sm text-gray-400">
              Connect your wallet to store a number
            </p>
          </div>

          <!-- Connected State -->
          <div v-else>
            <div class="flex gap-3">
              <input
                v-model="newNumber"
                type="number"
                min="0"
                class="flex-1 px-5 py-4 text-xl font-light text-gray-900 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-400/20 focus:bg-white transition-all placeholder:text-gray-300"
                placeholder="Enter a number"
                :disabled="isStoring"
                @keyup.enter="handleStoreNumber"
              >
              <button
                class="px-8 py-4 bg-gradient-to-r from-gray-800 to-black text-white font-medium rounded-2xl hover:from-gray-900 hover:to-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-black/25 hover:shadow-black/40 hover:-translate-y-0.5 active:translate-y-0"
                :disabled="!newNumber || isStoring"
                @click="handleStoreNumber"
              >
                <span v-if="isStoring" class="flex items-center gap-2">
                  <span class="icon-[mdi--loading] animate-spin w-5 h-5" />
                  <span>{{ isConfirming ? 'Confirming' : 'Storing' }}</span>
                </span>
                <span v-else class="flex items-center gap-2">
                  <span class="icon-[mdi--arrow-up] w-5 h-5" />
                  <span>Store</span>
                </span>
              </button>
            </div>

            <!-- Error Display -->
            <div v-if="writeError" class="mt-4 p-4 bg-gray-100 border border-gray-300 rounded-xl">
              <p class="text-sm text-gray-700 flex items-center gap-2">
                <span class="icon-[mdi--alert-circle] w-4 h-4" />
                {{ writeError.message }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Account Info Card -->
      <div class="bg-white rounded-2xl shadow-lg shadow-gray-200/30 border border-gray-200 p-6">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <!-- Wallet -->
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <span class="icon-[mdi--wallet] w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p class="text-xs text-gray-400 mb-0.5">
                Wallet
              </p>
              <div class="flex items-center gap-2">
                <span class="font-mono text-sm text-gray-700">{{ displayAddress }}</span>
                <button
                  v-if="address"
                  class="p-1 hover:bg-gray-100 rounded transition-colors"
                  @click="copyAddress"
                >
                  <span class="icon-[mdi--content-copy] w-3.5 h-3.5 text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          <!-- Network -->
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <span class="icon-[mdi--lan-connect] w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p class="text-xs text-gray-400 mb-0.5">
                Network
              </p>
              <p class="text-sm text-gray-700">
                {{ connectedChain.name }}
              </p>
            </div>
          </div>

          <!-- Balance -->
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <span class="w-5 h-5 text-gray-700" :class="chainIconClass" />
            </div>
            <div>
              <p class="text-xs text-gray-400 mb-0.5">
                Balance
              </p>
              <div class="text-sm text-gray-700">
                <Balance v-if="address" :address="address" />
                <span v-else>0 {{ connectedChain.nativeCurrency.symbol }}</span>
              </div>
            </div>
          </div>

          <!-- Faucet Link -->
          <a
            :href="faucetInfo.url"
            target="_blank"
            class="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <span class="icon-[mdi--water] w-4 h-4" />
            <span>{{ faucetInfo.label }}</span>
            <span class="icon-[mdi--open-in-new] w-3 h-3" />
          </a>
        </div>
      </div>

      <!-- Contract Info -->
      <div class="mt-6 text-center">
        <p class="text-xs text-gray-400">
          Contract:
          <a
            :href="`${explorerUrl}/address/${STORAGE_ADDRESS}`"
            target="_blank"
            class="font-mono hover:text-gray-900 transition-colors"
          >
            {{ STORAGE_ADDRESS.slice(0, 10) }}...{{ STORAGE_ADDRESS.slice(-8) }}
          </a>
        </p>
      </div>
    </div>

    <!-- Toast Notification -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="translate-y-4 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-4 opacity-0"
    >
      <div v-if="showToast" class="fixed bottom-6 right-6 z-50">
        <div class="flex items-center gap-3 px-5 py-4 bg-black text-white rounded-2xl shadow-2xl">
          <span class="icon-[mdi--check-circle] w-5 h-5 text-white" />
          <span class="text-sm font-medium">{{ toastMessage }}</span>
        </div>
      </div>
    </Transition>
  </div>
</template>
