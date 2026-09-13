import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * WCAG 2.1 AA contrast over the token pairs the design system actually ships (BRD 3.2, 8.4).
 * Every pair below is a foreground/background combination used by a primitive or the
 * footer; adding a pair here is how a new combination earns its place.
 */

const css = readFileSync(join(process.cwd(), 'src', 'styles', 'globals.css'), 'utf8');

function token(name: string): string {
  const match = new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6});`).exec(css);
  if (!match?.[1]) throw new Error(`token --color-${name} not found in globals.css`);
  return match[1];
}

type Rgb = [number, number, number];

function rgb(hex: string): Rgb {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function linear(channel: number): number {
  const s = channel / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance([r, g, b]: Rgb): number {
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

function ratio(fg: Rgb, bg: Rgb): number {
  const lighter = Math.max(luminance(fg), luminance(bg));
  const darker = Math.min(luminance(fg), luminance(bg));
  return (lighter + 0.05) / (darker + 0.05);
}

/** `text-white/75` on a solid background: composite before measuring. */
function over(fg: Rgb, bg: Rgb, alpha: number): Rgb {
  return fg.map((c, i) => Math.round(c * alpha + (bg[i] ?? 0) * (1 - alpha))) as Rgb;
}

const AA_TEXT = 4.5;
const AA_LARGE = 3;

const pairs: Array<{ use: string; fg: Rgb; bg: Rgb; min: number }> = [
  { use: 'Button primary', fg: rgb(token('white')), bg: rgb(token('primary')), min: AA_TEXT },
  {
    use: 'Button primary hover',
    fg: rgb(token('white')),
    bg: rgb(token('primary-hover')),
    min: AA_TEXT,
  },
  {
    use: 'Button secondary / ghost',
    fg: rgb(token('primary')),
    bg: rgb(token('surface')),
    min: AA_TEXT,
  },
  { use: 'Button inverse', fg: rgb(token('primary')), bg: rgb(token('white')), min: AA_TEXT },
  {
    use: 'Button inverse hover',
    fg: rgb(token('primary')),
    bg: rgb(token('accent-tint')),
    min: AA_TEXT,
  },
  { use: 'Body text on ground', fg: rgb(token('text')), bg: rgb(token('ground')), min: AA_TEXT },
  {
    use: 'Muted text on surface',
    fg: rgb(token('text-muted')),
    bg: rgb(token('surface')),
    min: AA_TEXT,
  },
  {
    use: 'Muted text on ground',
    fg: rgb(token('text-muted')),
    bg: rgb(token('ground')),
    min: AA_TEXT,
  },
  { use: 'Footer text on navy', fg: rgb(token('white')), bg: rgb(token('navy')), min: AA_TEXT },
  {
    use: 'Footer muted (white/75) on navy',
    fg: over(rgb(token('white')), rgb(token('navy')), 0.75),
    bg: rgb(token('navy')),
    min: AA_TEXT,
  },
  {
    use: 'Success line on surface',
    fg: rgb(token('success')),
    bg: rgb(token('surface')),
    min: AA_LARGE,
  },
  {
    use: 'Error text on surface',
    fg: rgb(token('error')),
    bg: rgb(token('surface')),
    min: AA_TEXT,
  },
  {
    use: 'Ribbon text on primary',
    fg: rgb(token('white')),
    bg: rgb(token('primary')),
    min: AA_TEXT,
  },
];

describe('design-system token pairs meet WCAG AA', () => {
  it.each(pairs)('$use', ({ fg, bg, min }) => {
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(min);
  });

  it('white on accent is below AA text contrast, so no primitive may use it for text', () => {
    // The old newsletter submit used exactly this pair; it now goes through Button.
    expect(ratio(rgb(token('white')), rgb(token('accent')))).toBeLessThan(AA_TEXT);
  });
});
