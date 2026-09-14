/**
 * The page number of a `[n]` route segment, or null: only pages 2 and up have a segment
 * (page 1 is the base route), so `1`, `0` and anything that is not a number are 404s.
 */
export function pageNumber(n: string): number | null {
  return /^[1-9]\d*$/.test(n) && Number(n) >= 2 ? Number(n) : null;
}
