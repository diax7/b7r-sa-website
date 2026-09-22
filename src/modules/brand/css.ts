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
import { DEFAULT_SOURCES, SHIPPED_DERIVED, SURFACE } from '@/modules/brand/defaults';
import { type BrandDerived, derive } from '@/modules/brand/derive';
import { type Pair, PALETTE_PAIRS, type PaletteToken } from '@/modules/brand/pairs';
import { type Hex, isHex, toHex, toHexRecord } from '@/modules/brand/types';

/**
 * A value standing in place of its rule's output.
 *
 * `origin` is load bearing, not bookkeeping. The factory pins the three colours the
 * calibration found are designed rather than computed; phase 1b's hook clears a factory pin
 * when one of *its own* sources changes, so editing the primary blue cannot silently move
 * every muted caption on the site, whose rule reads ink. An editor's pin is theirs and is
 * kept until they reset it.
 */
export interface Pin {
  value: Hex;
  origin: 'factory' | 'editor';
}

export interface Brand {
  sources: Record<keyof typeof DEFAULT_SOURCES, Hex>;
  pinned: Partial<Record<keyof BrandDerived, Pin>>;
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

const factory = (value: string): Pin => ({ value: toHex(value)!, origin: 'factory' });

/** The brand the site ships with: today's palette, exactly. */
export const DEFAULT_BRAND: Brand = {
  sources: toHexRecord(DEFAULT_SOURCES)!,
  pinned: {
    border: factory(SHIPPED_DERIVED.border),
    textMuted: factory(SHIPPED_DERIVED.textMuted),
    accentOnTint: factory(SHIPPED_DERIVED.accentOnTint),
  },
};

export type BrandTokens = Record<string, Hex>;

export interface PairFailure {
  use: string;
  wanted: number;
  got: number;
}

export interface Resolved {
  tokens: BrandTokens;
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
  for (const [token, pin] of Object.entries(brand.pinned) as Array<[keyof BrandDerived, Pin]>) {
    if (isHex(pin.value)) derived[token] = pin.value;
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

  const failures: PairFailure[] = [];
  for (const pair of PALETTE_PAIRS satisfies readonly Pair[]) {
    const fg = colourOf(tokens, pair.fg);
    const bg = colourOf(tokens, pair.bg);
    if (!fg || !bg) continue;
    const got = contrastRatio(fg, bg);
    if (got < pair.min) failures.push({ use: pair.use, wanted: pair.min, got });
  }
  return { tokens, failures };
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

function block(tokens: BrandTokens): string {
  return `:root:root{${declarations(tokens)}}`;
}

/**
 * The style block for a brand. A brand that fails any pair, or that cannot be read at all,
 * falls back to the shipped palette and says which pair failed. The panel refuses such a save
 * long before it can reach here, so this is the second line of defence, and unlike an earlier
 * draft it now actually does something.
 */
export function brandCss(brand: Brand): string {
  try {
    const resolved = resolveBrand(brand);
    if (resolved.failures.length === 0) return block(resolved.tokens);
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
  return block(SHIPPED_TOKENS);
}

/** The block for the palette the site ships with, computed once rather than on every render. */
export const SHIPPED_BRAND_CSS: string = block(SHIPPED_TOKENS);
