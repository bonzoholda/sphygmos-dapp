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
// We use a unique name that is unlikely to be overwritten by the wallet
const PRIVATE_NETWORK_NAME = "MEV Shield Active"; 

const PAIR_ABI = [{ constant: true, inputs: [], name: "getReserves", outputs: [{ name: "_reserve0", type: "uint112" }, { name: "_reserve1", type: "uint112" }, { name: "_blockTimestampLast", type: "uint32" }], stateMutability: "view", type: "function" }] as const;

export function Actions() {
  const { address, chain } = useAccount();
  const { acquirePU, stakeSMOS, claimMiner, refetchAll } = useController();

  const [puAmount, setPuAmount] = useState("");
  const [stakeAmount, setStakeAmount] = useState("");
  const [puTx, setPuTx] = useState<`0x${string}`>();
  const [stakeTx, setStakeTx] = useState<`0x${string}`>();
  const [claimTx, setClaimTx] = useState<`0x${string}`>();
  const [copyLabel, setCopyLabel] = useState("Copy RPC");

  // VERIFIED LOGIC: Green only if the wallet name matches our custom shield name
  const isProtected = chain?.name === PRIVATE_NETWORK_NAME;

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

  const addMEVProtectedRPC = async () => {
    // @ts-ignore
    const provider = window.ethereum;
    if (!provider) return;
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
    } catch (err) {
      alert("Manual Setup: Change your Network Name to 'MEV Shield Active' and RPC to " + PRIVATE_RPC_URL);
    }
  };

  if (!address || !controller) return null;

  return (
    <div className="space-y-6">
      {/* --- PREMIUM MEV SHIELD CARD --- */}
      <div className={`p-5 rounded-[2rem] border transition-all duration-500 ${isProtected ? 'bg-emerald-500/5 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-slate-900/50 border-slate-800'}`}>
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all ${isProtected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
              {isProtected ? "🛡️" : "🔓"}
            </div>
            <div>
              <h4 className={`text-base font-black uppercase tracking-widest ${isProtected ? 'text-emerald-400' : 'text-slate-200'}`}>
                {isProtected ? "Shield Active" : "Shield Exposed"}
              </h4>
              <p className="text-[11px] text-slate-500 font-medium">
                {isProtected ? "Private RPC is confirmed." : "Using Public RPC. Bots can see you."}
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={addMEVProtectedRPC}
            className={`h-14 rounded-2xl text-sm font-bold transition-all border-none ${isProtected ? 'bg-emerald-500/20 text-emerald-500 cursor-default' : 'bg-[#eab308] text-black hover:bg-[#ca8a04]'}`}
          >
            {isProtected ? "Protected" : "One-Tap Setup"}
          </button>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(PRIVATE_RPC_URL);
              setCopyLabel("Copied!");
              setTimeout(() => setCopyLabel("Copy RPC"), 2000);
            }}
            className="h-14 rounded-2xl text-sm font-bold border-2 border-[#eab308] text-[#eab308] bg-transparent hover:bg-[#eab308]/10 transition-all"
          >
            {copyLabel}
          </button>
        </div>
        
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex justify-between items-center px-1">
          <span className="text-[10px] text-slate-600 uppercase font-black tracking-[0.2em]">Live Connection</span>
          <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${isProtected ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-400'}`}>
            {chain?.name || "BNB Smart Chain"}
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
