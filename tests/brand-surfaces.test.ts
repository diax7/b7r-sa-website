import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '@/modules/brand/contrast';
import { DEFAULT_BRAND, resolveBrand } from '@/modules/brand/css';
import {
  BUILT_IN_SURFACES,
  DEFAULT_LIBRARY,
  GRAIN_MAX,
  isSurfaceKey,
  librarySurfaceCss,
  sampleField,
  SEA_MIST,
  surfaceKeys,
  surfaceStyle,
  surfaceVerdict,
  toLibrary,
} from '@/modules/brand/surfaces';
import { toHex, type Hex } from '@/modules/brand/types';

const hex = (value: string): Hex => toHex(value)!;
const tokens = resolveBrand(DEFAULT_BRAND).tokens;

describe('the background sets (spec 010, phase 1c)', () => {
  it('ships three sets built from the brand and Sea mist in the library', () => {
    expect(BUILT_IN_SURFACES).toEqual(['surface', 'ground', 'deep-sea']);
    expect(DEFAULT_LIBRARY.map((set) => set.key)).toEqual(['sea-mist']);
    expect(surfaceKeys(DEFAULT_LIBRARY)).toEqual(['surface', 'ground', 'deep-sea', 'sea-mist']);
  });

  it('accepts a key as a short lowercase slug, never anything that could leave a selector', () => {
    for (const key of ['sea-mist', 'a', 'dune-2']) expect(isSurfaceKey(key)).toBe(true);
    for (const key of ['', 'Sea', '2dune', "a']{}", 'a b', 'x'.repeat(33), 'sea_mist']) {
      expect(isSurfaceKey(key), key).toBe(false);
    }
  });
});

describe('Sea mist: the reference reproduced, softened until it reads', () => {
  it('keeps the fitted composition: the pale field and three blooms', () => {
    expect(SEA_MIST.kind).toBe('gradient');
    expect(SEA_MIST.background).toBe('#bbd0d9');
    expect(SEA_MIST.blooms).toHaveLength(3);
  });

  it('reads 4.5:1 for its text, secondary text and links at every sampled point, grain included', () => {
    const verdict = surfaceVerdict(SEA_MIST);
    expect(verdict.failures).toEqual([]);
    for (const row of verdict.rows) expect(row.worst).toBeGreaterThanOrEqual(4.5);
  });

  it('would not read if the deep bloom were left as the reference drew it', () => {
    const faithful = {
      ...SEA_MIST,
      blooms: SEA_MIST.blooms.map((b, i) => (i === 0 ? { ...b, colour: hex('#00609b') } : b)),
    };
    expect(surfaceVerdict(faithful).failures.map((f) => f.role)).toContain('text');
  });

  it('counts the grain: the same field with heavier grain reads worse', () => {
    const light = surfaceVerdict({ ...SEA_MIST, grain: 0 }).rows[0]!.worst;
    const heavy = surfaceVerdict({ ...SEA_MIST, grain: GRAIN_MAX }).rows[0]!.worst;
    expect(heavy).toBeLessThan(light);
  });
});

describe('sampling a field', () => {
  it('is one colour for a solid set', () => {
    const solid = { ...SEA_MIST, kind: 'solid' as const, blooms: [], grain: 0 };
    expect(new Set(sampleField(solid))).toEqual(new Set([SEA_MIST.background]));
  });

  it('reaches a bloom colour where the bloom sits', () => {
    const corner = sampleField({
      ...SEA_MIST,
      grain: 0,
      blooms: [{ colour: hex('#204080'), x: 0, y: 0, width: 40, height: 40 }],
    });
    const darkest = corner
      .toSorted((a, b) => contrastRatio(a, '#ffffff') - contrastRatio(b, '#ffffff'))
      .at(-1);
    expect(contrastRatio(darkest!, '#204080')).toBeLessThan(1.3);
  });
});

