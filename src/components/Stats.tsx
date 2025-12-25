import {
  useAccount,
  useReadContracts,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useEffect, useMemo, useState } from "react";
import { fmt } from "../utils/format";
import { SPHYGMOS_CONTROLLER_ABI } from "../abi/SphygmosController";
import { useController } from "../hooks/useController";

const CONTROLLER_ADDRESS = import.meta.env.VITE_CONTROLLER_ADDRESS as `0x${string}`;

/* ───────── Helper: Lock Status Formatter ───────── */
function formatLockTime(unlockTs: bigint) {
  if (unlockTs === 0n) return { status: "Not Staked", locked: false };
  const now = Math.floor(Date.now() / 1000);
  const diff = Number(unlockTs) - now;
  if (diff <= 0) return { status: "Unlocked & Ready", locked: false };
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  return {
    status: `Locked ${days.toString().padStart(2, "0")}d:${hours.toString().padStart(2, "0")}h:${minutes.toString().padStart(2, "0")}m`,
    locked: true,
  };
}

export default function Stats() {
  const { address } = useAccount();
  const { refetchAll } = useController();
  const safeAddress = address ?? "0x0000000000000000000000000000000000000000";

  /* ───────── Atomic Contract Reads ───────── */
  // Using useReadContracts ensures all data is fetched from the SAME block
  const { data, refetch } = useReadContracts({
    contracts: [
      { address: CONTROLLER_ADDRESS, abi: SPHYGMOS_CONTROLLER_ABI, functionName: "userPU", args: [safeAddress] },
      { address: CONTROLLER_ADDRESS, abi: SPHYGMOS_CONTROLLER_ABI, functionName: "stakedSMOS", args: [safeAddress] },
      { address: CONTROLLER_ADDRESS, abi: SPHYGMOS_CONTROLLER_ABI, functionName: "unlockTime", args: [safeAddress] },
      { address: CONTROLLER_ADDRESS, abi: SPHYGMOS_CONTROLLER_ABI, functionName: "accRewardPerPU" },
      { address: CONTROLLER_ADDRESS, abi: SPHYGMOS_CONTROLLER_ABI, functionName: "rewardDebt", args: [safeAddress] },
    ],
    query: {
      enabled: !!address,
      refetchInterval: 5000, // Frequent polling to stay "live"
    },
  });

  const [uPU, uStaked, uUnlock, gAcc, uDebt] = useMemo(() => {
    return [
      data?.[0]?.result as bigint | undefined,
      data?.[1]?.result as bigint | undefined,
      data?.[2]?.result as bigint | undefined,
      data?.[3]?.result as bigint | undefined,
      data?.[4]?.result as bigint | undefined,
    ];
  }, [data]);

  /* ───────── Reward Calculation ───────── */
  const pendingRewards = useMemo(() => {
    // 1. If values are missing or user has no power, it's 0
    if (!uPU || !gAcc || uDebt === undefined || uPU === 0n) return 0n;

    // 2. Perform math with BigInt precision
    const accumulated = (uPU * gAcc) / BigInt(1e18);
    
    // 3. Prevent "Huge Number" display: 
    // If debt is somehow higher than accumulated (rare timing issue), return 0
    if (uDebt > accumulated) return 0n;
    
    return accumulated - uDebt;
  }, [uPU, gAcc, uDebt]);

  /* ───────── Timer & Refresh Logic ───────── */
  const [, forceTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      forceTick((v) => v + 1);
      refetch(); // Atomic refetch
    }, 10000);
    return () => clearInterval(t);
  }, [refetch]);

  const lockInfo = useMemo(() => formatLockTime(uUnlock ?? 0n), [uUnlock]);
  const hasStake = uStaked !== undefined && uStaked > 0n;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-4">
          <p className="panel-title">Your Power Units</p>
          <p className="panel-value text-white">{fmt(uPU)}</p>
        </div>
        <div className="glass-card p-4">
          <p className="panel-title">Staked SMOS</p>
          <p className="panel-value text-neon">{fmt(uStaked)}</p>
        </div>
      </div>

      <div className="glass-card p-4 border-l-4 border-green-500 bg-green-500/5">
        <p className="panel-title text-green-400">Claimable Rewards</p>
        <div className="flex items-baseline gap-2">
          <p className="panel-value text-white">
            {/* If the number is impossibly high, show 0 while syncing */}
            {pendingRewards > BigInt(1e30) ? "0.00" : fmt(pendingRewards)}
          </p>
          <span className="text-[10px] text-green-500/60 font-mono">SMOS</span>
        </div>
      </div>

      <div className="glass-card p-4 space-y-4 border-t-2 border-yellow-500/20">
        <div className="flex justify-between items-end">
          <div>
            <p className="panel-title">Staked Lock Status</p>
            <p className={`text-lg font-mono font-bold ${lockInfo.locked ? "text-yellow-400" : "text-green-400"}`}>
              {hasStake ? lockInfo.status : "No Stake found"}
            </p>
          </div>
          {lockInfo.locked && (
            <span className="text-[10px] bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 px-2 py-1 rounded animate-pulse">
              168H LOCK
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
