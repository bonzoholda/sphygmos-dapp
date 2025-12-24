import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const handleConnect = () => {
    const tg = (window as any).Telegram?.WebApp;

    // ✅ Telegram Mobile → open external browser
    if (tg && (tg.platform === "android" || tg.platform === "ios")) {
      tg.openLink("https://smostoken.netlify.app", { tryBrowser: true });
      return;
    }

    // ✅ Normal browser connect
    connect({ connector: injected() });
  };

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
