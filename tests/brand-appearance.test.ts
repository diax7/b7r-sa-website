import { describe, expect, it } from 'vitest';
import {
  appearanceCss,
  readPins,
  refusals,
  refusalsFor,
  SOURCE_KEYS,
  toAppearance,
  toStoredPins,
} from '@/modules/brand/appearance';
import { formatRatio } from '@/modules/brand/admin/refusal';
import {
  brandCss,
  DEFAULT_BRAND,
  designedApplies,
  resolveBrand,
  SHIPPED_BRAND_CSS,
} from '@/modules/brand/css';
import { DEFAULT_SOURCES, DESIGNED_NOT_COMPUTED } from '@/modules/brand/defaults';
import { toHex, toHexRecord, type Hex } from '@/modules/brand/types';
import { fontStack } from '@/modules/brand/typefaces';

const hex = (value: string): Hex => toHex(value)!;
const sources = (over: Partial<Record<keyof typeof DEFAULT_SOURCES, string>> = {}) =>
  toHexRecord({ ...DEFAULT_SOURCES, ...over })!;

describe('reading the stored Appearance document', () => {
  it('reads a never-saved global as the shipped brand', () => {
    for (const doc of [null, undefined, {}, { sources: null, pins: null }, { pins: [] }]) {
      const { appearance, problems } = toAppearance(doc);
      expect(appearance.brand).toEqual(DEFAULT_BRAND);
      expect(appearance.typeface).toBe('rayat');
      expect(problems).toEqual([]);
    }
  });

  it('emits exactly the shipped block for a never-saved global', () => {
    const { appearance } = toAppearance(null);
    expect(brandCss(appearance.brand)).toBe(SHIPPED_BRAND_CSS);
  });

  it('reads the five colours, normalising case and spaces', () => {
    const { appearance, problems } = toAppearance({
      sources: { ...DEFAULT_SOURCES, primary: ' #1A5CAF ' },
      pins: [],
      typeface: 'tajawal',
    });
    expect(appearance.brand.sources.primary).toBe('#1a5caf');
    expect(appearance.typeface).toBe('tajawal');
    expect(problems).toEqual([]);
  });

  it('replaces an unreadable colour with the shipped one and names it', () => {
    const { appearance, problems } = toAppearance({
      sources: { ...DEFAULT_SOURCES, navy: '#fff', ink: null },
      pins: [],
    });
    expect(appearance.brand.sources.navy).toBe(DEFAULT_SOURCES.navy);
    expect(appearance.brand.sources.ink).toBe(DEFAULT_SOURCES.ink);
    expect(problems).toEqual([
      'appearance: sources.navy is "#fff", not a #rrggbb colour; the shipped navy applies',
      'appearance: sources.ink is null, not a #rrggbb colour; the shipped ink applies',
    ]);
  });

  it('reads the colours set by hand as a list, dropping a row it cannot use and naming it', () => {
    const { pins, problems } = readPins([
      { token: 'border', value: '#E1E5EB' },
      { token: 'halo', value: '#000000' },
      { token: 'ground', value: 'grey' },
      { token: 'border', value: '#000000' },
      'textMuted',
    ]);
    expect(pins).toEqual({ border: '#e1e5eb' });
    expect(problems).toHaveLength(4);
  });

  it('refuses the old object shape rather than guessing at it', () => {
    const { pins, problems } = readPins({ textMuted: { value: '#5b6470', origin: 'factory' } });
    expect(pins).toEqual({});
    expect(problems).toHaveLength(1);
  });

  it('writes the list back in the strip’s order', () => {
    expect(toStoredPins({ textMuted: hex('#4a5260'), primaryHover: hex('#003f80') })).toEqual([
      { token: 'primaryHover', value: '#003f80' },
      { token: 'textMuted', value: '#4a5260' },
    ]);
  });
});

describe('a designed value holds while its own brand colour is the shipped one', () => {
  const muted = (ink: string) =>
    resolveBrand({ ...DEFAULT_BRAND, sources: sources({ ink }) }).tokens['color-text-muted'];

  it('shows the designed grey with the shipped ink, computes after a change, and comes back', () => {
    expect(muted(DEFAULT_SOURCES.ink)).toBe(DESIGNED_NOT_COMPUTED.textMuted);
    expect(muted('#1b1f27')).not.toBe(DESIGNED_NOT_COMPUTED.textMuted);
    // Typed back, in capitals: the designed value returns, nothing was lost on the way.
    expect(muted('#14181F')).toBe(DESIGNED_NOT_COMPUTED.textMuted);
  });

  it('is moved only by the colour its rule reads: a new primary keeps every designed value', () => {
    const typed = sources({ primary: '#1a5caf' });
    for (const token of ['border', 'textMuted', 'accentOnTint'] as const) {
      expect(designedApplies(token, typed), token).toBe(true);
    }
    expect(designedApplies('textMuted', sources({ ink: '#000000' }))).toBe(false);
    expect(designedApplies('border', sources({ navy: '#102a4f' }))).toBe(false);
  });

  it('never applies to a colour computed exactly by its rule', () => {
    expect(designedApplies('primaryHover', sources())).toBe(false);
  });

  it('gives way to a colour set by hand', () => {
    const brand = { ...DEFAULT_BRAND, pinned: { textMuted: hex('#4a5260') } };
    expect(resolveBrand(brand).tokens['color-text-muted']).toBe('#4a5260');
  });
});

