/**
 * The Appearance global as the site and the panel read it (spec 010, phase 1b): the stored
 * document parsed at one boundary, the rule that releases a designed value when its own
 * brand colour moves, and the refusals, each attributed to the field an editor changes to
 * fix it.
 *
 * Pure: no Payload, no React, no IO. The global's config (`global.ts`), its validators and
 * the admin components all call into here, and so does the root layout through
 * `appearanceCss`, which is why nothing here throws on a stored value.
 */
import { contrastRatio } from '@/modules/brand/contrast';
import {
  type Brand,
  brandCss,
  DEFAULT_BRAND,
  DERIVED_FROM,
  type Pin,
  resolveBrand,
} from '@/modules/brand/css';
import type { BrandSources } from '@/modules/brand/defaults';
import type { BrandDerived } from '@/modules/brand/derive';
import type { PairKey, PaletteToken } from '@/modules/brand/pairs';
import { toHex } from '@/modules/brand/types';
import { toTypeface, type TypefaceKey, typefaceCss } from '@/modules/brand/typefaces';
import type { LogoImage } from '@/modules/core/logo-image';

export const APPEARANCE = 'appearance' as const;

export type SourceKey = keyof BrandSources;
export type DerivedKey = keyof BrandDerived;

/** The five brand colours in the order the screen shows them. */
export const SOURCE_KEYS: readonly SourceKey[] = [
  'primary',
  'primaryDark',
  'accent',
  'navy',
  'ink',
];

/** The derived colours in the order the strip shows them: the blue family, then the neutrals. */
export const DERIVED_KEYS: readonly DerivedKey[] = [
  'primaryHover',
  'accentTint',
  'accentOnTint',
  'ground',
  'border',
  'textMuted',
];

export interface Appearance {
  brand: Brand;
  typeface: TypefaceKey;
}

/** The logos the site ships with, where the Logo tab holds no upload. */
export const SHIPPED_LOGOS = {
  primary: { src: '/images/logo/logo-header.png', width: 198, height: 72 },
  onDark: { src: '/images/logo/logo-white-footer.png', width: 220, height: 80 },
} as const satisfies Record<string, LogoImage>;

export type Pins = Brand['pinned'];

/** The pins a never-saved global starts with: the three designed values, as shipped. */
export const DEFAULT_PINS: Pins = DEFAULT_BRAND.pinned;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isDerivedKey = (key: string): key is DerivedKey =>
  (DERIVED_KEYS as readonly string[]).includes(key);

/** The five colours; a never-saved global reads as the shipped ones, a broken value is named. */
function readSources(value: unknown, problems: string[]): Brand['sources'] {
  if (value === null || value === undefined) return { ...DEFAULT_BRAND.sources };
  const stored = isRecord(value) ? value : {};
  const sources = {} as Brand['sources'];
  for (const key of SOURCE_KEYS) {
    const parsed = toHex(stored[key]);
    if (parsed) {
      sources[key] = parsed;
      continue;
    }
    sources[key] = DEFAULT_BRAND.sources[key];
    problems.push(
      `appearance: sources.${key} is ${JSON.stringify(stored[key]) ?? 'missing'}, not a #rrggbb colour; the shipped ${key} applies`,
    );
  }
  return sources;
}

function readPin(key: string, raw: unknown, problems: string[]): [DerivedKey, Pin] | null {
  if (!isDerivedKey(key)) {
    problems.push(`appearance: pins.${key} names no derived colour; dropped`);
    return null;
  }
  const value = isRecord(raw) ? toHex(raw['value']) : null;
  const origin = isRecord(raw) ? raw['origin'] : undefined;
  if (!value || (origin !== 'factory' && origin !== 'editor')) {
    problems.push(
      `appearance: pins.${key} is ${JSON.stringify(raw)}; dropped, so its rule applies`,
    );
    return null;
  }
  return [key, { value, origin }];
}

/**
 * The pins: `null` (never saved) is the shipped designed values; `{}` is an editor's choice
 * that every derived colour be computed, and is kept as it is.
 */
function readPins(value: unknown, problems: string[]): Pins {
  if (value === null || value === undefined) return { ...DEFAULT_PINS };
  if (!isRecord(value)) {
    problems.push(
      `appearance: pins is ${JSON.stringify(value)}; the shipped designed values apply`,
    );
    return { ...DEFAULT_PINS };
  }
  const pins: Pins = {};
  for (const key of Object.keys(value)) {
    const pin = readPin(key, value[key], problems);
    if (pin) pins[pin[0]] = pin[1];
  }
  return pins;
}

/**
 * The stored document as an appearance. Never throws: every value that cannot be used is
 * replaced by the shipped one and named in `problems`, which the reader logs.
 */
