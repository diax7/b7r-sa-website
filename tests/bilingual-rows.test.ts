import type { Field } from 'payload';
import { describe, expect, it } from 'vitest';
import {
  keyOfPath,
  listAt,
  otherLocaleRows,
  plannedWrites,
  readKey,
  reconcile,
  resolveKey,
  shapeOf,
  type TranslationEntries,
} from '@/modules/cms/fields/bilingual';

/**
 * Bilingual rows (ADR-057, PR A): an entry inside an array or a blocks field is keyed by the
 * row's id, the other locale's write sends the whole list built from the saved document by
 * id, and only a bilingual subfield of a row the document has can be written.
 */
const fields: Field[] = [
  {
    name: 'hero',
    type: 'group',
    fields: [
      {
        name: 'slides',
        type: 'array',
        fields: [
          { name: 'eyebrow', type: 'text', localized: true },
          { name: 'headline', type: 'text', localized: true },
          { name: 'href', type: 'text' },
          { name: 'image', type: 'upload', relationTo: 'media', localized: true },
          { name: 'weight', type: 'number', localized: true },
        ],
      },
    ],
  },
  {
    name: 'blocks',
    type: 'blocks',
    blocks: [
      {
        slug: 'faqList',
        fields: [
          { name: 'title', type: 'text', localized: true },
          {
            name: 'items',
            type: 'array',
            fields: [
              { name: 'question', type: 'text', localized: true },
              { name: 'answer', type: 'richText', localized: true },
            ],
          },
        ],
      },
      {
        slug: 'contact',
        fields: [
          {
            name: 'booking',
            type: 'group',
            fields: [
              { name: 'title', type: 'text', localized: true },
              { name: 'href', type: 'text' },
            ],
          },
        ],
      },
      { slug: 'divider', fields: [{ name: 'tone', type: 'select', options: ['a', 'b'] }] },
    ],
  },
  { name: 'tags', type: 'array', localized: true, fields: [{ name: 'text', type: 'text' }] },
];
const shape = shapeOf(fields);

/** The saved document, in the saved locale (Arabic). */
const doc = {
  hero: {
    slides: [
      { id: 's2', eyebrow: 'ثانٍ', headline: 'عنوان ثانٍ', href: '/b', image: 2, weight: 2 },
      { id: 's1', eyebrow: 'أول', headline: 'عنوان أول', href: '/a', image: 1, weight: 1 },
      { id: 's3', eyebrow: 'جديد', headline: 'عنوان جديد', href: '/c', image: null, weight: 3 },
    ],
  },
  blocks: [
    {
      id: 'b1',
      blockType: 'faqList',
      title: 'الأسئلة',
      items: [
        { id: 'q1', question: 'سؤال', answer: { root: 'ar' } },
        { id: 'q2', question: 'سؤال آخر', answer: { root: 'ar2' } },
      ],
    },
    { id: 'b2', blockType: 'contact', booking: { title: 'احجز', href: '/book' } },
    { id: 'b3', blockType: 'divider', tone: 'a' },
  ],
  tags: [{ id: 't1', text: 'وسم' }],
};

/** What the other locale (English) holds, read before the write: s3 is new, s1 and s2 were reordered. */
const stored = {
  hero: {
    slides: [
      { id: 's1', eyebrow: 'First', headline: 'First headline', href: '/a', image: 11, weight: 10 },
      { id: 's2', eyebrow: null, headline: 'Second headline', href: '/b', image: 12, weight: 20 },
    ],
  },
  blocks: [
    {
      id: 'b1',
      blockType: 'faqList',
      title: 'FAQ',
      items: [
        { id: 'q1', question: 'Question', answer: { root: 'en' } },
        { id: 'q2', question: null, answer: null },
      ],
    },
    { id: 'b2', blockType: 'contact', booking: { title: null, href: '/book' } },
    { id: 'b3', blockType: 'divider', tone: 'a' },
  ],
  tags: [],
};

describe('the config walk', () => {
  it('lists the shared lists with their localized subfields per block, and a list localized as a whole as one value', () => {
    expect(Object.keys(shape.groups)).toEqual(['hero']);
    expect(Object.keys(shape.groups['hero']!.lists)).toEqual(['slides']);
    expect(shape.groups['hero']!.lists['slides']!.rows['']!.localized).toEqual({
      eyebrow: true,
      headline: true,
      image: false,
      weight: true,
    });
    const blocks = shape.lists['blocks']!;
    expect(blocks.type).toBe('blocks');
    expect(Object.keys(blocks.rows)).toEqual(['faqList', 'contact', 'divider']);
    expect(blocks.rows['faqList']!.lists['items']!.rows['']!.localized).toEqual({
      question: true,
      answer: false,
    });
    expect(blocks.rows['contact']!.groups['booking']!.localized).toEqual({ title: true });
    expect(shape.localized).toEqual({ tags: false });
    expect(listAt(shape, 'hero.slides')?.type).toBe('array');
    expect(listAt(shape, 'blocks')?.type).toBe('blocks');
    expect(listAt(shape, 'tags')).toBeUndefined();
  });
});

