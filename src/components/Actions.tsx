import { parseUnits } from "viem";
import { useAccount } from "wagmi";
import { useController } from "../hooks/useController";
import { SPHYGMOS_CONTROLLER_ABI } from "../abi/SphygmosController";
import { useState } from "react";
import { TxStatus } from "./TxStatus";


const controller = import.meta.env.VITE_CONTROLLER_ADDRESS as `0x${string}`;

export function Actions() {
  const { address } = useAccount();
  const {
    acquirePU,
    stakeSMOS,
    claimMiner,
  } = useController();
  const [puTx, setPuTx] = useState<`0x${string}`>();
  const [stakeTx, setStakeTx] = useState<`0x${string}`>();
  const [claimTx, setClaimTx] = useState<`0x${string}`>();

  if (!address) return null;

  return (
    <div className="space-y-4">

      <button
        className="btn"
        disabled={acquirePU.isPending}
        onClick={async () => {
          const hash = await acquirePU.writeContractAsync({
            address: controller,
            abi: SPHYGMOS_CONTROLLER_ABI,
            functionName: "depositPush",
            args: [parseUnits("10", 18)],
          });
          setPuTx(hash);
        }}
      >
        {acquirePU.isPending ? "Processing…" : "Acquire Power Units"}
      </button>
      
      <TxStatus hash={puTx} />

      
      <button
        className="btn"
        disabled={stakeSMOS.isPending}
        onClick={async () => {
          const hash = await stakeSMOS.writeContractAsync({
            address: controller,
            abi: SPHYGMOS_CONTROLLER_ABI,
            functionName: "stake",
            args: [parseUnits("5", 18)],
          });
          setStakeTx(hash);
        }}
      >
        {stakeSMOS.isPending ? "Staking…" : "Stake SMOS"}
      </button>
      
      <TxStatus hash={stakeTx} />

      <button
        className="btn btn-outline"
        disabled={claimMiner.isPending}
        onClick={async () => {
          const hash = await claimMiner.writeContractAsync({
            address: controller,
            abi: SPHYGMOS_CONTROLLER_ABI,
            functionName: "claimMinerRewards",
          });
          setClaimTx(hash);
        }}
      >
        {claimMiner.isPending ? "Claiming…" : "Claim Mining Rewards"}
      </button>
      
      <TxStatus hash={claimTx} />


    </div>
  );
}
