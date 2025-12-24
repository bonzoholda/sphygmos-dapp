import React, { useMemo } from "react";
import { useAccount } from "wagmi";

export const ConnectWallet: React.FC = () => {
  const { address, isConnected } = useAccount();

  // Detect Telegram WebApp
  const isTelegram = useMemo(() => {
    if (typeof window === "undefined") return false;
    return Boolean((window as any).Telegram?.WebApp);
  }, []);

  /**
   * RULE:
   * - Telegram → hide normal button (blue Telegram button handles it)
   * - Web / Mobile browser → show normal connect button
   */
  if (isTelegram) {
    return null;
  }

  const openModal = () => {
    // Web3Modal v3 exposes this event
    window.dispatchEvent(new Event("open-web3modal"));
  };

  if (isConnected && address) {
    return (
      <button className="btn btn-outline wallet-btn cursor-default">
        {address.slice(0, 6)}…{address.slice(-4)}
      </button>
    );
  }

  return (
    <button
      onClick={openModal}
      className="btn wallet-btn"
    >
      Connect Wallet
    </button>
  );
};
