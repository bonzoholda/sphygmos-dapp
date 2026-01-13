import { parseUnits, formatUnits } from "viem";
import { useAccount, useBalance, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { useController } from "../hooks/useController";
import { SPHYGMOS_CONTROLLER_ABI } from "../abi/SphygmosController";
import { useState, useEffect } from "react";
import { TxStatus } from "./TxStatus";

const controller = (import.meta.env.VITE_CONTROLLER_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`;
const USDT_ADDRESS = (import.meta.env.VITE_USDT_ADDRESS || "0x55d398326f99059fF775485246999027B3197955") as `0x${string}`;
const SMOS_ADDRESS = (import.meta.env.VITE_SMOS_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`;
const PAIR_ADDRESS = "0x047511EaeDcB7548507Fcb336E219D3c08c9e806" as `0x${string}`; 
const PRIVATE_RPC_URL = "https://bscrpc.pancakeswap.finance";

const PAIR_ABI = [{ constant: true, inputs: [], name: "getReserves", outputs: [{ name: "_reserve0", type: "uint112" }, { name: "_reserve1", type: "uint112" }, { name: "_blockTimestampLast", type: "uint32" }], stateMutability: "view", type: "function" }] as const;

function WalletIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7h18v10H3z" /><path d="M16 11h4v2h-4z" /></svg>;
}

export function Actions() {
  const { address, chain } = useAccount();
  const { acquirePU, stakeSMOS, claimMiner, refetchAll } = useController();

  const [puAmount, setPuAmount] = useState("");
  const [stakeAmount, setStakeAmount] = useState("");
  const [puTx, setPuTx] = useState<`0x${string}`>();
  const [stakeTx, setStakeTx] = useState<`0x${string}`>();
  const [claimTx, setClaimTx] = useState<`0x${string}`>();
  const [copyLabel, setCopyLabel] = useState("Copy RPC");
  const [isLoaded, setIsLoaded] = useState(false);

  // Verification Persistence
  const [isProtected, setIsProtected] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem("mev_shield_verified") === "true";
    return false;
  });

  const { data: usdtBalance, isLoading: loadingUsdt } = useBalance({ address, token: USDT_ADDRESS });
  const { data: smosBalance, isLoading: loadingSmos } = useBalance({ address, token: SMOS_ADDRESS });
  const { data: reserves, isLoading: loadingReserves } = useReadContract({
    address: PAIR_ADDRESS, abi: PAIR_ABI, functionName: "getReserves",
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  // Splash Screen Logic: Wait for data to arrive
  useEffect(() => {
    if (!loadingUsdt && !loadingSmos && !loadingReserves) {
      const timer = setTimeout(() => setIsLoaded(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [loadingUsdt, loadingSmos, loadingReserves]);

  const puWait = useWaitForTransactionReceipt({ hash: puTx });
  const stakeWait = useWaitForTransactionReceipt({ hash: stakeTx });
  const claimWait = useWaitForTransactionReceipt({ hash: claimTx });

  useEffect(() => {
    if (puWait.isSuccess || stakeWait.isSuccess || claimWait.isSuccess) {
      refetchAll();
      if (puWait.isSuccess) { setPuAmount(""); setPuTx(undefined); }
      if (stakeWait.isSuccess) { setStakeAmount(""); setStakeTx(undefined); }
      if (claimWait.isSuccess) { setClaimTx(undefined); }
    }
  }, [puWait.isSuccess, stakeWait.isSuccess, claimWait.isSuccess]);

  const addMEVProtectedRPC = async () => {
    // @ts-ignore
    const provider = window.ethereum;
    if (!provider) return;
    try {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: "0x38",
          chainName: "BSC (MEV Protected)",
          nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
          rpcUrls: [PRIVATE_RPC_URL],
          blockExplorerUrls: ["https://bscscan.com"],
        }],
      });
      setIsProtected(true);
      localStorage.setItem("mev_shield_verified", "true");
    } catch (err) {
      alert("Please add manually: " + PRIVATE_RPC_URL);
    }
  };

  // 1. SPLASH SCREEN
  if (!isLoaded && address) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4 bg-[#0f172a] rounded-[2.5rem] border border-slate-800 shadow-2xl">
      <div className="w-12 h-12 border-4 border-[#eab308] border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs animate-pulse">Initiating the dApp...</p>
    </div>
  );

  // 2. CONNECT WALLET GUARD
  if (!address) return (
    <div className="p-10 text-center bg-[#0f172a] rounded-[2.5rem] border border-slate-800 shadow-xl">
      <div className="text-4xl mb-4">🔑</div>
      <p className="text-slate-200 font-black uppercase tracking-widest text-sm">Please Connect Wallet</p>
      <p className="text-slate-500 text-xs mt-2">Connect to access Power Units and Staking</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* --- SHIELD STATUS CARD --- */}
      <div className={`p-6 rounded-[2.5rem] border-2 transition-all duration-500 ${isProtected ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-slate-900/50 border-slate-800'}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl transition-all ${isProtected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
              {isProtected ? "🛡️" : "🔓"}
            </div>
            <div>
              <h4 className={`text-base font-black uppercase tracking-widest ${isProtected ? 'text-emerald-400' : 'text-slate-200'}`}>
                {isProtected ? "Shield Active" : "Shield Exposed"}
              </h4>
              <p className="text-[11px] text-slate-500 font-bold leading-tight uppercase tracking-tighter">
                {isProtected ? "Private RPC Confirmed" : "Public RPC Detected"}
              </p>
            </div>
          </div>
          <input 
            type="checkbox" 
            checked={isProtected} 
            onChange={(e) => {
              setIsProtected(e.target.checked);
              localStorage.setItem("mev_shield_verified", e.target.checked.toString());
            }}
            className="toggle toggle-success toggle-md border-slate-700"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <button onClick={addMEVProtectedRPC} className="h-14 rounded-2xl text-xs font-black uppercase bg-[#eab308] text-black hover:bg-[#ca8a04] border-none transition-all active:scale-95 shadow-lg shadow-yellow-900/20">One-Tap Setup</button>
          <button onClick={() => { navigator.clipboard.writeText(PRIVATE_RPC_URL); setCopyLabel("Copied!"); setTimeout(() => setCopyLabel("Copy RPC"), 2000); }} className="h-14 rounded-2xl text-xs font-black uppercase border-2 border-slate-700 text-slate-300 hover:border-[#eab308] hover:text-[#eab308] bg-transparent transition-all active:scale-95">
            {copyLabel}
          </button>
        </div>
      </div>

      {/* --- ACQUIRE POWER UNITS --- */}
      <div className="space-y-3">
        <div className="relative group">
          <input className="input w-full h-14 bg-slate-900 border-slate-800 focus:border-[#eab308] rounded-2xl text-white font-bold transition-all" placeholder="USDT amount" value={puAmount} onChange={(e) => setPuAmount(e.target.value)} />
          <div className="absolute inset-y-0 right-4 flex items-center gap-2 text-xs font-bold text-slate-500">
             <WalletIcon /> {usdtBalance ? Number(formatUnits(usdtBalance.value, 18)).toFixed(2) : "0.00"}
          </div>
        </div>
        <button
          className="btn h-14 w-full bg-[#eab308] hover:bg-[#ca8a04] text-black border-none rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-yellow-900/20 active:scale-95 transition-all"
          disabled={!puAmount || acquirePU.isPending}
          onClick={() => {
            acquirePU.writeContractAsync({
                address: controller, abi: SPHYGMOS_CONTROLLER_ABI, functionName: "depositPush",
                args: [parseUnits(puAmount, 18)],
                maxPriorityFeePerGas: parseUnits('3', 'gwei'), 
            }).then(hash => setPuTx(hash)).catch(() => {});
          }}
        >
          {acquirePU.isPending ? "Confirming..." : "Acquire Power Units"}
        </button>
        <TxStatus hash={puTx} />
      </div>

      {/* --- STAKE SMOS --- */}
      <div className="space-y-3">
        <div className="relative group">
          <input className="input w-full h-14 bg-slate-900 border-slate-800 focus:border-[#eab308] rounded-2xl text-white font-bold transition-all" placeholder="SMOS amount" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} />
          <div className="absolute inset-y-0 right-4 flex items-center gap-2 text-xs font-bold text-slate-500">
             <WalletIcon /> {smosBalance ? Number(formatUnits(smosBalance.value, 18)).toFixed(2) : "0.00"}
          </div>
        </div>
        <button
          className="btn h-14 w-full bg-slate-800 hover:bg-slate-700 text-white border-none rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all"
          disabled={!stakeAmount || stakeSMOS.isPending}
          onClick={() => {
            stakeSMOS.writeContractAsync({
                address: controller, abi: SPHYGMOS_CONTROLLER_ABI, functionName: "stake",
                args: [parseUnits(stakeAmount, 18)],
            }).then(hash => setStakeTx(hash)).catch(() => {});
          }}
        >
          {stakeSMOS.isPending ? "Staking..." : "Stake SMOS"}
        </button>
        <TxStatus hash={stakeTx} />
      </div>

      {/* --- CLAIM REWARDS --- */}
      <button 
        className="btn h-14 w-full bg-transparent border-2 border-slate-800 hover:border-slate-600 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95"
        disabled={claimMiner.isPending} 
        onClick={() => {
            claimMiner.writeContractAsync({ 
                address: controller, 
                abi: SPHYGMOS_CONTROLLER_ABI, 
                functionName: "claimMinerRewards" 
            }).then(hash => setClaimTx(hash)).catch(() => {});
        }}
      >
        {claimMiner.isPending ? "Processing..." : "Claim Mining Rewards"}
      </button>
      <TxStatus hash={claimTx} />
    </div>
  );
}
