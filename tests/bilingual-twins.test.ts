import type { CollectionConfig, Field, GlobalConfig, PayloadRequest } from 'payload';
import { describe, expect, it } from 'vitest';
import { home as homeSeed } from '@/content/seed/home';
import { toHome, toPage } from '@/lib/cms/mappers';
import type { Home as HomeDoc, Media, Page as PageDoc } from '@/payload-types';
import {
  isTwinOf,
  shapeOf,
  TRANSLATIONS,
  twinField,
  twinPaths,
} from '@/modules/cms/fields/bilingual';
import {
  canonical,
  hashOf,
  idOf,
  populateGlobalTwins,
  populateTwins,
  showTwins,
  twinApplies,
  twinValues,
} from '@/modules/cms/fields/twins';

/**
 * The heavy twins (ADR-057, PR B): a localized rich text or upload has a sibling `<name>Twin`
 * that an admin read fills from the document's own other locale (`beforeRead`, before Payload
 * flattens the locales) and a save applies through the hook, its base a hash of the English
 * rich text or the English photo's id.
 */
type Doc = Record<string, unknown>;
type Hook = (args: unknown) => unknown;

const body: Field = { name: 'body', type: 'richText', localized: true };
const cover: Field = { name: 'cover', type: 'upload', relationTo: 'media', localized: true };
const content: Field = { name: 'content', type: 'richText', localized: true };
const richText = (field: Field) => twinField(field as Extract<Field, { type: 'richText' }>);
const upload = (field: Field) => twinField(field as Extract<Field, { type: 'upload' }>);

const fields: Field[] = [
  { name: 'title', type: 'text', localized: true },
  body,
  richText(body),
  { type: 'row', fields: [cover, upload(cover)] },
  {
    name: 'blocks',
    type: 'blocks',
    blocks: [{ slug: 'richText', fields: [content, richText(content)] }],
  },
];
const collection = { slug: 'posts', fields } as unknown as CollectionConfig;
const global = { slug: 'home', fields } as unknown as GlobalConfig;

const localization = {
  defaultLocale: 'ar',
  localeCodes: ['ar', 'en'],
  locales: [
    { code: 'ar', label: 'العربية', rtl: true },
    { code: 'en', label: 'English' },
  ],
};

const req = (opts: { user?: unknown; locale?: string; context?: Doc } = {}) =>
  ({
    user: 'user' in opts ? opts.user : { id: 1, role: 'admin' },
    locale: opts.locale ?? 'ar',
    context: opts.context ?? {},
    payload: { config: { localization } },
  }) as unknown as PayloadRequest;

const ar = { root: { children: [{ type: 'paragraph', text: 'فقرة' }] } };
const en = { root: { children: [{ type: 'paragraph', text: 'A paragraph.' }] } };

/** The document as `beforeRead` sees it: every localized value keyed by locale, the twins null. */
const raw = (): Doc => ({
  id: 7,
  title: { ar: 'عنوان', en: 'Title' },
  body: { ar, en },
  bodyTwin: null,
  cover: { ar: 12, en: 13 },
  coverTwin: null,
  blocks: [
    { id: 'b1', blockType: 'richText', content: { ar, en }, contentTwin: null },
    { id: 'b2', blockType: 'richText', content: { ar }, contentTwin: null },
  ],
  translations: null,
});

const read = (doc: Doc, request: PayloadRequest) =>
  (populateTwins as unknown as Hook)({ doc, req: request, collection, context: request.context });

