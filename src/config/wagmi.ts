import { http } from "wagmi";
import { defaultWagmiConfig } from "@web3modal/wagmi/react/config";
import { bsc } from "wagmi/chains";

export const projectId = "0e067b77e88bde54e08e5d0a94da2cc6";

const metadata = {
  name: "Sphygmos",
  description: "Sphygmos mining dApp",
  url: "https://smostoken.netlify.app",
  icons: ["https://smostoken.netlify.app/logo.png"],
};

export const wagmiConfig = defaultWagmiConfig({
  chains: [bsc],
  projectId,
  metadata,
  enableWalletConnect: true,
  walletConnectOptions: {
    showQrModal: false,
  },
  enableInjected: true,
  enableEIP6963: true,
  enableCoinbaseWallet: false,

  // Logic: Use bloXroute's MEV-Guard for BSC. 
  // This is often more effective than the standard Pancake RPC for broad wallet support.
  transports: {
    [bsc.id]: http("https://bsc.mev-share.flashbots.net"), 
  },
});
