import { ConnectWallet } from "./components/ConnectWallet";
import { useController } from "./hooks/useController";
import { Actions } from "./components/Actions";
import Stats from "./components/Stats";

export default function App() {
  const {
    minersPool,
    rewardPool,
    totalPU,
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

        {/* ───── Protocol Stats ───── */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <Stat label="Miners Pool" value={minersPool.data} />
          <Stat label="Reward Pool" value={rewardPool.data} />
          <Stat label="Total PU" value={totalPU.data} />
        </div>

        {/* ───── User Stats ───── */}
        <Stats />

        <Actions />

      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value?: bigint }) {
  return (
    <div className="bg-gray-100 rounded p-3 text-center">
      <div className="text-gray-500">{label}</div>
      <div className="font-semibold">
        {value !== undefined ? value.toString() : "—"}
      </div>
    </div>
  );
}
