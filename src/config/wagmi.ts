import { http, createConfig } from "wagmi";
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { bscTestnet } from "wagmi/chains";

// 1. Get ProjectID from https://cloud.reown.com/
export const projectId = '0e067b77e88bde54e08e5d0a94da2cc6'; 

// 2. Create metadata object
const metadata = {
  name: "Sphygmos",
  description: "Sphygmos dApp",
  url: "https://smostoken.netlify.app",
  icons: ["https://smostoken.netlify.app/logo.png"],
  redirect: {
    native: "https://smostoken.netlify.app", // Fallback for deep links
    universal: "https://smostoken.netlify.app"
  }
};

// 3. Create the config using defaultWagmiConfig
export const wagmiConfig = defaultWagmiConfig({
  chains: [bscTestnet],
  projectId,
  metadata,
  // This replaces your manual 'transports' setup automatically
  auth: {
    email: false, // Set to true if you want social logins later
  }
});
