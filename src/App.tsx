import { ConnectWallet } from "./components/ConnectWallet";
import { useController } from "./hooks/useController";
import { Actions } from "./components/Actions";
import Stats from "./components/Stats";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-6 space-y-4">
      <h1 className="text-xl font-bold">App Alive</h1>
      <ConnectWallet />
      <Stats />
    </div>
  );
}
