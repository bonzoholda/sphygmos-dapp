import React, { useMemo } from "react";
import { useAccount } from "wagmi";
import { Web3Button } from "@web3modal/wagmi/react";

export const ConnectWallet: React.FC = () => {
  const { isConnected } = useAccount();

  // Detect Telegram WebApp (mobile or web)
  const isTelegram = useMemo(() => {
    if (typeof window === "undefined") return false;
    return Boolean((window as any).Telegram?.WebApp);
  }, []);

  /**
   * RULE:
   * - Inside Telegram → HIDE normal Connect Wallet
   * - Outside Telegram → Show normal WalletConnect button
   */
  if (isTelegram) {
    return null;
  }

  return (
    <div className="w-full">
      {!isConnected && (
        <Web3Button
          label="Connect Wallet"
          balance="hide"
        />
      )}
    </div>
  );
};