describe('resolveKey: the allow-list at apply time', () => {
  it('a bilingual subfield of a row the document has resolves to its outermost list', () => {
    expect(resolveKey(shape, doc, 'hero.slides.s1.eyebrow')).toEqual({ list: 'hero.slides' });
    expect(resolveKey(shape, doc, 'hero.slides.s3.weight')).toEqual({ list: 'hero.slides' });
    expect(resolveKey(shape, doc, 'blocks.b1.title')).toEqual({ list: 'blocks' });
    expect(resolveKey(shape, doc, 'blocks.b1.items.q2.question')).toEqual({ list: 'blocks' });
    expect(resolveKey(shape, doc, 'blocks.b2.booking.title')).toEqual({ list: 'blocks' });
  });

  it('refuses a crafted id, a non-localized subfield, a heavy subfield, a block type the row is not, an index, a whole-localized list', () => {
    expect(resolveKey(shape, doc, 'hero.slides.made-up.eyebrow')).toBeNull();
    expect(resolveKey(shape, doc, 'hero.slides.s1.href')).toBeNull();
    expect(resolveKey(shape, doc, 'hero.slides.s1.image')).toBeNull();
    expect(resolveKey(shape, doc, 'hero.slides.s1.id')).toBeNull();
    expect(resolveKey(shape, doc, 'blocks.b1.blockType')).toBeNull();
    expect(resolveKey(shape, doc, 'blocks.b2.title')).toBeNull();
    expect(resolveKey(shape, doc, 'blocks.b3.tone')).toBeNull();
    expect(resolveKey(shape, doc, 'blocks.b1.items.q1.answer')).toBeNull();
    expect(resolveKey(shape, doc, 'blocks.b1.items.nope.question')).toBeNull();
    expect(resolveKey(shape, doc, 'hero.slides.0.eyebrow')).toBeNull();
    expect(resolveKey(shape, doc, 'hero.slides')).toBeNull();
    expect(resolveKey(shape, doc, 'hero.slides.s1')).toBeNull();
    expect(resolveKey(shape, doc, 'tags.t1.text')).toBeNull();
    expect(resolveKey(shape, doc, 'hero.slides.s1.eyebrow.more')).toBeNull();
  });

  it("refuses a prototype's names: the shape's records are read by own keys only", () => {
    for (const key of ['constructor', 'toString', '__proto__', 'hero.constructor']) {
      expect(resolveKey(shape, doc, key), key).toBeNull();
    }
    expect(resolveKey(shape, doc, 'blocks.b1.constructor')).toBeNull();
    expect(listAt(shape, 'constructor')).toBeUndefined();
    expect(listAt(shape, 'hero.constructor')).toBeUndefined();
    // A row whose block type is not a block of the config is sent as it is, never resolved.
    const odd = { blocks: [{ id: 'x', blockType: 'constructor', title: 'قديم' }] };
    expect(resolveKey(shape, odd, 'blocks.x.title')).toBeNull();
    const rows = otherLocaleRows(listAt(shape, 'blocks')!, odd.blocks, [], new Map(), 'blocks.');
    expect(rows).toEqual(odd.blocks);
  });
});

describe('readKey and keyOfPath: the client side of the id key', () => {
  it('readKey walks a plain path and a list by row id, never by index', () => {
    expect(readKey(stored, 'hero.slides.s2.headline')).toBe('Second headline');
    expect(readKey(stored, 'blocks.b1.items.q1.question')).toBe('Question');
    expect(readKey(stored, 'blocks.b2.booking.title')).toBeNull();
    expect(readKey(stored, 'hero.slides.s3.eyebrow')).toBeUndefined();
    expect(readKey(stored, 'hero.slides.0.headline')).toBeUndefined();
    expect(readKey(stored, 'hero.slides')).toHaveLength(2);
    expect(readKey(null, 'a.b')).toBeUndefined();
  });

  it('keyOfPath swaps each row index for the id in the form state; no id yet means no key', () => {
    const state: Record<string, { value?: unknown }> = {
      'hero.slides.0.id': { value: 's2' },
      'blocks.1.id': { value: 'b1' },
      'blocks.1.items.0.id': { value: 'q1' },
    };
    const idAt = (p: string) => state[p]?.value;
    expect(keyOfPath('hero.slides.0.eyebrow', idAt)).toBe('hero.slides.s2.eyebrow');
    expect(keyOfPath('blocks.1.items.0.question', idAt)).toBe('blocks.b1.items.q1.question');
    expect(keyOfPath('seo.title', idAt)).toBe('seo.title');
    expect(keyOfPath('hero.slides.4.eyebrow', idAt)).toBeNull();
    expect(keyOfPath('blocks.1.items.9.question', idAt)).toBeNull();
  });

  it('reconcile keeps an entry of a row the other locale has not seen yet (a new row), drops an applied one', () => {
    const entries: TranslationEntries = {
      'hero.slides.s3.eyebrow': { value: 'New', base: null },
      'hero.slides.s1.eyebrow': { value: 'First', base: 'Old first' },
      'hero.slides.s2.eyebrow': { value: 'Second', base: null },
    };
    expect(Object.keys(reconcile(entries, (at) => readKey(stored, at)))).toEqual([
      'hero.slides.s3.eyebrow',
      'hero.slides.s2.eyebrow',
    ]);
  });
});

