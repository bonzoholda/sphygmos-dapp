import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useEffect, useState } from "react";
import { fmt } from "../utils/format";
import { SPHYGMOS_CONTROLLER_ABI } from "../abi/SphygmosController";

const CONTROLLER_ADDRESS = import.meta.env.VITE_CONTROLLER_ADDRESS as `0x${string}`;

export default function Stats() {
  const { address } = useAccount();
  const safeAddress = address ?? "0x0000000000000000000000000000000000000000";

  /* ───────── Blockchain Data ───────── */
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

  /* ───────── Unstake Setup ───────── */
  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  /* ───────── Strict Time Calculation ───────── */
  // Use a single "heartbeat" for the entire component
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTimeSeconds(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 7 Days = 604,800 seconds
  const LOCK_PERIOD = 604800; 
  
  // Calculate remaining time
  const depositTimestamp = lastDepositTime ? Number(lastDepositTime) : 0;
  const unlockTimestamp = depositTimestamp + LOCK_PERIOD;
  const remainingSeconds = unlockTimestamp - currentTimeSeconds;
  
  // The lock is active ONLY if there is a stake AND the time hasn't passed
  const hasStake = stakedSMOS && stakedSMOS > 0n;
  const isCurrentlyLocked = hasStake && remainingSeconds > 0;

  const handleUnstake = () => {
    writeContract({
      address: CONTROLLER_ADDRESS,
      abi: SPHYGMOS_CONTROLLER_ABI,
      functionName: "withdraw",
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Staked SMOS" value={fmt(stakedSMOS)} />
        <StatCard 
          label="Lock Status" 
          value={isCurrentlyLocked ? "LOCKED" : (hasStake ? "READY" : "N/A")} 
          statusColor={isCurrentlyLocked ? "text-yellow-500" : "text-green-500"}
        />
      </div>

      {/* ───── Lock Timer & Action ───── */}
      <div className="glass-card p-5 border-t-2 border-yellow-500/30">
        <div className="mb-4">
          <p className="text-[10px] uppercase text-slate-500 font-bold">Staked Lock Status</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl font-mono font-black ${isCurrentlyLocked ? "text-yellow-400" : "text-green-400"}`}>
              {isCurrentlyLocked 
                ? `Locked for ${formatLockTimer(remainingSeconds)}` 
                : "Unlocked & Ready"}
            </span>
          </div>
        </div>

        <button
          onClick={handleUnstake}
          disabled={isCurrentlyLocked || !hasStake || isConfirming}
          className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            isCurrentlyLocked || !hasStake
              ? "bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800"
              : "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-900/40 active:scale-95"
          }`}
        >
          {isConfirming ? "Broadcasting..." : "Unstake All SMOS"}
        </button>
      </div>
    </div>
  );
}

/* ───────── UI Components ───────── */

function StatCard({ label, value, statusColor = "text-white" }: { label: string; value: string; statusColor?: string }) {
  return (
    <div className="glass-card p-4">
      <p className="text-[10px] uppercase text-slate-500 font-bold">{label}</p>
      <p className={`text-lg font-mono font-bold mt-1 ${statusColor}`}>{value}</p>
    </div>
  );
}

/* ───────── Helper: 00d:00h:00m ───────── */

function formatLockTimer(totalSeconds: number) {
  if (totalSeconds <= 0) return "00d:00h:00m";

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const d = days.toString().padStart(2, '0');
  const h = hours.toString().padStart(2, '0');
  const m = minutes.toString().padStart(2, '0');

  return `${d}d:${h}h:${m}m`;
}
