import type { CollectionConfig, Field, GlobalConfig, PayloadRequest } from 'payload';
import { describe, expect, it, vi } from 'vitest';
import {
  bilingualPaths,
  entriesOf,
  nestPaths,
  plannedWrites,
  reconcile,
  shapeOf,
  TRANSLATIONS_MAX_BYTES,
  TRANSLATIONS_MAX_ENTRIES,
  translationsField,
  translationsProblem,
  type Translations,
} from '@/modules/cms/fields/bilingual';
import {
  applyGlobalTranslations,
  applyTranslations,
  inOtherLocale,
  isAutosave,
  refusalFor,
  SKIP_TRANSLATIONS,
} from '@/modules/cms/hooks/translations';

/**
 * The apply of side-by-side bilingual editing (ADR-057): after a Save or Publish the hook
 * writes the other language's pending edits with a second update in that locale, inside the
 * same request, and clears the JSON in the same write. Payload is mocked the way
 * `revalidate-hook.test.ts` mocks it: the hook sees `req.payload` and nothing else.
 */
type Doc = Record<string, unknown>;
type Hook = (args: unknown) => Promise<Doc>;

const fields: Field[] = [
  { name: 'title', type: 'text', localized: true, required: true },
  { name: 'slug', type: 'text' },
  {
    type: 'tabs',
    tabs: [
      {
        label: 'Search',
        fields: [
          {
            name: 'seo',
            type: 'group',
            fields: [
              { name: 'title', type: 'text', localized: true },
              { name: 'description', type: 'textarea', localized: true },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'blocks',
    type: 'blocks',
    blocks: [{ slug: 'cards', fields: [{ name: 'title', type: 'text', localized: true }] }],
  },
];
const collection = { slug: 'pages', fields } as unknown as CollectionConfig;
const global = { slug: 'site-settings', fields } as unknown as GlobalConfig;

const localization = {
  defaultLocale: 'ar',
  localeCodes: ['ar', 'en'],
  locales: [
    { code: 'ar', label: 'العربية', rtl: true },
    { code: 'en', label: 'English' },
  ],
};

interface Fake {
  locale?: string;
  query?: Record<string, unknown>;
  context?: Record<string, unknown>;
  /** What the other locale holds now. */
  stored?: Doc;
  /** What the second write throws, if anything. */
  fail?: Error;
}

function fake(opts: Fake = {}) {
  const stored = opts.stored ?? { title: 'Old', seo: { title: 'Old meta' } };
  const update = vi.fn(async () => {
    if (opts.fail) throw opts.fail;
    return {};
  });
  const updateGlobal = vi.fn(async () => {
    if (opts.fail) throw opts.fail;
    return {};
  });
  const findByID = vi.fn(async () => stored);
  const findGlobal = vi.fn(async () => stored);
  const req = {
    locale: opts.locale ?? 'ar',
    query: opts.query ?? {},
    context: opts.context ?? {},
    payload: { update, updateGlobal, findByID, findGlobal, config: { localization } },
  } as unknown as PayloadRequest;
  return { req, update, updateGlobal, findByID, findGlobal };
}

const pending = (entries: Translations['en']): Translations => ({ en: entries });

function save(doc: Doc, req: PayloadRequest) {
  return (applyTranslations as unknown as Hook)({
    doc,
    previousDoc: doc,
    operation: 'update',
    req,
    collection,
    context: req.context,
  });
}

describe('the apply (ADR-057): one Save writes the other language too', () => {
  it('a changed value is written in the other locale, the JSON cleared in the same write', async () => {
    const { req, update, findByID } = fake();
    const doc = {
      id: 7,
      _status: 'published',
      translations: pending({ title: { value: 'New', base: 'Old' } }),
    };
    const result = await save(doc, req);
    expect(findByID).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'pages',
        id: 7,
        locale: 'en',
        fallbackLocale: false,
        draft: true,
        depth: 0,
        overrideAccess: false,
        req,
        context: { [SKIP_TRANSLATIONS]: true },
      }),
    );
    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'pages',
        id: 7,
        locale: 'en',
        draft: false,
        overrideAccess: false,
        req,
        data: { title: 'New', translations: null },
        context: { [SKIP_TRANSLATIONS]: true },
      }),
    );
    // The response carries the cleared JSON, not the other language's values.
    expect(result).toEqual({ ...doc, translations: null });
  });

  it('an unchanged entry (value equals base) is skipped: no second write', async () => {
    const { req, update } = fake();
    const doc = { id: 7, translations: pending({ title: { value: 'Old', base: 'Old' } }) };
    expect(await save(doc, req)).toBe(doc);
    expect(update).not.toHaveBeenCalled();
  });

  it('a stale base (someone else wrote there since the prefill) is skipped: the stored edit wins', async () => {
    const { req, update } = fake({ stored: { title: 'Theirs' } });
    const doc = { id: 7, translations: pending({ title: { value: 'Mine', base: 'Old' } }) };
    expect(await save(doc, req)).toBe(doc);
    expect(update).not.toHaveBeenCalled();
  });

  it('a required field blanked fails the save, naming the field and the language', async () => {
    const fail = Object.assign(new Error('The following field is invalid: Title'), {
      name: 'ValidationError',
      status: 400,
      data: { errors: [{ label: 'Title', message: 'This field is required.', path: 'title' }] },
    });
    const { req } = fake({ fail });
    const doc = {
      id: 7,
      _status: 'published',
      translations: pending({ title: { value: '', base: 'Old' } }),
    };
    await expect(save(doc, req)).rejects.toMatchObject({
      name: 'Refused',
      status: 400,
      message: 'Title in English: This field is required.',
    });
  });

  it("a collection's own refusal in the other locale is prefixed with the language", async () => {
    const fail = Object.assign(new Error('Excerpt: required'), { name: 'Refused', status: 400 });
    const { req } = fake({ fail });
    const doc = { id: 7, translations: pending({ title: { value: 'New', base: 'Old' } }) };
    await expect(save(doc, req)).rejects.toMatchObject({ message: 'English: Excerpt: required' });
  });

  it('an unexpected failure of the second write surfaces as it is', async () => {
    const fail = new Error('connection lost');
    const { req } = fake({ fail });
    const doc = { id: 7, translations: pending({ title: { value: 'New', base: 'Old' } }) };
    await expect(save(doc, req)).rejects.toBe(fail);
  });

  it('an autosave never applies: the entries ride along in the draft until a real save', async () => {
    for (const autosave of [true, 'true']) {
      const { req, update, findByID } = fake({ query: { autosave, draft: true } });
      const doc = {
        id: 7,
        _status: 'draft',
        translations: pending({ title: { value: 'New', base: 'Old' } }),
      };
      expect(await save(doc, req)).toBe(doc);
      expect(findByID).not.toHaveBeenCalled();
      expect(update).not.toHaveBeenCalled();
    }
    expect(isAutosave({ query: { autosave: 'true' } } as unknown as PayloadRequest)).toBe(true);
    expect(isAutosave({ query: { draft: true } } as unknown as PayloadRequest)).toBe(false);
  });

  it('a draft save applies as a draft; a publish applies as a publish', async () => {
    const draft = fake({ query: { draft: true } });
    await save(
      { id: 7, _status: 'draft', translations: pending({ title: { value: 'New', base: 'Old' } }) },
      draft.req,
    );
    expect(draft.update).toHaveBeenCalledWith(expect.objectContaining({ draft: true }));
    const publish = fake();
    await save(
      {
        id: 7,
        _status: 'published',
        translations: pending({ title: { value: 'New', base: 'Old' } }),
      },
      publish.req,
    );
    expect(publish.update).toHaveBeenCalledWith(expect.objectContaining({ draft: false }));
  });

  it('the second write runs the hook again and the guard returns at once', async () => {
    const { req, update, findByID } = fake({ context: { [SKIP_TRANSLATIONS]: true } });
    const doc = { id: 7, translations: pending({ title: { value: 'New', base: 'Old' } }) };
    expect(await save(doc, req)).toBe(doc);
    expect(findByID).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it('nothing pending, or a document without the field: no read, no write', async () => {
    for (const doc of [
      { id: 7 },
      { id: 7, translations: null },
      { id: 7, translations: { en: {} } },
    ]) {
      const { req, update, findByID } = fake();
      expect(await save(doc, req)).toBe(doc);
      expect(findByID).not.toHaveBeenCalled();
      expect(update).not.toHaveBeenCalled();
    }
  });

  it('entries for the locale being saved are not applied (a session that switched locale)', async () => {
    const { req, update } = fake({ locale: 'en' });
    const doc = { id: 7, translations: { en: { title: { value: 'New', base: 'Old' } } } };
    expect(await save(doc, req)).toBe(doc);
    expect(update).not.toHaveBeenCalled();
  });

  it('saving in English writes the Arabic side', async () => {
    const { req, update } = fake({ locale: 'en', stored: { title: 'قديم' } });
    const doc = { id: 7, translations: { ar: { title: { value: 'جديد', base: 'قديم' } } } };
    await save(doc, req);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ locale: 'ar', data: { title: 'جديد', translations: null } }),
    );
  });

  it('a nested path is written in its group; a path outside the bilingual list is ignored', async () => {
    const { req, update } = fake({
      stored: { title: 'Old', seo: { title: 'Old meta' }, _status: 'draft' },
    });
    const doc = {
      id: 7,
      blocks: [{ id: 'b1', blockType: 'cards', title: 'عنوان' }],
      translations: pending({
        'seo.title': { value: 'New meta', base: 'Old meta' },
        // An index, not a row id: the client never sends one, and it resolves to nothing.
        'blocks.0.title': { value: 'x', base: null },
        _status: { value: 'published', base: 'draft' },
        slug: { value: 'hacked', base: null },
      }),
    };
    await save(doc, req);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { seo: { title: 'New meta' }, translations: null } }),
    );
  });

  it('an entry inside a blocks row sends the whole list in the other locale, rows by id (PR A)', async () => {
    const { req, update } = fake({
      stored: {
        title: 'Old',
        blocks: [
          { id: 'b1', blockType: 'cards', title: 'One' },
          { id: 'b2', blockType: 'cards', title: null },
        ],
      },
    });
    const doc = {
      id: 7,
      _status: 'published',
      blocks: [
        { id: 'b2', blockType: 'cards', title: 'اثنان', blockName: 'second' },
        { id: 'b1', blockType: 'cards', title: 'واحد' },
      ],
      translations: pending({ 'blocks.b2.title': { value: 'Two', base: null } }),
    };
    await save(doc, req);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        locale: 'en',
        data: {
          blocks: [
            // The document's order and shared fields, the English by id, the write on top;
            // the untouched row keeps its stored English, never the Arabic.
            { id: 'b2', blockType: 'cards', blockName: 'second', title: 'Two' },
            { id: 'b1', blockType: 'cards', title: 'One' },
          ],
          translations: null,
        },
      }),
    );
  });

  it('a row entry the document has no row for makes no write at all', async () => {
    const { req, update } = fake({ stored: { blocks: [] } });
    const doc = {
      id: 7,
      blocks: [{ id: 'b1', blockType: 'cards', title: 'واحد' }],
      translations: pending({ 'blocks.made-up.title': { value: 'x', base: null } }),
    };
    expect(await save(doc, req)).toBe(doc);
    expect(update).not.toHaveBeenCalled();
  });

  it('a global goes through updateGlobal, read through findGlobal', async () => {
    const { req, updateGlobal, findGlobal, update } = fake({ stored: { title: 'Old' } });
    const doc = { translations: pending({ title: { value: 'New', base: 'Old' } }) };
    const result = await (applyGlobalTranslations as unknown as Hook)({
      doc,
      previousDoc: doc,
      req,
      global,
      context: req.context,
    });
    expect(findGlobal).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'site-settings', locale: 'en', draft: true }),
    );
    expect(updateGlobal).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: 'site-settings',
        locale: 'en',
        draft: false,
        data: { title: 'New', translations: null },
      }),
    );
    expect(update).not.toHaveBeenCalled();
    expect(result).toEqual({ translations: null });
  });
});

