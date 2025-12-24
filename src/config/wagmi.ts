import { http, createConfig } from "wagmi";
import { defaultWagmiConfig } from "@web3modal/wagmi/react/config";
import { bscTestnet } from "wagmi/chains";

// Project ID
export const projectId = "0e067b77e88bde54e08e5d0a94da2cc6";

// Metadata - The 'url' here MUST match your Telegram Bot link or Netlify URL exactly
const metadata = {
  name: "Sphygmos",
  description: "Sphygmos mining dApp",
  url: "https://smostoken.netlify.app",
  icons: ["https://smostoken.netlify.app/logo.png"],
};

// ✅ Telegram-safe wagmi config
export const wagmiConfig = defaultWagmiConfig({
  chains: [bscTestnet],
  projectId,
  metadata,

  // 🔑 THE FIX FOR TOKENPOCKET & TELEGRAM
  enableWalletConnect: true,
  walletConnectOptions: {
    showQrModal: false, 
  },

  // This ensures the wallet knows where to "send" the user back to
  // For Telegram, we often need to force the universal link redirect
  enableInjected: true, // 🚨 Disable injected on mobile to force WalletConnect
  enableEIP6963: true,
  enableCoinbaseWallet: false, 
});
