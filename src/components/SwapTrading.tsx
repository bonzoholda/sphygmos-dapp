import React, { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { PANCAKE_ROUTER_ADDRESS, PANCAKE_ROUTER_ABI } from '../constants/pancake';
import { TokenApprovalGuard } from './TokenApprovalGuard';

const USDT_ADDRESS = "0x..."; // Your USDT Address
const SMOS_ADDRESS = "0x..."; // Your SMOS Address

export const SwapTrading = () => {
  const { address } = useAccount();
  const [isBuy, setIsBuy] = useState(true);
  const [amountIn, setAmountIn] = useState("");

  const tokenIn = isBuy ? USDT_ADDRESS : SMOS_ADDRESS;
  const tokenOut = isBuy ? SMOS_ADDRESS : USDT_ADDRESS;

  // 1. Get Estimation (Does not account for tax, just market price)
  const { data: amountsOut } = useReadContract({
    address: PANCAKE_ROUTER_ADDRESS,
    abi: PANCAKE_ROUTER_ABI,
    functionName: 'getAmountsOut',
    args: amountIn && Number(amountIn) > 0 
      ? [parseUnits(amountIn, 18), [tokenIn, tokenOut]] 
      : undefined,
  });

  const estimatedOutput = amountsOut ? formatUnits(amountsOut[1], 18) : "0";

  // 2. Transaction Setup
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleSwap = () => {
    if (!amountsOut || !address) return;

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20); // 20 mins
    
    // 3. SET SLIPPAGE AT 5% (95/100)
    // Formula: EstimatedOutput * 0.95
    const minAmountOut = (amountsOut[1] * 95n) / 100n;

    writeContract({
      address: PANCAKE_ROUTER_ADDRESS,
      abi: PANCAKE_ROUTER_ABI,
      functionName: 'swapExactTokensForTokensSupportingFeeOnTransferTokens',
      args: [
        parseUnits(amountIn, 18),
        minAmountOut,
        [tokenIn, tokenOut],
        address,
        deadline
      ],
      gas: 300000n, // Higher gas for taxed tokens + mobile stability
    });
  };

  return (
    <div className="glass-card p-6 space-y-4 border-yellow-400/10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold text-neon uppercase tracking-tighter">
            {isBuy ? 'Buy SMOS' : 'Sell SMOS'}
          </h2>
          <p className="text-[10px] text-slate-500 italic">5% slippage applied (1% tax incl.)</p>
        </div>
        <button 
          onClick={() => {setIsBuy(!isBuy); setAmountIn("");}}
          className="text-[10px] border border-yellow-400/30 text-yellow-400 px-2 py-1 rounded-md hover:bg-yellow-400/10"
        >
          Switch to {isBuy ? 'Sell' : 'Buy'}
        </button>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] uppercase font-bold text-slate-400">Input Amount</label>
        <div className="relative">
          <input 
            type="number" 
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
            className="w-full bg-black/50 border border-yellow-400/20 p-4 rounded-xl text-lg outline-none focus:border-yellow-400/50"
            placeholder="0.0"
          />
          <span className="absolute right-4 top-4 text-slate-500 font-bold">
            {isBuy ? 'USDT' : 'SMOS'}
          </span>
        </div>
      </div>

      <div className="flex justify-center -my-2 relative z-10">
        <div className="bg-black border border-yellow-400/20 p-2 rounded-full text-xs">⬇️</div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] uppercase font-bold text-slate-400">Estimated Output</label>
        <div className="w-full bg-yellow-400/5 border border-yellow-400/10 p-4 rounded-xl text-lg font-mono text-yellow-400">
          {Number(estimatedOutput).toFixed(4)}
        </div>
      </div>

      <TokenApprovalGuard 
        tokenAddress={tokenIn} 
        spenderAddress={PANCAKE_ROUTER_ADDRESS} 
        amountRequired={amountIn || "0"}
      >
        <button
          onClick={handleSwap}
          disabled={!amountIn || isPending || isConfirming}
          className="w-full py-4 bg-yellow-400 text-black font-black rounded-xl shadow-[0_0_20px_rgba(243,186,47,0.2)] disabled:opacity-50"
        >
          {isPending || isConfirming ? "Processing Swap..." : "Execute Swap"}
        </button>
      </TokenApprovalGuard>

      {error && (
        <p className="text-[10px] text-red-500 text-center animate-pulse">
          Error: {error.message.includes("INSUFFICIENT_OUTPUT_AMOUNT") ? "Price moved too much (Slippage)" : "Swap Failed"}
        </p>
      )}
    </div>
  );
};
