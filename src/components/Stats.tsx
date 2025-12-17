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

  // This tracks the timestamp specifically for SMOS staking
  const { data: lastDepositTime } = useReadContract({
    address: CONTROLLER_ADDRESS,
    abi: SPHYGMOS_CONTROLLER_ABI,
    functionName: "lastDepositTime",
    args: [safeAddress],
    query: { enabled: !!address },
  });

  const { data: dripRatePerSecond } = useReadContract({
    address: CONTROLLER_ADDRESS,
    abi: SPHYGMOS_CONTROLLER_ABI,
    functionName: "dripRatePerSecond",
  });

  const { data: lastDripTimestamp } = useReadContract({
    address: CONTROLLER_ADDRESS,
    abi: SPHYGMOS_CONTROLLER_ABI,
    functionName: "lastDripTimestamp",
  });

  /* ───────── Unstake Execution ───────── */

  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  const handleUnstake = () => {
    writeContract({
      address: CONTROLLER_ADDRESS,
      abi: SPHYGMOS_CONTROLLER_ABI,
      functionName: "withdraw", // This function should handle the SMOS unstaking
    });
  };

  /* ───────── Lock Timer Logic ───────── */

  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const LOCK_DURATION = 604800; // 7 Days in seconds
  const unlockTime = lastDepositTime ? Number(lastDepositTime) + LOCK_DURATION : 0;
  const lockSecondsLeft = unlockTime - now;
  const isLocked = lockSecondsLeft > 0;

  const dripStart = lastDripTimestamp ? Number(lastDripTimestamp) : 0;
  const dripSecondsLeft = dripStart - now;
  const dripLive = dripRatePerSecond !== undefined && dripRatePerSecond > 0n && dripSecondsLeft <= 0;

  return (
    <div className="space-y-4">
      {/* Top Row: Power & Staked Balance */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Your Power Units" value={fmt(userPU)} color="text-white" />
        <StatCard label="Staked SMOS" value={fmt(stakedSMOS)} color="text-neon" />
      </div>

      {/* Bottom Row: Drip Rate & Unstake Controller */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          label={dripLive ? "Drip / Day" : "Drip Starts In"}
          value={
            dripLive
              ? fmt(dripRatePerSecond! * 86400n)
              : formatCountdown(dripSecondsLeft)
          }
          color="text-white"
        />

        {/* SMOS Specific Lock & Unstake Card */}
        <div className="glass-card p-4 flex flex-col justify-between border-l-2 border-l-red-500/50">
          <div>
            <p className="panel-title uppercase text-[10px] text-slate-500 font-bold">SMOS Lock</p>
            <p className={`text-lg font-mono font-bold mt-1 ${isLocked ? "text-yellow-500" : "text-green-400"}`}>
              {stakedSMOS && stakedSMOS > 0n 
                ? (isLocked ? formatCountdown(lockSecondsLeft) : "Unlocked") 
                : "0.00"}
            </p>
          </div>
          
          <button
            onClick={handleUnstake}
            disabled={isLocked || !stakedSMOS || stakedSMOS === 0n || isConfirming}
            className={`mt-3 w-full py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${
              isLocked || !stakedSMOS || stakedSMOS === 0n
                ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                : "bg-red-500/10 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white shadow-lg shadow-red-500/20"
            }`}
          >
            {isConfirming ? "Unstaking..." : "Unstake All"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────── UI Components ───────── */

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="glass-card p-4 space-y-1">
      <p className="panel-title uppercase text-[10px] text-slate-500 font-bold">{label}</p>
      <p className={`panel-value text-lg font-mono font-bold ${color}`}>{value}</p>
    </div>
  );
}

/* ───────── Helpers ───────── */

function formatCountdown(seconds: number) {
  if (seconds <= 0) return "00:00:00";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (d > 0) return `${d}d ${h}h`;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
