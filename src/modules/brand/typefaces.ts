/**
 * The curated typefaces (spec 010, decisions 5, 5b and 6): four families, self-hosted from
 * `public/fonts`, each subset by `scripts/subset-fonts.sh` and each with a metric fallback of
 * its own in `src/styles/tokens.css`, so switching families cannot regress CLS through a
 * fallback tuned for another face. Every `@font-face` is declared statically; a browser
 * downloads only the faces the page actually uses, so the three families not chosen cost
 * nothing.
 *
 * The chosen family reaches the page as one variable, `--font-sans`, emitted from this
 * registry by key. No stored string ever reaches the style block: an unknown key reads as
 * the default.
 */

/** A CSS font weight the site asks for (`font-light` to `font-black`). */
export type Weight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

export interface Typeface {
  /** The CSS family name, as declared in `tokens.css`. */
  family: string;
  /** The metric-adjusted fallback face declared beside it. */
  fallback: string;
  /** The file (in `public/fonts`, without `.woff2`) for each weight the family ships. */
  files: Partial<Record<Weight, string>>;
  /** `b7r-only`: licensed to B7R for serving from b7r.sa (BRD 3.2). `ofl`: SIL Open Font License. */
  licence: 'b7r-only' | 'ofl';
  /** Where the family's source files and licence text live. */
  sources: string;
}

const BALOO = 'BalooBhaijaan2-Variable';

export const TYPEFACES = {
  rayat: {
    family: 'ITF Rayat Round',
    fallback: 'Rayat Fallback',
    files: {
      300: 'ITFRayatRound-Light',
      400: 'ITFRayatRound-Regular',
      500: 'ITFRayatRound-Medium',
      700: 'ITFRayatRound-Bold',
      900: 'ITFRayatRound-Black',
    },
    licence: 'b7r-only',
    sources: 'resources/brand/fonts/web',
  },
  baloo: {
    family: 'Baloo Bhaijaan 2',
    fallback: 'Baloo Fallback',
    // One variable file, 400 to 800.
    files: { 400: BALOO, 500: BALOO, 600: BALOO, 700: BALOO, 800: BALOO },
    licence: 'ofl',
    sources: 'resources/brand/fonts/baloo-bhaijaan-2',
  },
  plex: {
    family: 'IBM Plex Sans Arabic',
    fallback: 'Plex Fallback',
    files: {
      300: 'IBMPlexSansArabic-Light',
      400: 'IBMPlexSansArabic-Regular',
      500: 'IBMPlexSansArabic-Medium',
      700: 'IBMPlexSansArabic-Bold',
    },
    licence: 'ofl',
    sources: 'resources/brand/fonts/ibm-plex-sans-arabic',
  },
  tajawal: {
    family: 'Tajawal',
    fallback: 'Tajawal Fallback',
    files: {
      300: 'Tajawal-Light',
      400: 'Tajawal-Regular',
      500: 'Tajawal-Medium',
      700: 'Tajawal-Bold',
      900: 'Tajawal-Black',
    },
    licence: 'ofl',
    sources: 'resources/brand/fonts/tajawal',
  },
} as const satisfies Record<string, Typeface>;

export type TypefaceKey = keyof typeof TYPEFACES;

export const TYPEFACE_KEYS = Object.keys(TYPEFACES) as TypefaceKey[];

export const DEFAULT_TYPEFACE: TypefaceKey = 'rayat';

/** What follows the family and its fallback in every stack: the shipped system fonts. */
const SYSTEM_STACK = "system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif";

/** The value of `--font-sans` for a family: the face, its own fallback, then the system fonts. */
export function fontStack(key: TypefaceKey): string {
  const { family, fallback } = TYPEFACES[key];
  return `'${family}', '${fallback}', ${SYSTEM_STACK}`;
}

/** A stored value as a family key; anything unknown reads as the default. */
export function toTypeface(value: unknown): TypefaceKey {
  return typeof value === 'string' && Object.hasOwn(TYPEFACES, value)
    ? (value as TypefaceKey)
    : DEFAULT_TYPEFACE;
}

/**
 * The weights a family ships, in the order CSS font matching tries them for `wanted`
 * (CSS Fonts 4, §5.2): from 400 to 500 it looks up to 500 first, then lighter, then heavier;
 * below 400 lighter first; above 500 heavier first.
 */
function matchOrder(available: Weight[], wanted: Weight): Weight[] {
  const up = available.filter((w) => w >= wanted).toSorted((a, b) => a - b);
  const down = available.filter((w) => w < wanted).toSorted((a, b) => b - a);
  if (wanted < 400) {
    const atOrBelow = available.filter((w) => w <= wanted).toSorted((a, b) => b - a);
    return [...atOrBelow, ...up.filter((w) => w > wanted)];
  }
  if (wanted <= 500) {
    const toFiveHundred = up.filter((w) => w <= 500);
    return [...toFiveHundred, ...down, ...up.filter((w) => w > 500)];
  }
  return [...up, ...down];
}

/** The file a browser loads when a page asks `key` for `weight`. */
export function fontFileFor(key: TypefaceKey, weight: Weight): string {
  const files: Partial<Record<Weight, string>> = TYPEFACES[key].files;
  const available = (Object.keys(files).map(Number) as Weight[]).toSorted((a, b) => a - b);
  const [best] = matchOrder(available, weight);
  const file = best === undefined ? undefined : files[best];
  if (!file) throw new Error(`typefaces: ${key} ships no file at all`);
  return file;
}

/** The font URLs to preload for the weights a page shows, deduplicated in order. */
export function preloadsFor(key: TypefaceKey, weights: readonly Weight[]): string[] {
  return [...new Set(weights.map((weight) => `/fonts/${fontFileFor(key, weight)}.woff2`))];
}

/** The style block that carries the family alone: the panel's, whose colours are its own. */
export function typefaceCss(key: TypefaceKey): string {
  return `:root:root{--font-sans:${fontStack(key)}}`;
}
