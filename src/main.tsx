import { init } from '@telegram-apps/sdk-react'

const isTelegramMobile =
  typeof window !== 'undefined' &&
  window.Telegram?.WebApp &&
  ['android', 'ios'].includes(window.Telegram.WebApp.platform)

if (isTelegramMobile) {
  try {
    init()
    window.Telegram.WebApp.ready()
    window.Telegram.WebApp.expand()
  } catch (e) {
    console.warn('Telegram SDK init failed', e)
  }
}

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiConfig } from './config/wagmi'
import { createWeb3Modal } from '@web3modal/wagmi/react'

const projectId = '0e067b77e88bde54e08e5d0a94da2cc6'

createWeb3Modal({
  wagmiConfig,
  projectId,
  enableAnalytics: true,
  themeMode: 'dark',

  // 🔑 CRITICAL FOR TELEGRAM
  featuredWalletIds: [],
  enableExplorer: false,
  mobileWallets: [],        // hard-disable deeplinks
  enableInjected: false     // prevent metamask://
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