export function toAppearance(doc: unknown): { appearance: Appearance; problems: string[] } {
  const stored = isRecord(doc) ? doc : {};
  const problems: string[] = [];
  const brand: Brand = {
    sources: readSources(stored['sources'], problems),
    pinned: readPins(stored['pins'], problems),
  };
  return { appearance: { brand, typeface: toTypeface(stored['typeface']) }, problems };
}

/** The appearance as the one style block of the document head: colours, then the typeface. */
export function appearanceCss(appearance: Appearance): string {
  return `${brandCss(appearance.brand)}${typefaceCss(appearance.typeface)}`;
}

/**
 * The pins after a save that moved `before` to `after`: a designed value (a factory pin) is
 * released when one of its own brand colours moved, so a rebrand recomputes the hairlines
 * and the secondary text rather than keeping a grey tuned for the old blue; changing the
 * primary does not touch the secondary text, whose rule reads ink. An editor's pin is theirs
 * and stays until they release it.
 */
export function releaseFactoryPins(
  before: Readonly<Record<SourceKey, string>>,
  after: Readonly<Record<SourceKey, string>>,
  pins: Pins,
): Pins {
  const moved = (key: SourceKey) => toHex(before[key]) !== toHex(after[key]);
  const kept: Pins = {};
  for (const [token, pin] of Object.entries(pins) as Array<[DerivedKey, Pin]>) {
    if (pin.origin === 'factory' && DERIVED_FROM[token].some(moved)) continue;
    kept[token] = pin;
  }
  return kept;
}

/** Where an editor fixes a colour: one of the five pickers, or a derived colour set by hand. */
export type FieldRef = { kind: 'source'; key: SourceKey } | { kind: 'pin'; key: DerivedKey };

export interface Culprit {
  field: FieldRef;
  /** Which way the colour must move to pull away from its partner. */
  direction: 'darker' | 'lighter';
}

export interface Refusal {
  pair: PairKey;
  got: number;
  wanted: number;
  /** Every field that could fix the pair, foreground side first. */
  fields: Culprit[];
}

const SOURCE_TOKENS: Partial<Record<PaletteToken, SourceKey>> = {
  primary: 'primary',
  'primary-dark': 'primaryDark',
  navy: 'navy',
  accent: 'accent',
  text: 'ink',
};

const DERIVED_TOKENS: Partial<Record<PaletteToken, DerivedKey>> = {
  'primary-hover': 'primaryHover',
  'accent-tint': 'accentTint',
  'accent-on-tint': 'accentOnTint',
  ground: 'ground',
  'text-muted': 'textMuted',
  border: 'border',
};

/**
 * The fields behind a colour of the palette. A brand colour is its own picker; a derived
 * colour set by hand is its own pin; a computed or designed one is fixed at its brand colour,
 * since that is what the editor can change. White and the page surface are fixed.
 */
function fieldsOf(token: PaletteToken | '#ffffff', brand: Brand): FieldRef[] {
  if (token === '#ffffff' || token === 'surface') return [];
  const source = SOURCE_TOKENS[token];
  if (source) return [{ kind: 'source', key: source }];
  const derived = DERIVED_TOKENS[token];
  if (!derived) return [];
  if (brand.pinned[derived]?.origin === 'editor') return [{ kind: 'pin', key: derived }];
  return DERIVED_FROM[derived].map((key) => ({ kind: 'source', key }));
}

/** Contrast against black grows with luminance, so it orders two colours by lightness. */
const lighterThan = (a: string, b: string) =>
  contrastRatio(a, '#000000') > contrastRatio(b, '#000000');

const sameField = (a: FieldRef, b: FieldRef) => a.kind === b.kind && a.key === b.key;

/** Every pair the brand fails, each with the fields that could fix it. Empty means usable. */
export function refusals(brand: Brand): Refusal[] {
  return resolveBrand(brand)
    .rows.filter((row) => !row.passes)
    .map(({ pair, fg, bg, ratio }): Refusal => {
      const fields: Culprit[] = [];
      for (const [side, colour, partner] of [
        [pair.fg, fg, bg],
        [pair.bg, bg, fg],
      ] as const) {
        const direction = lighterThan(colour, partner) ? 'lighter' : 'darker';
        for (const field of fieldsOf(side, brand)) {
          if (!fields.some((f) => sameField(f.field, field))) fields.push({ field, direction });
        }
      }
      return { pair: pair.key, got: ratio, wanted: pair.min, fields };
    });
}

/** The refusals one field can fix: what its validator reports. */
export function refusalsFor(brand: Brand, field: FieldRef): Refusal[] {
  return refusals(brand).filter((refusal) => refusal.fields.some((f) => sameField(f.field, field)));
}
