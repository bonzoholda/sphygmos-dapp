import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { SPHYGMOS_CONTROLLER_ABI } from "../abi/SphygmosController";
import { fmt } from "../utils/format";
import { TxStatus } from "./TxStatus";
import { useState } from "react";

const CONTROLLER_ADDRESS = import.meta.env
  .VITE_CONTROLLER_ADDRESS as `0x${string}` | undefined;

export default function DripStats() {
  const { address } = useAccount();
  const [claimTx, setClaimTx] = useState<`0x${string}`>();

  /* ───── Read Drip Rate ───── */
  const { data: dripRatePerSecond } = useReadContract({
    address: CONTROLLER_ADDRESS,
    abi: SPHYGMOS_CONTROLLER_ABI,
    functionName: "dripRatePerSecond",
    query: {
      enabled: !!CONTROLLER_ADDRESS,
    },
  });

  /* ───── Read Pending Drip ───── */
  const { data: pendingDrip } = useReadContract({
    address: CONTROLLER_ADDRESS,
    abi: SPHYGMOS_CONTROLLER_ABI,
    functionName: "pendingDripReward",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!CONTROLLER_ADDRESS,
    },
  });

  const claimDrip = useWriteContract();

  if (!address || !CONTROLLER_ADDRESS) return null;

  /* ───── Derived Values ───── */
  const dripPerDay =
    dripRatePerSecond && dripRatePerSecond > 0n
      ? dripRatePerSecond * 86400n
      : 0n;

  const canClaim =
    pendingDrip !== undefined && pendingDrip > 0n;

  return (
    <div className="panel space-y-4">
      <h3 className="panel-title">💧 Drip Rewards</h3>

      <div className="grid grid-cols-2 gap-4">
        <StatCard
          label="Drip / Day"
          value={
            dripPerDay > 0n
              ? fmt(dripPerDay, 18, 4)
              : "Waiting rebase…"
          }
        />

        <StatCard
          label="Your Pending Drip"
          value={fmt(pendingDrip, 18, 4)}
        />
      </div>

      <button
        className="btn btn-outline w-full"
        disabled={!canClaim || claimDrip.isPending}
        onClick={async () => {
          try {
            const hash = await claimDrip.writeContractAsync({
              address: CONTROLLER_ADDRESS,
              abi: SPHYGMOS_CONTROLLER_ABI,
              functionName: "claimDripRewards",
            });
            setClaimTx(hash);
          } catch (err) {
            console.error("Claim drip failed:", err);
          }
        }}
      >
        {claimDrip.isPending
          ? "Claiming…"
          : "Claim Drip Rewards"}
      </button>

      <TxStatus hash={claimTx} />
    </div>
  );
}

/* ───────────────────────── */

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="panel">
      <p className="panel-title">{label}</p>
      <p className="panel-value">{value}</p>
    </div>
  );
}
