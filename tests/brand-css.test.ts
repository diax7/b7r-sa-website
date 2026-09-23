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
import {
  type Brand,
  brandCss,
  DEFAULT_BRAND,
  resolveBrand,
  SHIPPED_BRAND_CSS,
} from '@/modules/brand/css';
import { toHex } from '@/modules/brand/types';

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
    const broken = {
      ...DEFAULT_BRAND,
      sources: { ...DEFAULT_BRAND.sources, ink: toHex('#ffffff')! },
    };
    expect(brandCss(broken)).toBe(SHIPPED_BRAND_CSS);
  });

  it('refuses a pinned colour that fails its pair, rather than shipping it', () => {
    // The blocker this test exists for: pins used to be laid over the palette *after* the
    // rules had been validated, so an override that failed was shipped in silence. Decision 4
    // of the spec refuses such a save; this proves the refusal reaches the stylesheet.
    const pinned: Brand = {
      ...DEFAULT_BRAND,
      pinned: { textMuted: toHex('#eeeeee')! },
    };
    const resolved = resolveBrand(pinned);
    expect(resolved.failures.map((f) => f.use)).toContain('Muted text on surface');
    expect(brandCss(pinned)).toBe(SHIPPED_BRAND_CSS);
  });

  it('never throws, whatever it is handed', () => {
    // Every one of these is a value the Appearance global can hand it in phase 1b: a NULL
    // column, a legacy three digit hex, a pasted value with a trailing space, a colour name.
    const malformed = ['red', '#fff', '', '#0A2F5E ', null, undefined, 42, '#gggggg'];
    for (const value of malformed) {
      const brand = {
        ...DEFAULT_BRAND,
        sources: { ...DEFAULT_BRAND.sources, primary: value as never },
      };
      expect(() => brandCss(brand), String(value)).not.toThrow();
      expect(brandCss(brand), String(value)).toBe(SHIPPED_BRAND_CSS);
    }
  });

  it('never throws on a malformed pin either', () => {
    const brand = {
      ...DEFAULT_BRAND,
      pinned: { textMuted: 'not a colour' as never },
    };
    expect(() => brandCss(brand)).not.toThrow();
  });
});
