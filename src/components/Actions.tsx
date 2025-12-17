import { parseUnits, formatUnits } from "viem";
import { useAccount, useBalance } from "wagmi";
import { useController } from "../hooks/useController";
import { SPHYGMOS_CONTROLLER_ABI } from "../abi/SphygmosController";
import { useState } from "react";
import { TxStatus } from "./TxStatus";

const controller = import.meta.env.VITE_CONTROLLER_ADDRESS;

export function Actions() {
  const { address } = useAccount();
  const { acquirePU, stakeSMOS, claimMiner } = useController();

  const [puAmount, setPuAmount] = useState("");
  const [stakeAmount, setStakeAmount] = useState("");
  const [puTx, setPuTx] = useState<`0x${string}`>();
  const [stakeTx, setStakeTx] = useState<`0x${string}`>();
  const [claimTx, setClaimTx] = useState<`0x${string}`>();

  if (!address || !controller) return null;

  return (
    <div className="space-y-6">

      {/* Acquire PU */}
      <div className="space-y-2">
        <input
          className="input w-full"
          placeholder="USDT amount"
          value={puAmount}
          onChange={(e) => setPuAmount(e.target.value)}
        />

        <button
          className="btn w-full"
          disabled={!puAmount || acquirePU.isPending}
          onClick={async () => {
            try {
              const hash = await acquirePU.writeContractAsync({
                address: controller as `0x${string}`,
                abi: SPHYGMOS_CONTROLLER_ABI,
                functionName: "depositPush",
                args: [parseUnits(puAmount, 18)],
              });
              setPuTx(hash);
            } catch (err) {
              console.error("Acquire PU failed", err);
            }
          }}
        >
          {acquirePU.isPending ? "Processing…" : "Acquire Power Units"}
        </button>

        <TxStatus hash={puTx} />
      </div>

      {/* Stake SMOS */}
      <div className="space-y-2">
        <input
          className="input w-full"
          placeholder="SMOS amount"
          value={stakeAmount}
          onChange={(e) => setStakeAmount(e.target.value)}
        />

        <button
          className="btn w-full"
          disabled={!stakeAmount || stakeSMOS.isPending}
          onClick={async () => {
            try {
              const hash = await stakeSMOS.writeContractAsync({
                address: controller as `0x${string}`,
                abi: SPHYGMOS_CONTROLLER_ABI,
                functionName: "stake",
                args: [parseUnits(stakeAmount, 18)],
              });
              setStakeTx(hash);
            } catch (err) {
              console.error("Stake failed", err);
            }
          }}
        >
          {stakeSMOS.isPending ? "Staking…" : "Stake SMOS"}
        </button>

        <TxStatus hash={stakeTx} />
      </div>

      {/* Claim */}
      <button
        className="btn btn-outline w-full"
        disabled={claimMiner.isPending}
        onClick={async () => {
          try {
            const hash = await claimMiner.writeContractAsync({
              address: controller as `0x${string}`,
              abi: SPHYGMOS_CONTROLLER_ABI,
              functionName: "claimMinerRewards",
            });
            setClaimTx(hash);
          } catch (err) {
            console.error("Claim failed", err);
          }
        }}
      >
        {claimMiner.isPending ? "Claiming…" : "Claim Mining Rewards"}
      </button>

      <TxStatus hash={claimTx} />
    </div>
  );
}
