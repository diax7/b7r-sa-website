/**
 * Profit maths (BRD 0.6, 6.4.3). Pure and unit-tested; the UI never computes money itself.
 * Selling price minus base cost; shipping and VAT excluded from all estimates.
 */
export const DAYS_PER_MONTH = 30;
export const SELL_MAX_MULTIPLIER = 4;
export const DAILY_MIN = 1;
export const DAILY_MAX = 100;

export function perPieceProfit(sellPrice: number, baseCost: number): number {
  return Math.round(sellPrice) - Math.round(baseCost);
}

export function monthlyProfit(sellPrice: number, baseCost: number, dailySales: number): number {
  return perPieceProfit(sellPrice, baseCost) * Math.round(dailySales) * DAYS_PER_MONTH;
}

export function sellMax(baseCost: number): number {
  return baseCost * SELL_MAX_MULTIPLIER;
}

/**
 * Typed prices above the slider maximum clamp to it; prices below the base cost are kept
 * (the UI shows the below-cost warning instead). Non-numbers fall back to the base cost.
 */
export function clampSell(value: number, baseCost: number): { value: number; belowCost: boolean } {
  if (!Number.isFinite(value)) return { value: baseCost, belowCost: false };
  const rounded = Math.max(0, Math.round(value));
  const clamped = Math.min(rounded, sellMax(baseCost));
  return { value: clamped, belowCost: clamped < baseCost };
}

export function clampDaily(value: number): number {
  if (!Number.isFinite(value)) return DAILY_MIN;
  return Math.min(DAILY_MAX, Math.max(DAILY_MIN, Math.round(value)));
}
