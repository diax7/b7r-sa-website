/**
 * The saved brand as one style block for the document head (spec 010).
 *
 * Written as `:root:root` rather than `:root`: `site-document.tsx` imports `globals.css` and
 * Next hoists it into the head, so a plain `:root` block would tie with Tailwind's
 * `:root, :host` and the winner would depend on hoisting order, which cannot be verified
 * without a build. Specificity (0,2,0) settles it for one character.
 *
 * `brandCss` does not throw, and unlike an earlier draft that claimed it in a comment, it is
 * held three ways: colours are parsed at the boundary (`types.ts`), every value is checked
 * again on the way into the stylesheet, and the whole thing sits inside a catch. It runs
 * while `SiteDocument` renders every page and the global 404, so a brand that cannot be used
 * falls back to the shipped palette and says so in the log rather than taking the site down
 * (ADR-061, and `CLAUDE.md`: never swallow a failure silently).
 */
import { contrastRatio } from '@/modules/brand/contrast';
import { DEFAULT_SOURCES, DESIGNED_NOT_COMPUTED, SURFACE } from '@/modules/brand/defaults';
import { type BrandDerived, derive } from '@/modules/brand/derive';
import { type Pair, type PairKey, PALETTE_PAIRS, type PaletteToken } from '@/modules/brand/pairs';
import { type Hex, isHex, toHex, toHexRecord } from '@/modules/brand/types';

/**
 * The brand an editor sets: the five colours, and the derived colours they set by hand
 * (`pinned`), each standing in place of its rule's output until they hand it back.
 *
 * The three designed colours are not stored. A designed value applies while every brand
 * colour its rule reads is still the shipped one (`designedApplies`), so changing ink
 * recomputes the secondary text and changing ink back restores the designed grey, with no
 * state to lose on the way (the CTO's 2026-09-23 review of phase 1b found a stored "factory
 * pin" could be dropped for good by a change and its undo). Editing the primary blue never
 * moves a muted caption, whose rule reads ink.
 */
export interface Brand {
  sources: Record<keyof typeof DEFAULT_SOURCES, Hex>;
  pinned: Partial<Record<keyof BrandDerived, Hex>>;
}

/** Which sources each derived token's rule actually reads (calibration.md). */
export const DERIVED_FROM: Record<
  keyof BrandDerived,
  ReadonlyArray<keyof typeof DEFAULT_SOURCES>
> = {
  primaryHover: ['primary'],
  ground: ['primaryDark'],
  accentTint: ['accent'],
  border: ['navy'],
  textMuted: ['ink'],
  accentOnTint: ['accent'],
};

/** The brand the site ships with: today's palette, exactly, with nothing set by hand. */
export const DEFAULT_BRAND: Brand = {
  sources: toHexRecord(DEFAULT_SOURCES)!,
  pinned: {},
};

const SHIPPED_SOURCES: Record<keyof typeof DEFAULT_SOURCES, Hex> = DEFAULT_BRAND.sources;

/**
 * Whether a derived colour shows its designed value (`DESIGNED_NOT_COMPUTED`): it is one of
 * the three designed colours and every brand colour its rule reads is still the shipped one.
 */
export function designedApplies(
  token: keyof BrandDerived,
  sources: Readonly<Record<keyof typeof DEFAULT_SOURCES, string>>,
): boolean {
  return (
    token in DESIGNED_NOT_COMPUTED &&
    DERIVED_FROM[token].every((source) => toHex(sources[source]) === SHIPPED_SOURCES[source])
  );
}

export type BrandTokens = Record<string, Hex>;

export interface PairFailure {
  key: PairKey;
  use: string;
  wanted: number;
  got: number;
}

/** One pair of the contrast check as the finished palette paints it. */
export interface PairRow {
  pair: Pair;
  fg: Hex;
  bg: Hex;
  ratio: number;
  passes: boolean;
}

export interface Resolved {
  tokens: BrandTokens;
  /** Every pair of `PALETTE_PAIRS`, in order: what the panel's contrast check draws. */
  rows: PairRow[];
  /** Every pair the finished palette fails, pins included. Empty means the brand is usable. */
  failures: PairFailure[];
}

function colourOf(tokens: BrandTokens, token: PaletteToken | '#ffffff'): Hex | undefined {
  return token === '#ffffff' ? (token as Hex) : tokens[`color-${token}`];
}

