import { useAccount, useReadContract } from "wagmi";
import { SPHYGMOS_CONTROLLER_ABI } from "../abi/SphygmosController";
import { useReadContract, useWriteContract } from "wagmi";


const controllerAddress = import.meta.env.VITE_CONTROLLER_ADDRESS as `0x${string}`;

export function useController() {
  const { address } = useAccount();
  const acquirePU = useWriteContract();
  const stakeSMOS = useWriteContract();
  const claimMiner = useWriteContract();
  const { refreshKey } = useRefresh();

  const minersPool = useReadContract({
    address: controllerAddress,
    abi: SPHYGMOS_CONTROLLER_ABI,
    functionName: "minersPoolBalance",
    scopeKey: `minersPool-${refreshKey}`,
  });

  const rewardPool = useReadContract({
    address: controllerAddress,
    abi: SPHYGMOS_CONTROLLER_ABI,
    functionName: "rewardPoolBalance",
    scopeKey: `rewardPool-${refreshKey}`,
  });

  const totalPU = useReadContract({
    address: controllerAddress,
    abi: SPHYGMOS_CONTROLLER_ABI,
    functionName: "totalPU",
    scopeKey: `totalPU-${refreshKey}`,
  });

  const userPU = useReadContract({
    address: controllerAddress,
    abi: SPHYGMOS_CONTROLLER_ABI,
    functionName: "userPU",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const stakedSMOS = useReadContract({
    address: controllerAddress,
    abi: SPHYGMOS_CONTROLLER_ABI,
    functionName: "stakedSMOS",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  return {
    minersPool,
    rewardPool,
    totalPU,
    userPU,
    stakedSMOS,
    acquirePU,
    stakeSMOS,
    claimMiner,
  };

}