describe('the request is put back after the other locale is written', () => {
  it("locale, fallback locale, context and depth return to the request's own, after a throw too", async () => {
    const req = {
      locale: 'ar',
      fallbackLocale: 'ar',
      context: { own: true },
      query: { depth: 2 },
    } as unknown as PayloadRequest;
    const mutate = () => {
      // What Payload's createLocalReq does to the req it is handed.
      req.locale = 'en';
      req.fallbackLocale = false;
      req.context = { ...req.context, [SKIP_TRANSLATIONS]: true };
      req.query!['depth'] = 0;
    };
    await inOtherLocale(req, async () => mutate());
    expect(req).toMatchObject({ locale: 'ar', fallbackLocale: 'ar', context: { own: true } });
    expect(req.query!['depth']).toBe(2);
    await expect(
      inOtherLocale(req, async () => {
        mutate();
        throw new Error('refused');
      }),
    ).rejects.toThrow('refused');
    expect(req).toMatchObject({ locale: 'ar', fallbackLocale: 'ar', context: { own: true } });
    expect(req.context[SKIP_TRANSLATIONS]).toBeUndefined();
  });
});

describe('the pure pieces', () => {
  it('bilingualPaths: localized light fields through tabs and groups, and inside the rows of arrays and blocks', () => {
    expect(bilingualPaths(fields)).toEqual([
      'title',
      'seo.title',
      'seo.description',
      'blocks.cards.title',
    ]);
    const more: Field[] = [
      { name: 'kind', type: 'select', localized: true, options: ['a', 'b'] },
      { name: 'many', type: 'select', localized: true, hasMany: true, options: ['a'] },
      { name: 'tags', type: 'text', localized: true, hasMany: true },
      { name: 'body', type: 'richText', localized: true },
      { name: 'cover', type: 'upload', relationTo: 'media', localized: true },
      { name: 'hub', type: 'relationship', relationTo: 'categories', localized: true },
      { name: 'hidden', type: 'text', localized: true, admin: { hidden: true } },
      { name: 'widget', type: 'text', localized: true, admin: { components: { Field: 'x#Y' } } },
      { name: 'items', type: 'array', fields: [{ name: 'text', type: 'text', localized: true }] },
      { name: 'box', type: 'group', localized: true, fields: [{ name: 'line', type: 'text' }] },
      {
        type: 'tabs',
        tabs: [
          { name: 'hero', label: 'Hero', fields: [{ name: 'cta', type: 'text', localized: true }] },
        ],
      },
      { type: 'row', fields: [{ name: 'inRow', type: 'textarea', localized: true }] },
    ];
    // Per shape the leaves come first, then the groups, then the lists, each in config order.
    expect(bilingualPaths(more)).toEqual(['kind', 'inRow', 'box.line', 'hero.cta', 'items.text']);
    const shape = shapeOf(more);
    expect(Object.keys(shape.lists)).toEqual(['items']);
    expect(shape.localized).toEqual({
      kind: true,
      many: false,
      tags: false,
      body: false,
      cover: false,
      hub: false,
      hidden: false,
      widget: false,
      inRow: true,
    });
  });

  it('entriesOf keeps well-formed entries of the asked locale only', () => {
    expect(entriesOf(null, 'en')).toEqual({});
    expect(entriesOf({ ar: { title: { value: 'x', base: null } } }, 'en')).toEqual({});
    expect(
      entriesOf(
        { en: { title: { value: 'x', base: null }, bad: { value: 3, base: null }, worse: 'no' } },
        'en',
      ),
    ).toEqual({ title: { value: 'x', base: null } });
  });

  it('plannedWrites and reconcile agree on what still applies; an empty text is written as null', () => {
    const entries = {
      changed: { value: 'New', base: 'Old' },
      unchanged: { value: 'Old', base: 'Old' },
      stale: { value: 'Mine', base: 'Old' },
      applied: { value: 'New', base: 'Old' },
      blanked: { value: '', base: 'Old' },
      fromEmpty: { value: 'First', base: null },
      outside: { value: 'x', base: null },
    };
    const stored: Record<string, unknown> = {
      changed: 'Old',
      unchanged: 'Old',
      stale: 'Theirs',
      applied: 'New',
      blanked: 'Old',
      fromEmpty: undefined,
      outside: null,
    };
    const shape = shapeOf(
      Object.keys(entries)
        .filter((k) => k !== 'outside')
        .map((name): Field => ({ name, type: 'text', localized: true })),
    );
    expect(plannedWrites(entries, shape, {}, stored)).toEqual([
      ['changed', 'New'],
      ['blanked', null],
      ['fromEmpty', 'First'],
    ]);
    // The client keeps the same entries (the allow-list is the hook's), so `outside` stays.
    expect(Object.keys(reconcile(entries, (p) => stored[p]))).toEqual([
      'changed',
      'blanked',
      'fromEmpty',
      'outside',
    ]);
  });

  it('nestPaths builds the write from dotted paths', () => {
    expect(
      nestPaths([
        ['title', 'a'],
        ['seo.title', 'b'],
        ['seo.description', 'c'],
      ]),
    ).toEqual({ title: 'a', seo: { title: 'b', description: 'c' } });
  });

  it('the hidden JSON is bounded: more than 200 entries is refused', () => {
    const entries = Object.fromEntries(
      Array.from({ length: TRANSLATIONS_MAX_ENTRIES + 1 }, (_, i) => [
        `f${i}`,
        { value: 'x', base: null },
      ]),
    );
    expect(translationsProblem({ en: entries })).toMatchObject({
      en: expect.stringContaining('at most 200 entries'),
      ar: expect.stringContaining('200 مدخل'),
    });
    const { [`f${TRANSLATIONS_MAX_ENTRIES}`]: _last, ...atTheCap } = entries;
    void _last;
    expect(translationsProblem({ en: atTheCap })).toBeNull();
    // The count is over every locale key, so a split across two keys is the same count.
    const half = Object.fromEntries(Object.entries(entries).slice(0, 101));
    expect(translationsProblem({ en: half, ar: half })).not.toBeNull();
  });

  it('the hidden JSON is bounded: a serialised size over 64 KB is refused', () => {
    const big = { en: { title: { value: 'x'.repeat(TRANSLATIONS_MAX_BYTES), base: null } } };
    expect(translationsProblem(big)?.en).toContain('64 KB');
    const fits = { en: { title: { value: 'x'.repeat(TRANSLATIONS_MAX_BYTES - 100), base: null } } };
    expect(translationsProblem(fits)).toBeNull();
    // Bytes, not characters: Arabic is two bytes a letter.
    const arabic = { en: { title: { value: 'ن'.repeat(TRANSLATIONS_MAX_BYTES / 2), base: null } } };
    expect(translationsProblem(arabic)).not.toBeNull();
    expect(translationsProblem(null)).toBeNull();
    expect(translationsProblem(undefined)).toBeNull();
  });

  it("the field's validate answers in the panel's language", () => {
    const validate = (translationsField() as { validate?: unknown }).validate as (
      value: unknown,
      options: { req: unknown },
    ) => true | string;
    const big = { en: { title: { value: 'x'.repeat(TRANSLATIONS_MAX_BYTES), base: null } } };
    expect(validate(null, { req: {} })).toBe(true);
    expect(validate({ en: {} }, { req: {} })).toBe(true);
    expect(validate(big, { req: { i18n: { language: 'en' } } })).toMatch(/^Pending translations/);
    expect(validate(big, { req: { i18n: { language: 'ar' } } })).toMatch(/^الترجمات المعلّقة/);
  });

  it('refusalFor: a validation error names each field and the language; anything else passes', () => {
    const validation = Object.assign(new Error('invalid'), {
      name: 'ValidationError',
      data: {
        errors: [
          { label: 'Title', message: 'This field is required.', path: 'title' },
          { label: 'Search > Meta title', message: 'Too long.', path: 'seo.title' },
        ],
      },
    });
    expect(refusalFor(validation, 'English')?.message).toBe(
      'Title in English: This field is required.; Search > Meta title in English: Too long.',
    );
    expect(refusalFor(new Error('boom'), 'English')).toBeNull();
    expect(refusalFor('not an error', 'English')).toBeNull();
  });
});
