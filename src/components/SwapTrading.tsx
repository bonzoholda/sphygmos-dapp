import { useState } from "react";
import { useAccount, useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { TokenApprovalGuard } from "./TokenApprovalGuard";

// BSC Testnet Pancake Router (Commonly used: 0x9Ac64Cc6e4415144C455bd8E4837fea55603e5c3)
const ROUTER_ADDRESS = "0x9Ac64Cc6e4415144C455bd8E4837fea55603e5c3"; 
const USDT_ADDRESS = "0xd5210074786CfBE75b66FEC5D72Ae79020514afD";
const SMOS_ADDRESS = "0x88b711119C6591E7Dd1388EAAbBD8b9777d104Cb"; // Replace with real address

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

export function SwapTrading() {
  const { address } = useAccount();
  const [isBuy, setIsBuy] = useState(true);
  const [amountIn, setAmountIn] = useState("");

  const tokenIn = isBuy ? USDT_ADDRESS : SMOS_ADDRESS;
  const tokenOut = isBuy ? SMOS_ADDRESS : USDT_ADDRESS;

  // 1. Balances
  const usdtBal = useBalance({ address, token: USDT_ADDRESS });
  const smosBal = useBalance({ address, token: SMOS_ADDRESS });

  // 2. Current Price (1 USDT = ? SMOS)
  const { data: priceData } = useReadContract({
    address: ROUTER_ADDRESS,
    abi: ROUTER_ABI,
    functionName: "getAmountsOut",
    args: [parseUnits("1", 18), [USDT_ADDRESS, SMOS_ADDRESS]],
  });
  const currentPrice = priceData ? Number(formatUnits(priceData[1], 18)).toFixed(4) : "0.00";

  // 3. Swap Quote
  const { data: quoteData } = useReadContract({
    address: ROUTER_ADDRESS,
    abi: ROUTER_ABI,
    functionName: "getAmountsOut",
    args: amountIn && Number(amountIn) > 0 ? [parseUnits(amountIn, 18), [tokenIn, tokenOut]] : undefined,
  });
  const estimatedOut = quoteData ? formatUnits(quoteData[1], 18) : "0";

  // 4. Swap Execution
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  const handleSwap = () => {
    if (!quoteData || !address) return;
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);
    const minOut = (quoteData[1] * 95n) / 100n; // 5% slippage

    writeContract({
      address: ROUTER_ADDRESS,
      abi: ROUTER_ABI,
      functionName: "swapExactTokensForTokensSupportingFeeOnTransferTokens",
      args: [parseUnits(amountIn, 18), minOut, [tokenIn, tokenOut], address, deadline],
    });
  };

  return (
    <div className="glass-card border-t-4 border-t-yellow-400 p-6 space-y-6">
      {/* Header & Price */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-black text-white uppercase">Exchange</h2>
          <div className="text-[10px] text-yellow-400 font-mono mt-1">
            Price: 1 USDT = {currentPrice} SMOS
          </div>
        </div>
        <button onClick={() => { setIsBuy(!isBuy); setAmountIn(""); }} className="text-[10px] bg-yellow-400/10 border border-yellow-400/40 text-yellow-400 px-3 py-1 rounded-full font-bold">
          {isBuy ? 'Switch to Sell' : 'Switch to Buy'}
        </button>
      </div>

      {/* Balances */}
      <div className="grid grid-cols-2 gap-2">
        <BalanceChip label="USDT" val={usdtBal.data?.formatted} color="text-white" />
        <BalanceChip label="SMOS" val={smosBal.data?.formatted} color="text-neon" />
      </div>

      {/* Input/Output */}
      <div className="space-y-2">
        <div className="bg-black/40 p-4 rounded-xl border border-white/10">
          <input type="number" value={amountIn} onChange={(e) => setAmountIn(e.target.value)} placeholder="0.0" className="w-full bg-transparent text-2xl font-bold outline-none text-white" />
          <div className="text-[10px] text-slate-500 uppercase mt-1 font-bold">{isBuy ? 'Pay USDT' : 'Pay SMOS'}</div>
        </div>
        <div className="bg-black/20 p-4 rounded-xl border border-white/5 border-dashed">
          <div className="text-2xl font-bold text-slate-400">{Number(estimatedOut).toFixed(4)}</div>
          <div className="text-[10px] text-slate-500 uppercase mt-1 font-bold">Receive (Est.)</div>
        </div>
      </div>

      {/* APPROVAL GUARD + SWAP BUTTON */}
      <TokenApprovalGuard 
        tokenAddress={tokenIn} 
        spenderAddress={ROUTER_ADDRESS} 
        amountRequired={amountIn || "0"}
      >
        <button
          onClick={handleSwap}
          disabled={isPending || isConfirming || !amountIn || estimatedOut === "0"}
          className="w-full py-4 rounded-xl bg-yellow-400 text-black font-black uppercase tracking-widest shadow-lg shadow-yellow-400/20 active:scale-95 disabled:opacity-30"
        >
          {isPending || isConfirming ? "Processing..." : isBuy ? "Buy SMOS" : "Sell SMOS"}
        </button>
      </TokenApprovalGuard>
      
      {estimatedOut === "0" && amountIn && (
        <p className="text-[10px] text-red-500 text-center uppercase font-bold italic">
          No Liquidity Found for this Pair
        </p>
      )}
    </div>
  );
}

function BalanceChip({ label, val, color }: any) {
  return (
    <div className="bg-white/5 rounded-lg p-2 border border-white/5">
      <p className="text-[8px] text-slate-500 uppercase">{label} Balance</p>
      <p className={`text-xs font-mono font-bold ${color}`}>{Number(val || 0).toFixed(2)}</p>
    </div>
  );
}
