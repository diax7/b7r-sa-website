import type { PrintAreaCanvas } from '@/content/schema';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 28 × 38 cm front print area (BRD 6.4.3). */
export const PRINT_AREA_ASPECT = 28 / 38;

/** Fractions of the 1000 × 1000 photo → pixels for a square stage of `size`. */
export function printAreaRect(area: PrintAreaCanvas, size: number): Rect {
  return { x: area.x * size, y: area.y * size, width: area.w * size, height: area.h * size };
}

/** Initial placement: design width = 60 % of the area width, centred, aspect kept. */
export function initialDesignBox(area: Rect, naturalWidth: number, naturalHeight: number): Rect {
  const ratio = naturalHeight / Math.max(1, naturalWidth);
  let width = area.width * 0.6;
  let height = width * ratio;
  if (height > area.height * 0.9) {
    height = area.height * 0.9;
    width = height / ratio;
  }
  return {
    x: area.x + (area.width - width) / 2,
    y: area.y + (area.height - height) / 2,
    width,
    height,
  };
}

/** Fraction of `box` that lies inside `area` (0–1). */
export function insideRatio(box: Rect, area: Rect): number {
  const boxArea = box.width * box.height;
  if (boxArea <= 0) return 0;
  const ix = Math.max(
    0,
    Math.min(box.x + box.width, area.x + area.width) - Math.max(box.x, area.x),
  );
  const iy = Math.max(
    0,
    Math.min(box.y + box.height, area.y + area.height) - Math.max(box.y, area.y),
  );
  return (ix * iy) / boxArea;
}

/** Minimum share of the design that must stay inside the print area (BRD 6.4.3). */
export const MIN_INSIDE = 0.25;
