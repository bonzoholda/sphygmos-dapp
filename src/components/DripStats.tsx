import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { SPHYGMOS_CONTROLLER_ABI } from "../abi/SphygmosController";
import { fmt } from "../utils/format";
import { TxStatus } from "./TxStatus";
import { useState } from "react";

const controller = import.meta.env
  .VITE_CONTROLLER_ADDRESS as `0x${string}`;

export default function DripStats() {
  const { address } = useAccount();
  const [claimTx, setClaimTx] = useState<`0x${string}`>();

  const { data: dripRate } = useReadContract({
    address: controller,
    abi: SPHYGMOS_CONTROLLER_ABI,
    functionName: "dripRatePerSecond",
  });

  const { data: pendingDrip } = useReadContract({
    address: controller,
    abi: SPHYGMOS_CONTROLLER_ABI,
    functionName: "pendingDripReward",
    args: address ? [address] : undefined,
  });

  const claimDrip = useWriteContract();

  if (!address) return null;

  const dripPerDay =
    dripRate ? (dripRate * 86400n) : 0n;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
      <h3 className="font-semibold text-slate-800">
        💧 Drip Rewards
      </h3>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <Stat label="Drip / Day" value={fmt(dripPerDay)} />
        <Stat label="Your Pending Drip" value={fmt(pendingDrip)} />
      </div>

      <button
        className="btn btn-outline w-full"
        disabled={!pendingDrip || pendingDrip === 0n}
        onClick={async () => {
          try {
            const hash = await claimDrip.writeContractAsync({
              address: controller,
              abi: SPHYGMOS_CONTROLLER_ABI,
              functionName: "claimDripRewards",
            });
            setClaimTx(hash);
          } catch (err) {
            console.error("Claim drip failed", err);
          }
        }}
      >
        Claim Drip Rewards
      </button>

      <TxStatus hash={claimTx} />
    </div>
  );
}

/* ───────────────────────── */

function Stat({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div className="rounded bg-white p-3 text-center">
      <div className="text-xs text-slate-500">
        {label}
      </div>
      <div className="font-semibold text-slate-900">
        {value ?? "—"}
      </div>
    </div>
  );
}
