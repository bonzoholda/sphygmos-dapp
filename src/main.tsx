// FIX for Telegram Mobile Deep Linking (ERR_UNKNOWN_URL_SCHEME)
if (window.parent !== window) { // Check if inside an iframe (like Telegram)
  const originalOpen = window.open;
  window.open = function (url, target, features) {
    const tg = (window as any).Telegram?.WebApp;
    
    // If the URL is a deep link (metamask://, wc:, etc.)
    if (url && (url.startsWith('metamask:') || url.startsWith('trust:') || url.startsWith('wc:') || url.startsWith('tpouter:'))) {
      if (tg && tg.openLink) {
        tg.openLink(url); // Tell Telegram to open it externally
        return null;
      }
    }
    return originalOpen.call(window, url, target, features);
  };
}

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "./config/wagmi";
import { createWeb3Modal } from '@web3modal/wagmi/react'; // 1. Import the modal creator

// 2. Configuration for the Modal
// Replace with your actual Project ID from cloud.reown.com
const projectId = '0e067b77e88bde54e08e5d0a94da2cc6'; 

createWeb3Modal({
  wagmiConfig: wagmiConfig,
  projectId,
  enableAnalytics: true, // Optional
  themeMode: 'dark'     // Fits the Telegram dark mode well
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {/* Your App now has access to both Wagmi hooks and the Web3Modal */}
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
