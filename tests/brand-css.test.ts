/**
 * Gate 1 of phase 1a (spec 010): the block the Appearance global emits must restate exactly
 * the values the site shipped before this feature existed.
 *
 * The expected values come from `tests/fixtures/globals-9989617.css`, a verbatim copy of the
 * stylesheet at the commit this branch left main. That anchor matters: an earlier draft of
 * this test compared the defaults against the live stylesheet, which after the change would
 * have been a file whose values came from the defaults. It would have proved nothing. The
 * fixture is a copy the change cannot move, and it survives CI's shallow clone, which a
 * `git show` at that commit would not.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { brandCss, DEFAULT_BRAND, resolveBrand } from '@/modules/brand/css';

const fixture = readFileSync(
  join(process.cwd(), 'tests', 'fixtures', 'globals-9989617.css'),
  'utf8',
);

function shipped(token: string): string {
  const found = new RegExp(`--${token}:\\s*(#[0-9a-fA-F]{6});`).exec(fixture)?.[1];
  if (!found) throw new Error(`${token} is not in the 9989617 fixture`);
  return found.toLowerCase();
}

describe('the emitted block restates the shipped palette', () => {
  it('matches the pre-change stylesheet token by token', () => {
    const { tokens } = resolveBrand(DEFAULT_BRAND);
    for (const [token, value] of Object.entries(tokens)) {
      expect(value.toLowerCase(), token).toBe(shipped(token));
    }
  });

  it('covers every brand colour the stylesheet defines, and no semantic one', () => {
    const { tokens } = resolveBrand(DEFAULT_BRAND);
    expect(Object.keys(tokens).toSorted()).toEqual([
      'color-accent',
      'color-accent-on-tint',
      'color-accent-tint',
      'color-border',
      'color-ground',
      'color-navy',
      'color-primary',
      'color-primary-dark',
      'color-primary-hover',
      'color-surface',
      'color-text',
      'color-text-muted',
    ]);
    // Meaning, not brand: these must never follow the brand blue.
    for (const semantic of ['color-success', 'color-warning', 'color-error', 'color-whatsapp']) {
      expect(Object.keys(tokens)).not.toContain(semantic);
    }
  });

  it('outranks Tailwind regardless of stylesheet order', () => {
    expect(brandCss(DEFAULT_BRAND).startsWith(':root:root{')).toBe(true);
  });

  it('falls back to the shipped palette rather than emitting an unreadable one', () => {
    // An ink that cannot satisfy the muted requirement; the panel refuses such a save, so
    // reaching here at all means something bypassed it and the site must still be readable.
    const broken = { ...DEFAULT_BRAND, sources: { ...DEFAULT_BRAND.sources, ink: '#ffffff' } };
    expect(brandCss(broken)).toBe(brandCss(DEFAULT_BRAND));
  });

  it('never throws, whatever it is handed', () => {
    expect(() => brandCss({ sources: DEFAULT_BRAND.sources, pinned: {} })).not.toThrow();
  });
});
