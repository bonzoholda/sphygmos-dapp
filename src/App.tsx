import { ConnectWallet } from "./components/ConnectWallet";
import Stats from "./components/Stats";
import { Actions } from "./components/Actions";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-6">
      <div className="max-w-md mx-auto space-y-6">

        {/* Header */}
        <h1 className="text-2xl font-bold text-center">
          Sphygmos Network
        </h1>

        {/* Wallet */}
        <div className="flex justify-center">
          <ConnectWallet />
        </div>

        {/* User Stats */}
        <Stats />


        {/* Footer hint */}
        <p className="text-xs text-center text-slate-500 pt-4">
          Power Units represent virtual mining capacity.  
          They are non-withdrawable and used to calculate rewards.
        </p>

      </div>
    </div>
  );
}
