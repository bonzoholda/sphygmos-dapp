import { http, createConfig } from "wagmi";
import { bscTestnet } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const wagmiConfig = createConfig({
  chains: [bscTestnet],
  // 1. Explicitly add the injected connector for mobile wallets
  connectors: [
    injected(),
  ],
  transports: {
    // 2. Use a high-performance public mirror for better stability
    [bscTestnet.id]: http(),
  },
});
