import { init, utils } from '@telegram-apps/sdk-react';

// 1. Initialize the SDK
init();

// 2. The Proven Patch for Mobile ERR_UNKNOWN_URL_SCHEME
const originalOpen = window.open;
window.open = (url: string | URL | undefined, target?: string, features?: string) => {
  const urlString = url?.toString() || '';

  // Intercept common wallet schemes
  if (urlString.startsWith('metamask:') || urlString.startsWith('trust:') || urlString.startsWith('tpouter:')) {
    let finalUrl = urlString;

    // Transform deep links into Universal Links (Web-compatible)
    if (urlString.startsWith('metamask:')) {
      finalUrl = urlString.replace('metamask:', 'https://metamask.app.link/');
    } else if (urlString.startsWith('trust:')) {
      finalUrl = urlString.replace('trust:', 'https://link.trustwallet.com/');
    } else if (urlString.startsWith('tpouter:')) {
      finalUrl = urlString.replace('tpouter:', 'https://tokenpocket.pro/');      
    }

    // Use the native Telegram SDK to break out of the webview
    if (utils.openLink.isAvailable()) {
      utils.openLink(finalUrl);
      return null; 
    }
  }

  return originalOpen(url, target, features);
};

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
