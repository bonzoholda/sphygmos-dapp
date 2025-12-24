import { init, openLink } from '@telegram-apps/sdk-react';

// Check if we are inside Telegram before running any SDK code
const isTelegram = typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.platform !== 'unknown';

if (isTelegram) {
  try {
    init();
    
    // Patch window.open ONLY if in Telegram
    const originalOpen = window.open;
    window.open = (url: string | URL | undefined, target?: string, features?: string) => {
      const urlString = url?.toString() || '';

      if (urlString.startsWith('metamask:') || urlString.startsWith('trust:') || urlString.startsWith('tpouter:')) {
        let finalUrl = urlString;
        if (urlString.startsWith('metamask:')) {
          finalUrl = urlString.replace('metamask:', 'https://metamask.app.link/');
        } else if (urlString.startsWith('trust:')) {
          finalUrl = urlString.replace('trust:', 'https://link.trustwallet.com/');
        }

        openLink(finalUrl);
        return null;
      }
      return originalOpen(url, target, features);
    };
  } catch (e) {
    console.warn("Telegram SDK initialization failed, continuing in web mode", e);
  }
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
