import { useAccount, useReadContract } from "wagmi";
import { fmt } from "../utils/format";
import { SPHYGMOS_CONTROLLER_ABI } from "../abi/SphygmosController";

const CONTROLLER_ADDRESS = import.meta.env
  .VITE_CONTROLLER_ADDRESS as `0x${string}`;

export default function Stats() {
  const { address } = useAccount();
  const safeAddress =
    address ?? "0x0000000000000000000000000000000000000000";

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

  return (
    <div className="grid grid-cols-2 gap-4">
      <StatCard label="Your Power Units" value={fmt(userPU)} />
      <StatCard label="Staked SMOS" value={fmt(stakedSMOS)} />
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-900 p-4 border border-slate-800">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}
