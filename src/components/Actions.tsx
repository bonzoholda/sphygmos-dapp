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
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
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

  // Explicit MEV acknowledgement (honest + enforceable)
  const [mevAcknowledged, setMevAcknowledged] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("mev_acknowledged") === "true";
    }
    return false;
  });

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
        params: [
          {
            chainId: "0x38",
            chainName: "BSC (Private RPC)",
            nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
            rpcUrls: [PRIVATE_RPC_URL],
            blockExplorerUrls: ["https://bscscan.com"],
          },
        ],
      });
    } catch {
      alert("Please add this RPC manually:\n" + PRIVATE_RPC_URL);
    }
  };

  if (!isLoaded && address) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4 bg-[#0f172a] rounded-[2.5rem] border border-slate-800">
        <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-xs font-black uppercase tracking-widest">
          Initializing dApp
        </p>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="p-10 text-center bg-[#0f172a] rounded-[2.5rem] border border-slate-800">
        <div className="text-4xl mb-4">🔑</div>
        <p className="text-slate-200 font-black uppercase tracking-widest text-sm">
          Please Connect Wallet
        </p>
      </div>
    );
  }

  const txBlocked = !mevAcknowledged;

  return (
    <div className="space-y-6">
      {/* SHIELD CARD */}
      <div className="p-6 rounded-[2.5rem] border border-emerald-500/30 bg-emerald-500/5">
        <h4 className="text-emerald-400 font-black uppercase tracking-widest mb-2">
          MEV Protection Acknowledgement
        </h4>
        <p className="text-xs text-slate-400 mb-4">
          This dApp requires private RPC usage to reduce sandwich attacks.
          Frontend cannot enforce RPC — proceed only if you configured one.
        </p>

        <div className="flex gap-3">
          <button
            onClick={addMEVProtectedRPC}
            className="h-12 px-4 rounded-xl bg-yellow-400 text-black font-black text-xs uppercase"
          >
            Add Private RPC
          </button>

          <button
            onClick={() => {
              setMevAcknowledged(true);
              localStorage.setItem("mev_acknowledged", "true");
            }}
            className="h-12 px-4 rounded-xl border border-emerald-500 text-emerald-400 font-black text-xs uppercase"
          >
            I Understand the Risk
          </button>
        </div>
      </div>

      {/* ACQUIRE PU */}
      <button
        disabled={txBlocked || acquirePU.isPending}
        className="btn h-14 w-full bg-yellow-400 text-black font-black rounded-2xl disabled:opacity-40"
        onClick={() =>
          acquirePU
            .writeContractAsync({
              address: controller,
              abi: SPHYGMOS_CONTROLLER_ABI,
              functionName: "depositPush",
              args: [parseUnits(puAmount || "0", 18)],
              maxPriorityFeePerGas: parseUnits("2", "gwei"),
              maxFeePerGas: parseUnits("6", "gwei"),
            })
            .then(setPuTx)
        }
      >
        Acquire Power Units
      </button>

      <TxStatus hash={puTx} />
    </div>
  );
}
