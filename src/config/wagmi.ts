import { http } from "wagmi";
import { defaultWagmiConfig } from "@web3modal/wagmi/react/config";
import { bsc } from "wagmi/chains";

// Project ID
export const projectId = "0e067b77e88bde54e08e5d0a94da2cc6";

// Metadata - MUST match your production URL exactly
const metadata = {
  name: "Sphygmos",
  description: "Sphygmos mining dApp",
  url: "https://smostoken.netlify.app",
  icons: ["https://smostoken.netlify.app/logo.png"],
};

// ✅ BNB Chain Mainnet wagmi config (Telegram-safe)
export const wagmiConfig = defaultWagmiConfig({
  chains: [bsc],
  projectId,
  metadata,

  // WalletConnect is required for Telegram & TokenPocket
  enableWalletConnect: true,
  walletConnectOptions: {
    showQrModal: false,
  },

  // Injected wallets (MetaMask browser, OKX, etc.)
  enableInjected: true,
  enableEIP6963: true,

  // Optional
  enableCoinbaseWallet: false,

  // Optional explicit transport (recommended for stability)
  transports: {
    [bsc.id]: http("https://bsc-dataseed.binance.org"),
  },
});
