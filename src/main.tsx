import { utils } from '@telegram-apps/sdk';

// This is the proven industry fix for Telegram Mini App deep linking
const patchTelegramDeepLinks = () => {
  if (typeof window === 'undefined') return;

  const originalOpen = window.open;

  window.open = (url: string | URL | undefined, target?: string, features?: string) => {
    const urlString = url?.toString() || '';

    // 1. Detect if it's a wallet deep link
    const isWalletLink = urlString.startsWith('metamask:') || 
                         urlString.startsWith('trust:') || 
                         urlString.startsWith('wc:') || 
                         urlString.startsWith('tpouter:');

    if (isWalletLink) {
      let finalUrl = urlString;

      // 2. Convert specific schemes to Universal Links (proven to fix ERR_UNKNOWN_URL_SCHEME)
      if (urlString.startsWith('metamask:')) {
        finalUrl = urlString.replace('metamask:', 'https://metamask.app.link/');
      } else if (urlString.startsWith('trust:')) {
        finalUrl = urlString.replace('trust:', 'https://link.trustwallet.com/');
      }

      // 3. Use Telegram's native SDK to jump out of the WebView
      try {
        utils.openLink(finalUrl);
        return null; // Stop the browser from trying to load it
      } catch (e) {
        console.error("Telegram SDK not ready, falling back to _blank", e);
        return originalOpen(finalUrl, '_blank'); 
      }
    }

    return originalOpen(url, target, features);
  };
};

patchTelegramDeepLinks();

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
