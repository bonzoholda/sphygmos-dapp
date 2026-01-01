import {
  useAccount,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useEffect, useMemo, useState } from "react";
import { fmt } from "../utils/format";
import { SPHYGMOS_CONTROLLER_ABI } from "../abi/SphygmosController";
import { useController } from "../hooks/useController";
import { TxStatus } from "./TxStatus";

const CONTROLLER_ADDRESS = import.meta.env.VITE_CONTROLLER_ADDRESS as `0x${string}`;

function formatLockTime(unlockTs: bigint) {
  if (unlockTs === 0n) return { status: "Not Staked", locked: false, ready: false };
  const now = Math.floor(Date.now() / 1000);
  const diff = Number(unlockTs) - now;
  if (diff <= 0) return { status: "Unlocked & Ready", locked: false, ready: true };
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  return {
    status: `Locked ${days.toString().padStart(2, "0")}d:${hours.toString().padStart(2, "0")}h:${minutes.toString().padStart(2, "0")}m`,
    locked: true,
    ready: false,
  };
}

export default function Stats() {
  const { address } = useAccount();
  const { refetchAll } = useController();
  const [withdrawTx, setWithdrawTx] = useState<`0x${string}`>();
  const { writeContractAsync: withdraw, isPending: isWithdrawing } = useWriteContract();

  const safeAddress = address ?? "0x0000000000000000000000000000000000000000";

  const { data, refetch } = useReadContracts({
    contracts: [
      { address: CONTROLLER_ADDRESS, abi: SPHYGMOS_CONTROLLER_ABI, functionName: "userPU", args: [safeAddress] },
      { address: CONTROLLER_ADDRESS, abi: SPHYGMOS_CONTROLLER_ABI, functionName: "stakedSMOS", args: [safeAddress] },
      { address: CONTROLLER_ADDRESS, abi: SPHYGMOS_CONTROLLER_ABI, functionName: "unlockTime", args: [safeAddress] },
      { address: CONTROLLER_ADDRESS, abi: SPHYGMOS_CONTROLLER_ABI, functionName: "accRewardPerPU" },
      { address: CONTROLLER_ADDRESS, abi: SPHYGMOS_CONTROLLER_ABI, functionName: "rewardDebt", args: [safeAddress] },
    ],
    query: { enabled: !!address, refetchInterval: 5000 },
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

  const withdrawWait = useWaitForTransactionReceipt({ hash: withdrawTx });

  useEffect(() => {
    if (withdrawWait.isSuccess) {
      refetchAll();
      refetch();
      setWithdrawTx(undefined);
    }
  }, [withdrawWait.isSuccess, refetchAll, refetch]);

  const pendingRewards = useMemo(() => {
    if (!uPU || !gAcc || uDebt === undefined || uPU === 0n) return 0n;
    const accumulated = (uPU * gAcc) / BigInt(1e18);
    return uDebt > accumulated ? 0n : accumulated - uDebt;
  }, [uPU, gAcc, uDebt]);

  const lockInfo = useMemo(() => formatLockTime(uUnlock ?? 0n), [uUnlock]);
  const hasStake = uStaked !== undefined && uStaked > 0n;

  const handleUnstake = async () => {
    try {
      const hash = await withdraw({
        address: CONTROLLER_ADDRESS,
        abi: SPHYGMOS_CONTROLLER_ABI,
        functionName: "withdraw", // Assuming 'withdraw' is the function name in your ABI
      });
      setWithdrawTx(hash);
    } catch (err) {
      console.error("Unstake failed", err);
    }
  };

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
            {pendingRewards > BigInt(1e30) ? "0.00" : fmt(pendingRewards)}
          </p>
          <span className="text-[10px] text-green-500/60 font-mono">SMOS</span>
        </div>
      </div>

      <div className="glass-card p-4 space-y-4 border-t-2 border-yellow-500/20">
        <div className="flex justify-between items-center">
          <div>
            <p className="panel-title">Staked Lock Status</p>
            <p className={`text-lg font-mono font-bold ${lockInfo.locked ? "text-yellow-400" : "text-green-400"}`}>
              {hasStake ? lockInfo.status : "No Stake found"}
            </p>
          </div>
          
          {/* THE UNSTAKE BUTTON */}
          {hasStake && lockInfo.ready && (
            <button 
              className="btn btn-sm btn-primary animate-bounce-subtle"
              disabled={isWithdrawing}
              onClick={handleUnstake}
            >
              {isWithdrawing ? "Unstaking..." : "Unstake Now"}
            </button>
          )}

          {lockInfo.locked && (
            <span className="text-[10px] bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 px-2 py-1 rounded animate-pulse">
              168H LOCK
            </span>
          )}
        </div>
        <TxStatus hash={withdrawTx} />
      </div>
    </div>
  );
}
