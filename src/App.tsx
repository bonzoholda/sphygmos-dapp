import { ConnectWallet } from "./components/ConnectWallet";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow p-6 space-y-4">
        <h1 className="text-2xl font-bold text-center">
          Sphygmos Network
        </h1>

        <p className="text-sm text-gray-600 text-center">
          Acquire Power Units to activate mining and earn SMOS.
        </p>

        <div className="flex justify-center">
          <ConnectWallet />
        </div>
      </div>
    </div>
  );
}
