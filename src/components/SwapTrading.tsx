import { useState, useEffect } from "react";
import { 
  useAccount, 
  useBalance, 
  useReadContract, 
  useWriteContract, 
  useWaitForTransactionReceipt 
} from "wagmi";
import { parseUnits, formatUnits } from "viem";

// PancakeRouter ABI (Simplified for Swap)
const ROUTER_ABI = [
  {
    inputs: [
      { name: "amountIn", type: "uint256" },
      { name: "amountOutMin", type: "uint256" },
      { name: "path", type: "address[]" },
      { name: "to", type: "address" },
      { name: "deadline", type: "uint256" },
    ],
    name: "swapExactTokensForTokensSupportingFeeOnTransferTokens",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "amountIn", type: "uint256" },
      { name: "path", type: "address[]" },
    ],
    name: "getAmountsOut",
    outputs: [{ name: "amounts", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const ROUTER_ADDRESS = "0x10ED43C718714eb63d5aA57B78B54704E256024E"; // Pancake Mainnet
const USDT_ADDRESS = "0xd5210074786CfBE75b66FEC5D72Ae79020514afD"; // Your Mock USDT
const SMOS_ADDRESS = "0x88b711119C6591E7Dd1388EAAbBD8b9777d104Cb"; // Replace with real SMOS address

export function SwapTrading() {
  const { address } = useAccount();
  const [isBuy, setIsBuy] = useState(true);
  const [amountIn, setAmountIn] = useState("");

  // 1. FETCH BALANCES
  const usdtBalance = useBalance({
    address,
    token: USDT_ADDRESS,
  });

  const smosBalance = useBalance({
    address,
    token: SMOS_ADDRESS,
  });

  // 2. QUOTE LOGIC (PancakeRouter.getAmountsOut)
  const path = isBuy ? [USDT_ADDRESS, SMOS_ADDRESS] : [SMOS_ADDRESS, USDT_ADDRESS];
  
  const { data: amountsOut } = useReadContract({
    address: ROUTER_ADDRESS,
    abi: ROUTER_ABI,
    functionName: "getAmountsOut",
    args: amountIn ? [parseUnits(amountIn, 18), path] : undefined,
    query: { enabled: !!amountIn && Number(amountIn) > 0 },
  });

  const estimatedOut = amountsOut ? formatUnits(amountsOut[1], 18) : "0";

  // 3. SWAP LOGIC
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleSwap = () => {
    if (!amountIn || !address) return;
    
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20); // 20 mins
    const slip = isBuy ? 0.95 : 0.90; // Buy 5% slippage, Sell 10% (adjust as needed)
    const amountOutMin = parseUnits((Number(estimatedOut) * slip).toString(), 18);

    writeContract({
      address: ROUTER_ADDRESS,
      abi: ROUTER_ABI,
      functionName: "swapExactTokensForTokensSupportingFeeOnTransferTokens",
      args: [parseUnits(amountIn, 18), amountOutMin, path, address, deadline],
    });
  };

  return (
    <div className="glass-card border-t-4 border-t-yellow-400 p-6 space-y-4 shadow-2xl animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tighter">Swap</h2>
          <p className="text-[10px] text-slate-500 uppercase">PancakeSwap V2 Routing</p>
        </div>
        <button 
          onClick={() => { setIsBuy(!isBuy); setAmountIn(""); }}
          className="text-[10px] bg-yellow-400/10 border border-yellow-400/40 text-yellow-400 px-3 py-1 rounded-full uppercase font-bold hover:bg-yellow-400 hover:text-black transition-colors"
        >
          {isBuy ? 'Switch to Sell' : 'Switch to Buy'}
        </button>
      </div>

      {/* ───── BALANCE DISPLAY ───── */}
      <div className="flex gap-2">
        <div className="flex-1 bg-white/5 rounded-lg p-2 border border-white/5">
          <p className="text-[9px] text-slate-500 uppercase">USDT Balance</p>
          <p className="text-sm font-mono text-white">
            {usdtBalance.data ? Number(usdtBalance.data.formatted).toFixed(2) : "0.00"}
          </p>
        </div>
        <div className="flex-1 bg-white/5 rounded-lg p-2 border border-white/5">
          <p className="text-[9px] text-slate-500 uppercase">SMOS Balance</p>
          <p className="text-sm font-mono text-neon">
            {smosBalance.data ? Number(smosBalance.data.formatted).toFixed(2) : "0.00"}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Input Field */}
        <div className="bg-black/40 p-4 rounded-2xl border border-white/10">
          <div className="flex justify-between text-[10px] text-slate-500 mb-1 uppercase font-bold">
            <span>You Pay</span>
            <span>{isBuy ? 'USDT' : 'SMOS'}</span>
          </div>
          <input
            type="number"
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
            placeholder="0.0"
            className="w-full bg-transparent text-2xl font-bold outline-none text-white"
          />
        </div>

        {/* Output Quote */}
        <div className="bg-black/40 p-4 rounded-2xl border border-white/10 border-dashed">
          <div className="flex justify-between text-[10px] text-slate-500 mb-1 uppercase font-bold">
            <span>You Receive (Est.)</span>
            <span>{isBuy ? 'SMOS' : 'USDT'}</span>
          </div>
          <div className="text-2xl font-bold text-slate-400">
            {estimatedOut !== "0" ? Number(estimatedOut).toFixed(4) : "0.00"}
          </div>
        </div>
      </div>

      <button
        onClick={handleSwap}
        disabled={isPending || isConfirming || !amountIn}
        className="w-full py-4 rounded-2xl bg-yellow-400 text-black font-black uppercase tracking-widest shadow-lg shadow-yellow-400/20 active:scale-95 transition-all disabled:opacity-50"
      >
        {isPending || isConfirming ? "Processing..." : isBuy ? "Buy SMOS" : "Sell SMOS"}
      </button>

      {isSuccess && (
        <p className="text-center text-xs text-green-400 font-bold animate-pulse">
          Swap Successful!
        </p>
      )}
    </div>
  );
}
