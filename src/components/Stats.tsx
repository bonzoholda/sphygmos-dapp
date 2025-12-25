import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useEffect, useMemo, useState } from "react";
import { fmt } from "../utils/format";
import { SPHYGMOS_CONTROLLER_ABI } from "../abi/SphygmosController";

const CONTROLLER_ADDRESS = import.meta.env
  .VITE_CONTROLLER_ADDRESS as `0x${string}`;

/* ───────── Helper: Lock Status Formatter ───────── */
function formatLockTime(unlockTs: bigint) {
  if (unlockTs === 0n)
    return { status: "Not Staked", locked: false };

  const now = Math.floor(Date.now() / 1000);
  const diff = Number(unlockTs) - now;

  if (diff <= 0)
    return {
      status: "Unlocked & Ready",
      locked: false,
    };

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);

  return {
    status: `Locked ${days
      .toString()
      .padStart(2, "0")}d:${hours
      .toString()
      .padStart(2, "0")}h:${minutes
      .toString()
      .padStart(2, "0")}m`,
    locked: true,
  };
}

export default function Stats() {
  const { address } = useAccount();
  const safeAddress =
    address ?? "0x0000000000000000000000000000000000000000";

  /* ───────── Contract Reads ───────── */
  const { data: userPU } = useReadContract({
    address: CONTROLLER_ADDRESS,
    abi: SPHYGMOS_CONTROLLER_ABI,
    functionName: "userPU",
    args: [safeAddress],
    query: { enabled: !!address, refetchInterval: 10000 }, // Sync every 10s
  });

  const { data: stakedSMOS } = useReadContract({
    address: CONTROLLER_ADDRESS,
    abi: SPHYGMOS_CONTROLLER_ABI,
    functionName: "stakedSMOS",
    args: [safeAddress],
    query: { enabled: !!address, refetchInterval: 10000 },
  });

  const { data: unlockTime } = useReadContract({
    address: CONTROLLER_ADDRESS,
    abi: SPHYGMOS_CONTROLLER_ABI,
    functionName: "unlockTime",
    args: [safeAddress],
    query: { enabled: !!address },
  });

  // 💎 Refetching these prevents the "lag" after claiming in Actions.tsx
  const { data: accRewardPerPU } = useReadContract({
    address: CONTROLLER_ADDRESS,
    abi: SPHYGMOS_CONTROLLER_ABI,
    functionName: "accRewardPerPU",
    query: { refetchInterval: 10000 },
  });

  const { data: rewardDebt } = useReadContract({
    address: CONTROLLER_ADDRESS,
    abi: SPHYGMOS_CONTROLLER_ABI,
    functionName: "rewardDebt",
    args: [safeAddress],
    query: { enabled: !!address, refetchInterval: 10000 },
  });

  /* ───────── Reward Calculation ───────── */
  const pendingRewards = useMemo(() => {
    // If user has no PU, pending is always 0
    if (!userPU || BigInt(userPU.toString()) === 0n) return 0n;
    // If global data is missing, return 0 to avoid "Lag" flickers
    if (!accRewardPerPU || rewardDebt === undefined) return 0n;
    
    const pu = BigInt(userPU.toString());
    const acc = BigInt(accRewardPerPU.toString());
    const debt = BigInt(rewardDebt.toString());

    const accumulated = (pu * acc) / BigInt(1e18);
    return accumulated > debt ? accumulated - debt : 0n;
  }, [userPU, accRewardPerPU, rewardDebt]);

  /* ───────── Timer Tick ───────── */
  const [, forceTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => forceTick((v) => v + 1), 60000);
    return () => clearInterval(t);
  }, []);

  /* ───────── Lock Status ───────── */
  const unlockTs = useMemo(() => {
    if (!unlockTime) return 0n;
    return BigInt(unlockTime.toString());
  }, [unlockTime]);

  const lockInfo = useMemo(() => formatLockTime(unlockTs), [unlockTs]);

  const hasStake = stakedSMOS !== undefined && BigInt(stakedSMOS) > 0n;

  /* ───────── Unstake Logic ───────── */
  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  const handleUnstake = () => {
    if (!lockInfo.locked && hasStake) {
      writeContract({
        address: CONTROLLER_ADDRESS,
        abi: SPHYGMOS_CONTROLLER_ABI,
        functionName: "unstakeSMOS",
        args: [stakedSMOS],
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* ─── Grid 1: Main Stats ─── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-4">
          <p className="panel-title">Your Power Units</p>
          <p className="panel-value text-white">
            {fmt(userPU)}
          </p>
        </div>

        <div className="glass-card p-4">
          <p className="panel-title">Staked SMOS</p>
          <p className="panel-value text-neon">
            {fmt(stakedSMOS)}
          </p>
        </div>
      </div>

      {/* ─── Simplified Reward Display (No Button) ─── */}
      <div className="glass-card p-4 border-l-4 border-green-500 bg-green-500/5">
        <p className="panel-title text-green-400">Claimable Rewards</p>
        <div className="flex items-baseline gap-2">
          <p className="panel-value text-white">
            {fmt(pendingRewards)}
          </p>
          <span className="text-[10px] text-green-500/60 font-mono tracking-tighter">SMOS</span>
        </div>
      </div>

      {/* ─── Grid 2: Lock Status & Unstake ─── */}
      <div className="glass-card p-4 space-y-4 border-t-2 border-yellow-500/20">
        <div className="flex justify-between items-end">
          <div>
            <p className="panel-title">
              Staked Lock Status
            </p>
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

        <button
          onClick={handleUnstake}
          disabled={lockInfo.locked || !hasStake || isConfirming}
          className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            lockInfo.locked || !hasStake
              ? "bg-slate-900 text-slate-600 cursor-not-allowed grayscale border border-white/5"
              : "bg-red-600 text-white hover:bg-red-700 shadow-lg active:scale-95 shadow-red-900/20"
          }`}
        >
          {isConfirming ? "Processing..." : "Unstake SMOS"}
        </button>
      </div>
    </div>
  );
}
