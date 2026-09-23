import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TYPEFACE,
  fontFileFor,
  fontStack,
  preloadsFor,
  toTypeface,
  TYPEFACE_KEYS,
  TYPEFACES,
  typefaceCss,
} from '@/modules/brand/typefaces';

const root = process.cwd();
const tokensCss = readFileSync(join(root, 'src/styles/tokens.css'), 'utf8');

/** Every `@font-face` block of the shared tokens, as family, weight and source url. */
function fontFaces(css: string) {
  return [...css.matchAll(/@font-face\s*{([^}]*)}/g)].map(([, body = '']) => ({
    family: /font-family:\s*'([^']+)'/.exec(body)?.[1],
    weight: /font-weight:\s*([0-9 ]+);/.exec(body)?.[1]?.trim(),
    url: /url\('([^']+)'\)/.exec(body)?.[1],
    local: /src:\s*local\(/.test(body),
  }));
}

describe('the curated typefaces (spec 010 decision 6)', () => {
  it('lists the four families, Rayat first and the default', () => {
    expect(TYPEFACE_KEYS).toEqual(['rayat', 'baloo', 'plex', 'tajawal']);
    expect(DEFAULT_TYPEFACE).toBe('rayat');
    expect(TYPEFACES.rayat.family).toBe('ITF Rayat Round');
  });

  it('keeps the shipped stack for Rayat, so the default brand changes nothing', () => {
    expect(fontStack('rayat')).toBe(
      "'ITF Rayat Round', 'Rayat Fallback', system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif",
    );
    expect(tokensCss).toContain(`--font-sans:\n    ${fontStack('rayat')};`);
  });

  it('switches the fallback family with the primary one, never only the primary', () => {
    for (const key of TYPEFACE_KEYS) {
      const { family, fallback } = TYPEFACES[key];
      expect(fontStack(key).startsWith(`'${family}', '${fallback}', `)).toBe(true);
    }
  });

  it('declares every file of every family in tokens.css, and each file exists in public/fonts', () => {
    const faces = fontFaces(tokensCss);
    for (const key of TYPEFACE_KEYS) {
      const { family, files } = TYPEFACES[key];
      for (const file of new Set(Object.values(files))) {
        const url = `/fonts/${file}.woff2`;
        expect(existsSync(join(root, 'public', url)), url).toBe(true);
        expect(
          faces.some((f) => f.family === family && f.url === url),
          `${family} ${url}`,
        ).toBe(true);
      }
    }
  });

  it('gives every family its own metric fallback face over local fonts', () => {
    const faces = fontFaces(tokensCss);
    for (const key of TYPEFACE_KEYS) {
      const fallback = faces.find((f) => f.family === TYPEFACES[key].fallback);
      expect(fallback?.local, TYPEFACES[key].fallback).toBe(true);
    }
    const blocks = [...tokensCss.matchAll(/@font-face\s*{([^}]*)}/g)].map(([, b = '']) => b);
    for (const key of TYPEFACE_KEYS) {
      const block = blocks.find((b) => b.includes(`'${TYPEFACES[key].fallback}'`)) ?? '';
      for (const override of ['size-adjust', 'ascent-override', 'descent-override']) {
        expect(block, `${key} ${override}`).toMatch(new RegExp(`${override}:\\s*[0-9.]+%`));
      }
    }
  });

  it('resolves a requested weight to the file the browser would pick', () => {
    expect(fontFileFor('rayat', 900)).toBe('ITFRayatRound-Black');
    expect(fontFileFor('rayat', 400)).toBe('ITFRayatRound-Regular');
    // Plex stops at Bold: the display weight falls to it, as CSS font matching does.
    expect(fontFileFor('plex', 900)).toBe('IBMPlexSansArabic-Bold');
    expect(fontFileFor('plex', 300)).toBe('IBMPlexSansArabic-Light');
    // Baloo is one variable file for every weight.
    expect(fontFileFor('baloo', 300)).toBe('BalooBhaijaan2-Variable');
    expect(fontFileFor('baloo', 900)).toBe('BalooBhaijaan2-Variable');
    expect(fontFileFor('tajawal', 500)).toBe('Tajawal-Medium');
  });

  it('matches weights the way CSS does: lighter first below 400, heavier first above 500', () => {
    // Rayat has no 600: a semibold request takes Bold, which is what the site shows today.
    expect(fontFileFor('rayat', 600)).toBe('ITFRayatRound-Bold');
    expect(fontFileFor('tajawal', 200)).toBe('Tajawal-Light');
  });

  it('derives the preload list from the choice, deduplicated', () => {
    expect(preloadsFor('rayat', [400, 500, 700])).toEqual([
      '/fonts/ITFRayatRound-Regular.woff2',
      '/fonts/ITFRayatRound-Medium.woff2',
      '/fonts/ITFRayatRound-Bold.woff2',
    ]);
    expect(preloadsFor('baloo', [400, 500, 700])).toEqual(['/fonts/BalooBhaijaan2-Variable.woff2']);
    expect(preloadsFor('plex', [700, 900])).toEqual(['/fonts/IBMPlexSansArabic-Bold.woff2']);
  });

  it('reads a stored value, and anything unknown as the default', () => {
    expect(toTypeface('tajawal')).toBe('tajawal');
    expect(toTypeface(' Plex ')).toBe('rayat');
    expect(toTypeface(null)).toBe('rayat');
    expect(toTypeface('__proto__')).toBe('rayat');
  });

  it('emits only the font variable, from the registry, never a stored string', () => {
    expect(typefaceCss('plex')).toBe(`:root:root{--font-sans:${fontStack('plex')}}`);
  });

  it('names the licence of each family; only Rayat is bound to b7r.sa', () => {
    expect(TYPEFACES.rayat.licence).toBe('b7r-only');
    for (const key of ['baloo', 'plex', 'tajawal'] as const) {
      expect(TYPEFACES[key].licence).toBe('ofl');
      const dir = TYPEFACES[key].sources;
      expect(existsSync(join(root, dir, 'OFL.txt')), dir).toBe(true);
      // The licence travels with the served files, as the OFL asks of a redistributed font.
      const stem = Object.values(TYPEFACES[key].files)[0]!.split('-')[0]!;
      expect(existsSync(join(root, 'public/fonts', `${stem}-OFL.txt`)), stem).toBe(true);
    }
  });
});
