/**
 * The Appearance global as the site and the panel read it (spec 010, phase 1b): the stored
 * document parsed at one boundary, and the refusals, each attributed to the field an editor
 * changes to fix it.
 *
 * Pure: no Payload, no React, no IO. The global's config (`global.ts`), its validators and
 * the admin components all call into here, and so does the root layout through
 * `appearanceCss`, which is why nothing here throws on a stored value.
 */
import { contrastRatio } from '@/modules/brand/contrast';
import {
  block,
  type Brand,
  brandTokens,
  DEFAULT_BRAND,
  DERIVED_FROM,
  resolveBrand,
} from '@/modules/brand/css';
import type { BrandSources } from '@/modules/brand/defaults';
import type { BrandDerived } from '@/modules/brand/derive';
import type { PairKey, PaletteToken } from '@/modules/brand/pairs';
import { type Hex, toHex } from '@/modules/brand/types';
import { librarySurfaceCss, type SurfaceSet, toLibrary } from '@/modules/brand/surfaces';
import { toTypeface, type TypefaceKey, typefaceCss } from '@/modules/brand/typefaces';
import type { MailPalette } from '@/lib/mail-palette';

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
  /** The library of background sets (phase 1c); the three built from the brand are CSS. */
  surfaces: SurfaceSet[];
}

export type Pins = Brand['pinned'];

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

/** A derived colour set by hand, as the global stores it: a row of a list. */
export interface StoredPin {
  token: DerivedKey;
  value: Hex;
}

/**
 * The derived colours set by hand, stored as a list rather than an object: Payload hands a
 * field's validator the saved document deep-merged over the stored one, and a merge unions
 * an object's keys but replaces a list, so a colour handed back to its rule in this save is
 * gone from what the validators read (the CTO's review of phase 1b). `null` (never saved)
 * and `[]` both mean nothing is set by hand. A row that cannot be read is dropped and named.
 */
export function readPins(value: unknown): { pins: Pins; problems: string[] } {
  if (value === null || value === undefined) return { pins: {}, problems: [] };
  if (!Array.isArray(value)) {
    return { pins: {}, problems: [`appearance: pins is ${JSON.stringify(value)}, not a list`] };
  }
  const pins: Pins = {};
  const problems: string[] = [];
  for (const raw of value) {
    const token = isRecord(raw) ? raw['token'] : undefined;
    const colour = isRecord(raw) ? toHex(raw['value']) : null;
    if (typeof token !== 'string' || !isDerivedKey(token) || !colour || token in pins) {
      problems.push(`appearance: dropped the row ${JSON.stringify(raw)} of pins`);
      continue;
    }
    pins[token] = colour;
  }
  return { pins, problems };
}

/** The colours set by hand as the list the global stores, in the strip's order. */
export function toStoredPins(pins: Pins): StoredPin[] {
  return DERIVED_KEYS.flatMap((token) => {
    const value = pins[token];
    return value ? [{ token, value }] : [];
  });
}

/**
 * The stored document as an appearance. Never throws: every value that cannot be used is
 * replaced by the shipped one and named in `problems`, which the reader logs.
 */
export function toAppearance(doc: unknown): { appearance: Appearance; problems: string[] } {
  const stored = isRecord(doc) ? doc : {};
  const problems: string[] = [];
  const read = readPins(stored['pins']);
  const library = toLibrary(stored['surfaces']);
  problems.push(...read.problems, ...library.problems);
  const brand: Brand = { sources: readSources(stored['sources'], problems), pinned: read.pins };
  return {
    appearance: { brand, typeface: toTypeface(stored['typeface']), surfaces: library.library },
    problems,
  };
}

/**
 * The colours the site paints with (`brandTokens`), by token, for what is drawn outside the
 * stylesheet: the e-mails, the app icons, the browser bar and the manifest.
 */
export function paintedColours(appearance: Appearance): (token: PaletteToken) => Hex {
  const tokens = brandTokens(appearance.brand);
  return (token) => tokens[`color-${token}`] ?? appearance.brand.sources.ink;
}

/** The colours an e-mail is written in: the ones the site paints with. */
export function mailPalette(appearance: Appearance): MailPalette {
  const colour = paintedColours(appearance);
  return {
    text: colour('text'),
    muted: colour('text-muted'),
    primary: colour('primary'),
    ground: colour('ground'),
  };
}

/**
 * The appearance as the one style block of the document head: the colours, the typeface, then
 * the library's background sets, whose white button takes the primary the page paints.
 */
export function appearanceCss(appearance: Appearance): string {
  const tokens = brandTokens(appearance.brand);
  const sets = appearance.surfaces.map((set) => librarySurfaceCss(set, tokens)).join('');
  return `${block(tokens)}${typefaceCss(appearance.typeface)}${sets}`;
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
 * colour set by hand is its own row of the strip; a computed or designed one is fixed at its
 * brand colour, since that is what the editor can change. White and the surface are fixed.
 */
function fieldsOf(token: PaletteToken | '#ffffff', brand: Brand): FieldRef[] {
  if (token === '#ffffff' || token === 'surface') return [];
  const source = SOURCE_TOKENS[token];
  if (source) return [{ kind: 'source', key: source }];
  const derived = DERIVED_TOKENS[token];
  if (!derived) return [];
  if (brand.pinned[derived]) return [{ kind: 'pin', key: derived }];
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
