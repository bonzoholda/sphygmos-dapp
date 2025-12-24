import { useAccount, useDisconnect } from "wagmi";

function getTelegram() {
  if (typeof window === "undefined") return null;
  return (window as any).Telegram?.WebApp ?? null;
}

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <button
        onClick={() => disconnect()}
        className="btn btn-outline wallet-btn"
      >
        {address?.slice(0, 6)}…{address?.slice(-4)}
      </button>
    );
  }

  const handleConnect = () => {
    const tg = getTelegram();

    if (tg && (tg.platform === "android" || tg.platform === "ios")) {
      tg.openLink(
        "https://link.walletconnect.com/",
        { try_browser: true }
      );
      return;
    }

    // normal web behavior
    const btn = document.querySelector("w3m-button") as any;
    btn?.click?.();
  };

  return (
    <button
      onClick={handleConnect}
      className="btn wallet-btn"
    >
      Connect Wallet
    </button>
  );
}
