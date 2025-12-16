import { parseUnits } from "viem";
import { useAccount } from "wagmi";
import { useBalance } from "wagmi";
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
  const [puAmount, setPuAmount] = useState("");
  const [stakeAmount, setStakeAmount] = useState("");

  const { data: usdtBal } = useBalance({
    address,
    token: USDT_ADDRESS,
  });
  
  const { data: smosBal } = useBalance({
    address,
    token: SMOS_ADDRESS,
  });


  if (!address) return null;

  return (
    <div className="space-y-4">

      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Amount"
            value={puAmount}
            onChange={(e) => setPuAmount(e.target.value)}
            className="input w-full"
          />
      
          <button
            className="btn btn-outline"
            onClick={() =>
              setPuAmount(usdtBal ? usdtBal.formatted : "")
            }
          >
            MAX
          </button>
        </div>
      
        <button
          className="btn w-full"
          disabled={acquirePU.isPending || !puAmount}
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


      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Stake amount"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
            className="input w-full"
          />
      
          <button
            className="btn btn-outline"
            onClick={() =>
              setStakeAmount(smosBal ? smosBal.formatted : "")
            }
          >
            MAX
          </button>
        </div>
      
        <button
          className="btn w-full"
          disabled={stakeSMOS.isPending || !stakeAmount}
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
