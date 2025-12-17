import React, { useEffect } from 'react';
import { 
  useAccount, 
  useReadContract, 
  useWriteContract, 
  useWaitForTransactionReceipt,
  useQueryClient // Added for forcing data updates
} from 'wagmi';
import { parseUnits, maxUint256 } from 'viem';

const MOCK_USDT_ABI = [
  {"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}
] as const;

export const TokenApprovalGuard = ({ children, tokenAddress, spenderAddress, amountRequired }: any) => {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const requiredWei = parseUnits(amountRequired, 18);

  const { data: allowance, queryKey } = useReadContract({
    address: tokenAddress,
    abi: MOCK_USDT_ABI,
    functionName: 'allowance',
    args: address ? [address, spenderAddress] : undefined,
  });

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // FORCE REFRESH: This ensures the UI "sees" the 0 allowance before you click Approve
  useEffect(() => {
    if (isSuccess) {
      // Small delay for RPC propagation, then clear cache
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey });
      }, 2000); 
    }
  }, [isSuccess, queryKey, queryClient]);

  const handleApprove = () => {
    writeContract({
      address: tokenAddress,
      abi: MOCK_USDT_ABI,
      functionName: 'approve',
      args: [spenderAddress, maxUint256],
      gas: 80000n, // Slightly higher for mobile safety
    });
  };

  const handleReset = () => {
    writeContract({
      address: tokenAddress,
      abi: MOCK_USDT_ABI,
      functionName: 'approve',
      args: [spenderAddress, 0n],
      gas: 60000n,
    });
  };

  if (!address) return <>{children}</>;

  // CASE 1: Allowance > 0 but < Required (Must Reset first)
  if (allowance !== undefined && allowance > 0n && allowance < requiredWei) {
    return (
      <div className="glass-card p-6 text-center space-y-4">
        <h3 className="text-red-400 font-bold">Inconsistent Allowance</h3>
        <p className="text-xs text-slate-400">USDT requires a reset to 0 before changing limits.</p>
        <button 
          onClick={handleReset} 
          disabled={isPending || isConfirming}
          className="w-full py-3 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg font-bold"
        >
          {isPending || isConfirming ? "Processing Reset..." : "1. Reset to 0"}
        </button>
      </div>
    );
  }

  // CASE 2: Allowance is 0 (Ready to set Unlimited)
  if (allowance !== undefined && allowance === 0n) {
    return (
      <div className="glass-card p-6 text-center space-y-4">
        <h3 className="text-yellow-400 font-bold uppercase">Enable Trading</h3>
        <p className="text-xs text-slate-400">Click below to authorize the Sphygmos Controller.</p>
        <button 
          onClick={handleApprove} 
          disabled={isPending || isConfirming}
          className="w-full py-3 bg-yellow-400 text-black rounded-lg font-black shadow-lg"
        >
          {isPending || isConfirming ? "Confirming on Chain..." : "2. Enable Unlimited Spend"}
        </button>
      </div>
    );
  }

  // CASE 3: Allowance is fine
  return <>{children}</>;
};
