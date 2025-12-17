import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useEffect, useState } from "react";
import { fmt } from "../utils/format";
import { SPHYGMOS_CONTROLLER_ABI } from "../abi/SphygmosController";

const CONTROLLER_ADDRESS = import.meta.env.VITE_CONTROLLER_ADDRESS as `0x${string}`;

export default function Stats() {
  const { address } = useAccount();
  const safeAddress = address ?? "0x0000000000000000000000000000000000000000";

  /* ───────── Contract Reads ───────── */
  const { data: userPU } = useReadContract({
    address: CONTROLLER_ADDRESS,
    abi: SPHYGMOS_CONTROLLER_ABI,
    functionName: "userPU",
    args: [safeAddress],
    query: { enabled: !!address },
  });

  const { data: stakedSMOS } = useReadContract({
    address: CONTROLLER_ADDRESS,
    abi: SPHYGMOS_CONTROLLER_ABI,
    functionName: "stakedSMOS",
    args: [safeAddress],
    query: { enabled: !!address },
  });

  const { data: lastDepositTime } = useReadContract({
    address: CONTROLLER_ADDRESS,
    abi: SPHYGMOS_CONTROLLER_ABI,
    functionName: "lastDepositTime",
    args: [safeAddress],
    query: { enabled: !!address },
  });

  /* ───────── Unstake Logic ───────── */
  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  // Calculation Fix:
  const LOCK_DURATION = 604800; // 7 days
  const depositTs = lastDepositTime ? Number(lastDepositTime) : 0;
  const unlockTs = depositTs + LOCK_DURATION;
  const secondsLeft = unlockTs - now;

  // IMPORTANT: Only consider it locked if depositTs > 0 and timer hasn't hit zero
  const isLocked = depositTs > 0 && secondsLeft > 0;
  const hasStake = !!stakedSMOS && stakedSMOS > 0n;

  const handleUnstake = () => {
    writeContract({
      address: CONTROLLER_ADDRESS,
      abi: SPHYGMOS_CONTROLLER_ABI,
      functionName: "withdraw",
    });
  };

  return (
    <div className="space-y-4">
      {/* ─── Grid 1: Main Stats ─── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-4">
          <p className="panel-title">Your Power Units</p>
          <p className="panel-value text-white">{fmt(userPU)}</p>
        </div>
        <div className="glass-card p-4">
          <p className="panel-title">Staked SMOS</p>
          <p className="panel-value text-neon">{fmt(stakedSMOS)}</p>
        </div>
      </div>

      {/* ─── Grid 2: Lock Status & Unstake ─── */}
      <div className="glass-card p-4 space-y-4 border-t-2 border-yellow-500/20">
        <div className="flex justify-between items-end">
          <div>
            <p className="panel-title">Staked Lock Status</p>
            <p className={`text-lg font-mono font-bold ${isLocked ? "text-yellow-400" : "text-green-400"}`}>
              {hasStake 
                ? (isLocked ? `Locked: ${formatTimer(secondsLeft)}` : "Unlocked & Ready") 
                : "No Stake found"}
            </p>
          </div>
          {isLocked && (
             <span className="text-[10px] bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 px-2 py-1 rounded animate-pulse">
               168H LOCK
             </span>
          )}
        </div>

        <button
          onClick={handleUnstake}
          disabled={isLocked || !hasStake || isConfirming}
          className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            isLocked || !hasStake
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

function formatTimer(sec: number) {
  if (sec <= 0) return "00d:00h:00m";
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${d.toString().padStart(2, '0')}d:${h.toString().padStart(2, '0')}h:${m.toString().padStart(2, '0')}m`;
}
