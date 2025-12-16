import { ConnectWallet } from "./components/ConnectWallet";
import { useController } from "./hooks/useController";

export default function App() {
  const {
    minersPool,
    rewardPool,
    totalPU,
    userPU,
    stakedSMOS,
  } = useController();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow p-6 space-y-6">

        <h1 className="text-2xl font-bold text-center">
          Sphygmos Network
        </h1>

        <div className="flex justify-center">
          <ConnectWallet />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <Stat label="Miners Pool" value={minersPool.data} />
          <Stat label="Reward Pool" value={rewardPool.data} />
          <Stat label="Total PU" value={totalPU.data} />
          <Stat label="Your PU" value={userPU.data} />
          <Stat label="Staked SMOS" value={stakedSMOS.data} />
        </div>

      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value?: bigint }) {
  return (
    <div className="bg-gray-100 rounded p-3 text-center">
      <div className="text-gray-500">{label}</div>
      <div className="font-semibold">
        {value ? value.toString() : "—"}
      </div>
    </div>
  );
}
