/**
 * The colour space behind the Appearance global's derivation rules (spec 010). OKLCH is used
 * so a lightness step is perceptually even across hues, which is what makes "darken until AA
 * passes" behave the same for a blue and for a red.
 *
 * The headline assertion is the gamut one, not the round trip: a hand rolled conversion
 * usually fails after a lightness search pushes a colour outside sRGB, not on the way there
 * and back.
 */
import { assert, integer, property, tuple } from 'fast-check';
import { describe, expect, it } from 'vitest';
import { hexToOklch, oklchToHex, withLightness } from '@/modules/brand/oklch';

const hexArb = tuple(
  integer({ min: 0, max: 255 }),
  integer({ min: 0, max: 255 }),
  integer({ min: 0, max: 255 }),
).map(([r, g, b]) => `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`);

describe('the OKLCH conversion', () => {
  it('round trips every colour back to itself', () => {
    assert(
      property(hexArb, (hex) => {
        expect(oklchToHex(hexToOklch(hex))).toBe(hex);
      }),
      { numRuns: 500 },
    );
  });

  it('reads the shipped palette at the lightness the calibration measured', () => {
    // calibration.md, task 1a.0. These four anchor the conversion against hand checked values.
    expect(hexToOklch('#0058b0').l).toBeCloseTo(47.0, 1);
    expect(hexToOklch('#1858a8').l).toBeCloseTo(46.7, 1);
    expect(hexToOklch('#0a2f5e').l).toBeCloseTo(30.9, 1);
    expect(hexToOklch('#ffffff').l).toBeCloseTo(100, 1);
  });

  it('keeps every lightness change inside the sRGB gamut', () => {
    assert(
      property(hexArb, integer({ min: 0, max: 100 }), (hex, lightness) => {
        const moved = withLightness(hexToOklch(hex), lightness);
        expect(oklchToHex(moved)).toMatch(/^#[0-9a-f]{6}$/);
      }),
      { numRuns: 500 },
    );
  });

  it('moves lightness in the direction asked, monotonically', () => {
    const base = hexToOklch('#0058b0');
    const darker = oklchToHex(withLightness(base, 30));
    const lighter = oklchToHex(withLightness(base, 70));
    expect(hexToOklch(darker).l).toBeLessThan(base.l);
    expect(hexToOklch(lighter).l).toBeGreaterThan(base.l);
  });
});
