import { useAccount, useReadContract } from "wagmi";
import { fmt } from "../utils/format";
import { SPHYGMOS_CONTROLLER_ABI } from "../abi/SphygmosController";

const CONTROLLER_ADDRESS = import.meta.env
  .VITE_CONTROLLER_ADDRESS as `0x${string}`;

export default function Stats() {
  return (
    <div className="p-4 bg-green-100 rounded">
      <p className="font-bold">Stats Loaded</p>
    </div>
  );
}
