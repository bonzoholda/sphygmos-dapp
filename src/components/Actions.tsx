import { parseUnits } from "viem";
import { useAccount, useBalance } from "wagmi";
import { useState } from "react";
import { TxStatus } from "./TxStatus";
import { useController } from "../hooks/useController";
import { useWriteContract } from "wagmi";
import ERC20_ABI from "../abi/ERC20";


const USDT_ADDRESS = import.meta.env.VITE_USDT_ADDRESS as `0x${string}`;
const SMOS_ADDRESS = import.meta.env.VITE_SMOS_ADDRESS as `0x${string}`;
const approveUSDT = useWriteContract();
const approveSMOS = useWriteContract();


export function Actions() {
  const { address, isConnected } = useAccount();

  const {
    acquirePU,
    stakeSMOS,
    claimMiner,
  } = useController();

  const [puAmount, setPuAmount] = useState("");
  const [stakeAmount, setStakeAmount] = useState("");

  const [puTx, setPuTx] = useState<`0x${string}`>();
  const [stakeTx, setStakeTx] = useState<`0x${string}`>();
  const [claimTx, setClaimTx] = useState<`0x${string}`>();

  const { data: usdtBal } = useBalance({
    address,
    token: USDT_ADDRESS,
    query: { enabled: isConnected },
  });

  const { data: smosBal } = useBalance({
    address,
    token: SMOS_ADDRESS,
    query: { enabled: isConnected },
  });

  if (!isConnected) return null;

  /* ───────────────────────────── */
  /* Helpers */
  /* ───────────────────────────── */

  function safeParse(value: string) {
    if (!value || Number(value) <= 0) return null;
    try {
      return parseUnits(value, 18);
    } catch {
      return null;
    }
  }

  /* ───────────────────────────── */
  /* UI */
  /* ───────────────────────────── */

  return (
    <div className="space-y-6">

      {/* ───────── Acquire PU ───────── */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="decimal"
            placeholder="USDT amount"
            value={puAmount}
            onChange={(e) => setPuAmount(e.target.value)}
            className="input w-full"
          />

          <button
            className="btn btn-outline"
            onClick={() => setPuAmount(usdtBal?.formatted ?? "")}
          >
            MAX
          </button>
        </div>

        <button
          className="btn btn-outline w-full"
          onClick={async () => {
            try {
              await approveUSDT.writeContractAsync({
                address: USDT_ADDRESS,
                abi: ERC20_ABI,
                functionName: "approve",
                args: [controller, parseUnits("1000000", 6)], // large allowance
              });
            } catch (e) {
              console.error(e);
            }
          }}
        >
          Approve USDT
        </button>

        <button
          className="btn w-full"
          disabled={
            acquirePU.isPending ||
            !safeParse(puAmount)
          }
          onClick={async () => {
            const parsed = safeParse(puAmount);
            if (!parsed) return;

            try {
              const hash = await acquirePU.writeContractAsync({
                args: [parsed],
              });
              setPuTx(hash);
            } catch (e) {
              console.error(e);
            }
          }}
        >
          {acquirePU.isPending
            ? "Processing…"
            : "Acquire Power Units"}
        </button>

        <TxStatus hash={puTx} />
      </div>

      {/* ───────── Stake SMOS ───────── */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="decimal"
            placeholder="SMOS amount"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
            className="input w-full"
          />

          <button
            className="btn btn-outline"
            onClick={() => setStakeAmount(smosBal?.formatted ?? "")}
          >
            MAX
          </button>
        </div>

        <button
          className="btn btn-outline w-full"
          onClick={async () => {
            try {
              await approveSMOS.writeContractAsync({
                address: SMOS_ADDRESS,
                abi: ERC20_ABI,
                functionName: "approve",
                args: [controller, parseUnits("1000000", 18)],
              });
            } catch (e) {
              console.error(e);
            }
          }}
        >
          Approve SMOS
        </button>

        
        <button
          className="btn w-full"
          disabled={
            stakeSMOS.isPending ||
            !safeParse(stakeAmount)
          }
          onClick={async () => {
            const parsed = safeParse(stakeAmount);
            if (!parsed) return;

            try {
              const hash = await stakeSMOS.writeContractAsync({
                args: [parsed],
              });
              setStakeTx(hash);
            } catch (e) {
              console.error(e);
            }
          }}
        >
          {stakeSMOS.isPending ? "Staking…" : "Stake SMOS"}
        </button>

        <TxStatus hash={stakeTx} />
      </div>

      {/* ───────── Claim ───────── */}
      <button
        className="btn btn-outline w-full"
        disabled={claimMiner.isPending}
        onClick={async () => {
          try {
            const hash = await claimMiner.writeContractAsync();
            setClaimTx(hash);
          } catch (e) {
            console.error(e);
          }
        }}
      >
        {claimMiner.isPending
          ? "Claiming…"
          : "Claim Mining Rewards"}
      </button>

      <TxStatus hash={claimTx} />
    </div>
  );
}
