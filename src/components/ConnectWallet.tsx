import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";

const DAPP_URL = "https://smostoken.netlify.app";

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const isTelegram =
    typeof window !== "undefined" &&
    (window as any).Telegram?.WebApp;

  // TokenPocket universal link (BEST supported)
  const openInTokenPocket = () => {
    const encoded = encodeURIComponent(DAPP_URL);
    const tpLink =
      `https://tokenpocket.github.io/tp-url-common/index.html?url=${encoded}`;

    const tg = (window as any).Telegram?.WebApp;

    if (tg) {
      tg.openLink(tpLink, { tryBrowser: true });
    } else {
      window.location.href = tpLink;
    }
  };

  // ─────────────────────────────────────
  // CONNECTED STATE
  // ─────────────────────────────────────
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

  // ─────────────────────────────────────
  // TELEGRAM STATE → OPEN TOKENPOCKET
  // ─────────────────────────────────────
  if (isTelegram) {
    return (
      <button
        onClick={openInTokenPocket}
        className="btn wallet-btn bg-green-600 hover:bg-green-700"
      >
        🟢 Open in TokenPocket
      </button>
    );
  }

  // ─────────────────────────────────────
  // NORMAL WEB → INJECTED WALLET
  // ─────────────────────────────────────
  return (
    <button
      onClick={() => connect({ connector: injected() })}
      className="btn wallet-btn"
      disabled={isPending}
    >
      {isPending ? "Connecting…" : "Connect Wallet"}
    </button>
  );
}
