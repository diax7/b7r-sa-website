/**
 * The brand the site paints itself with (spec 010): the colours an editor sets, the tones
 * derived from them, the typeface, and the style block the document head carries, read from
 * the Appearance global through `getAppearance`. Nothing outside this module reaches past
 * this file. The Payload config imports `global.ts` directly, as it does for every module
 * (through this index it would be a cycle through the CMS client, since `read.ts` needs it);
 * the panel's widgets import their own files.
 */
export { appearanceCss, paintedColours } from '@/modules/brand/appearance';
export { surfaceKeys } from '@/modules/brand/surfaces';
export {
  APP_ICON_ROUTES,
  APP_ICON_SIZES,
  appIconSize,
  APPLE_ICON_SIZE,
  MANIFEST_ICON_SIZES,
} from '@/modules/brand/app-icons';
export { readMailPalette } from '@/modules/brand/mail';
export { getAppearance, type SiteAppearance, siteViewport } from '@/modules/brand/read';
export { preloadsFor, typefaceCss } from '@/modules/brand/typefaces';
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
