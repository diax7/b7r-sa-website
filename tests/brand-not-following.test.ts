import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_BRAND } from '@/modules/brand/css';
import { SHIPPED_DERIVED } from '@/modules/brand/defaults';
import { NOT_FOLLOWING, NOT_FOLLOWING_ITEMS } from '@/modules/brand/not-following';
import { adminStrings, adminStringsAr } from '@/modules/cms/admin/strings';

/**
 * "Nothing stale goes unnamed" (spec 010, phase 1b gate) as a test rather than a promise:
 * every file that carries one of the shipped brand colours is either where the palette is
 * defined, or named by an item of the "does not follow" list the Appearance screen shows.
 */
const root = process.cwd();

/** Where the palette is defined or restated on purpose, each with its reason. */
const DEFINES_THE_PALETTE: Record<string, string> = {
  'src/modules/brand/defaults.ts': 'the shipped brand itself',
  'src/app/(payload)/admin.css': "the panel's own palette, which does not follow by decision 7",
  'scripts/dev/pill-contrast.mjs': 'a developer tool measuring the panel pills',
};

/**
 * In the site stylesheet only the token definitions themselves, which the runtime block
 * restates (`tests/brand-css.test.ts`); a brand colour anywhere else in it (a shadow, a glow)
 * would stay blue after a rebrand, so it must be written through the tokens.
 */
const TOKEN_DEFINITIONS = { 'src/styles/globals.css': /^\s*--color-[a-z-]+:\s*#[0-9a-f]{6};\s*$/i };

/** Generated from the above: the column defaults a never-saved Appearance global reads. */
const GENERATED = ['src/migrations/'];

const SCANNED = ['src', 'public', 'scripts'];
const TEXT = /\.(ts|tsx|js|mjs|css|svg|json|html|txt|webmanifest)$/;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === 'node_modules' ? [] : files(path);
    return TEXT.test(name) ? [path] : [];
  });
}

const hexes = [...Object.values(DEFAULT_BRAND.sources), ...Object.values(SHIPPED_DERIVED)].map(
  (hex) => hex.slice(1).toLowerCase(),
);
const channels = (hex: string) => [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));

/**
 * A shipped brand colour in any form a stylesheet or a template writes it: `#rrggbb`,
 * `#rrggbbaa`, and `rgb()` or `rgba()` with spaces or commas.
 */
const brandColour = new RegExp(
  [
    `#(${hexes.join('|')})([0-9a-f]{2})?(?![0-9a-f])`,
    ...hexes.map((hex) => {
      const [r, g, b] = channels(hex);
      return String.raw`rgba?\(\s*${r}[\s,]+${g}[\s,]+${b}(?![0-9])`;
    }),
  ].join('|'),
  'i',
);

/** The lines of a file that carry a brand colour and are not one of its allowed definitions. */
function offending(path: string): string[] {
  const allowed = TOKEN_DEFINITIONS[path as keyof typeof TOKEN_DEFINITIONS];
  return readFileSync(join(root, path), 'utf8')
    .split(/\r?\n/)
    .filter((line) => brandColour.test(line) && !allowed?.test(line));
}

const named = (path: string) =>
  NOT_FOLLOWING_ITEMS.some((item) =>
    NOT_FOLLOWING[item].some((entry) => path === entry || path.startsWith(`${entry}/`)),
  );

describe('the "does not follow" list (spec 010)', () => {
  it('names every file that holds a shipped brand colour', () => {
    const holding = SCANNED.flatMap((dir) => files(join(root, dir)))
      .map((path) => relative(root, path).split(sep).join('/'))
      .filter((path) => offending(path).length > 0);
    const unnamed = holding.filter(
      (path) =>
        !(path in DEFINES_THE_PALETTE) &&
        !GENERATED.some((prefix) => path.startsWith(prefix)) &&
        !named(path),
    );
    expect(unnamed).toEqual([]);
    // The scan reads what it claims to: the palette's own definition is found.
    expect(holding).toContain('src/modules/brand/defaults.ts');
  });

  it('reads every form a colour is written in, and only the token lines of the stylesheet', () => {
    for (const written of ['#0058b0', '#0058B0cc', 'rgb(0 88 176 / 0.3)', 'rgba(0, 88, 176, .3)']) {
      expect(brandColour.test(written), written).toBe(true);
    }
    for (const other of ['#0058b01', 'rgb(0 88 1760)', 'rgb(10 88 176)', '#fff']) {
      expect(brandColour.test(other), other).toBe(false);
    }
    const tokenLine = TOKEN_DEFINITIONS['src/styles/globals.css'];
    expect(tokenLine.test('  --color-primary: #0058b0;')).toBe(true);
    expect(tokenLine.test('  --shadow-island: 0 16px 36px rgb(0 88 176 / 0.35);')).toBe(false);
  });

  it('points at files and folders that exist', () => {
    for (const item of NOT_FOLLOWING_ITEMS) {
      for (const path of NOT_FOLLOWING[item]) expect(existsSync(join(root, path)), path).toBe(true);
    }
  });

  it('says what each item is and why, in both languages', () => {
    for (const item of NOT_FOLLOWING_ITEMS) {
      for (const tree of [adminStrings, adminStringsAr]) {
        const { name, why } = tree.appearance.notFollowing.items[item];
        expect(name.length, item).toBeGreaterThan(3);
        expect(why.length, item).toBeGreaterThan(10);
      }
    }
  });
});
