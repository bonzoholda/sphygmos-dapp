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
      args: [spenderAddress, requiredWei],
      gas: 70000n, // Manual gas to fix TokenPocket 0-gas issue
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
  if (allowance !== undefined && allowance < requiredWei && allowance > 0n) {
    return (
      <div style={containerStyle}>
        <h3>Update Permission</h3>
        <p>Current allowance is insufficient ({allowance.toString()}).</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={handleReset} disabled={isPending || isConfirming} style={buttonStyle}>
            {isPending ? 'Resetting...' : 'Reset to 0'}
          </button>
          <button onClick={handleApprove} disabled={isPending || isConfirming} style={buttonStyle}>
            Set to {amountRequired}
          </button>
        </div>
        <p style={{ fontSize: '12px', marginTop: '10px' }}>Recommended for mobile wallet stability.</p>
      </div>
    );
  }

  // If allowance is exactly 0
  if (allowance !== undefined && allowance === 0n) {
    return (
      <div style={containerStyle}>
        <h3>Enable Spending</h3>
        <p>Approve the Sphygmos Controller to use your tokens.</p>
        <button onClick={handleApprove} disabled={isPending || isConfirming} style={buttonStyle}>
          {isPending || isConfirming ? 'Processing...' : 'Approve USDT'}
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
