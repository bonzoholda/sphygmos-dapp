import { ConnectWallet } from "./components/ConnectWallet";
import { useController } from "./hooks/useController";
import { Actions } from "./components/Actions";
import Stats from "./components/Stats";
import DripStats from "./components/DripStats";
import { fmt } from "./utils/format";
import Logo from "./assets/logo.svg";

// 1. Import the new Guard component
import { TokenApprovalGuard } from "./components/TokenApprovalGuard";

/**
 * CONFIGURATION
 * Replace these with your actual deployed addresses or environment variables
 */
const CONTROLLER_ADDRESS = import.meta.env
  .VITE_CONTROLLER_ADDRESS as `0x${string}` | undefined;
const MOCK_USDT_ADDRESS = "0xd5210074786CfBE75b66FEC5D72Ae79020514afD" as `0x${string}`;


export default function App() {
  const { minersPool, rewardPool, totalPU } = useController();

  return (
    <div className="min-h-screen bg-black bg-grid p-6">
      {/* ───── Logo ───── */}
      <div className="flex justify-center mb-8">
        <div className="pulse-glow">
          <img
            src={Logo}
            alt="Sphygmos Network"
            className="relative z-10 mx-auto w-full max-w-[320px] h-auto"
          />
        </div>
      </div>

      {/* ───── Main Card ───── */}
      <div className="max-w-md mx-auto glass-card p-6 space-y-6">
        {/* Tagline */}
        <h3 className="text-center text-sm text-slate-400">
          The Heartbeat of Perpetual DeFi
        </h3>

        {/* Wallet */}
        <div className="flex justify-center">
          <ConnectWallet />
        </div>

        {/* ───── Protocol Stats ───── */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <Stat label="Miners Pool" value={minersPool.data} decimals={18} />
          <Stat label="Reward Pool" value={rewardPool.data} decimals={18} />
          <Stat label="Total PU" value={totalPU.data} decimals={18} />
        </div>

        {/* ───── User Stats ───── */}
        <Stats />

        {/* ───── Drip Stats ───── */}
        <DripStats />

        {/* ───── Actions ───── */}
        {/* We wrap Actions so the user must approve before they can Spend/Deposit */}
        <TokenApprovalGuard 
          tokenAddress={MOCK_USDT_ADDRESS}
          spenderAddress={CONTROLLER_ADDRESS}
          amountRequired="1000000" // Requires 1M allowance for testing (adjust as needed)
        >
          <Actions />
        </TokenApprovalGuard>
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
    <div className="rounded-xl bg-black/70 border border-yellow-400/20 p-3 text-center">
      <div className="text-xs text-yellow-400/70">{label}</div>
      <div className="mt-1 text-base font-semibold text-neon">
        {value !== undefined ? fmt(value, decimals, 2) : "—"}
      </div>
    </div>
  );
}
