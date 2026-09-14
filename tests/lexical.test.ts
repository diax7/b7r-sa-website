import { describe, expect, it } from 'vitest';
import {
  headingIds,
  headings,
  arabicParagraphs,
  docHref,
  latinParagraphs,
  type LexicalNode,
  type LexicalState,
  linkTargets,
  plainText,
  splitAfterSecondHeading,
} from '@/lib/lexical';

const text = (t: string): LexicalNode => ({ type: 'text', text: t });
const p = (...children: LexicalNode[]): LexicalNode => ({ type: 'paragraph', children });
const h = (tag: 'h2' | 'h3', t: string): LexicalNode => ({
  type: 'heading',
  tag,
  children: [text(t)],
});
const link = (fields: NonNullable<LexicalNode['fields']>, t: string): LexicalNode => ({
  type: 'link',
  fields,
  children: [text(t)],
});
const state = (...children: LexicalNode[]): LexicalState => ({
  root: { type: 'root', children },
});

const body = state(
  p(text('مقدمة قصيرة.')),
  h('h2', 'ما هي الطباعة عند الطلب؟'),
  p(text('لا تُطبع القطعة إلا بعد البيع.')),
  h('h3', 'مثال'),
  p(text('تيشيرت أساسي بـ 45 ريالاً.')),
  h('h2', 'كيف أبدأ؟'),
  p(link({ linkType: 'custom', url: '/how-it-works' }, 'كيف تعمل')),
  h('h2', 'كم أربح؟'),
  p(
    link(
      { linkType: 'internal', doc: { relationTo: 'products', value: { slug: 'tee-essential' } } },
      'التيشيرت الأساسي',
    ),
  ),
  p(link({ linkType: 'custom', url: 'https://www.printful.com/x' }, 'Printful')),
  p(text('This paragraph is written in English only.')),
  p(text('اسم المنصة Shopify يمر بلا مشكلة.')),
);

describe('lib/lexical: one reading of a post body', () => {
  it('numbers the H2s section-n and the H3s under them', () => {
    const ids = [...headingIds(body).values()];
    expect(ids).toEqual(['section-1', 'section-1-1', 'section-2', 'section-3']);
    expect(headings(body)).toEqual([
      { id: 'section-1', text: 'ما هي الطباعة عند الطلب؟', level: 2 },
      { id: 'section-2', text: 'كيف أبدأ؟', level: 2 },
      { id: 'section-3', text: 'كم أربح؟', level: 2 },
    ]);
  });

  it('splits before the third H2 and keeps the ids of the whole body', () => {
    const [before, after] = splitAfterSecondHeading(body);
    expect(before.root.children).toHaveLength(7);
    expect(after?.root.children[0]).toMatchObject({ tag: 'h2' });
    // The halves share node identity with the whole, so one id map serves both.
    const ids = headingIds(body);
    expect(ids.get(after!.root.children[0]!)).toBe('section-3');
    const short = state(h('h2', 'واحد'), p(text('x')), h('h2', 'اثنان'));
    expect(splitAfterSecondHeading(short)).toEqual([short, null]);
  });

  it('flattens to one line per block', () => {
    expect(plainText(body).split('\n')[0]).toBe('مقدمة قصيرة.');
    expect(plainText(body)).toContain('كيف تعمل');
    expect(plainText(null)).toBe('');
    expect(plainText({ root: { type: 'root', children: [] } })).toBe('');
  });

  it('lists every link and tells internal from external', () => {
    expect(linkTargets(body)).toEqual([
      { href: '/how-it-works', internal: true },
      { href: '/products/tee-essential', internal: true },
      { href: 'https://www.printful.com/x', internal: false },
    ]);
    expect(linkTargets(undefined)).toEqual([]);
  });

  it('flags a Latin paragraph, not a brand name inside Arabic or on its own', () => {
    expect(latinParagraphs(body)).toEqual(['This paragraph is written in English only.']);
  });

  it('flags an Arabic paragraph in an English body the same way (ADR-043)', () => {
    expect(arabicParagraphs(body)).toEqual(
      expect.arrayContaining(['لا تُطبع القطعة إلا بعد البيع.', 'اسم المنصة Shopify يمر بلا مشكلة.']),
    );
    expect(arabicParagraphs(body)).not.toContain('This paragraph is written in English only.');
    expect(arabicParagraphs(undefined)).toEqual([]);
  });

  it('resolves an internal document link under the locale (ADR-043)', () => {
    const doc = { relationTo: 'posts', value: { slug: 'first' } };
    expect(docHref(doc)).toBe('/blog/first');
    expect(docHref(doc, 'en')).toBe('/en/blog/first');
    expect(docHref({ relationTo: 'pages', value: { slug: 'about' } }, 'en')).toBe('/en/about');
    expect(docHref({ relationTo: 'products', value: { slug: 'hoodie' } }, 'en')).toBe(
      '/en/products/hoodie',
    );
    expect(docHref({ relationTo: 'posts', value: 3 }, 'en')).toBeNull();
  });
});
