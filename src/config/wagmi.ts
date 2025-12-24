import { defaultWagmiConfig } from '@web3modal/wagmi/react'
import { walletConnect } from 'wagmi/connectors'

export const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  connectors: [
    walletConnect({
      projectId,
      showQrModal: true, // 🔑 CRITICAL
      metadata: {
        name: 'Sphygmos',
        description: 'Sphygmos mining dApp',
        url: 'https://smostoken.netlify.app',
        icons: ['https://smostoken.netlify.app/logo.png'],
      }
    })
  ]
})
