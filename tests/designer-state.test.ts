import { describe, expect, it } from 'vitest';
import { products } from '@/content/seed/products';

const getProduct = (slug: string) => products.find((p) => p.slug === slug);
import { initialState, reducer, SAMPLE_DESIGN } from '@/modules/designer/use-designer-state';

const tee = getProduct('tee-essential')!;
const hoodie = getProduct('hoodie')!;
const tote = getProduct('tote-bag')!;

describe('designer state', () => {
  it('starts on the essential tee in white, an empty print area and the suggested price', () => {
    const s = initialState(tee);
    expect(s.colorSlug).toBe('white');
    expect(s.design).toBeNull();
    expect(s.sellPrice).toBe(89);
    expect(s.dailySales).toBe(10);
  });

  it('shows every product in white, or its only colour (the tote)', () => {
    expect(initialState(hoodie).colorSlug).toBe('white');
    expect(initialState(tote).colorSlug).toBe(tote.colors[0]?.slug);
  });

  it('resets colour and sell price when the product changes (no spurious below-cost warning)', () => {
    let s = initialState(tee);
    s = reducer(s, { type: 'commitSell', value: 60 });
    s = reducer(s, { type: 'selectProduct', product: hoodie });
    expect(s.sellPrice).toBe(189);
    expect(s.belowCost).toBe(false);
    expect(s.colorSlug).toBe('white');
    s = reducer(s, { type: 'selectProduct', product: tote });
    expect(s.colorSlug).toBe('beige');
  });

  it('flags below-cost prices and clamps above the slider max', () => {
    let s = reducer(initialState(tee), { type: 'setSell', value: 40, live: true });
    expect(s.belowCost).toBe(true);
    expect(s.live).toBe(true);
    s = reducer(s, { type: 'commitSell', value: 500 });
    expect(s.sellPrice).toBe(180);
    expect(s.live).toBe(false);
  });

  it('increments commit only on committed changes', () => {
    let s = initialState(tee);
    const c0 = s.commit;
    s = reducer(s, { type: 'setSell', value: 100, live: true });
    expect(s.commit).toBe(c0);
    s = reducer(s, { type: 'commitSell', value: 100 });
    expect(s.commit).toBe(c0 + 1);
    s = reducer(s, { type: 'setDaily', value: 12 });
    expect(s.commit).toBe(c0 + 2);
  });

  it('keeps the previous design on a file error; the sample and remove actions replace it', () => {
    let s = reducer(initialState(tee), {
      type: 'setDesign',
      design: { url: 'blob:x', kind: 'upload', width: 10, height: 10 },
    });
    s = reducer(s, { type: 'fileError', error: true });
    expect(s.design?.url).toBe('blob:x');
    expect(s.fileError).toBe(true);
    s = reducer(s, { type: 'useSample' });
    expect(s.design?.kind).toBe('sample');
    expect(s.design?.url).toBe(SAMPLE_DESIGN.url);
    expect(s.fileError).toBe(false);
    s = reducer(s, { type: 'removeDesign' });
    expect(s.design).toBeNull();
  });
});
