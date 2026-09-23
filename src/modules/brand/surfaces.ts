/**
 * The background sets (spec 010, phase 1c, ADR-065): a background is a set, never a bare
 * colour, carrying the text, the secondary text and the link colour that read on it and the
 * button that stands on it.
 *
 * Three sets are built from the brand and live in `globals.css` as rules over the tokens, so
 * they follow a rebrand and cannot be deleted: `surface` and `ground` (today's two section
 * tones) and `deep-sea` (the navy of the footer). The library, a list in the Appearance
 * global, holds the sets the brand cannot derive; it ships with Sea mist, the gradient Dhia
 * chose, whose colours are fixed (decision 3 of the 2026-09-23 answers) and so named on the
 * "does not follow" panel.
 *
 * A section paints `--section-bg` and `--section-image` and never `--color-surface`, so the
 * cards inside a themed section stay the page's white (the colour bleed the CTO caught in
 * the plan); `globals.css` puts the root tones back on every such island.
 *
 * Pure. Every stored value is parsed here, bounded, and only checked values reach a style
 * block: a key is a slug, a colour a `Hex`, a number clamped.
 */
import { contrastRatio } from '@/modules/brand/contrast';
import type { BrandTokens } from '@/modules/brand/css';
import { mixSrgb, scaleSrgb } from '@/modules/brand/oklch';
import { type Hex, toHex } from '@/modules/brand/types';

export const BUILT_IN_SURFACES = ['surface', 'ground', 'deep-sea'] as const;
export type BuiltInSurface = (typeof BUILT_IN_SURFACES)[number];

const KEY = /^[a-z][a-z0-9-]{0,31}$/;

/** Whether a value can name a set: a short lowercase slug that cannot leave a selector. */
export function isSurfaceKey(value: unknown): value is string {
  return typeof value === 'string' && KEY.test(value);
}

