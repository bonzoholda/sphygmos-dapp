import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiConfig } from './config/wagmi'

import { createWeb3Modal } from '@web3modal/wagmi/react'

const projectId = '0e067b77e88bde54e08e5d0a94da2cc6'

// ✅ Web3Modal MUST be created BEFORE App renders
createWeb3Modal({
  wagmiConfig,
  projectId,
  themeMode: 'dark',

  // 🔑 Telegram-safe defaults
  featuredWalletIds: [],
  enableExplorer: false,
  enableInjected: false
})

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
)
