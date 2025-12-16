import { http, createConfig } from "wagmi";
import { bscTestnet } from "wagmi/chains";

export const wagmiConfig = createConfig({
  chains: [bscTestnet],
  transports: {
    [bscTestnet.id]: http(),
  },
});
