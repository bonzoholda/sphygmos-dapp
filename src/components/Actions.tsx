import { parseUnits, formatUnits } from "viem";
import { useAccount, useBalance, useWaitForTransactionReceipt } from "wagmi";
import { useController } from "../hooks/useController";
import { SPHYGMOS_CONTROLLER_ABI } from "../abi/SphygmosController";
import { useState, useEffect } from "react"; // Added useEffect
import { TxStatus } from "./TxStatus";

const controller = import.meta.env.VITE_CONTROLLER_ADDRESS as `0x${string}`;
const USDT_ADDRESS = import.meta.env.VITE_USDT_ADDRESS as `0x${string}` | undefined;
const SMOS_ADDRESS = import.meta.env.VITE_SMOS_ADDRESS as `0x${string}` | undefined;

/* ───────── Wallet SVG ───────── */
function WalletIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7h18v10H3z" /><path d="M16 11h4v2h-4z" />
    </svg>
  );
}

export function Actions() {
  const { address } = useAccount();
  const { acquirePU, stakeSMOS, claimMiner, refetchAll } = useController();

  const [puAmount, setPuAmount] = useState("");
  const [stakeAmount, setStakeAmount] = useState("");
  const [puTx, setPuTx] = useState<`0x${string}`>();
  const [stakeTx, setStakeTx] = useState<`0x${string}`>();
  const [claimTx, setClaimTx] = useState<`0x${string}`>();

  /* ───────── Wallet Balances ───────── */
  // We destructure 'refetch' and rename them to avoid conflicts
  const { data: usdtBalance, refetch: refetchUsdt } = useBalance({
    address,
    token: USDT_ADDRESS,
    query: { enabled: !!address },
  });

  const { data: smosBalance, refetch: refetchSmos } = useBalance({
    address,
    token: SMOS_ADDRESS,
    query: { enabled: !!address },
  });

  /* ───────── TX WATCHERS ───────── */

  const puWait = useWaitForTransactionReceipt({ hash: puTx });
  const stakeWait = useWaitForTransactionReceipt({ hash: stakeTx });
  const claimWait = useWaitForTransactionReceipt({ hash: claimTx });

  // Handle Refreshing logic in a useEffect
  useEffect(() => {
    if (puWait.isSuccess || stakeWait.isSuccess || claimWait.isSuccess) {
      // Refresh the data from useController hook
      refetchAll();
      // Force refresh the local balance hooks
      refetchUsdt();
      refetchSmos();
      
      // Clear inputs and hashes
      if (puWait.isSuccess) {
        setPuAmount("");
        setPuTx(undefined);
      }
      if (stakeWait.isSuccess) {
        setStakeAmount("");
        setStakeTx(undefined);
      }
      if (claimWait.isSuccess) {
        setClaimTx(undefined);
      }
    }
  }, [puWait.isSuccess, stakeWait.isSuccess, claimWait.isSuccess, refetchAll, refetchUsdt, refetchSmos]);

  if (!address || !controller) return null;

  return (
    <div className="space-y-6">
      {/* Acquire PU */}
      <div className="space-y-2">
        <div className="relative">
          <input
            className="input w-full pr-28"
            placeholder="USDT amount"
            value={puAmount}
            onChange={(e) => setPuAmount(e.target.value)}
          />
          <div className="absolute inset-y-0 right-3 flex items-center gap-1 text-xs text-slate-400">
            <WalletIcon />
            {usdtBalance ? Number(formatUnits(usdtBalance.value, usdtBalance.decimals)).toFixed(2) : "0.00"}
          </div>
        </div>
        <button
          className="btn w-full"
          disabled={!puAmount || acquirePU.isPending}
          onClick={async () => {
            const hash = await acquirePU.writeContractAsync({
              address: controller,
              abi: SPHYGMOS_CONTROLLER_ABI,
              functionName: "depositPush",
              args: [parseUnits(puAmount, 18)],
            });
            setPuTx(hash);
          }}
        >
          {acquirePU.isPending ? "Processing…" : "Acquire Power Units"}
        </button>
        <TxStatus hash={puTx} />
      </div>

      {/* Stake SMOS (Same logic applies here) */}
      <div className="space-y-2">
        <div className="relative">
          <input
            className="input w-full pr-28"
            placeholder="SMOS amount"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
          />
          <div className="absolute inset-y-0 right-3 flex items-center gap-1 text-xs text-slate-400">
            <WalletIcon />
            {smosBalance ? Number(formatUnits(smosBalance.value, smosBalance.decimals)).toFixed(2) : "0.00"}
          </div>
        </div>
        <button
          className="btn w-full"
          disabled={!stakeAmount || stakeSMOS.isPending}
          onClick={async () => {
            const hash = await stakeSMOS.writeContractAsync({
              address: controller,
              abi: SPHYGMOS_CONTROLLER_ABI,
              functionName: "stake",
              args: [parseUnits(stakeAmount, 18)],
            });
            setStakeTx(hash);
          }}
        >
          {stakeSMOS.isPending ? "Staking…" : "Stake SMOS"}
        </button>
        <TxStatus hash={stakeTx} />
      </div>

      {/* ───────── Claim Rewards ───────── */}
      <button
        className="btn btn-outline w-full"
        disabled={claimMiner.isPending}
        onClick={async () => {
          try {
            const hash =
              await claimMiner.writeContractAsync({
                address: controller,
                abi: SPHYGMOS_CONTROLLER_ABI,
                functionName: "claimMinerRewards",
              });
            setClaimTx(hash);
          } catch (err) {
            console.error("Claim failed", err);
          }
        }}
      >
        {claimMiner.isPending
          ? "Claiming…"
          : "Claim Mining Rewards"}
      </button>

      <TxStatus hash={claimTx} />
    </div>
  );
}
