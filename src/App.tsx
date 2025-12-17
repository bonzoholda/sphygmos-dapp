import { ConnectWallet } from "./components/ConnectWallet";
import { useController } from "./hooks/useController";
import { Actions } from "./components/Actions";
import Stats from "./components/Stats";

export default function App() {
  return (
    <div className="min-h-screen bg-red-100 flex items-center justify-center">
      <h1 className="text-3xl font-bold">
        APP IS ALIVE
      </h1>
    </div>

    <Stats />

    
  );
}
