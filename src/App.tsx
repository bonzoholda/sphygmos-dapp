import { ConnectWallet } from "./components/ConnectWallet";
import { useController } from "./hooks/useController";
import { Actions } from "./components/Actions";
import Stats from "./components/Stats";
import { fmt } from "./utils/format";
import DripStats from "./components/DripStats";
import Logo from "./assets/logo.png";



export default function App() {
  const {
    minersPool,
    rewardPool,
    totalPU,
  } = useController();

  return (
    
    <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex justify-center mb-6">
          <div className="logo">
            <img
              src={Logo}
              alt="Sphygmos Network"
              className="relative z-10 w-full max-w-[300px] h-auto mx-auto drop-shadow-[0_0_12px_rgba(56,189,248,0.6)]"
            />
          </div>
        </div>   

      
      <div className="max-w-md mx-auto bg-white rounded-xl shadow p-6 space-y-6">

        {/* ───── Header ───── */}
        <h3 className="text-2xl font-italic text-center">   
          The Heartbeat of Perpetual DeFi
        </h3>

        {/* ───── Wallet ───── */}
        <div className="flex justify-center">
          <ConnectWallet />
        </div>

        {/* ───── Protocol Stats ───── */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <Stat
            label="Miners Pool"
            value={minersPool.data}
            decimals={18}
          />
          <Stat
            label="Reward Pool"
            value={rewardPool.data}
            decimals={18}
          />
          <Stat
            label="Total PU"
            value={totalPU.data}
            decimals={18}
          />
        </div>

        {/* ───── User Stats ───── */}
        <Stats />

        <DripStats />

        {/* ───── Actions ───── */}
        <Actions />

      </div>
    </div>
  );
}

/* ───────────────────────────── */

function Stat({
  label,
  value,
  decimals,
}: {
  label: string;
  value?: bigint;
  decimals: number;
}) {
  return (
    <div className="bg-gray-100 rounded p-3 text-center">
      <div className="text-gray-500 text-xs">
        {label}
      </div>

      <div className="font-semibold text-base">
        {value !== undefined ? fmt(value, decimals, 2) : "—"}
      </div>
    </div>
  );
}