describe('otherLocaleRows and plannedWrites: the whole list in the other locale', () => {
  const entries: TranslationEntries = {
    'hero.slides.s2.eyebrow': { value: 'Second', base: null },
    'hero.slides.s3.headline': { value: 'New headline', base: null },
  };
  /** The one write the entries make: the slides list, as `[path, rows]`. */
  const only = (planned: TranslationEntries): [string, Array<Record<string, unknown>>] => {
    const writes = plannedWrites(planned, shape, doc, stored);
    expect(writes).toHaveLength(1);
    return writes[0] as [string, Array<Record<string, unknown>>];
  };

  it("reorder: the rows come in the document's order, each English matched by id", () => {
    const [path, rows] = only(entries);
    expect(path).toBe('hero.slides');
    expect(rows.map((r) => r['id'])).toEqual(['s2', 's1', 's3']);
  });

  it('an untouched row keeps its stored English on every localized subfield, the Arabic never copied; shared subfields come from the document', () => {
    const [, rows] = only(entries);
    expect(rows[1]).toEqual({
      id: 's1',
      eyebrow: 'First',
      headline: 'First headline',
      href: '/a',
      image: 11,
      weight: 10,
    });
  });

  it('a new row on the same save: the write lands, the other localized subfields start null', () => {
    const [, rows] = only(entries);
    expect(rows[2]).toEqual({
      id: 's3',
      eyebrow: null,
      headline: 'New headline',
      href: '/c',
      image: null,
      weight: null,
    });
  });

  it('the planned write overlays the stored English of its row; an empty text is written as null', () => {
    const blanked: TranslationEntries = {
      'hero.slides.s1.headline': { value: '', base: 'First headline' },
      'hero.slides.s2.eyebrow': { value: 'Second', base: null },
    };
    const [, rows] = only(blanked);
    expect(rows[0]).toMatchObject({ id: 's2', eyebrow: 'Second' });
    expect(rows[1]).toMatchObject({ id: 's1', headline: null });
  });

  it('delete: an entry of a row the document no longer has is dropped and the list is not sent for it alone', () => {
    const gone: TranslationEntries = { 'hero.slides.s9.eyebrow': { value: 'Gone', base: null } };
    expect(plannedWrites(gone, shape, doc, stored)).toEqual([]);
  });

  it('a crafted id and a crafted non-localized path (a link, a block type) never reach the write', () => {
    const crafted: TranslationEntries = {
      'hero.slides.s1.href': { value: '/evil', base: '/a' },
      'blocks.b1.blockType': { value: 'contact', base: 'faqList' },
      'blocks.b3.tone': { value: 'b', base: 'a' },
      'blocks.b1.items.q1.answer': { value: 'x', base: null },
      'hero.slides.made-up.eyebrow': { value: 'x', base: null },
      'hero.slides.s2.eyebrow': { value: 'Second', base: null },
    };
    const writes = plannedWrites(crafted, shape, doc, stored);
    expect(writes.map(([p]) => p)).toEqual(['hero.slides']);
    const rows = writes[0]![1] as Array<Record<string, unknown>>;
    expect(rows.map((r) => r['id'])).toEqual(['s2', 's1', 's3']);
    expect(rows[1]).toMatchObject({ href: '/a' });
  });

  it('a nested block array: the whole blocks list, the nested rows by id inside their block, a block the config does not know sent as it is', () => {
    const nested: TranslationEntries = {
      'blocks.b1.items.q2.question': { value: 'Another question', base: null },
      'blocks.b2.booking.title': { value: 'Book', base: null },
    };
    const writes = plannedWrites(nested, shape, doc, stored);
    expect(writes.map(([p]) => p)).toEqual(['blocks']);
    expect(writes[0]![1]).toEqual([
      {
        id: 'b1',
        blockType: 'faqList',
        title: 'FAQ',
        items: [
          { id: 'q1', question: 'Question', answer: { root: 'en' } },
          { id: 'q2', question: 'Another question', answer: null },
        ],
      },
      { id: 'b2', blockType: 'contact', booking: { title: 'Book', href: '/book' } },
      { id: 'b3', blockType: 'divider', tone: 'a' },
    ]);
  });

  it('a stale entry (the other locale changed since the prefill) is skipped like a scalar', () => {
    const stale: TranslationEntries = {
      'hero.slides.s1.eyebrow': { value: 'Mine', base: 'Theirs before' },
    };
    expect(plannedWrites(stale, shape, doc, stored)).toEqual([]);
  });

  it('otherLocaleRows on its own: no rows when the document has none; a row without an id is sent as it is', () => {
    const list = listAt(shape, 'hero.slides')!;
    expect(otherLocaleRows(list, undefined, [], new Map(), 'hero.slides.')).toEqual([]);
    expect(otherLocaleRows(list, [{ href: '/x' }], [], new Map(), 'hero.slides.')).toEqual([
      { href: '/x' },
    ]);
  });
});
