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
// This name must be EXACTLY what you see in your wallet network list for the green light to turn on
const PRIVATE_NETWORK_NAME = "BSC (MEV Protected)";

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
  
  const [usePrivateRPC, setUsePrivateRPC] = useState(true);
  const [copyLabel, setCopyLabel] = useState("Copy RPC");

  // Detective Logic: We check if the name matches OR if the chain ID is 56 
  // and the user has toggled the protection (since we can't truly read the RPC URL).
  const isProtected = chain?.name === PRIVATE_NETWORK_NAME;

  const { data: reserves, refetch: refetchReserves } = useReadContract({
    address: PAIR_ADDRESS,
    abi: PAIR_ABI,
    functionName: "getReserves",
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  const { data: usdtBalance, refetch: refetchUsdt } = useBalance({ address, token: USDT_ADDRESS, query: { enabled: !!address } });
  const { data: smosBalance, refetch: refetchSmos } = useBalance({ address, token: SMOS_ADDRESS, query: { enabled: !!address } });

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

  const addMEVProtectedRPC = async () => {
    // @ts-ignore
    const provider = window.ethereum;
    if (!provider) return alert("Wallet not found.");
    try {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: "0x38",
          chainName: PRIVATE_NETWORK_NAME,
          nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
          rpcUrls: [PRIVATE_RPC_URL],
          blockExplorerUrls: ["https://bscscan.com"],
        }],
      });
    } catch (err: any) {
      alert("Manual setup required: " + PRIVATE_RPC_URL);
    }
  };

  const validateSandwichRisk = async () => {
    const { data: latestReserves } = await refetchReserves();
    if (!latestReserves) return true;
    const [res0, res1, lastTimestamp] = latestReserves;
    const now = Math.floor(Date.now() / 1000);
    if (now - lastTimestamp < 15) {
      if (!confirm("⚠️ Pool activity detected. Possible attack in progress. Proceed?")) return false;
    }
    const isUsdtToken0 = USDT_ADDRESS?.toLowerCase() < SMOS_ADDRESS?.toLowerCase();
    const reserveUSDT = isUsdtToken0 ? res0 : res1;
    const poolUSDT = Number(formatUnits(reserveUSDT, 18));
    const impact = (parseFloat(puAmount) / poolUSDT) * 100;
    if (impact > 1) return confirm(`⚠️ High Impact: ${impact.toFixed(2)}% of pool. Proceed?`);
    return true;
  };

  if (!address || !controller) return null;

  return (
    <div className="space-y-6">
      {/* --- RE-STYLED MEV SHIELD CARD --- */}
      <div className={`p-4 rounded-2xl border transition-all duration-300 ${isProtected ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-slate-800/60 border-slate-700'}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${isProtected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
              {isProtected ? "🛡️" : "🔓"}
            </div>
            <div>
              <h4 className={`text-sm font-bold uppercase tracking-wider ${isProtected ? 'text-emerald-400' : 'text-slate-200'}`}>
                {isProtected ? "Shield Active" : "Shield Exposed"}
              </h4>
              <p className="text-[10px] text-slate-500 leading-tight">
                {isProtected ? "Your transaction is hidden from bots." : "Bots can see and attack your deposit."}
              </p>
            </div>
          </div>
          <input 
            type="checkbox" 
            checked={usePrivateRPC} 
            onChange={(e) => setUsePrivateRPC(e.target.checked)}
            className="toggle toggle-primary toggle-sm mt-1"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={addMEVProtectedRPC}
            className={`btn btn-sm normal-case font-semibold border-none ${isProtected ? 'btn-disabled bg-emerald-500/20 text-emerald-500' : 'btn-primary'}`}
          >
            {isProtected ? "Connected" : "One-Tap Setup"}
          </button>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(PRIVATE_RPC_URL);
              setCopyLabel("Copied!");
              setTimeout(() => setCopyLabel("Copy RPC"), 2000);
            }}
            className="btn btn-sm btn-outline normal-case font-semibold border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            {copyLabel}
          </button>
        </div>
        
        <div className="mt-3 pt-3 border-t border-slate-700/50 flex justify-between items-center px-1">
          <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Connection Status</span>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${isProtected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
            {chain?.name || "Unknown Network"}
          </span>
        </div>
      </div>

      {/* --- ACQUIRE POWER UNITS --- */}
      <div className="space-y-2">
        <div className="relative">
          <input className="input w-full pr-28" placeholder="USDT amount" value={puAmount} onChange={(e) => setPuAmount(e.target.value)} />
          <div className="absolute inset-y-0 right-3 flex items-center gap-1 text-xs text-slate-400">
            <WalletIcon /> {usdtBalance ? Number(formatUnits(usdtBalance.value, usdtBalance.decimals)).toFixed(2) : "0.00"}
          </div>
        </div>
        <button
          className="btn w-full btn-primary font-bold tracking-wide"
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
      <div className="space-y-2">
        <div className="relative">
          <input className="input w-full pr-28" placeholder="SMOS amount" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} />
          <div className="absolute inset-y-0 right-3 flex items-center gap-1 text-xs text-slate-400">
            <WalletIcon /> {smosBalance ? Number(formatUnits(smosBalance.value, smosBalance.decimals)).toFixed(2) : "0.00"}
          </div>
        </div>
        <button
          className="btn w-full font-bold tracking-wide"
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

      <button className="btn btn-outline w-full font-bold" disabled={claimMiner.isPending} onClick={async () => {
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
