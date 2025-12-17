import React, { useEffect } from 'react';
import { 
  useAccount, 
  useReadContract, 
  useWriteContract, 
  useWaitForTransactionReceipt 
} from 'wagmi';
import { parseUnits, maxUint256 } from 'viem';

const MOCK_USDT_ABI = [
  {"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}
] as const;

export const TokenApprovalGuard = ({ children, tokenAddress, spenderAddress, amountRequired }: any) => {
  const { address } = useAccount();
  const requiredWei = parseUnits(amountRequired, 18);

  // 1. Fetch Allowance
  const { data: allowance, refetch, isError: isReadError } = useReadContract({
    address: tokenAddress,
    abi: MOCK_USDT_ABI,
    functionName: 'allowance',
    args: address ? [address, spenderAddress] : undefined,
  });

  // 2. Transaction Hooks (Added 'reset' to clear old state)
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // 3. Clear the state and refetch when a transaction finishes
  useEffect(() => {
    if (isSuccess) {
      console.log("Transaction Success! Refreshing...");
      refetch();
      // reset(); // Optional: Clears the hash so hooks reset to idle
    }
  }, [isSuccess, refetch, reset]);

  const handleApprove = () => {
    console.log("Button Clicked: Approve");
    if (!address) return alert("Wallet not connected");
    
    writeContract({
      address: tokenAddress,
      abi: MOCK_USDT_ABI,
      functionName: 'approve',
      args: [spenderAddress, maxUint256],
      gas: 100000n, // Increased gas slightly for mobile safety
    });
  };

  const handleReset = () => {
    console.log("Button Clicked: Reset");
    writeContract({
      address: tokenAddress,
      abi: MOCK_USDT_ABI,
      functionName: 'approve',
      args: [spenderAddress, 0n],
      gas: 60000n,
    });
  };

  // UI Helpers
  const isLoading = isPending || isConfirming;

  if (!address) return <>{children}</>;

  // CASE 1: Needs Reset
  if (allowance !== undefined && allowance > 0n && allowance < requiredWei) {
    return (
      <div className="glass-card p-6 text-center space-y-4 border-red-500/20">
        <h3 className="text-red-400 font-bold uppercase text-xs">Step 1: Security Reset</h3>
        <p className="text-[10px] text-slate-400">USDT requires a reset to 0 before changing limits.</p>
        <button 
          onClick={handleReset} 
          disabled={isLoading}
          className={`w-full py-3 rounded-lg font-bold text-sm transition-all ${isLoading ? 'bg-slate-800 text-slate-500' : 'bg-red-500/20 text-red-400 border border-red-500/40'}`}
        >
          {isLoading ? "Processing Reset..." : "Reset to 0"}
        </button>
        {error && <p className="text-[10px] text-red-500 mt-2">{error.message.split('\n')[0]}</p>}
      </div>
    );
  }

  // CASE 2: Ready to Approve
  if (allowance !== undefined && allowance === 0n) {
    return (
      <div className="glass-card p-6 text-center space-y-4 border-yellow-400/20">
        <h3 className="text-yellow-400 font-bold uppercase text-xs">Step 2: Enable Spending</h3>
        <p className="text-[10px] text-slate-400">Authorize the Controller to use your USDT.</p>
        <button 
          onClick={handleApprove} 
          disabled={isLoading}
          className={`w-full py-3 rounded-lg font-black text-sm transition-all shadow-lg ${isLoading ? 'bg-slate-800 text-slate-500' : 'bg-yellow-400 text-black active:scale-95'}`}
        >
          {isLoading ? "Waiting for Confirmation..." : "2. Enable Unlimited Spend"}
        </button>
        
        {/* Important: Show error on screen for mobile debugging */}
        {error && (
          <div className="mt-4 p-2 bg-red-900/20 rounded border border-red-500/20">
            <p className="text-[9px] text-red-400 break-all">{error.message}</p>
            <button onClick={() => reset()} className="text-[9px] underline text-slate-400 mt-1">Try Again</button>
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
};
