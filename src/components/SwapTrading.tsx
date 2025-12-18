import { useState } from "react";
import {
  useAccount,
  useBalance,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { TokenApprovalGuard } from "./TokenApprovalGuard";
import { TxStatus } from "./TxStatus";

// PancakeSwap V2 Router (BSC Testnet)
const ROUTER_ADDRESS = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1";
const USDT_ADDRESS = "0xd5210074786CfBE75b66FEC5D72Ae79020514afD";
const SMOS_ADDRESS = "0x88b711119C6591E7Dd1388EAAbBD8b9777d104Cb";

const ROUTER_ABI = [
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
] as const;

export function SwapTrading() {
  const { address } = useAccount();
  const [isBuy, setIsBuy] = useState(true);
  const [amountIn, setAmountIn] = useState("");
  const [txHash, setTxHash] = useState<`0x${string}`>();

  const tokenIn = isBuy ? USDT_ADDRESS : SMOS_ADDRESS;
  const tokenOut = isBuy ? SMOS_ADDRESS : USDT_ADDRESS;

  /* ───────── Wallet Balances ───────── */
  const usdtBal = useBalance({ address, token: USDT_ADDRESS });
  const smosBal = useBalance({ address, token: SMOS_ADDRESS });

  /* ───────── Price (1 SMOS = ? USDT) ───────── */
  const { data: priceData } = useReadContract({
    address: ROUTER_ADDRESS,
    abi: ROUTER_ABI,
    functionName: "getAmountsOut",
    args: [parseUnits("1", 18), [SMOS_ADDRESS, USDT_ADDRESS]],
  });

  const smosPriceUSDT = priceData
    ? Number(formatUnits(priceData[1], 18)).toFixed(4)
    : "0.00";

  /* ───────── Quote ───────── */
  const { data: quoteData } = useReadContract({
    address: ROUTER_ADDRESS,
    abi: ROUTER_ABI,
    functionName: "getAmountsOut",
    args:
      amountIn && Number(amountIn) > 0
        ? [parseUnits(amountIn, 18), [tokenIn, tokenOut]]
        : undefined,
  });

  const estimatedOut = quoteData
    ? Number(formatUnits(quoteData[1], 18)).toFixed(4)
    : "0.0000";

  /* ───────── Swap Execution ───────── */
  const { writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming } =
    useWaitForTransactionReceipt({ hash: txHash });

  const handleSwap = async () => {
    if (!quoteData || !address) return;

    const deadline = BigInt(
      Math.floor(Date.now() / 1000) + 1200
    );
    const minOut = (quoteData[1] * 95n) / 100n;

    const hash = await writeContract({
      address: ROUTER_ADDRESS,
      abi: ROUTER_ABI,
      functionName:
        "swapExactTokensForTokensSupportingFeeOnTransferTokens",
      args: [
        parseUnits(amountIn, 18),
        minOut,
        [tokenIn, tokenOut],
        address,
        deadline,
      ],
    });

    setTxHash(hash);
  };

  return (
    <div className="glass-card p-6 space-y-6 border-t-2 border-yellow-500/30">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <p className="panel-title">Trading Hub</p>
          <p className="text-xs font-mono text-yellow-400 mt-1">
            Price: 1 SMOS = {smosPriceUSDT} USDT
          </p>
        </div>

        <button
          onClick={() => {
            setIsBuy(!isBuy);
            setAmountIn("");
          }}
          className="text-[10px] bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 px-3 py-1 rounded-full font-bold uppercase"
        >
          {isBuy ? "Switch to Sell" : "Switch to Buy"}
        </button>
      </div>

      {/* Balances */}
      <div className="grid grid-cols-2 gap-2">
        <BalanceChip label="USDT" val={usdtBal.data?.formatted} />
        <BalanceChip label="SMOS" val={smosBal.data?.formatted} neon />
      </div>

      {/* Input / Output */}
      <div className="space-y-3">
        <div className="bg-black/40 p-4 rounded-xl border border-white/10">
          <input
            type="number"
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
            placeholder="0.0"
            className="w-full bg-transparent text-2xl font-black outline-none text-white"
          />
          <p className="text-[10px] text-slate-500 uppercase mt-1 font-bold">
            {isBuy ? "Pay USDT" : "Pay SMOS"}
          </p>
        </div>

        <div className="bg-black/20 p-4 rounded-xl border border-white/5 border-dashed">
          <p className="text-2xl font-black text-slate-400">
            {estimatedOut}
          </p>
          <p className="text-[10px] text-slate-500 uppercase mt-1 font-bold">
            Receive (Estimated)
          </p>
        </div>
      </div>

      {/* Approval + Swap */}
      <TokenApprovalGuard
        tokenAddress={tokenIn}
        spenderAddress={ROUTER_ADDRESS}
        amountRequired={amountIn || "0"}
      >
        <button
          onClick={handleSwap}
          disabled={
            !amountIn ||
            estimatedOut === "0.0000" ||
            isPending ||
            isConfirming
          }
          className="w-full py-4 rounded-xl bg-yellow-400 text-black font-black uppercase tracking-widest shadow-lg shadow-yellow-400/20 active:scale-95 disabled:opacity-30"
        >
          {isPending || isConfirming
            ? "Processing..."
            : isBuy
            ? "Buy SMOS"
            : "Sell SMOS"}
        </button>
      </TokenApprovalGuard>

      {/* TX STATUS */}
      <TxStatus hash={txHash} />

      {estimatedOut === "0.0000" && amountIn && (
        <p className="text-[10px] text-red-500 text-center uppercase font-bold italic">
          No Liquidity Found
        </p>
      )}
    </div>
  );
}

/* ───────── Balance Chip ───────── */
function BalanceChip({
  label,
  val,
  neon,
}: {
  label: string;
  val?: string;
  neon?: boolean;
}) {
  return (
    <div className="bg-white/5 rounded-lg p-2 border border-white/5">
      <p className="text-[8px] text-slate-500 uppercase">
        {label} Balance
      </p>
      <p
        className={`text-xs font-mono font-bold ${
          neon ? "text-neon" : "text-white"
        }`}
      >
        {Number(val || 0).toFixed(2)}
      </p>
    </div>
  );
}
