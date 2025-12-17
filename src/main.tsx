import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "./config/wagmi";
import { RefreshProvider } from "./context/RefreshContext";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RefreshProvider>
          <App />
        </RefreshProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
