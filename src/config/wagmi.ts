import { http, createConfig } from "wagmi";
import { defaultWagmiConfig } from "@web3modal/wagmi/react/config";
import { bscTestnet } from "wagmi/chains";

// Project ID
export const projectId = "0e067b77e88bde54e08e5d0a94da2cc6";

// Metadata
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

  // 🔑 CRITICAL FOR TELEGRAM MOBILE
  enableWalletConnect: true,
  walletConnectOptions: {
    showQrModal: false, // 🚨 THIS FIXES TELEGRAM MOBILE
  },

  auth: {
    email: false,
  },
});
