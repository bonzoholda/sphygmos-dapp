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

  // Specifically for the 7-day lock timer
  const { data: lastDepositTime } = useReadContract({
    address: CONTROLLER_ADDRESS,
    abi: SPHYGMOS_CONTROLLER_ABI,
    functionName: "lastDepositTime",
    args: [safeAddress],
    query: { enabled: !!address },
  });

  /* ───────── Unstake Execution ───────── */
  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  const handleUnstake = () => {
    writeContract({
      address: CONTROLLER_ADDRESS,
      abi: SPHYGMOS_CONTROLLER_ABI,
      functionName: "withdraw", 
    });
  };

  /* ───────── Countdown Logic ───────── */
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const LOCK_DURATION = 604800; // 7 Days
  const unlockTime = lastDepositTime ? Number(lastDepositTime) + LOCK_DURATION : 0;
  const lockSecondsLeft = unlockTime - now;
  const isLocked = lockSecondsLeft > 0;

  return (
    <div className="space-y-4">
      {/* Primary User Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Your Power Units" value={fmt(userPU)} />
        <StatCard label="Staked SMOS" value={fmt(stakedSMOS)} />
      </div>

      {/* ───── NEW: Lock Status & Unstake ───── */}
      <div className="glass-card p-5 border-l-4 border-l-yellow-500/50">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-tighter text-slate-500 font-bold">Staked Lock Status</p>
            <p className={`text-xl font-mono font-black mt-1 ${isLocked ? "text-yellow-400" : "text-green-400"}`}>
              {stakedSMOS && stakedSMOS > 0n 
                ? (isLocked ? `Locked for ${formatDetailedCountdown(lockSecondsLeft)}` : "Unlocked") 
                : "No Active Stake"}
            </p>
          </div>
          {isLocked && (
            <div className="bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20">
              <span className="text-[10px] text-yellow-500 font-bold animate-pulse">🔒 LOCKED</span>
            </div>
          )}
        </div>

        <button
          onClick={handleUnstake}
          disabled={isLocked || !stakedSMOS || stakedSMOS === 0n || isConfirming}
          className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
            isLocked || !stakedSMOS || stakedSMOS === 0n
              ? "bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800"
              : "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-900/20 active:scale-95"
          }`}
        >
          {isConfirming ? "Processing Unstake..." : "Unstake All SMOS"}
        </button>
        
        {isLocked && (
          <p className="text-center text-[9px] text-slate-500 mt-3 italic">
            Tokens are non-withdrawable during the 168-hour commitment period.
          </p>
        )}
      </div>
    </div>
  );
}

/* ───────── UI ───────── */
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card p-4 space-y-1 border-b border-white/5">
      <p className="text-[10px] uppercase text-slate-500 font-bold tracking-tight">{label}</p>
      <p className="text-lg font-mono font-bold text-white">{value}</p>
    </div>
  );
}

/* ───────── Helpers ───────── */
function formatDetailedCountdown(seconds: number) {
  if (seconds <= 0) return "00d:00h:00m";
  
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);

  return `${d.toString().padStart(2, '0')}d:${h.toString().padStart(2, '0')}h:${m.toString().padStart(2, '0')}m`;
}
