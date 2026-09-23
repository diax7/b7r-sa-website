import { describe, expect, it } from 'vitest';
import {
  appearanceCss,
  DEFAULT_PINS,
  refusals,
  refusalsFor,
  releaseFactoryPins,
  SOURCE_KEYS,
  toAppearance,
} from '@/modules/brand/appearance';
import { formatRatio } from '@/modules/brand/admin/refusal';
import { brandCss, DEFAULT_BRAND, SHIPPED_BRAND_CSS } from '@/modules/brand/css';
import { DEFAULT_SOURCES } from '@/modules/brand/defaults';
import { toHex, toHexRecord, type Hex } from '@/modules/brand/types';
import { fontStack } from '@/modules/brand/typefaces';

const hex = (value: string): Hex => toHex(value)!;
const sources = (over: Partial<Record<keyof typeof DEFAULT_SOURCES, string>> = {}) =>
  toHexRecord({ ...DEFAULT_SOURCES, ...over })!;

describe('reading the stored Appearance document', () => {
  it('reads a never-saved global as the shipped brand, factory pins included', () => {
    for (const doc of [null, undefined, {}, { sources: null, pins: null }]) {
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

  it('keeps an empty pin set as the editor left it: every derived colour computed', () => {
    const { appearance } = toAppearance({ sources: DEFAULT_SOURCES, pins: {} });
    expect(appearance.brand.pinned).toEqual({});
  });

  it('reads the five colours, normalising case and spaces', () => {
    const { appearance, problems } = toAppearance({
      sources: { ...DEFAULT_SOURCES, primary: ' #1A5CAF ' },
      pins: DEFAULT_PINS,
      typeface: 'tajawal',
    });
    expect(appearance.brand.sources.primary).toBe('#1a5caf');
    expect(appearance.typeface).toBe('tajawal');
    expect(problems).toEqual([]);
  });

  it('replaces an unreadable colour with the shipped one and names it', () => {
    const { appearance, problems } = toAppearance({
      sources: { ...DEFAULT_SOURCES, navy: '#fff', ink: null },
      pins: DEFAULT_PINS,
    });
    expect(appearance.brand.sources.navy).toBe(DEFAULT_SOURCES.navy);
    expect(appearance.brand.sources.ink).toBe(DEFAULT_SOURCES.ink);
    expect(problems).toEqual([
      'appearance: sources.navy is "#fff", not a #rrggbb colour; the shipped navy applies',
      'appearance: sources.ink is null, not a #rrggbb colour; the shipped ink applies',
    ]);
  });

  it('drops a pin that names no derived colour or holds no colour, and says so', () => {
    const { appearance, problems } = toAppearance({
      sources: DEFAULT_SOURCES,
      pins: {
        border: { value: '#e5e9ef', origin: 'factory' },
        halo: { value: '#000000', origin: 'editor' },
        ground: { value: 'grey', origin: 'editor' },
        textMuted: { value: '#5b6470', origin: 'someone' },
        __proto__: { value: '#000000', origin: 'editor' },
      },
    });
    expect(appearance.brand.pinned).toEqual({ border: { value: '#e5e9ef', origin: 'factory' } });
    expect(problems).toHaveLength(3);
  });
});

describe('releasing a factory pin (the designed values follow a rebrand)', () => {
  it('releases a designed value only when one of its own brand colours moves', () => {
    const after = sources({ primary: '#1a5caf' });
    // Primary feeds only the hover blue, which is computed exactly: nothing designed moves.
    expect(releaseFactoryPins(sources(), after, DEFAULT_BRAND.pinned)).toEqual(
      DEFAULT_BRAND.pinned,
    );
    const inkMoved = releaseFactoryPins(
      sources(),
      sources({ ink: '#1b1f27' }),
      DEFAULT_BRAND.pinned,
    );
    expect(Object.keys(inkMoved)).toEqual(['border', 'accentOnTint']);
  });

  it('never releases an editor pin, whatever moves', () => {
    const pinned = { textMuted: { value: hex('#4a5260'), origin: 'editor' as const } };
    expect(releaseFactoryPins(sources(), sources({ ink: '#000000' }), pinned)).toEqual(pinned);
  });

  it('compares colours case-insensitively, so a re-typed value is not a move', () => {
    const before = { ...sources(), navy: '#0A2F5E' as Hex };
    expect(releaseFactoryPins(before, sources(), DEFAULT_BRAND.pinned)).toEqual(
      DEFAULT_BRAND.pinned,
    );
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
      pinned: {
        ...DEFAULT_BRAND.pinned,
        textMuted: { value: hex('#c0c4ca'), origin: 'editor' as const },
      },
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
      pinned: {
        ...DEFAULT_BRAND.pinned,
        accentTint: { value: hex('#9fd3f0'), origin: 'editor' as const },
      },
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
      pins: DEFAULT_PINS,
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
