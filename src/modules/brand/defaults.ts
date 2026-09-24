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
import { type Hex, toHex } from '@/modules/brand/types';

/**
 * The five colours an editor sets. `primary-dark` is a brand blue sampled from the logo, not
 * a darkening of primary: at L 46.7 against primary's 47.0 it is the same lightness
 * (calibration.md).
 */
export interface BrandSources {
  primary: Hex;
  primaryDark: Hex;
  navy: Hex;
  accent: Hex;
  ink: Hex;
}

/** A literal in this file, checked at module load: a typo here is a build time bug. */
function hex(value: string): Hex {
  const parsed = toHex(value);
  if (!parsed) throw new Error(`brand defaults: "${value}" is not a #rrggbb colour`);
  return parsed;
}

/**
 * The page's base colour. Not a source: a coloured page background is a background set
 * (phase 1c), not a token an editor retypes, and the mixing rules need a fixed base.
 */
export const SURFACE: Hex = hex('#ffffff');

export const DEFAULT_SOURCES: BrandSources = {
  primary: hex('#0058b0'),
  primaryDark: hex('#1858a8'),
  navy: hex('#0a2f5e'),
  accent: hex('#0098e0'),
  ink: hex('#14181f'),
};

/** Reproduced exactly by their rule, so they follow a source change with no jump. */
export const COMPUTED_EXACTLY = {
  primaryHover: '#004a94',
  ground: '#f6f8fb',
  accentTint: '#e6f5fc',
} as const;

/**
 * Designed by eye; no rule reaches them (calibration.md). Each applies while every brand
 * colour its rule reads is still the shipped one (`designedApplies` in `css.ts`), and its
 * rule takes over once one of them changes.
 */
export const DESIGNED_NOT_COMPUTED = {
  border: '#e5e9ef',
  textMuted: '#5b6470',
  accentOnTint: '#00639c',
} as const;

/** The derived values as the site ships them today, both groups together. */
export const SHIPPED_DERIVED = { ...COMPUTED_EXACTLY, ...DESIGNED_NOT_COMPUTED } as const;

/** Meaning, not brand: a failure that followed the brand blue would stop reading as a failure. */
export const SEMANTIC = {
  success: '#15803d',
  warning: '#f59e0b',
  error: '#d90000',
  whatsapp: '#25d366',
} as const;
