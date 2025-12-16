export const SPHYGMOS_CONTROLLER_ABI = [
  // Power Units
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "userPU",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Staked SMOS
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "stakedSMOS",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Pending miner rewards
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "pendingMinerRewards",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Stake function
  {
    inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    name: "stake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Unstake function
  {
    inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    name: "unstakeSMOS",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Claim miner rewards
  {
    inputs: [],
    name: "claimMinerRewards",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
