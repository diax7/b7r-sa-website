/**
 * Scroll-driven steps (BRD 6.4.4): the pinned section is 300 vh; progress through the
 * scrollable range maps to step 0 / 1 / 2 at 0 / 33 / 66 %.
 */
export const STEP_COUNT = 3;

/** Progress in [0, 1] from the section's bounding rect and the viewport height. */
export function scrollProgress(
  rectTop: number,
  rectHeight: number,
  viewportHeight: number,
): number {
  const range = rectHeight - viewportHeight;
  if (range <= 0) return 0;
  return Math.min(1, Math.max(0, -rectTop / range));
}

export function activeStep(progress: number, count = STEP_COUNT): number {
  if (!Number.isFinite(progress)) return 0;
  return Math.min(count - 1, Math.max(0, Math.floor(progress * count)));
}
