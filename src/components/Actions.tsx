import { parseUnits, formatUnits } from "viem";
import { useAccount, useBalance, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { useController } from "../hooks/useController";
import { SPHYGMOS_CONTROLLER_ABI } from "../abi/SphygmosController";
import { useState, useEffect } from "react";
import { TxStatus } from "./TxStatus";

const controller = import.meta.env.VITE_CONTROLLER_ADDRESS as `0x${string}` | undefined;
const USDT_ADDRESS = import.meta.env.VITE_USDT_ADDRESS as `0x${string}` | undefined;
const SMOS_ADDRESS = import.meta.env.VITE_SMOS_ADDRESS as `0x${string}` | undefined;
const PAIR_ADDRESS = "0x047511EaeDcB7548507Fcb336E219D3c08c9e806" as `0x${string}`; 

const PRIVATE_RPC_URL = "https://bscrpc.pancakeswap.finance";

const PAIR_ABI = [{ constant: true, inputs: [], name: "getReserves", outputs: [{ name: "_reserve0", type: "uint112" }, { name: "_reserve1", type: "uint112" }, { name: "_blockTimestampLast", type: "uint32" }], stateMutability: "view", type: "function" }] as const;

// FIXED: Icon component added back to prevent blank screen crash
function WalletIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7h18v10H3z" /><path d="M16 11h4v2h-4z" />
    </svg>
  );
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

  // PERSISTENCE: Remembers the user's shield choice across refreshes
  const [isProtected, setIsProtected] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("mev_shield_verified") === "true";
    }
    return false;
  });

  const { data: reserves, refetch: refetchReserves } = useReadContract({
    address: PAIR_ADDRESS, abi: PAIR_ABI, functionName: "getReserves",
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  const { data: usdtBalance, refetch: refetchUsdt } = useBalance({ address, token: USDT_ADDRESS });
  const { data: smosBalance, refetch: refetchSmos } = useBalance({ address, token: SMOS_ADDRESS });

  const puWait = useWaitForTransactionReceipt({ hash: puTx });
  const stakeWait = useWaitForTransactionReceipt({ hash: stakeTx });
  const claimWait = useWaitForTransactionReceipt({ hash: claimTx });

  useEffect(() => {
    if (puWait.isSuccess || stakeWait.isSuccess || claimWait.isSuccess) {
      refetchAll(); refetchUsdt(); refetchSmos(); refetchReserves();
      if (puWait.isSuccess) { setPuAmount(""); setPuTx(undefined); }
      if (stakeWait.isSuccess) { setStakeAmount(""); setStakeTx(undefined); }
      if (claimWait.isSuccess) { setClaimTx(undefined); }
    }
  }, [puWait.isSuccess, stakeWait.isSuccess, claimWait.isSuccess, refetchAll, refetchUsdt, refetchSmos, refetchReserves]);

  const handleToggleProtection = (checked: boolean) => {
    setIsProtected(checked);
    localStorage.setItem("mev_shield_verified", checked.toString());
  };

  const validateSandwichRisk = async () => {
    const { data: latestReserves } = await refetchReserves();
    if (!latestReserves) return true;
    const [res0, res1, lastTimestamp] = latestReserves;
    const now = Math.floor(Date.now() / 1000);
    if (now - lastTimestamp < 15) {
      if (!confirm("⚠️ High activity detected in the pool. Proceed anyway?")) return false;
    }
    const isUsdtToken0 = USDT_ADDRESS?.toLowerCase() < SMOS_ADDRESS?.toLowerCase();
    const reserveUSDT = isUsdtToken0 ? res0 : res1;
    const poolUSDT = Number(formatUnits(reserveUSDT, 18));
    const impact = (parseFloat(puAmount) / poolUSDT) * 100;
    if (impact > 1) return confirm(`⚠️ High Impact: ${impact.toFixed(2)}% of pool. Continue?`);
    return true;
  };

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
      handleToggleProtection(true);
    } catch (err) {
      alert("Please ensure you add " + PRIVATE_RPC_URL + " manually.");
    }
  };

  if (!address || !controller) return null;

  return (
    <div className="space-y-6">
      {/* --- SHIELD STATUS CARD --- */}
      <div className={`p-5 rounded-[2rem] border transition-all duration-500 ${isProtected ? 'bg-emerald-500/5 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-slate-900 border-slate-800'}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all ${isProtected ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-slate-800 text-slate-500'}`}>
              {isProtected ? "🛡️" : "🔓"}
            </div>
            <div>
              <h4 className={`text-base font-black uppercase tracking-widest ${isProtected ? 'text-emerald-400' : 'text-slate-200'}`}>
                {isProtected ? "Shield Active" : "Shield Exposed"}
              </h4>
              <p className="text-[11px] text-slate-500 font-medium leading-tight">
                {isProtected ? "Private RPC protection enabled." : "Using Public RPC. Bots can see you."}
              </p>
            </div>
          </div>
          <input 
            type="checkbox" 
            checked={isProtected} 
            onChange={(e) => handleToggleProtection(e.target.checked)}
            className="toggle toggle-success toggle-sm"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={addMEVProtectedRPC}
            className="h-14 rounded-2xl text-sm font-bold bg-[#eab308] text-black hover:bg-[#ca8a04] border-none shadow-lg shadow-yellow-900/10 transition-all active:scale-95"
          >
            One-Tap Setup
          </button>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(PRIVATE_RPC_URL);
              setCopyLabel("Copied!");
              setTimeout(() => setCopyLabel("Copy RPC"), 2000);
            }}
            className="h-14 rounded-2xl text-sm font-bold border-2 border-[#eab308] text-[#eab308] bg-transparent hover:bg-[#eab308]/10 transition-all active:scale-95"
          >
            {copyLabel}
          </button>
        </div>
      </div>

      {/* --- ACQUIRE POWER UNITS --- */}
      <div className="space-y-3">
        <div className="relative">
          <input className="input w-full h-14 bg-slate-900 border-slate-800 rounded-2xl pr-28 text-white focus:border-[#eab308] transition-all" placeholder="USDT amount" value={puAmount} onChange={(e) => setPuAmount(e.target.value)} />
          <div className="absolute inset-y-0 right-4 flex items-center gap-2 text-xs text-slate-400 font-bold">
            <WalletIcon /> {usdtBalance ? Number(formatUnits(usdtBalance.value, usdtBalance.decimals)).toFixed(2) : "0.00"}
          </div>
        </div>
        <button
          className="btn h-14 w-full bg-[#eab308] hover:bg-[#ca8a04] text-black border-none rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-yellow-900/20 active:scale-95 transition-all"
          disabled={!puAmount || acquirePU.isPending}
          onClick={async () => {
            if (!(await validateSandwichRisk())) return;
            try {
              const hash = await acquirePU.writeContractAsync({
                address: controller, abi: SPHYGMOS_CONTROLLER_ABI, functionName: "depositPush",
                args: [parseUnits(puAmount, 18)],
                maxPriorityFeePerGas: parseUnits('3', 'gwei'), 
              });
              setPuTx(hash);
            } catch (err) {}
          }}
        >
          {acquirePU.isPending ? "Processing..." : "Acquire Power Units"}
        </button>
        <TxStatus hash={puTx} />
      </div>

      {/* --- STAKE SMOS --- */}
      <div className="space-y-3">
        <div className="relative">
          <input className="input w-full h-14 bg-slate-900 border-slate-800 rounded-2xl pr-28 text-white focus:border-[#eab308] transition-all" placeholder="SMOS amount" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} />
          <div className="absolute inset-y-0 right-4 flex items-center gap-2 text-xs text-slate-400 font-bold">
            <WalletIcon /> {smosBalance ? Number(formatUnits(smosBalance.value, smosBalance.decimals)).toFixed(2) : "0.00"}
          </div>
        </div>
        <button
          className="btn h-14 w-full bg-slate-800 hover:bg-slate-700 text-white border-none rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all"
          disabled={!stakeAmount || stakeSMOS.isPending}
          onClick={async () => {
            const hash = await stakeSMOS.writeContractAsync({
              address: controller, abi: SPHYGMOS_CONTROLLER_ABI, functionName: "stake",
              args: [parseUnits(stakeAmount, 18)],
            });
            setStakeTx(hash);
          }}
        >
          {stakeSMOS.isPending ? "Staking..." : "Stake SMOS"}
        </button>
        <TxStatus hash={stakeTx} />
      </div>

      {/* --- CLAIM --- */}
      <button className="btn btn-outline h-14 w-full border-slate-700 rounded-2xl font-black uppercase tracking-widest text-white hover:bg-slate-800 active:scale-95 transition-all" disabled={claimMiner.isPending} onClick={async () => {
          try {
            const hash = await claimMiner.writeContractAsync({ address: controller, abi: SPHYGMOS_CONTROLLER_ABI, functionName: "claimMinerRewards" });
            setClaimTx(hash);
          } catch (err) {}
      }}>
        {claimMiner.isPending ? "Claiming..." : "Claim Mining Rewards"}
      </button>

      <TxStatus hash={claimTx} />
    </div>
  );
}
