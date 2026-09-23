/**
 * The derivation rules (spec 010), calibrated against the shipped palette in task 1a.0
 * before a line of this was written: `specs/010-brand-settings/calibration.md`.
 *
 * Three rules reproduce today's hexes to the byte. Three do not, because those colours were
 * designed by eye and no rule reaches them; they ship verbatim from `defaults.ts` and this
 * module recomputes them only when a source changes. Inventing a constant that made them
 * match would be a fudge, and the calibration exists to keep that out.
 *
 * Nothing here raises. `brandCss` calls it while `SiteDocument` renders every page and the
 * global 404, so a failure is returned and the caller falls back (ADR-061's rule that a
 * failure degrades rather than cascades).
 */
import { contrastRatio, darkenUntil, lightestMeeting, type Search } from '@/modules/brand/contrast';
import { type BrandSources, SURFACE } from '@/modules/brand/defaults';
import type { Hex } from '@/modules/brand/types';
import { mixSrgb, scaleSrgb } from '@/modules/brand/oklch';

export interface BrandDerived {
  primaryHover: string;
  ground: string;
  accentTint: string;
  border: string;
  textMuted: string;
  accentOnTint: string;
}

export interface DerivationFailure {
  token: keyof BrandDerived;
  wanted: number;
  best: number;
  on: string;
}

export type Derivation =
  | { ok: true; value: BrandDerived }
  | { ok: false; value: BrandDerived; failures: DerivationFailure[] };

/**
 * What each derived token must reach, and against what. `surface` means the page's base
 * colour; anything else names another derived token. The property test in
 * `tests/brand-derive.test.ts` walks this table for random sources, which is what makes the
 * AA promise mechanical rather than a claim.
 */
export const REQUIREMENTS = {
  /** Muted body text: the BRD documents 4.6:1 but the shipped colour measures 6.0 (calibration.md). */
  textMuted: { on: 'surface', ratio: 4.5 },
  /** The accent as text on its own tint. */
  accentOnTint: { on: 'accentTint', ratio: 4.5 },
} as const satisfies Record<string, { on: 'surface' | keyof BrandDerived; ratio: number }>;

/** How far muted text is allowed to recede: the shipped colour sits here (calibration.md). */
const MUTED_RATIO = 6;

/** The sRGB factor that reproduces `primary-hover` exactly; the exact range is 0.839 to 0.843. */
const HOVER_FACTOR = 0.84;

/**
 * Reproduces `ground` exactly over the surface, but **fitted**: a round 0.04 gives `#f6f8fc`.
 * The window that works is 0.0403 to 0.0411, wide enough not to be knife edge (calibration.md).
 */
const GROUND_ALPHA = 0.041;

/** The alpha that reproduces `accent-tint` exactly, over the surface. */
const TINT_ALPHA = 0.1;

/** The alpha for `border`: the closest rule found, two channels out from the designed value. */
const BORDER_ALPHA = 0.1;

/** Takes a search's colour, or its nearest attempt, recording why it fell short. */
function settle(
  token: keyof BrandDerived,
  found: Search,
  fallback: string,
  failures: DerivationFailure[],
): string {
  if (found.ok) return found.value;
  failures.push({ token, wanted: found.wanted, best: found.best, on: found.on });
  return fallback;
}

/**
 * The derived palette for a set of sources. Always returns a usable palette; `ok` says
 * whether every requirement was met, and `failures` names the ones that were not so the
 * panel can refuse the save and tell the editor which pair fell short.
 */
export function derive(sources: Record<keyof BrandSources, Hex>): Derivation {
  const failures: DerivationFailure[] = [];

  const primaryHover = scaleSrgb(sources.primary, HOVER_FACTOR);
  const ground = mixSrgb(sources.primaryDark, SURFACE, GROUND_ALPHA);
  const accentTint = mixSrgb(sources.accent, SURFACE, TINT_ALPHA);
  const border = mixSrgb(sources.navy, SURFACE, BORDER_ALPHA);

  const textMuted = settle(
    'textMuted',
    lightestMeeting(sources.ink, SURFACE, MUTED_RATIO),
    // An ink that cannot reach the muted requirement is itself unreadable; keeping it is
    // the least surprising answer and the panel refuses the save either way.
    sources.ink,
    failures,
  );
  const accentOnTint = settle(
    'accentOnTint',
    darkenUntil(sources.accent, accentTint, REQUIREMENTS.accentOnTint.ratio),
    sources.accent,
    failures,
  );

  const value: BrandDerived = {
    primaryHover,
    ground,
    accentTint,
    border,
    textMuted,
    accentOnTint,
  };

  // The requirements table is the contract; re-check it rather than trusting each rule to
  // have honoured it, so a future rule change cannot quietly drop a guarantee.
  for (const [token, requirement] of Object.entries(REQUIREMENTS) as Array<
    [keyof BrandDerived, { on: 'surface' | keyof BrandDerived; ratio: number }]
  >) {
    const against = requirement.on === 'surface' ? SURFACE : value[requirement.on];
    const got = contrastRatio(value[token], against);
    if (got < requirement.ratio && !failures.some((f) => f.token === token)) {
      failures.push({ token, wanted: requirement.ratio, best: got, on: requirement.on });
    }
  }

  return failures.length === 0 ? { ok: true, value } : { ok: false, value, failures };
}
