import { useAccount, useDisconnect } from "wagmi";

// Telegram mobile detection
function getTelegramApp() {
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
    const tg = getTelegramApp();

    // ✅ TELEGRAM MOBILE (escape WebView)
    if (tg && (tg.platform === "android" || tg.platform === "ios")) {
      tg.openLink(
        "https://walletconnect.com/explorer?type=wallet",
        { try_browser: true }
      );
      return;
    }

    // ✅ NON-TELEGRAM (fallback to Web3Modal)
    window.dispatchEvent(new CustomEvent("open-web3modal"));
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
