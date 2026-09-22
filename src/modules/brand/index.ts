/**
 * The brand the site paints itself with (spec 010): the colours an editor sets, the tones
 * derived from them, and the style block the document head carries. Phase 1b puts the
 * Appearance global behind it; nothing outside this module reaches past this file.
 */
export {
  contrastRatio,
  darkenUntil,
  lightenUntil,
  lightestMeeting,
} from '@/modules/brand/contrast';
export type { Search } from '@/modules/brand/contrast';
export {
  type Brand,
  brandCss,
  DEFAULT_BRAND,
  DERIVED_FROM,
  type PairFailure,
  type Pin,
  resolveBrand,
  SHIPPED_BRAND_CSS,
} from '@/modules/brand/css';
export {
  AA_LARGE,
  AA_TEXT,
  type Pair,
  PALETTE_PAIRS,
  type PaletteToken,
} from '@/modules/brand/pairs';
export { type Hex, isHex, toHex, toHexRecord } from '@/modules/brand/types';
export {
  type BrandSources,
  DEFAULT_SOURCES,
  SEMANTIC,
  SHIPPED_DERIVED,
  SURFACE,
} from '@/modules/brand/defaults';
export {
  type BrandDerived,
  derive,
  type DerivationFailure,
  REQUIREMENTS,
} from '@/modules/brand/derive';
export {
  hexToOklch,
  mixSrgb,
  type Oklch,
  oklchToHex,
  scaleSrgb,
  withLightness,
} from '@/modules/brand/oklch';