/** One soft radial bloom of a gradient, in percent of the section's box. */
export interface Bloom {
  colour: Hex;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SurfaceSet {
  key: string;
  kind: 'solid' | 'gradient';
  /** The colour of a solid set; the field under the blooms of a gradient. */
  background: Hex;
  blooms: Bloom[];
  /** The grain's strength, the opacity of its darkest and lightest pixels: 0 to `GRAIN_MAX`. */
  grain: number;
  text: Hex;
  textMuted: Hex;
  /** Links and the section's own primary-coloured words. */
  link: Hex;
  /** The call to action on it: the primary blue, or white with primary text. */
  button: 'primary' | 'inverse';
}

export const GRAIN_MAX = 0.2;
export const MAX_BLOOMS = 4;
const POSITION = { min: -50, max: 150 };
const SIZE = { min: 1, max: 200 };

/** WCAG AA for text: every role of a set must reach it at every sampled point. */
const TEXT_MIN = 4.5;

const hex = (value: string): Hex => {
  const parsed = toHex(value);
  if (!parsed) throw new Error(`surfaces: "${value}" is not a #rrggbb colour`);
  return parsed;
};

/**
 * Sea mist: `resources/gradient/reference.png` fitted as a pale field and three blooms (a
 * least-squares fit of the blurred image, 4.8 of 255 RMS per channel), then the deep top
 * bloom lightened in OKLCH, hue and chroma kept, from #00609b until the text, the secondary
 * text and the links read 4.5:1 at every sampled point with the darkest grain pixel: Dhia's
 * choice on 2026-09-23 ("soften the deep bloom"). The other two blooms already read.
 */
export const SEA_MIST: SurfaceSet = {
  key: 'sea-mist',
  kind: 'gradient',
  background: hex('#bbd0d9'),
  blooms: [
    { colour: hex('#4f9cd7'), x: 103.8, y: 3.3, width: 33.1, height: 109.4 },
    { colour: hex('#4f92bc'), x: 45.1, y: 120.5, width: 37.9, height: 63 },
    { colour: hex('#71a7c6'), x: 86.5, y: 58.7, width: 38.8, height: 34.7 },
  ],
  grain: 0.06,
  text: hex('#14181f'),
  textMuted: hex('#1f2833'),
  link: hex('#0a2a50'),
  button: 'primary',
};

export const DEFAULT_LIBRARY: readonly SurfaceSet[] = [SEA_MIST];

/** Sea mist's name in the section picker, in both content languages. */
export const SEA_MIST_NAME = { ar: 'رذاذ البحر', en: 'Sea mist' } as const;

/** Sea mist as a row of the library, named in one content language. */
export function seaMistRow(locale: string | undefined) {
  return {
    ...SEA_MIST,
    label: locale === 'en' ? SEA_MIST_NAME.en : SEA_MIST_NAME.ar,
    blooms: SEA_MIST.blooms.map((bloom) => ({ ...bloom })),
  };
}

/** Every key a section may name: the three built from the brand, then the library's. */
export function surfaceKeys(library: readonly SurfaceSet[]): string[] {
  return [...BUILT_IN_SURFACES, ...library.map((set) => set.key)];
}

const clamp = (value: unknown, { min, max }: { min: number; max: number }, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function readBlooms(value: unknown): Bloom[] | null {
  if (!Array.isArray(value)) return [];
  const blooms: Bloom[] = [];
  for (const raw of value.slice(0, MAX_BLOOMS)) {
    const colour = isRecord(raw) ? toHex(raw['colour']) : null;
    if (!isRecord(raw) || !colour) return null;
    blooms.push({
      colour,
      x: clamp(raw['x'], POSITION, 50),
      y: clamp(raw['y'], POSITION, 50),
      width: clamp(raw['width'], SIZE, 50),
      height: clamp(raw['height'], SIZE, 50),
    });
  }
  return blooms;
}

/** One stored row as a set, or the reason it cannot be one. */
function readSet(raw: unknown, taken: ReadonlySet<string>): SurfaceSet | string {
  if (!isRecord(raw)) return 'not an object';
  const key = raw['key'];
  if (!isSurfaceKey(key)) return `key ${JSON.stringify(key)} is not a slug`;
  if (taken.has(key)) return `key "${key}" is taken`;
  const colours = {
    background: toHex(raw['background']),
    text: toHex(raw['text']),
    textMuted: toHex(raw['textMuted']),
    link: toHex(raw['link']),
  };
  const missing = Object.entries(colours).find(([, value]) => !value);
  if (missing) return `"${key}": ${missing[0]} is not a #rrggbb colour`;
  const kind = raw['kind'] === 'gradient' ? 'gradient' : 'solid';
  const blooms = kind === 'gradient' ? readBlooms(raw['blooms']) : [];
  if (!blooms) return `"${key}": a bloom has no colour`;
  return {
    key,
    kind,
    background: colours.background!,
    blooms,
    grain: kind === 'gradient' ? clamp(raw['grain'], { min: 0, max: GRAIN_MAX }, 0) : 0,
    text: colours.text!,
    textMuted: colours.textMuted!,
    link: colours.link!,
    button: raw['button'] === 'inverse' ? 'inverse' : 'primary',
  };
}

/**
 * One row as the panel holds it while an editor types: a set whatever its key, or `null`
 * while a colour or a bloom cannot be read yet. The row's validators judge its text colours
 * against this, so a half-typed key never hides a contrast refusal.
 */
export function toSurfaceSet(raw: unknown): SurfaceSet | null {
  if (!isRecord(raw)) return null;
  const set = readSet({ ...raw, key: 'row' }, new Set());
  return typeof set === 'string'
    ? null
    : { ...set, key: isSurfaceKey(raw['key']) ? raw['key'] : 'row' };
}

/**
 * The stored library as sets. `null` (never saved) is the default library; a row that cannot
 * be used is dropped and named in `problems`, never emitted.
 */
export function toLibrary(value: unknown): { library: SurfaceSet[]; problems: string[] } {
  if (value === null || value === undefined) return { library: [...DEFAULT_LIBRARY], problems: [] };
  if (!Array.isArray(value)) {
    return { library: [...DEFAULT_LIBRARY], problems: ['surfaces: the library is not a list'] };
  }
  const taken = new Set<string>(BUILT_IN_SURFACES);
  const library: SurfaceSet[] = [];
  const problems: string[] = [];
  for (const raw of value) {
    const set = readSet(raw, taken);
    if (typeof set === 'string') {
      problems.push(`surfaces: dropped a row; ${set}`);
      continue;
    }
    taken.add(set.key);
    library.push(set);
  }
  return { library, problems };
}

/* ---------------------------------------------------------------------------------------
   The field, sampled: what the verdict reads and what the CSS paints must be one model.
   A bloom is `radial-gradient(ellipse W% H% at X% Y%, c 0%, c/.75 35%, c/.25 70%, transparent
   100%)`; CSS composites the first-listed layer on top and interpolates in sRGB.
   --------------------------------------------------------------------------------------- */

const FALLOFF = [
  { at: 0, alpha: 1 },
  { at: 0.35, alpha: 0.75 },
  { at: 0.7, alpha: 0.25 },
  { at: 1, alpha: 0 },
] as const;

function falloff(t: number): number {
  if (t >= 1) return 0;
  for (let i = 1; i < FALLOFF.length; i++) {
    const hi = FALLOFF[i]!;
    const lo = FALLOFF[i - 1]!;
    if (t <= hi.at) return lo.alpha + ((t - lo.at) / (hi.at - lo.at)) * (hi.alpha - lo.alpha);
  }
  return 0;
}

type Rgb = [number, number, number];

const rgbOf = (colour: Hex): Rgb =>
  [1, 3, 5].map((i) => parseInt(colour.slice(i, i + 2), 16)) as Rgb;
const hexOf = ([r, g, b]: Rgb): Hex =>
  `#${[r, g, b]
    .map((v) =>
      Math.round(Math.min(255, Math.max(0, v)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}` as Hex;

const COLUMNS = 32;
const ROWS = 18;

/**
 * The colours of a set's field at a 32 by 18 grid of points from edge to edge, each twice: under the grain's
 * darkest pixel and under its lightest (the grain is black and white noise at `grain`
 * opacity). A dark text meets the first, a light text the second; the verdict reads both.
 */
export function sampleField(set: SurfaceSet): Hex[] {
  if (set.kind === 'solid') return [set.background];
  const samples: Hex[] = [];
  const blooms = set.blooms.map((bloom) => ({ ...bloom, rgb: rgbOf(bloom.colour) }));
  for (let row = 0; row < ROWS; row++) {
    for (let column = 0; column < COLUMNS; column++) {
      // Edge to edge: the corners, where a bloom sits deepest, are points of the field too.
      const x = (column / (COLUMNS - 1)) * 100;
      const y = (row / (ROWS - 1)) * 100;
      let pixel = rgbOf(set.background);
      for (const bloom of blooms.toReversed()) {
        const t = Math.hypot((x - bloom.x) / bloom.width, (y - bloom.y) / bloom.height);
        const a = falloff(t);
        pixel = pixel.map((v, i) => v * (1 - a) + bloom.rgb[i]! * a) as Rgb;
      }
      samples.push(hexOf(pixel.map((v) => v * (1 - set.grain)) as Rgb));
      samples.push(hexOf(pixel.map((v) => v * (1 - set.grain) + 255 * set.grain) as Rgb));
    }
  }
  return samples;
}

export type SurfaceRole = 'text' | 'textMuted' | 'link';

export interface SurfaceVerdict {
  rows: Array<{ role: SurfaceRole; worst: number; wanted: number }>;
  failures: Array<{ role: SurfaceRole; worst: number; wanted: number }>;
}

/** Each text role of a set against every sampled point of its field: the lowest ratio wins. */
export function surfaceVerdict(set: SurfaceSet): SurfaceVerdict {
  const field = sampleField(set);
  const rows = (['text', 'textMuted', 'link'] as const).map((role) => ({
    role,
    worst: Math.min(...field.map((colour) => contrastRatio(set[role], colour))),
    wanted: TEXT_MIN,
  }));
  return { rows, failures: rows.filter((row) => row.worst < row.wanted) };
}

/* ---------------------------------------------------------------------------------------
   The scoped style of a library set, emitted into the head's style block.
   --------------------------------------------------------------------------------------- */

const pct = (n: number) => `${Math.round(n * 10) / 10}%`;

function bloomCss({ colour, x, y, width, height }: Bloom): string {
  const [r, g, b] = rgbOf(colour);
  const at = (alpha: number) => `rgb(${r} ${g} ${b} / ${alpha})`;
  return `radial-gradient(ellipse ${pct(width)} ${pct(height)} at ${pct(x)} ${pct(y)},${FALLOFF.map(
    (stop) => `${at(stop.alpha)} ${pct(stop.at * 100)}`,
  ).join(',')})`;
}

/**
 * The grain: SVG fractal noise thresholded to pure black and pure white, every pixel at the
 * set's opacity, 160 px, tiled. That is the model `sampleField` checks (the darkest pixel is
 * black at `grain`, the lightest white at `grain`), so the check reads what the page paints.
 * Built here from a bounded number, never from a stored string. The noise is in the red
 * channel; the matrix copies it to all three and sets the alpha, the transfer rounds each
 * channel to 0 or 1 and puts the alpha at the grain.
 */
export function grainCss(grain: number): string {
  const opacity = Math.round(Math.min(GRAIN_MAX, Math.max(0, grain)) * 1000) / 1000;
  const matrix = '1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 0 1';
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='${matrix}'/><feComponentTransfer><feFuncR type='discrete' tableValues='0 1'/><feFuncG type='discrete' tableValues='0 1'/><feFuncB type='discrete' tableValues='0 1'/><feFuncA type='linear' slope='0' intercept='${opacity}'/></feComponentTransfer></filter><rect width='100%' height='100%' filter='url(#g)'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/**
 * A set's background as CSS values: the colour, and the blooms with the grain over them. One
 * function for the head's rules and the panel's preview, so the two cannot disagree.
 */
export function surfaceStyle(set: SurfaceSet): { backgroundColor: Hex; backgroundImage: string } {
  const layers =
    set.kind === 'gradient'
      ? [...(set.grain > 0 ? [grainCss(set.grain)] : []), ...set.blooms.map(bloomCss)]
      : [];
  return { backgroundColor: set.background, backgroundImage: layers.join(',') || 'none' };
}

/**
 * One library set as the rules the head carries: its section background and image, and the
 * tones inside it, the focus ring among them. `--color-surface` is never touched (cards keep
 * the page's white), and a set whose button is inverse turns the primary buttons inside it
 * white with primary text, as the ribbon's is (`tokens` are the page's resolved colours).
 */
export function librarySurfaceCss(set: SurfaceSet, tokens: BrandTokens): string {
  if (!isSurfaceKey(set.key)) return '';
  const scope = `[data-surface='${set.key}']`;
  const { backgroundColor, backgroundImage } = surfaceStyle(set);
  const declarations = [
    `--section-bg:${backgroundColor}`,
    `--section-image:${backgroundImage}`,
    `--color-text:${set.text}`,
    `--color-text-muted:${set.textMuted}`,
    `--color-primary:${set.link}`,
    `--color-primary-hover:${scaleSrgb(set.link, 0.84)}`,
    `--color-border:${mixSrgb(set.text, set.background, 0.14)}`,
    `--focus-ring:${set.link}`,
  ];
  const rules = [`${scope}{${declarations.join(';')}}`];
  if (set.button === 'inverse') {
    const primary = tokens['color-primary'] ?? set.link;
    const tint = tokens['color-accent-tint'] ?? '#ffffff';
    rules.push(
      `${scope} :is(.bg-primary,.btn-shiny){--color-primary:#ffffff;--color-primary-hover:${tint};--color-accent:${tint};color:${primary}}`,
    );
  }
  return rules.join('');
}
