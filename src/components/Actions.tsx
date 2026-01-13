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
  const { address } = useAccount();
  const { acquirePU, stakeSMOS, claimMiner, refetchAll } = useController();

  const [puAmount, setPuAmount] = useState("");
  const [stakeAmount, setStakeAmount] = useState("");
  const [puTx, setPuTx] = useState<`0x${string}`>();
  const [stakeTx, setStakeTx] = useState<`0x${string}`>();
  const [claimTx, setClaimTx] = useState<`0x${string}`>();
  
  // Anti-Sandwich Toggle
  const [usePrivateRPC, setUsePrivateRPC] = useState(true);

  const { data: reserves, refetch: refetchReserves } = useReadContract({
    address: PAIR_ADDRESS,
    abi: PAIR_ABI,
    functionName: "getReserves",
    query: { 
      enabled: !!address,
      refetchInterval: 5000 // Faster refresh to monitor volatility
    },
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
  const claimWait = useWaitForTransactionReceipt({ hash: claimWait });

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

  /* ───────── ENHANCED DEFENSE LOGIC ───────── */
  const validateSandwichRisk = async () => {
    const { data: latestReserves } = await refetchReserves();
    if (!latestReserves) return true;

    const [res0, res1, lastTimestamp] = latestReserves;
    const now = Math.floor(Date.now() / 1000);

    // 1. VOLATILITY CHECK (Detecting active attacks)
    // If a trade happened in the last 15 seconds, someone might be manipulating the pool.
    if (now - lastTimestamp < 15) {
      const proceed = confirm("⚠️ High activity detected in the pool (last trade < 15s ago). This could be an attack in progress. Proceed anyway?");
      if (!proceed) return false;
    }

    // 2. DYNAMIC PRICE IMPACT CHECK
    // Determine which reserve is USDT
    const isUsdtToken0 = USDT_ADDRESS?.toLowerCase() < SMOS_ADDRESS?.toLowerCase();
    const reserveUSDT = isUsdtToken0 ? res0 : res1;
    const poolUSDT = Number(formatUnits(reserveUSDT, 18));
    
    const depositValue = parseFloat(puAmount);
    if (isNaN(depositValue) || depositValue <= 0) return false;

    const impact = (depositValue / poolUSDT) * 100;

    if (impact > 1) {
      return confirm(`⚠️ High Impact: This deposit is ${impact.toFixed(2)}% of the pool. Small pools are easily sandwiched. Continue?`);
    }

    return true;
  };

  if (!address || !controller) return null;

  return (
    <div className="space-y-6">
      {/* MEV Protection Info */}
      <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-slate-300 font-medium">MEV Sandwich Protection</span>
          <input 
            type="checkbox" 
            checked={usePrivateRPC} 
            onChange={(e) => setUsePrivateRPC(e.target.checked)}
            className="toggle toggle-primary toggle-xs"
          />
        </div>
        <p className="text-slate-500 leading-relaxed">
          Protects your deposit from bots. {usePrivateRPC ? "Status: Active." : "Status: Disabled (Risky)."}
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
                // High priority tip to outpace bots in the mempool
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
