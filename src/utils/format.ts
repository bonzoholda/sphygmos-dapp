import { formatUnits } from "viem";

/**
 * Format bigint token amount for UI
 */
export function fmt(
  value?: bigint,
  decimals = 18,
  maxDecimals = 4
) {
  if (!value) return "0";

  const num = Number(formatUnits(value, decimals));

  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  });
}