describe('reading the stored library', () => {
  it('reads a never-saved library as the default one', () => {
    expect(toLibrary(null).library).toEqual(DEFAULT_LIBRARY);
    expect(toLibrary(undefined).library).toEqual(DEFAULT_LIBRARY);
  });

  it('keeps an editor’s set and drops a row it cannot use, naming it', () => {
    const { library, problems } = toLibrary([
      {
        key: 'dune',
        kind: 'solid',
        background: '#f3ead8',
        text: '#14181f',
        textMuted: '#4b4f55',
        link: '#0058b0',
        button: 'primary',
        grain: 0,
        blooms: [],
      },
      {
        key: 'ground',
        kind: 'solid',
        background: '#ffffff',
        text: '#14181f',
        textMuted: '#4b4f55',
        link: '#0058b0',
        button: 'primary',
      },
      {
        key: "x']{}",
        kind: 'solid',
        background: '#ffffff',
        text: '#14181f',
        textMuted: '#4b4f55',
        link: '#0058b0',
        button: 'primary',
      },
      {
        key: 'fog',
        kind: 'solid',
        background: 'grey',
        text: '#14181f',
        textMuted: '#4b4f55',
        link: '#0058b0',
        button: 'primary',
      },
    ]);
    expect(library.map((set) => set.key)).toEqual(['dune']);
    expect(problems).toHaveLength(3);
  });

  it('bounds the numbers: a bloom outside the box or a heavy grain is clamped, never emitted as typed', () => {
    const { library } = toLibrary([
      {
        key: 'storm',
        kind: 'gradient',
        background: '#bbd0d9',
        text: '#14181f',
        textMuted: '#1f2833',
        link: '#0a2a50',
        button: 'primary',
        grain: 5,
        blooms: [{ colour: '#4f9cd7', x: 900, y: -40, width: 0, height: 1e9 }],
      },
    ]);
    const [storm] = library;
    expect(storm!.grain).toBe(GRAIN_MAX);
    expect(storm!.blooms[0]).toEqual({ colour: '#4f9cd7', x: 150, y: -40, width: 1, height: 200 });
  });
});

describe('the scoped style of a library set', () => {
  it('writes the section background, its image and the text tones, from checked values only', () => {
    const css = librarySurfaceCss(SEA_MIST, tokens);
    expect(css.startsWith("[data-surface='sea-mist']{")).toBe(true);
    expect(css).toContain('--section-bg:#bbd0d9');
    // The grain is the first layer, so CSS paints it over the blooms.
    expect(css).toContain('--section-image:url("data:image/svg+xml,');
    expect(css).toContain(',radial-gradient(ellipse 33.1% 109.4% at 103.8% 3.3%');
    expect(css).toContain('--focus-ring:#0a2a50');
    expect(css).toContain('--color-text:#14181f');
    expect(css).toContain('--color-text-muted:#1f2833');
    expect(css).toContain('--color-primary:#0a2a50');
    expect(css).not.toContain('--color-surface');
  });

  it('paints a solid set with no image, and the preview reads the same values', () => {
    const solid = { ...SEA_MIST, key: 'dune', kind: 'solid' as const, background: hex('#f3ead8') };
    expect(surfaceStyle(solid)).toEqual({ backgroundColor: '#f3ead8', backgroundImage: 'none' });
    expect(librarySurfaceCss(solid, tokens)).toContain('--section-image:none');
  });

  it('emits nothing for a key that is not a slug, whatever else the set holds', () => {
    expect(librarySurfaceCss({ ...SEA_MIST, key: "x'] body{color:red" }, tokens)).toBe('');
  });

  it('turns the buttons white on a set whose button is inverse', () => {
    const css = librarySurfaceCss({ ...SEA_MIST, key: 'night', button: 'inverse' }, tokens);
    expect(css).toContain("[data-surface='night'] :is(.bg-primary,.btn-shiny)");
  });
});

/** Every island background the site's components use: the page's white, grey or tint. */
function used(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'admin' ? [] : used(path);
    if (!entry.name.endsWith('.tsx')) return [];
    return (
      [
        ...readFileSync(path, 'utf8').matchAll(
          /(?<![\w:-])bg-(?:surface|ground|white|accent-tint)(?:\/(\d+))?(?![\w-])/g,
        ),
      ]
        // A veil (white at 5 or 10 percent on a dark background) is not an island.
        .filter((m) => !m[1] || Number(m[1]) >= 50)
        .map((m) => m[0])
    );
  });
}

describe('every island a section can hold keeps the page’s tones (globals.css)', () => {
  const root = process.cwd();
  const css = readFileSync(join(root, 'src/styles/globals.css'), 'utf8');
  /** The classes the island rule names, unescaped: `bg-surface/95`. */
  const listed = new Set(
    [
      ...(/:where\(\.surface\)\s*:where\(([^)]*)\)/.exec(css)?.[1] ?? '').matchAll(
        /\.([\w\\/-]+)/g,
      ),
    ].map((m) => m[1]!.replaceAll(String.fromCharCode(92), '')),
  );
  it('names every one of them', () => {
    const classes = new Set([
      ...used(join(root, 'src/modules')),
      ...used(join(root, 'src/components')),
    ]);
    expect(classes.size).toBeGreaterThan(3);
    expect([...classes].filter((c) => !listed.has(c))).toEqual([]);
  });
});
