import { describe, expect, it } from 'vitest';
import { products } from '@/content/products';
import {
  initialDesignBox,
  insideRatio,
  MIN_INSIDE,
  PRINT_AREA_ASPECT,
  printAreaRect,
} from '@/modules/designer/print-area';

describe('print areas (BRD 6.4.3)', () => {
  it.each(products.map((p) => [p.slug, p.printArea.canvas] as const))(
    '%s keeps the 28:38 aspect within tolerance',
    (_slug, area) => {
      const aspect = area.w / area.h;
      expect(Math.abs(aspect - PRINT_AREA_ASPECT)).toBeLessThan(0.02);
      expect(area.x + area.w).toBeLessThan(1);
      expect(area.y + area.h).toBeLessThan(1);
    },
  );

  it('scales fractions to stage pixels', () => {
    expect(printAreaRect({ x: 0.25, y: 0.5, w: 0.2, h: 0.1 }, 640)).toEqual({
      x: 160,
      y: 320,
      width: 128,
      height: 64,
    });
  });

  it('places the design at 60 % of the area width, centred', () => {
    const area = { x: 100, y: 100, width: 200, height: 270 };
    const box = initialDesignBox(area, 1200, 600);
    expect(box.width).toBeCloseTo(120);
    expect(box.height).toBeCloseTo(60);
    expect(box.x).toBeCloseTo(140);
    expect(box.y).toBeCloseTo(205);
  });

  it('caps very tall designs at 90 % of the area height', () => {
    const area = { x: 0, y: 0, width: 200, height: 100 };
    const box = initialDesignBox(area, 100, 1000);
    expect(box.height).toBeCloseTo(90);
  });

  it('computes the inside ratio', () => {
    const area = { x: 0, y: 0, width: 100, height: 100 };
    expect(insideRatio({ x: 0, y: 0, width: 50, height: 50 }, area)).toBe(1);
    expect(insideRatio({ x: 75, y: 0, width: 50, height: 50 }, area)).toBe(0.5);
    expect(insideRatio({ x: 200, y: 200, width: 50, height: 50 }, area)).toBe(0);
    expect(insideRatio({ x: 90, y: 90, width: 40, height: 40 }, area)).toBeLessThan(MIN_INSIDE);
  });
});
