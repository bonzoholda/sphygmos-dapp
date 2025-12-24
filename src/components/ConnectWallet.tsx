import { useAccount, useDisconnect } from "wagmi";
import { useWeb3Modal } from "@web3modal/wagmi/react";

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useWeb3Modal();

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
      onClick={() => open()}
      className="btn wallet-btn"
    >
      Connect Wallet
    </button>
  );
}
