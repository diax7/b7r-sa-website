/**
 * The brand the site ships with: today's palette, verbatim (spec 010).
 *
 * Every value here mirrors `src/styles/globals.css`, and `tests/brand-css.test.ts` holds
 * them equal against a checked-in fixture of the stylesheet as it stood at 9989617, so the
 * comparison is anchored to something outside this change.
 *
 * Three of the derived values are reproduced exactly by their rule; three are designed
 * colours that no rule reaches (task 1a.0, `specs/010-brand-settings/calibration.md`). Those
 * three ship from here verbatim and recompute from their rules only when a source changes,
 * because that moment is a rebrand and a coherent family is the point.
 */

/** The five colours an editor sets. `primary-dark` is a brand blue sampled from the logo. */
export interface BrandSources {
  primary: string;
  primaryDark: string;
  navy: string;
  accent: string;
  ink: string;
}

/**
 * The page's base colour. Not a source: a coloured page background is a background set
 * (phase 1c), not a token an editor retypes, and the mixing rules need a fixed base.
 */
export const SURFACE = '#ffffff';

export const DEFAULT_SOURCES: BrandSources = {
  primary: '#0058b0',
  primaryDark: '#1858a8',
  navy: '#0a2f5e',
  accent: '#0098e0',
  ink: '#14181f',
};

/**
 * The derived values as the site ships them today. The first three are what the rules
 * produce; the last three are designed colours the rules do not reach.
 */
export const SHIPPED_DERIVED = {
  primaryHover: '#004a94',
  ground: '#f6f8fb',
  accentTint: '#e6f5fc',
  border: '#e5e9ef',
  textMuted: '#5b6470',
  accentOnTint: '#00639c',
} as const;

/** Meaning, not brand: a failure that followed the brand blue would stop reading as a failure. */
export const SEMANTIC = {
  success: '#15803d',
  warning: '#f59e0b',
  error: '#d90000',
  whatsapp: '#25d366',
} as const;
