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
const PRIVATE_NETWORK_NAME = "BSC (MEV Protected)";

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
    payable: false,
    stateMutability: "view",
    type: "function",
  },
] as const;

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
  
  const [usePrivateRPC, setUsePrivateRPC] = useState(true);
  const [copyLabel, setCopyLabel] = useState("Copy RPC");

  // Detect if the user is successfully using the Private RPC
  const isProtected = chain?.name === PRIVATE_NETWORK_NAME;

  const { data: reserves, refetch: refetchReserves } = useReadContract({
    address: PAIR_ADDRESS,
    abi: PAIR_ABI,
    functionName: "getReserves",
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  const { data: usdtBalance, refetch: refetchUsdt } = useBalance({
    address,
    token: USDT_ADDRESS,
    query: { enabled: !!address },
  });

  const { data: smosBalance, refetch: refetchSmos } = useBalance({
    address,
    token: SMOS_ADDRESS,
    query: { enabled: !!address },
  });

  const puWait = useWaitForTransactionReceipt({ hash: puTx });
  const stakeWait = useWaitForTransactionReceipt({ hash: stakeTx });
  const claimWait = useWaitForTransactionReceipt({ hash: claimTx });

  useEffect(() => {
    if (puWait.isSuccess || stakeWait.isSuccess || claimWait.isSuccess) {
      refetchAll();
      refetchUsdt();
      refetchSmos();
      refetchReserves();
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
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x38" }], 
      });
      
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
      if (err.code === 4902 || err.code === -32603) {
        alert("Manual setup required. Copy the RPC URL and add it in your wallet settings.");
      }
    }
  };

  const handleCopyRpc = () => {
    navigator.clipboard.writeText(PRIVATE_RPC_URL);
    setCopyLabel("Copied!");
    setTimeout(() => setCopyLabel("Copy RPC"), 2000);
  };

  const validateSandwichRisk = async () => {
    const { data: latestReserves } = await refetchReserves();
    if (!latestReserves) return true;

    const [res0, res1, lastTimestamp] = latestReserves;
    const now = Math.floor(Date.now() / 1000);

    if (now - lastTimestamp < 15) {
      const proceed = confirm("⚠️ High activity detected in the pool. This could be an attack in progress. Proceed anyway?");
      if (!proceed) return false;
    }

    const isUsdtToken0 = USDT_ADDRESS?.toLowerCase() < SMOS_ADDRESS?.toLowerCase();
    const reserveUSDT = isUsdtToken0 ? res0 : res1;
    const poolUSDT = Number(formatUnits(reserveUSDT, 18));
    
    const depositValue = parseFloat(puAmount);
    if (isNaN(depositValue) || depositValue <= 0) return false;

    const impact = (depositValue / poolUSDT) * 100;
    if (impact > 1) {
      return confirm(`⚠️ High Impact: This deposit is ${impact.toFixed(2)}% of the pool. Continue?`);
    }

    return true;
  };

  if (!address || !controller) return null;

  return (
    <div className="space-y-6">
      {/* MEV Protection Info & Status */}
      <div className={`p-4 rounded-xl border transition-all ${isProtected ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-800/80 border-slate-700'} space-y-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{isProtected ? "🛡️" : "⚠️"}</span>
            <div className="flex flex-col">
              <span className={`font-bold text-xs ${isProtected ? 'text-green-400' : 'text-slate-200'}`}>
                {isProtected ? "SHIELD ACTIVE" : "SHIELD EXPOSED"}
              </span>
              <span className="text-[10px] text-slate-500">
                {isProtected ? "Your trades are hidden" : "Bots can see your trades"}
              </span>
            </div>
          </div>
          <input 
            type="checkbox" 
            checked={usePrivateRPC} 
            onChange={(e) => setUsePrivateRPC(e.target.checked)}
            className="toggle toggle-primary toggle-sm"
          />
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={addMEVProtectedRPC}
            className="btn btn-primary btn-xs flex-1 normal-case font-medium py-2 h-auto"
          >
            One-Tap Setup
          </button>
          <button 
            onClick={handleCopyRpc}
            className="btn btn-outline btn-xs px-3 normal-case font-medium py-2 h-auto"
          >
            {copyLabel}
          </button>
        </div>

        <p className="text-[10px] text-slate-500 text-center">
          Current Network: <span className={isProtected ? 'text-green-500' : 'text-red-400'}>{chain?.name || "Unknown"}</span>
        </p>
      </div>

      {/* Acquire PU */}
      <div className="space-y-2">
        <div className="relative">
          <input
            className="input w-full pr-28"
            placeholder="USDT amount"
            value={puAmount}
            onChange={(e) => setPuAmount(e.target.value)}
          />
          <div className="absolute inset-y-0 right-3 flex items-center gap-1 text-xs text-slate-400">
            <WalletIcon />
            {usdtBalance ? Number(formatUnits(usdtBalance.value, usdtBalance.decimals)).toFixed(2) : "0.00"}
          </div>
        </div>
        <button
          className="btn w-full"
          disabled={!puAmount || acquirePU.isPending}
          onClick={async () => {
            const isSafe = await validateSandwichRisk();
            if (!isSafe) return;
            try {
              const hash = await acquirePU.writeContractAsync({
                address: controller,
                abi: SPHYGMOS_CONTROLLER_ABI,
                functionName: "depositPush",
                args: [parseUnits(puAmount, 18)],
                maxPriorityFeePerGas: parseUnits('3', 'gwei'), 
              });
              setPuTx(hash);
            } catch (err) {
              console.error("Deposit failed", err);
            }
          }}
        >
          {acquirePU.isPending ? "Processing..." : "Acquire Power Units"}
        </button>
        <TxStatus hash={puTx} />
      </div>

      {/* Stake SMOS */}
      <div className="space-y-2">
        <div className="relative">
          <input
            className="input w-full pr-28"
            placeholder="SMOS amount"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
          />
          <div className="absolute inset-y-0 right-3 flex items-center gap-1 text-xs text-slate-400">
            <WalletIcon />
            {smosBalance ? Number(formatUnits(smosBalance.value, smosBalance.decimals)).toFixed(2) : "0.00"}
          </div>
        </div>
        <button
          className="btn w-full"
          disabled={!stakeAmount || stakeSMOS.isPending}
          onClick={async () => {
            const hash = await stakeSMOS.writeContractAsync({
              address: controller,
              abi: SPHYGMOS_CONTROLLER_ABI,
              functionName: "stake",
              args: [parseUnits(stakeAmount, 18)],
            });
            setStakeTx(hash);
          }}
        >
          {stakeSMOS.isPending ? "Staking..." : "Stake SMOS"}
        </button>
        <TxStatus hash={stakeTx} />
      </div>

      {/* Claim Rewards */}
      <button
        className="btn btn-outline w-full"
        disabled={claimMiner.isPending}
        onClick={async () => {
          try {
            const hash = await claimMiner.writeContractAsync({
              address: controller,
              abi: SPHYGMOS_CONTROLLER_ABI,
              functionName: "claimMinerRewards",
            });
            setClaimTx(hash);
          } catch (err) {
            console.error("Claim failed", err);
          }
        }}
      >
        {claimMiner.isPending ? "Claiming..." : "Claim Mining Rewards"}
      </button>

      <TxStatus hash={claimTx} />
    </div>
  );
}
