import { parseUnits } from "viem";
import { useAccount } from "wagmi";
import { useController } from "../hooks/useController";
import { SPHYGMOS_CONTROLLER_ABI } from "../abi/SphygmosController";

const controller = import.meta.env.VITE_CONTROLLER_ADDRESS as `0x${string}`;

export function Actions() {
  const { address } = useAccount();
  const {
    acquirePU,
    stakeSMOS,
    claimMiner,
  } = useController();

  if (!address) return null;

  return (
    <div className="space-y-4">

      <button
        className="btn"
        onClick={() =>
          acquirePU.writeContract({
            address: controller,
            abi: SPHYGMOS_CONTROLLER_ABI,
            functionName: "depositPush",
            args: [parseUnits("10", 18)], // 10 USDT test
          })
        }
      >
        Acquire Power Units
      </button>

      <button
        className="btn"
        onClick={() =>
          stakeSMOS.writeContract({
            address: controller,
            abi: SPHYGMOS_CONTROLLER_ABI,
            functionName: "stake",
            args: [parseUnits("5", 18)], // 5 SMOS test
          })
        }
      >
        Stake SMOS
      </button>

      <button
        className="btn btn-outline"
        onClick={() =>
          claimMiner.writeContract({
            address: controller,
            abi: SPHYGMOS_CONTROLLER_ABI,
            functionName: "claimMinerRewards",
          })
        }
      >
        Claim Mining Rewards
      </button>

    </div>
  );
}
