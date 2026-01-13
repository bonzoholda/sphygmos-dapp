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

  const { data: reserves, refetch: refetchReserves } = useReadContract({
    address: PAIR_ADDRESS,
    abi: PAIR_ABI,
    functionName: "getReserves",
    query: { 
      enabled: !!address,
      refetchInterval: 10000 // Force refresh every 10 seconds to catch bot activity
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

  /* ───────── IMPROVED DEFENSE LOGIC ───────── */
  const validateSandwichRisk = async () => {
    // 1. Fetch fresh data
    const { data: latestReserves } = await refetchReserves();
    if (!latestReserves) return true;
  
    const [res0, res1, lastTimestamp] = latestReserves;
    
    // 2. Optimized Stale Check:
    // Instead of using Date.now() (local system time), we check if the 
    // pool is extremely outdated. We increase the threshold to 30 mins
    // or focus on Price Impact instead.
    const now = Math.floor(Date.now() / 1000);
    const secondsSinceLastTrade = now - lastTimestamp;
  
    // If the pool hasn't moved in 1 hour, it might be an abandoned or 
    // low-liquidity pool, but it's not necessarily a "stale RPC".
    if (secondsSinceLastTrade > 3600) {
        console.warn("Pool hasn't had a trade in over an hour.");
    }
  
    // 3. High Impact Warning (The most important defense):
    const depositValue = parseFloat(puAmount);
    if (isNaN(depositValue) || depositValue <= 0) return false;
  
    const poolUSDT = Number(formatUnits(res0, 18));
    
    // Calculate potential impact percentage
    const impact = (depositValue / poolUSDT) * 100;
  
    if (impact > 1) { // Greater than 1% of pool
      return confirm(
        `Warning: This deposit represents ${impact.toFixed(2)}% of the liquidity pool. ` +
        `Large trades are highly vulnerable to sandwich attacks. Do you wish to proceed?`
      );
    }
  
    return true;
  };
  
  if (!address || !controller) return null;

  return (
    <div className="space-y-6">
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
              // Priority Tip to incentivize the MEV RPC to bundle this transaction faster
              const hash = await acquirePU.writeContractAsync({
                address: controller,
                abi: SPHYGMOS_CONTROLLER_ABI,
                functionName: "depositPush",
                args: [parseUnits(puAmount, 18)],
                // BSC Priority Tip
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
