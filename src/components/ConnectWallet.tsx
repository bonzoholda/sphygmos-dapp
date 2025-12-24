import React, { useMemo } from "react";
import { useAccount } from "wagmi";

export const ConnectWallet: React.FC = () => {
  const { isConnected } = useAccount();

  // Detect Telegram WebApp (mobile + web)
  const isTelegram = useMemo(() => {
    if (typeof window === "undefined") return false;
    return Boolean((window as any).Telegram?.WebApp);
  }, []);

  /**
   * RULE:
   * - Inside Telegram → hide normal WalletConnect button
   * - Outside Telegram → show Web3Modal button
   */
  if (isTelegram) {
    return null;
  }

  return (
    <div className="w-full">
      {!isConnected && (
        <w3m-button balance="hide"></w3m-button>
      )}
    </div>
  );
};