/**
 * The rules' output with the pins laid over it, then **checked as a whole**.
 *
 * The check runs here rather than inside `derive` because a pin replaces a rule's output
 * after the rule has validated it. Checking only the rules would let an editor pin muted text
 * to near white and ship it, which is exactly what decision 4 of the spec refuses.
 */
export function resolveBrand(brand: Brand): Resolved {
  const derivation = derive(brand.sources);
  const derived: BrandDerived = { ...derivation.value };
  for (const token of Object.keys(DESIGNED_NOT_COMPUTED) as Array<keyof BrandDerived>) {
    if (designedApplies(token, brand.sources)) {
      derived[token] = DESIGNED_NOT_COMPUTED[token as keyof typeof DESIGNED_NOT_COMPUTED];
    }
  }
  for (const [token, pin] of Object.entries(brand.pinned) as Array<[keyof BrandDerived, Hex]>) {
    if (isHex(pin)) {
      derived[token] = pin;
    } else {
      // Silently dropping it would be the same failure class as the silent fallback above:
      // the rule's output ships and the editor's value has vanished with nothing said.
      console.warn(
        `brand: ignoring the value set by hand on ${token}; ${JSON.stringify(pin)} is not a #rrggbb colour, so its rule applies instead`,
      );
    }
  }

  const tokens: BrandTokens = {
    'color-primary': brand.sources.primary,
    'color-primary-hover': derived.primaryHover as Hex,
    'color-primary-dark': brand.sources.primaryDark,
    'color-navy': brand.sources.navy,
    'color-accent': brand.sources.accent,
    'color-accent-tint': derived.accentTint as Hex,
    'color-accent-on-tint': derived.accentOnTint as Hex,
    'color-ground': derived.ground as Hex,
    'color-surface': toHex(SURFACE)!,
    'color-text': brand.sources.ink,
    'color-text-muted': derived.textMuted as Hex,
    'color-border': derived.border as Hex,
  };

  const rows: PairRow[] = [];
  for (const pair of PALETTE_PAIRS satisfies readonly Pair[]) {
    const fg = colourOf(tokens, pair.fg);
    const bg = colourOf(tokens, pair.bg);
    if (!fg || !bg) continue;
    const ratio = contrastRatio(fg, bg);
    rows.push({ pair, fg, bg, ratio, passes: ratio >= pair.min });
  }
  const failures: PairFailure[] = rows
    .filter((row) => !row.passes)
    .map(({ pair, ratio }) => ({ key: pair.key, use: pair.use, wanted: pair.min, got: ratio }));
  return { tokens, rows, failures };
}

/** The shipped palette, resolved once: the fallback can never itself be the failing input. */
const SHIPPED_TOKENS: BrandTokens = resolveBrand(DEFAULT_BRAND).tokens;

/** Only a checked colour reaches the stylesheet: this string goes into the document head. */
function declarations(tokens: BrandTokens): string {
  return Object.entries(tokens)
    .filter(([, value]) => isHex(value))
    .map(([name, value]) => `--${name}:${value}`)
    .join(';');
}

/** The root block for resolved tokens: `:root:root { --color-…: #hex }`. */
export function block(tokens: BrandTokens): string {
  return `:root:root{${declarations(tokens)}}`;
}

/**
 * The tokens a page paints with for a brand. A brand that fails any pair, or that cannot be read at all,
 * falls back to the shipped palette and says which pair failed. The panel refuses such a save
 * long before it can reach here, so this is the second line of defence, and unlike an earlier
 * draft it now actually does something.
 */
export function brandTokens(brand: Brand): BrandTokens {
  try {
    const resolved = resolveBrand(brand);
    if (resolved.failures.length === 0) return resolved.tokens;
    for (const failure of resolved.failures) {
      console.warn(
        `brand: keeping the shipped palette; ${failure.use} reads ${failure.got.toFixed(2)}:1 and needs ${failure.wanted}:1`,
      );
    }
  } catch (error) {
    console.warn(
      `brand: keeping the shipped palette; the saved brand could not be read (${
        error instanceof Error ? error.message : 'unknown'
      })`,
    );
  }
  return SHIPPED_TOKENS;
}

/** The style block for a brand: the tokens `brandTokens` settles on. */
export function brandCss(brand: Brand): string {
  return block(brandTokens(brand));
}

/** The block for the palette the site ships with, computed once rather than on every render. */
export const SHIPPED_BRAND_CSS: string = block(SHIPPED_TOKENS);
