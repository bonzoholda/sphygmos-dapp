import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";

// Telegram mobile detector (local, safe)
function isTelegramMobile(): boolean {
  if (typeof window === "undefined") return false;
  const tg = (window as any).Telegram?.WebApp;
  if (!tg) return false;
  return tg.platform === "android" || tg.platform === "ios";
}

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
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
    if (isTelegramMobile()) {
      // ✅ WalletConnect works in Telegram mobile
      connect({
        connector: walletConnect({
          projectId: "0e067b77e88bde54e08e5d0a94da2cc6"
        })
      });
      return;
    }

    // ✅ Normal browsers
    connect({ connector: injected() });
  };

  return (
    <button
      onClick={handleConnect}
      className="btn wallet-btn"
      disabled={isPending}
    >
      {isPending ? "Connecting…" : "Connect Wallet"}
    </button>
  );
}
