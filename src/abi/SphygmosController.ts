export const SPHYGMOS_CONTROLLER_ABI = [
  {
    "type": "function",
    "name": "minersPoolBalance",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [{ "type": "uint256" }]
  },
  {
    "type": "function",
    "name": "rewardPoolBalance",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [{ "type": "uint256" }]
  },
  {
    "type": "function",
    "name": "totalPU",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [{ "type": "uint256" }]
  },
  {
    "type": "function",
    "name": "userPU",
    "stateMutability": "view",
    "inputs": [{ "name": "", "type": "address" }],
    "outputs": [{ "type": "uint256" }]
  },
  {
    "type": "function",
    "name": "stakedSMOS",
    "stateMutability": "view",
    "inputs": [{ "name": "", "type": "address" }],
    "outputs": [{ "type": "uint256" }]
  },
  {
    "type": "function",
    "name": "depositPush",
    "stateMutability": "nonpayable",
    "inputs": [{ "name": "usdtAmount", "type": "uint256" }],
    "outputs": []
  },
  {
    "type": "function",
    "name": "stake",
    "stateMutability": "nonpayable",
    "inputs": [{ "name": "amount", "type": "uint256" }],
    "outputs": []
  },
  {
    "type": "function",
    "name": "claimMinerRewards",
    "stateMutability": "nonpayable",
    "inputs": [],
    "outputs": []
  }
  {
    "type": "function",
    "name": "seederPoolBalance",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [{ "type": "uint256" }]
  },
  {
    "type": "function",
    "name": "pairedPoolBalance",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [{ "type": "uint256" }]
  },
  {
    "type": "function",
    "name": "triggerPoolBalance",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [{ "type": "uint256" }]
  },
  {
    "type": "function",
    "name": "totalStakedSMOS",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [{ "type": "uint256" }]
  },
  {
    "type": "function",
    "name": "dripRatePerSecond",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [{ "type": "uint256" }]
  }

  
] as const;
