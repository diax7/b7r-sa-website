/**
 * WCAG contrast for the Appearance global (spec 010). `tests/contrast.test.ts` checks the
 * pairs the design system ships today; this checks the machinery that will generate pairs
 * from colours nobody has seen yet.
 *
 * The rule that matters: a requirement that cannot be met is reported, never raised. These
 * functions run inside `SiteDocument`, which renders every page and the global 404, so a
 * throw here would take the whole site down (spec 010 risks, and the standing rule from
 * ADR-061 that a failure degrades rather than cascades).
 */
import { assert, double, integer, property, tuple } from 'fast-check';
import { describe, expect, it } from 'vitest';
import { contrastRatio, darkenUntil, lightenUntil } from '@/modules/brand/contrast';

const hexArb = tuple(
  integer({ min: 0, max: 255 }),
  integer({ min: 0, max: 255 }),
  integer({ min: 0, max: 255 }),
).map(([r, g, b]) => `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`);

describe('contrastRatio', () => {
  it('agrees with the WCAG definition at the extremes', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 2);
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
  });

  it('is symmetric', () => {
    assert(
      property(hexArb, hexArb, (a, b) => {
        expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 10);
      }),
      { numRuns: 200 },
    );
  });

  it('measures the shipped palette where the calibration measured it', () => {
    // calibration.md, task 1a.0. Both of these contradict the BRD's written figures, which
    // the ADR-065 amendment corrects: muted is documented at 4.6:1 and accent at 3.5:1.
    expect(contrastRatio('#5b6470', '#ffffff')).toBeCloseTo(6.0, 1);
    expect(contrastRatio('#0098e0', '#ffffff')).toBeCloseTo(3.2, 1);
  });
});

describe('darkenUntil and lightenUntil', () => {
  it('returns a colour that actually meets the requirement', () => {
    const found = darkenUntil('#0098e0', '#e6f5fc', 4.5);
    expect(found.ok).toBe(true);
    if (found.ok) expect(contrastRatio(found.value, '#e6f5fc')).toBeGreaterThanOrEqual(4.5);
  });

  it('holds the requirement for any colour on any background it can reach', () => {
    assert(
      property(hexArb, hexArb, (colour, background) => {
        const found = darkenUntil(colour, background, 4.5);
        if (found.ok) expect(contrastRatio(found.value, background)).toBeGreaterThanOrEqual(4.5);
      }),
      { numRuns: 300 },
    );
  });

  it('reports failure instead of raising when the requirement cannot be met', () => {
    // Nothing is 21:1 against mid grey: black reaches about 5.3:1 and white about 3.9:1.
    const impossible = darkenUntil('#0058b0', '#777777', 21);
    expect(impossible.ok).toBe(false);
    if (!impossible.ok) expect(impossible.best).toBeLessThan(21);
  });

  it('never raises, whatever it is handed', () => {
    assert(
      property(hexArb, hexArb, double({ min: 1, max: 21, noNaN: true }), (a, b, ratio) => {
        expect(() => darkenUntil(a, b, ratio)).not.toThrow();
        expect(() => lightenUntil(a, b, ratio)).not.toThrow();
      }),
      { numRuns: 300 },
    );
  });

  it('lightens towards white and darkens towards black', () => {
    const lightened = lightenUntil('#0a2f5e', '#0a2f5e', 3);
    expect(lightened.ok).toBe(true);
    if (lightened.ok) {
      expect(contrastRatio(lightened.value, '#ffffff')).toBeLessThan(
        contrastRatio('#0a2f5e', '#ffffff'),
      );
    }
  });
});
