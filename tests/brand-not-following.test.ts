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
  'src/styles/globals.css':
    'the build-time tokens the runtime block restates (tests/brand-css.test.ts)',
  'src/app/(payload)/admin.css': "the panel's own palette, which does not follow by decision 7",
  'scripts/dev/pill-contrast.mjs': 'a developer tool measuring the panel pills',
};

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
const brandHex = new RegExp(`#(${hexes.join('|')})(?![0-9a-f])`, 'i');

const named = (path: string) =>
  NOT_FOLLOWING_ITEMS.some((item) =>
    NOT_FOLLOWING[item].some((entry) => path === entry || path.startsWith(`${entry}/`)),
  );

describe('the "does not follow" list (spec 010)', () => {
  it('names every file that holds a shipped brand colour', () => {
    const holding = SCANNED.flatMap((dir) => files(join(root, dir)))
      .map((path) => relative(root, path).split(sep).join('/'))
      .filter((path) => brandHex.test(readFileSync(join(root, path), 'utf8')));
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
