import { assert, integer, property } from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  clampDaily,
  clampSell,
  monthlyProfit,
  perPieceProfit,
  sellMax,
} from '@/modules/designer/profit';

describe('profit maths (BRD 6.4.3)', () => {
  it('matches the BRD example: 89 sell, 45 base, 10 daily', () => {
    expect(perPieceProfit(89, 45)).toBe(44);
    expect(monthlyProfit(89, 45, 10)).toBe(13200);
  });

  it('is zero at cost and negative below cost', () => {
    expect(perPieceProfit(45, 45)).toBe(0);
    expect(perPieceProfit(40, 45)).toBe(-5);
    expect(monthlyProfit(40, 45, 3)).toBe(-450);
  });

  it('monthly = per piece × daily × 30 for any inputs', () => {
    assert(
      property(
        integer({ min: 0, max: 2000 }),
        integer({ min: 1, max: 500 }),
        integer({ min: 1, max: 100 }),
        (sell, base, daily) => {
          expect(monthlyProfit(sell, base, daily)).toBe((sell - base) * daily * 30);
          expect(Number.isInteger(monthlyProfit(sell, base, daily))).toBe(true);
        },
      ),
      { numRuns: 1000 },
    );
  });

  it('clampSell keeps below-cost values but flags them, clamps above 4× base', () => {
    expect(clampSell(40, 45)).toEqual({ value: 40, belowCost: true });
    expect(clampSell(45, 45)).toEqual({ value: 45, belowCost: false });
    expect(clampSell(999, 45)).toEqual({ value: 180, belowCost: false });
    expect(sellMax(45)).toBe(180);
    expect(clampSell(Number.NaN, 45)).toEqual({ value: 45, belowCost: false });
    expect(clampSell(-10, 45)).toEqual({ value: 0, belowCost: true });
  });

  it('clampDaily stays within 1–100', () => {
    expect(clampDaily(0)).toBe(1);
    expect(clampDaily(100)).toBe(100);
    expect(clampDaily(101)).toBe(100);
    expect(clampDaily(10.6)).toBe(11);
    expect(clampDaily(Number.NaN)).toBe(1);
  });
});
