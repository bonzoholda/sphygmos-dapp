import { useState } from "react";
import { ConnectWallet } from "./components/ConnectWallet";
import { useController } from "./hooks/useController";
import { Actions } from "./components/Actions";
import Stats from "./components/Stats";
import DripStats from "./components/DripStats";
import { fmt } from "./utils/format";
import Logo from "./assets/logo.svg";

// 1. Import the Guard and Swap components
import { TokenApprovalGuard } from "./components/TokenApprovalGuard";
import { SwapTrading } from "./components/SwapTrading";

/**
 * CONFIGURATION
 */
const CONTROLLER_ADDRESS = import.meta.env.VITE_CONTROLLER_ADDRESS as `0x${string}` | undefined;
const MOCK_USDT_ADDRESS = "0xd5210074786CfBE75b66FEC5D72Ae79020514afD" as `0x${string}`;
const SMOS_ADDRESS = "0x88b711119C6591E7Dd1388EAAbBD8b9777d104Cb"; // Your SMOS Contract Address

export default function App() {
  const { minersPool, rewardPool, totalPU } = useController();
  
  // State to toggle between Mining and Trading views
  const [activeTab, setActiveTab] = useState<"mining" | "trade">("mining");

  return (
    <div className="min-h-screen bg-black bg-grid p-6 pb-20">
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

      <div className="max-w-md mx-auto space-y-6">
        {/* ───── Tab Navigation ───── */}
        <div className="flex bg-slate-900/50 p-1 rounded-xl border border-yellow-400/20 shadow-inner">
          <button
            onClick={() => setActiveTab("mining")}
            className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all duration-300 ${
              activeTab === "mining" 
                ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/20" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            MINING HUB
          </button>
          <button
            onClick={() => setActiveTab("trade")}
            className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all duration-300 ${
              activeTab === "trade" 
                ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/20" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            TRADE SMOS
          </button>
        </div>

        {/* ───── Conditional Content Rendering ───── */}
        {activeTab === "mining" ? (
          /* MINING VIEW */
          <div className="glass-card p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-center text-sm text-slate-400">
              The Heartbeat of Perpetual DeFi
            </h3>

            <div className="flex justify-center">
              <ConnectWallet />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <Stat label="Miners Pool" value={minersPool.data} decimals={18} />
              <Stat label="Reward Pool" value={rewardPool.data} decimals={18} />
              <Stat label="Total PU" value={totalPU.data} decimals={18} />
            </div>

            <Stats />
            <DripStats />

            <hr className="border-yellow-400/10" />

            {/* Guarded Actions for Controller */}
            {CONTROLLER_ADDRESS && (
              <TokenApprovalGuard 
                tokenAddress={MOCK_USDT_ADDRESS}
                spenderAddress={CONTROLLER_ADDRESS}
                amountRequired="0.1" 
              >
              {/* Nested Guard: First approve USDT, then approve SMOS */}
              <TokenApprovalGuard
                tokenAddress={SMOS_ADDRESS}
                spenderAddress={CONTROLLER_ADDRESS}
                amountRequired="0.1"
              >
                <Actions />
              </TokenApprovalGuard>
            )}
          </div>
        ) : (
          /* TRADE VIEW */
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <SwapTrading />
          </div>
        )}
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
