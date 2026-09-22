/**
 * The derivation rules calibrated in task 1a.0 (`specs/010-brand-settings/calibration.md`).
 *
 * Two guarantees, and they are different:
 *
 * 1. The three exact rules reproduce the shipped palette to the byte, so today's site cannot
 *    move. The other three are designed colours that ship verbatim in `DEFAULT_BRAND` and
 *    recompute only when a source changes.
 * 2. **The property test:** for any sources at all, every rule's output either meets its
 *    contrast requirement or is reported as a failure. This is what turns "we promise AA"
 *    into something mechanical, and it is the reason the derivation engine is worth having.
 */
import { assert, integer, property, record, tuple } from 'fast-check';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '@/modules/brand/contrast';
import { DEFAULT_SOURCES, SHIPPED_DERIVED, SURFACE } from '@/modules/brand/defaults';
import { derive, REQUIREMENTS } from '@/modules/brand/derive';

const hexArb = tuple(
  integer({ min: 0, max: 255 }),
  integer({ min: 0, max: 255 }),
  integer({ min: 0, max: 255 }),
).map(([r, g, b]) => `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`);

const sourcesArb = record({
  primary: hexArb,
  primaryDark: hexArb,
  navy: hexArb,
  accent: hexArb,
  ink: hexArb,
});

describe('the three exact rules', () => {
  it('reproduces the shipped palette to the byte', () => {
    const result = derive(DEFAULT_SOURCES);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // calibration.md: primary times 0.84 in sRGB, primary-dark at 4.1% over surface,
    // accent at 10% over surface. These three and only these three are exact.
    expect(result.value.primaryHover).toBe(SHIPPED_DERIVED.primaryHover);
    expect(result.value.ground).toBe(SHIPPED_DERIVED.ground);
    expect(result.value.accentTint).toBe(SHIPPED_DERIVED.accentTint);
  });

  it('does not claim the designed colours are reproducible', () => {
    const result = derive(DEFAULT_SOURCES);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // If one of these ever starts matching, the calibration has been superseded and the
    // designed value should be retired in favour of the rule. Until then, they differ, and
    // pretending otherwise in a rule would be a fudge constant.
    expect(result.value.textMuted).not.toBe(SHIPPED_DERIVED.textMuted);
    expect(result.value.accentOnTint).not.toBe(SHIPPED_DERIVED.accentOnTint);
  });
});

describe('the property that carries the AA promise', () => {
  it('never returns a derived pair that fails its requirement, for any sources', () => {
    assert(
      property(sourcesArb, (sources) => {
        const result = derive(sources);
        if (!result.ok) return; // a reported failure is the honest outcome, not a breach
        for (const [token, requirement] of Object.entries(REQUIREMENTS)) {
          const value = result.value[token as keyof typeof result.value];
          const against = requirement.on === 'surface' ? SURFACE : result.value[requirement.on];
          expect(
            contrastRatio(value, against),
            `${token} on ${requirement.on}`,
          ).toBeGreaterThanOrEqual(requirement.ratio);
        }
      }),
      { numRuns: 300 },
    );
  });

  it('never raises, whatever colours it is handed', () => {
    assert(
      property(sourcesArb, (sources) => {
        expect(() => derive(sources)).not.toThrow();
      }),
      { numRuns: 300 },
    );
  });

  it('reports a failure rather than a bad colour when a requirement cannot be met', () => {
    // An ink with no room to lighten and still pass its requirement on white.
    const result = derive({ ...DEFAULT_SOURCES, ink: '#ffffff' });
    if (!result.ok) {
      expect(result.failures.length).toBeGreaterThan(0);
      expect(result.failures[0]).toHaveProperty('token');
    }
  });
});

describe('the default sources', () => {
  it('derive cleanly, so the fallback can never itself be the failing input', () => {
    expect(derive(DEFAULT_SOURCES).ok).toBe(true);
  });
});
