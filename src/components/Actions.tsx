import { parseUnits, formatUnits } from "viem";
import { useAccount, useBalance, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { useController } from "../hooks/useController";
import { SPHYGMOS_CONTROLLER_ABI } from "../abi/SphygmosController";
import { useState, useEffect } from "react";
import { TxStatus } from "./TxStatus";

const controller = import.meta.env.VITE_CONTROLLER_ADDRESS as `0x${string}`;
const USDT_ADDRESS = import.meta.env.VITE_USDT_ADDRESS as `0x${string}`;
const SMOS_ADDRESS = import.meta.env.VITE_SMOS_ADDRESS as `0x${string}`;
const PAIR_ADDRESS = "0x047511EaeDcB7548507Fcb336E219D3c08c9e806" as `0x${string}`; 

const PRIVATE_RPC_URL = "https://bscrpc.pancakeswap.finance";

const PAIR_ABI = [{ constant: true, inputs: [], name: "getReserves", outputs: [{ name: "_reserve0", type: "uint112" }, { name: "_reserve1", type: "uint112" }, { name: "_blockTimestampLast", type: "uint32" }], stateMutability: "view", type: "function" }] as const;

function WalletIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7h18v10H3z" /><path d="M16 11h4v2h-4z" /></svg>;
}

export function Actions() {
  const { address, chain } = useAccount();
  const { acquirePU, stakeSMOS, refetchAll } = useController();

  const [puAmount, setPuAmount] = useState("");
  const [puTx, setPuTx] = useState<`0x${string}`>();
  const [copyLabel, setCopyLabel] = useState("Copy RPC");
  
  // THE FIX: Persistent Verification
  const [isProtected, setIsProtected] = useState(() => {
    return localStorage.getItem("mev_shield_verified") === "true";
  });

  const { data: usdtBalance } = useBalance({ address, token: USDT_ADDRESS });
  const { data: reserves, refetch: refetchReserves } = useReadContract({
    address: PAIR_ADDRESS, abi: PAIR_ABI, functionName: "getReserves",
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  const puWait = useWaitForTransactionReceipt({ hash: puTx });

  useEffect(() => {
    if (puWait.isSuccess) {
      refetchAll();
      setPuAmount("");
    }
  }, [puWait.isSuccess]);

  const addMEVProtectedRPC = async () => {
    // @ts-ignore
    const provider = window.ethereum;
    if (!provider) return;
    try {
      // Adding it with a unique name
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: "0x38",
          chainName: "BSC MEV Shield",
          nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
          rpcUrls: [PRIVATE_RPC_URL],
          blockExplorerUrls: ["https://bscscan.com"],
        }],
      });
      // VERIFICATION: Once added and switched, we set the state
      setIsProtected(true);
      localStorage.setItem("mev_shield_verified", "true");
    } catch (err) {
      alert("Manual switch required. Please ensure your RPC is set to: " + PRIVATE_RPC_URL);
    }
  };

  if (!address) return <div className="p-10 text-center bg-slate-900 rounded-[2rem]">Connect Wallet</div>;

  return (
    <div className="space-y-6">
      {/* SHIELD STATUS CARD - Optimized for Scannability */}
      <div className={`p-6 rounded-[2rem] border-2 transition-all duration-500 ${isProtected ? 'bg-emerald-500/5 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-slate-900 border-slate-800 shadow-xl'}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl transition-all ${isProtected ? 'bg-emerald-400 text-black shadow-[0_0_15px_rgba(52,211,153,0.5)]' : 'bg-slate-800 text-slate-500'}`}>
              {isProtected ? "🛡️" : "🔓"}
            </div>
            <div>
              <h4 className={`text-base font-black uppercase tracking-widest ${isProtected ? 'text-emerald-400' : 'text-slate-200'}`}>
                {isProtected ? "Shield Active" : "Shield Exposed"}
              </h4>
              <p className="text-[11px] text-slate-500 font-bold leading-tight">
                {isProtected ? "Private RPC Verified" : "Public RPC Detected"}
              </p>
            </div>
          </div>
          
          {/* Real Toggle to allow users to "reset" if they change networks back */}
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
          <button 
            onClick={addMEVProtectedRPC}
            className={`h-14 rounded-2xl text-sm font-black transition-all border-none ${isProtected ? 'bg-emerald-500/20 text-emerald-500 cursor-default' : 'bg-[#eab308] text-black hover:bg-[#ca8a04]'}`}
          >
            {isProtected ? "Shield On" : "One-Tap Setup"}
          </button>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(PRIVATE_RPC_URL);
              setCopyLabel("Copied!");
              setTimeout(() => setCopyLabel("Copy RPC"), 2000);
            }}
            className="h-14 rounded-2xl text-sm font-bold border-2 border-slate-700 text-slate-300 hover:border-[#eab308] hover:text-[#eab308] transition-all bg-transparent"
          >
            {copyLabel}
          </button>
        </div>

        {/* Technical Breadcrumb */}
        <div className="mt-4 pt-4 border-t border-slate-800/50 flex justify-between items-center text-[10px] font-bold">
            <span className="text-slate-600 uppercase tracking-tighter">Chain Name</span>
            <span className={isProtected ? "text-emerald-500" : "text-red-500"}>{chain?.name || "Detecting..."}</span>
        </div>
      </div>

      {/* DEPOSIT ACTION */}
      <div className="space-y-3">
        <div className="relative group">
          <input 
            className="input w-full h-14 bg-slate-900 border-slate-800 focus:border-[#eab308] rounded-2xl transition-all text-white font-bold" 
            placeholder="USDT amount" 
            value={puAmount} 
            onChange={(e) => setPuAmount(e.target.value)} 
          />
          <div className="absolute inset-y-0 right-4 flex items-center gap-2 text-xs font-bold text-slate-500">
             <WalletIcon /> {usdtBalance ? Number(formatUnits(usdtBalance.value, 18)).toFixed(2) : "0.00"}
          </div>
        </div>
        <button
          className="btn h-14 w-full bg-[#eab308] hover:bg-[#ca8a04] text-black border-none rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-yellow-900/20 transition-all active:scale-95"
          disabled={!puAmount || acquirePU.isPending}
          onClick={async () => {
            // High-priority gas for MEV protection
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
    </div>
  );
}
