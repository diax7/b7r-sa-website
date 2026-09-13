/**
 * Number formatting for displayed figures (BRD 3.11, amended 2026-09-13): Western digits,
 * thousands separators, no decimals for integers and exactly two otherwise. Never used for
 * form input values: `<input type="number">` rejects grouped strings.
 */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '0';
  const rounded = Math.round(value * 100) / 100;
  const fractionDigits = Number.isInteger(rounded) ? 0 : 2;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(rounded);
}