describe('the twin field', () => {
  it('twinField pairs a localized rich text or upload with a non-localized sibling of the same editor or collection', () => {
    const twin = richText(body) as { name: string; type: string; localized?: boolean };
    expect(twin).toMatchObject({ name: 'bodyTwin', type: 'richText', localized: false });
    expect(isTwinOf(twin as Field, body)).toBe(true);
    expect(isTwinOf(upload(cover), cover)).toBe(true);
    expect(isTwinOf(upload(cover), body)).toBe(false);
    expect(isTwinOf({ name: 'bodyTwin', type: 'richText', localized: true }, body)).toBe(false);
    expect(
      isTwinOf({ name: 'coverTwin', type: 'upload', relationTo: 'users' } as Field, cover),
    ).toBe(false);
    expect(() => twinField({ name: 'plain', type: 'richText' } as never)).toThrow(/localized/);
    // The shape records a heavy field as a twin only when the twin follows it.
    expect(twinPaths(fields)).toEqual(['body', 'cover', 'blocks.richText.content']);
    expect(twinPaths([body, cover, richText(body)])).toEqual([]);
    expect(shapeOf(fields).twins).toEqual({ body: 'richText', cover: 'upload' });
  });

  it('stores null on a Save or Publish and keeps the value on an autosave; read by signed-in staff only', () => {
    const twin = richText(body) as {
      hooks: { beforeChange: Array<(args: { req: unknown; value?: unknown }) => unknown> };
      access: { read: (args: { req: unknown }) => boolean };
      admin: { className: string; description: { ar: string; en: string } };
    };
    const beforeChange = twin.hooks.beforeChange[0]!;
    expect(beforeChange({ req: { query: {} }, value: en })).toBeNull();
    expect(beforeChange({ req: { query: { autosave: true } }, value: en })).toEqual(en);
    expect(beforeChange({ req: { query: { autosave: 'true' } }, value: en })).toEqual(en);
    expect(twin.access.read({ req: { user: { id: 1 } } })).toBe(true);
    expect(twin.access.read({ req: { user: null } })).toBe(false);
    expect(twin.admin.className).toBe('admin-twin');
    expect(twin.admin.description.ar.split(' ').length).toBeGreaterThanOrEqual(4);
    expect(twin.admin.description.en.split(' ').length).toBeGreaterThanOrEqual(4);
  });
});

describe('the base: a canonical hash for rich text, the id for an upload', () => {
  it('canonical JSON is stable across key order and changes with content', () => {
    const a = { root: { type: 'root', children: [{ text: 'x', type: 'text' }] } };
    const b = { root: { children: [{ type: 'text', text: 'x' }], type: 'root' } };
    expect(canonical(a)).toBe(canonical(b));
    expect(hashOf(a)).toBe(hashOf(b));
    expect(hashOf(a)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashOf({ root: { type: 'root', children: [{ text: 'y', type: 'text' }] } })).not.toBe(
      hashOf(a),
    );
    // An undefined property is no property; a null one is content.
    expect(hashOf({ a: 1, b: undefined })).toBe(hashOf({ a: 1 }));
    expect(hashOf({ a: 1, b: null })).not.toBe(hashOf({ a: 1 }));
    expect(hashOf(null)).toBeNull();
    expect(hashOf(undefined)).toBeNull();
  });

  it('an upload base is its id as text, from a raw id or a populated document', () => {
    expect(idOf(13)).toBe('13');
    expect(idOf('13')).toBe('13');
    expect(idOf({ id: 13, url: '/x.jpg' })).toBe('13');
    expect(idOf(null)).toBeNull();
    expect(idOf('')).toBeNull();
    expect(idOf({ url: '/x.jpg' })).toBeNull();
  });

  it('twinApplies: differs and the base still stands; equal, stale or a base from nothing decide as the light fields do', () => {
    const base = hashOf(en);
    const changed = { root: { children: [{ type: 'paragraph', text: 'Changed.' }] } };
    expect(twinApplies('richText', changed, base, en)).toBe(true);
    expect(twinApplies('richText', en, base, en)).toBe(false);
    expect(twinApplies('richText', changed, base, changed)).toBe(false);
    expect(twinApplies('richText', changed, base, { root: 'theirs' })).toBe(false);
    // No English yet: the first text applies, and nothing applies over nothing.
    expect(twinApplies('richText', changed, null, null)).toBe(true);
    expect(twinApplies('richText', null, null, undefined)).toBe(false);
    // A rich text cleared over an existing English applies (and lets Payload's required refuse).
    expect(twinApplies('richText', null, base, en)).toBe(true);
    expect(twinApplies('upload', 31, '13', 13)).toBe(true);
    expect(twinApplies('upload', 13, '13', 13)).toBe(false);
    expect(twinApplies('upload', 31, '13', 14)).toBe(false);
    expect(twinApplies('upload', null, '13', 13)).toBe(true);
    expect(twinApplies('upload', null, null, null)).toBe(false);
  });
});

