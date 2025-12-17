import { useAccount, useReadContract } from "wagmi";
import { useEffect, useState } from "react";
import { fmt } from "../utils/format";
import { SPHYGMOS_CONTROLLER_ABI } from "../abi/SphygmosController";

const CONTROLLER_ADDRESS = import.meta.env
  .VITE_CONTROLLER_ADDRESS as `0x${string}`;

export default function Stats() {
  const { address } = useAccount();

  const safeAddress =
    address ?? "0x0000000000000000000000000000000000000000";

  /* ───────── User Stats ───────── */

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

  /* ───────── Drip Stats ───────── */

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

  /* ───────── Countdown Timer ───────── */

  const [now, setNow] = useState(() =>
    Math.floor(Date.now() / 1000)
  );

  useEffect(() => {
    const t = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);

    return () => clearInterval(t);
  }, []);

  const dripStart = lastDripTimestamp
    ? Number(lastDripTimestamp)
    : 0;

  const secondsLeft = dripStart - now;

  const dripLive =
    dripRatePerSecond !== undefined &&
    dripRatePerSecond > 0n &&
    secondsLeft <= 0;

  return (
    <div className="grid grid-cols-2 gap-4">

      <StatCard
        label="Your Power Units"
        value={fmt(userPU)}
      />

      <StatCard
        label="Staked SMOS"
        value={fmt(stakedSMOS)}
      />

      <StatCard
        label={dripLive ? "Drip / Day" : "Drip Starts In"}
        value={
          dripLive
            ? fmt(dripRatePerSecond! * 86400n)
            : formatCountdown(secondsLeft)
        }
      />

    </div>
  );
}

/* ───────── UI ───────── */

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card p-4 space-y-3">
      <p className="panel-title">{label}</p>
      <p className="panel-value">{value}</p>
    </div>
  );
}


/* ───────── Helpers ───────── */

function formatCountdown(seconds: number) {
  if (seconds <= 0) return "Live";

  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);

  return `${d}d ${h}h ${m}m`;
}