describe('refusals: every failing pair, named by the field that fixes it', () => {
  it('refuses nothing for the shipped brand', () => {
    expect(refusals(DEFAULT_BRAND)).toEqual([]);
  });

  it('puts a pale primary on the primary picker, asking for a darker one', () => {
    const brand = { ...DEFAULT_BRAND, sources: sources({ primary: '#7fb2ff' }) };
    const found = refusalsFor(brand, { kind: 'source', key: 'primary' });
    expect(found.map((r) => r.pair)).toContain('buttonPrimary');
    const button = found.find((r) => r.pair === 'buttonPrimary')!;
    expect(button.got).toBeLessThan(button.wanted);
    expect(button.fields).toContainEqual({
      field: { kind: 'source', key: 'primary' },
      direction: 'darker',
    });
  });

  it('puts a light ink on the ink picker', () => {
    const brand = { ...DEFAULT_BRAND, sources: sources({ ink: '#9aa3ad' }) };
    expect(refusalsFor(brand, { kind: 'source', key: 'ink' }).map((r) => r.pair)).toContain(
      'bodyOnSurface',
    );
  });

  it('puts a failing hand-set value on its own pin, not on a brand colour', () => {
    const brand = {
      ...DEFAULT_BRAND,
      pinned: { textMuted: hex('#c0c4ca') },
    };
    const onPin = refusalsFor(brand, { kind: 'pin', key: 'textMuted' });
    expect(onPin.map((r) => r.pair)).toEqual(['mutedOnSurface', 'mutedOnGround']);
    expect(onPin[0]!.fields).toEqual([
      { field: { kind: 'pin', key: 'textMuted' }, direction: 'darker' },
    ]);
    expect(refusalsFor(brand, { kind: 'source', key: 'ink' })).toEqual([]);
  });

  it('names both fields when either could fix the pair', () => {
    // A primary close to the accent tint fails "primary text on the accent tint".
    const brand = { ...DEFAULT_BRAND, sources: sources({ primary: '#6aa0d8' }) };
    const pair = refusals(brand).find((r) => r.pair === 'buttonInverseHover')!;
    expect(pair.fields.map((f) => f.field)).toEqual([
      { kind: 'source', key: 'primary' },
      { kind: 'source', key: 'accent' },
    ]);
  });

  it('asks for the direction that moves the colour away from its partner', () => {
    // Navy sits under white footer text: a pale navy has to go darker.
    const pale = { ...DEFAULT_BRAND, sources: sources({ navy: '#8aa4c8' }) };
    expect(refusalsFor(pale, { kind: 'source', key: 'navy' })[0]!.fields[0]!.direction).toBe(
      'darker',
    );
    // The accent tint sits under darker text: a tint set too deep has to go lighter.
    const deep = {
      ...DEFAULT_BRAND,
      pinned: { accentTint: hex('#9fd3f0') },
    };
    const onTint = refusalsFor(deep, { kind: 'pin', key: 'accentTint' });
    expect(onTint.map((r) => r.pair)).toEqual(['buttonInverseHover', 'badgeAccent']);
    for (const refusal of onTint) {
      expect(refusal.fields).toContainEqual({
        field: { kind: 'pin', key: 'accentTint' },
        direction: 'lighter',
      });
    }
  });
});

describe('the ratio as the editor reads it', () => {
  it('floors to two decimals, so a pair just short of 4.5 never reads as 4.5', () => {
    expect(formatRatio(4.4999, 'en')).toBe('4.49:1');
    expect(formatRatio(3, 'ar')).toBe('3:1');
    expect(formatRatio(12.345, 'ar')).toBe('12.34:1');
  });
});

describe('the style block of a whole appearance', () => {
  it('is the colours, then the typeface', () => {
    const { appearance } = toAppearance({
      sources: DEFAULT_SOURCES,
      pins: [],
      typeface: 'plex',
    });
    const css = appearanceCss(appearance);
    expect(css.startsWith(SHIPPED_BRAND_CSS)).toBe(true);
    expect(css).toContain(`--font-sans:${fontStack('plex')}`);
  });

  it('lists the five brand colours in screen order', () => {
    expect(SOURCE_KEYS).toEqual(['primary', 'primaryDark', 'accent', 'navy', 'ink']);
  });
});
