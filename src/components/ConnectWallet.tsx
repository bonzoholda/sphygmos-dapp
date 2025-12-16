import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  if (!isConnected) {
    return (
      <button
        onClick={() => connect({ connector: injected() })}
        className="px-4 py-2 rounded bg-blue-600 text-white"
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-700">
        {address?.slice(0, 6)}…{address?.slice(-4)}
      </span>

      <button
        onClick={() => disconnect()}
        className="px-3 py-1 rounded bg-gray-200"
      >
        Disconnect
      </button>
    </div>
  );
}