describe('populateTwins (beforeRead): an admin read fills the twins from the document itself', () => {
  it('fills a null twin with the other locale and writes its base into the JSON, rows by id', () => {
    const doc = read(raw(), req()) as Doc;
    expect(doc['bodyTwin']).toEqual(en);
    expect(doc['coverTwin']).toBe(13);
    const blocks = doc['blocks'] as Doc[];
    expect(blocks[0]!['contentTwin']).toEqual(en);
    expect(blocks[1]!['contentTwin']).toBeNull();
    expect(doc[TRANSLATIONS]).toEqual({
      en: {
        body: { base: hashOf(en) },
        cover: { base: '13' },
        'blocks.b1.content': { base: hashOf(en) },
        'blocks.b2.content': { base: null },
      },
    });
    // The twin is a copy: the flattening that follows must not reach it through the original.
    expect(doc['bodyTwin']).not.toBe((doc['body'] as Doc)['en']);
    // The localized originals are untouched (Payload flattens them after this hook).
    expect(doc['body']).toEqual({ ar, en });
  });

  it('keeps a twin that holds a value (the pending English of an autosaved draft) and its base', () => {
    const pendingEn = { root: { children: [{ type: 'paragraph', text: 'Pending.' }] } };
    const doc = raw();
    doc['bodyTwin'] = pendingEn;
    doc[TRANSLATIONS] = { en: { body: { base: 'kept' }, title: { value: 'Typed', base: null } } };
    const out = read(doc, req()) as Doc;
    expect(out['bodyTwin']).toEqual(pendingEn);
    expect(out[TRANSLATIONS]).toMatchObject({
      en: { body: { base: 'kept' }, title: { value: 'Typed', base: null }, cover: { base: '13' } },
    });
  });

  it('runs for a signed-in user reading the default locale only, never under the re-entry flag', () => {
    for (const request of [
      req({ user: null }),
      req({ user: undefined }),
      req({ locale: 'en' }),
      req({ locale: 'all' }),
      req({ context: { skipTranslations: true } }),
    ]) {
      const doc = read(raw(), request) as Doc;
      expect(doc['bodyTwin']).toBeNull();
      expect(doc['coverTwin']).toBeNull();
      expect(doc[TRANSLATIONS]).toBeNull();
    }
  });

  it('a config without a twin is left alone; a global reads through its own hook', () => {
    const plain = { slug: 'tags', fields: [{ name: 'title', type: 'text', localized: true }] };
    const doc = { title: { ar: 'x', en: 'y' }, translations: null };
    const out = (populateTwins as unknown as Hook)({ doc, req: req(), collection: plain }) as Doc;
    expect(out).toBe(doc);
    expect(out[TRANSLATIONS]).toBeNull();
    const home = (populateGlobalTwins as unknown as Hook)({
      doc: raw(),
      req: req(),
      global,
    }) as Doc;
    expect(home['coverTwin']).toBe(13);
  });
});

