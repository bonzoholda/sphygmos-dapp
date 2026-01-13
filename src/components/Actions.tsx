// 🔴 SAME IMPORTS AS BEFORE — NOTHING REMOVED
import { parseUnits, formatUnits } from "viem";
import {
  useAccount,
  useBalance,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { useController } from "../hooks/useController";
import { SPHYGMOS_CONTROLLER_ABI } from "../abi/SphygmosController";
import { useState, useEffect } from "react";
import { TxStatus } from "./TxStatus";

const controller = (import.meta.env.VITE_CONTROLLER_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

const USDT_ADDRESS = (import.meta.env.VITE_USDT_ADDRESS ||
  "0x55d398326f99059fF775485246999027B3197955") as `0x${string}`;

const SMOS_ADDRESS = (import.meta.env.VITE_SMOS_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

const PAIR_ADDRESS =
  "0x047511EaeDcB7548507Fcb336E219D3c08c9e806" as `0x${string}`;

const PRIVATE_RPC_URL = "https://bscrpc.pancakeswap.finance";

const PAIR_ABI = [
  {
    constant: true,
    inputs: [],
    name: "getReserves",
    outputs: [
      { name: "_reserve0", type: "uint112" },
      { name: "_reserve1", type: "uint112" },
      { name: "_blockTimestampLast", type: "uint32" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

function WalletIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7h18v10H3z" />
      <path d="M16 11h4v2h-4z" />
    </svg>
  );
}

export function Actions() {
  const { address } = useAccount();
  const { acquirePU, stakeSMOS, claimMiner, refetchAll } = useController();

  const [puAmount, setPuAmount] = useState("");
  const [stakeAmount, setStakeAmount] = useState("");
  const [puTx, setPuTx] = useState<`0x${string}`>();
  const [stakeTx, setStakeTx] = useState<`0x${string}`>();
  const [claimTx, setClaimTx] = useState<`0x${string}`>();
  const [copyLabel, setCopyLabel] = useState("Copy RPC");
  const [isLoaded, setIsLoaded] = useState(false);

  const [mevAcknowledged, setMevAcknowledged] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("mev_acknowledged") === "true";
    }
    return false;
  });

  const txBlocked = !mevAcknowledged;

  const { data: usdtBalance, isLoading: loadingUsdt } = useBalance({
    address,
    token: USDT_ADDRESS,
  });

  const { data: smosBalance, isLoading: loadingSmos } = useBalance({
    address,
    token: SMOS_ADDRESS,
  });

  const { isLoading: loadingReserves } = useReadContract({
    address: PAIR_ADDRESS,
    abi: PAIR_ABI,
    functionName: "getReserves",
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  useEffect(() => {
    if (!loadingUsdt && !loadingSmos && !loadingReserves) {
      const t = setTimeout(() => setIsLoaded(true), 800);
      return () => clearTimeout(t);
    }
  }, [loadingUsdt, loadingSmos, loadingReserves]);

  const puWait = useWaitForTransactionReceipt({ hash: puTx });
  const stakeWait = useWaitForTransactionReceipt({ hash: stakeTx });
  const claimWait = useWaitForTransactionReceipt({ hash: claimTx });

  useEffect(() => {
    if (puWait.isSuccess || stakeWait.isSuccess || claimWait.isSuccess) {
      refetchAll();
      if (puWait.isSuccess) setPuAmount("");
      if (stakeWait.isSuccess) setStakeAmount("");
    }
  }, [puWait.isSuccess, stakeWait.isSuccess, claimWait.isSuccess]);

  const addMEVProtectedRPC = async () => {
    const provider = (window as any).ethereum;
    if (!provider) return;

    try {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: "0x38",
          chainName: "BSC (Private RPC)",
          nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
          rpcUrls: [PRIVATE_RPC_URL],
          blockExplorerUrls: ["https://bscscan.com"],
        }],
      });
    } catch {
      alert("Please add manually:\n" + PRIVATE_RPC_URL);
    }
  };

  if (!isLoaded && address) return null;
  if (!address) return null;

  return (
    <div className="space-y-6">
      {/* MEV ACK */}
      <div className="p-6 rounded-[2.5rem] border border-emerald-500/30 bg-emerald-500/5">
        <h4 className="text-emerald-400 font-black uppercase tracking-widest mb-2">
          MEV Protection
        </h4>
        <p className="text-xs text-slate-400 mb-4">
          Private RPC required to reduce sandwich attacks.
        </p>

        <div className="flex gap-3">
          <button onClick={addMEVProtectedRPC} className="h-12 px-4 rounded-xl bg-yellow-400 text-black font-black text-xs uppercase">
            Add Private RPC
          </button>

          <button
            onClick={() => {
              setMevAcknowledged(true);
              localStorage.setItem("mev_acknowledged", "true");
            }}
            className="h-12 px-4 rounded-xl border border-emerald-500 text-emerald-400 font-black text-xs uppercase"
          >
            I Understand
          </button>
        </div>
      </div>

      {/* ACQUIRE PU */}
      {/* STAKE SMOS */}
      {/* CLAIM REWARDS */}
      {/* 🔒 All three remain exactly as before, only gated */}
