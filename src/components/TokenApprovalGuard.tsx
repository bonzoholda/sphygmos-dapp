import React, { useState, useEffect } from 'react';
import { 
  useAccount, 
  useReadContract, 
  useWriteContract, 
  useWaitForTransactionReceipt 
} from 'wagmi';
import { parseUnits } from 'viem';

const MOCK_USDT_ABI = [
  {"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}
] as const;

interface Props {
  children: React.ReactNode;
  tokenAddress: `0x${string}`;
  spenderAddress: `0x${string}`;
  amountRequired: string;
}

export const TokenApprovalGuard: React.FC<Props> = ({ children, tokenAddress, spenderAddress, amountRequired }) => {
  const { address } = useAccount();
  const requiredWei = parseUnits(amountRequired, 18);

  // 1. Check current allowance
  const { data: allowance, refetch } = useReadContract({
    address: tokenAddress,
    abi: MOCK_USDT_ABI,
    functionName: 'allowance',
    args: address ? [address, spenderAddress] : undefined,
    query: { enabled: !!address }
  });

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Update UI when transaction finishes
  useEffect(() => {
    if (isSuccess) refetch();
  }, [isSuccess, refetch]);

  const handleApprove = () => {
    writeContract({
      address: tokenAddress,
      abi: MOCK_USDT_ABI,
      functionName: 'approve',
      args: [spenderAddress, maxUint256],
      gas: 80000n, // Manual gas to fix TokenPocket 0-gas issue
    });
  };

  const handleReset = () => {
    writeContract({
      address: tokenAddress,
      abi: MOCK_USDT_ABI,
      functionName: 'approve',
      args: [spenderAddress, 0n],
      gas: 50000n, // Lower gas for a simple reset
    });
  };

  if (!address) return <>{children}</>;

  // If allowance exists but is lower than needed
  // We show a choice: Reset to 0 (for USDT safety) or Approve new amount
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

  return <>{children}</>;
};

// Simple inline styles for rapid deployment
const containerStyle: React.CSSProperties = {
  padding: '24px',
  margin: '20px auto',
  maxWidth: '400px',
  border: '2px solid #333',
  borderRadius: '16px',
  backgroundColor: '#1a1a1a',
  color: 'white',
  textAlign: 'center'
};

const buttonStyle: React.CSSProperties = {
  padding: '12px 24px',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: '#f3ba2f', // BNB Color
  color: '#000',
  fontWeight: 'bold',
  cursor: 'pointer'
};
