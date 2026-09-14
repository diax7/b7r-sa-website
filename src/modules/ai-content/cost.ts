/**
 * A cost estimate from token counts and the per-provider rates in the settings (USD per
 * million tokens, defaulted to the providers' published prices at the time of writing and
 * labelled "estimate" in the admin). Never the provider's bill.
 */
export interface Usage {
  inputTokens: number;
  outputTokens: number;
}

export interface Rates {
  inputPerMillionUsd: number;
  outputPerMillionUsd: number;
}

export function estimateCostUsd(usage: Usage, rates: Rates): number {
  const cost =
    (usage.inputTokens / 1_000_000) * rates.inputPerMillionUsd +
    (usage.outputTokens / 1_000_000) * rates.outputPerMillionUsd;
  return Math.round(cost * 10_000) / 10_000;
}

export function addUsage(a: Usage, b: Partial<Usage>): Usage {
  return {
    inputTokens: a.inputTokens + (b.inputTokens ?? 0),
    outputTokens: a.outputTokens + (b.outputTokens ?? 0),
  };
}

export const ZERO_USAGE: Usage = { inputTokens: 0, outputTokens: 0 };