describe('twinValues and showTwins: what a write carries and what the response shows', () => {
  const shape = shapeOf(fields);
  const doc = {
    body: ar,
    bodyTwin: null,
    cover: 12,
    coverTwin: null,
    blocks: [
      { id: 'b1', blockType: 'richText', content: ar, contentTwin: null },
      { id: 'b2', blockType: 'richText', content: ar, contentTwin: null },
    ],
  };

  it('reads each twin the request sent, by row id; an upload as its id; a twin not sent is left out', () => {
    const data = {
      bodyTwin: en,
      coverTwin: { id: 31, url: '/x.jpg' },
      blocks: [{ id: 'b2', contentTwin: en }, { id: 'b1' }],
    };
    expect(twinValues(shape, data, doc)).toEqual([
      { key: 'body', twinKey: 'bodyTwin', kind: 'richText', value: en },
      { key: 'cover', twinKey: 'coverTwin', kind: 'upload', value: 31 },
      { key: 'blocks.b2.content', twinKey: 'blocks.b2.contentTwin', kind: 'richText', value: en },
    ]);
    expect(twinValues(shape, {}, doc)).toEqual([]);
    expect(twinValues(shape, { coverTwin: null }, doc)).toEqual([
      { key: 'cover', twinKey: 'coverTwin', kind: 'upload', value: null },
    ]);
  });

  it('shows an applied twin as written and the others as stored, each with a fresh base', () => {
    const out = structuredClone(doc) as Doc;
    const values = twinValues(shape, { bodyTwin: en, coverTwin: 31 }, out);
    const stored = { body: { root: 'theirs' }, cover: 13 };
    const bases = showTwins(out, values, new Set(['body']), stored);
    expect(out['bodyTwin']).toEqual(en);
    expect(out['coverTwin']).toBe(13);
    expect(bases).toEqual({ body: { base: hashOf(en) }, cover: { base: '13' } });
  });
});

/** A populated media document, as the site reads it at depth 1. */
const photo = (id: number): Media => ({
  id,
  alt: 'صورة',
  url: `/api/payload/media/file/${id}.jpg`,
  updatedAt: '',
  createdAt: '',
});

describe("the site's mappers never read a twin", () => {
  it('a page maps the same with a rich-text block twin filled or null; the contract has no twin', () => {
    const paragraph = {
      root: { type: 'root', children: [{ type: 'paragraph', children: [] }], version: 1 },
    };
    const page = (contentTwin: unknown) =>
      ({
        id: 8,
        slug: 'about-e2e',
        title: 'عنوان',
        blocks: [
          { id: 'b1', blockType: 'richText', title: 'مقدمة', content: paragraph, contentTwin },
        ],
        seo: { title: 'عنوان', description: 'وصف' },
        updatedAt: '2026-09-18T00:00:00.000Z',
        createdAt: '2026-09-18T00:00:00.000Z',
        _status: 'published',
      }) as unknown as PageDoc;
    const filled = toPage(page(en));
    expect(filled).toEqual(toPage(page(null)));
    expect(JSON.stringify(filled)).not.toContain('Twin');
  });

  it('the home page maps the same with the slide photo twins filled or null', () => {
    const slide = (twins: boolean) => ({
      id: 's1',
      headline: 'عنوان',
      subline: 'سطر',
      imageDesktop: photo(1),
      imageMobile: photo(2),
      imageDesktopTwin: twins ? photo(3) : null,
      imageMobileTwin: twins ? 4 : null,
    });
    const doc = (twins: boolean) =>
      ({
        ...homeSeed,
        id: 1,
        hero: {
          ...homeSeed.hero,
          slides: Array.from({ length: 4 }, () => slide(twins)),
          chips: [],
        },
        productStrip: {
          ...homeSeed.productStrip,
          products: homeSeed.productStrip.order.map((slug, i) => ({ id: i + 1, slug })),
        },
        steps: {
          ...homeSeed.steps,
          items: homeSeed.steps.items.map((s, i) => ({ ...s, icon: photo(10 + i) })),
        },
        _status: 'published',
      }) as unknown as HomeDoc;
    const filled = toHome(doc(true));
    expect(filled).toEqual(toHome(doc(false)));
    expect(filled.hero.slides[0]?.imageDesktop).toBe('/api/payload/media/file/1.jpg');
    expect(JSON.stringify(filled)).not.toContain('Twin');
  });
});
