import { describe, expect, it } from 'vitest';
import type { LexicalState } from '@/lib/lexical';
import { crawl } from '@/modules/visibility/rules/crawl';
import { emitted, extractability } from '@/modules/visibility/rules/extractability';
import { identity } from '@/modules/visibility/rules/identity';
import {
  CHECKLIST_ITEMS,
  corroboration,
  isBrandQuery,
  isCategoryQuery,
  measurement,
  signals,
} from '@/modules/visibility/rules/rest';
import { isQuestion, openingWords, prorata } from '@/modules/visibility/rules/shared';
import { ITEMS, SECTIONS, THRESHOLDS } from '@/modules/visibility/rules/weights';
import { findings, scoreOf } from '@/modules/visibility/score';
import type { Snapshot } from '@/modules/visibility/types';

const paragraph = (text: string) => ({
  type: 'paragraph',
  children: [{ type: 'text', text }],
});
const h2 = (text: string) => ({ type: 'heading', tag: 'h2', children: [{ type: 'text', text }] });
const body = (...children: unknown[]): LexicalState =>
  ({ root: { type: 'root', children } }) as unknown as LexicalState;
const words = (n: number) => Array.from({ length: n }, (_, i) => `كلمة${i}`).join(' ');

/** A filled production site: everything an admin controls is right, nothing outside is connected. */
function filled(overrides: Partial<Snapshot> = {}): Snapshot {
  return {
    at: '2026-09-16T09:00:00.000Z',
    adminRoute: '/admin',
    isProductionSite: true,
    englishOn: true,
    indexNow: true,
    gaConfigured: true,
    site: {
      tagline: { ar: 'اطبع براندك بلا مخزون', en: 'Print your brand with no stock' },
      social: {
        x: 'https://x.com/b7rprint',
        instagram: 'https://instagram.com/b7rprint',
        tiktok: 'https://tiktok.com/@b7rprint',
      },
    },
    titleTemplate: { ar: '%s | بحر برنت', en: '%s | B7R Print' },
    routes: [
      {
        route: '/',
        title: { ar: 'بحر برنت: طباعة عند الطلب', en: 'B7R Print: print on demand' },
        description: {
          ar: 'وصف الرئيسية بطول مناسب لمحركات البحث في السعودية.',
          en: 'A home description of a fitting length for search engines in Saudi Arabia.',
        },
      },
    ],
    pages: [
      {
        id: 1,
        slug: 'about',
        title: { ar: 'من نحن', en: 'About' },
        seo: {
          title: { ar: 'من نحن', en: 'About B7R' },
          description: {
            ar: 'قصة بحر برنت وفريقها ومن أين تشحن.',
            en: 'The story of B7R Print, its team and where it ships from.',
          },
        },
      },
    ],
    products: [
      {
        id: 2,
        slug: 'hoodie',
        title: { ar: 'هودي', en: 'Hoodie' },
        shortDescription: {
          ar: 'هودي قطني ثقيل بطباعة واضحة.',
          en: 'A heavy cotton hoodie with a crisp print.',
        },
        baseCost: 89,
        sortOrder: 1,
      },
    ],
    posts: [
      {
        id: 3,
        slug: 'start-a-brand',
        title: { ar: 'كيف تبدأ براند ملابس', en: 'How to start a clothing brand' },
        excerpt: { ar: 'مقدمة المقال', en: 'The post intro' },
        seo: {
          title: { ar: 'كيف تبدأ براند ملابس بلا مخزون', en: 'Start a clothing brand with no stock' },
          description: {
            ar: 'خطوات البدء بدون مصنع ولا مخزون، بالأرقام.',
            en: 'The steps to start with no factory and no stock, in numbers.',
          },
        },
        body: {
          ar: body(paragraph(words(50)), h2('كيف أبدأ؟'), paragraph('نص')),
          en: body(
            paragraph(Array.from({ length: 45 }, () => 'word').join(' ')),
            h2('What does it cost?'),
          ),
        },
        author: 4,
      },
    ],
    hubs: [
      {
        id: 5,
        slug: 'getting-started',
        title: { ar: 'البداية', en: 'Getting started' },
        lead: { ar: 'أول خطوة نحو براندك.', en: 'The first step towards your brand.' },
      },
    ],
    authors: [
      {
        id: 4,
        name: { ar: 'ضياء', en: 'Dhia' },
        bio: { ar: 'مؤسس بحر برنت', en: 'Founder' },
        photo: 7,
        sameAs: 1,
      },
    ],
    faqs: Array.from({ length: 6 }, (_, i) => ({
      id: 10 + i,
      question: { ar: `سؤال ${i}؟`, en: `Question ${i}?` },
    })),
    media: [{ id: 7, filename: 'dhia.jpg', alt: { ar: 'ضياء', en: 'Dhia' }, usedBy: ['ضياء'] }],
    checklist: Object.fromEntries(CHECKLIST_ITEMS.map((i) => [i.key, true])),
    connections: [],
    landings30d: 12,
    prompts: [
      ...Array.from({ length: 5 }, () => ({
        language: 'ar' as const,
        enabled: true,
        namesBrand: false,
      })),
      ...Array.from({ length: 5 }, () => ({
        language: 'en' as const,
        enabled: true,
        namesBrand: false,
      })),
    ],
    lastLedgerRunAt: null,
    citedRate: null,
    pagespeed: [],
    searchConsole: null,
    ...overrides,
  };
}

/** Documents for a pro-rata rule, one per flag. */
const checks = (oks: boolean[]) => oks.map((ok, i) => ({ ok, label: `d${i}`, href: `/x/${i}` }));

const by = (list: ReturnType<typeof findings>, key: string) => {
  const f = list.find((x) => x.key === key);
  if (!f) throw new Error(`no finding ${key}`);
  return f;
};

describe('the visibility score: the table (ADR-049)', () => {
  it('sums to 100, one item per key, and the site-only set is what the ADR says', () => {
    expect(SECTIONS.reduce((n, s) => n + s.weight, 0)).toBe(100);
    for (const section of SECTIONS) {
      const own = ITEMS.filter((i) => i.section === section.key).reduce((n, i) => n + i.weight, 0);
      expect(own, section.key).toBe(section.weight);
    }
    expect(new Set(ITEMS.map((i) => i.key)).size).toBe(ITEMS.length);
    expect(ITEMS.filter((i) => !i.siteOnly).map((i) => i.key)).toEqual([
      'C3',
      'C4',
      'M3',
      'P1',
      'P2',
      'P3',
      'P4',
    ]);
    expect(ITEMS.filter((i) => i.siteOnly).reduce((n, i) => n + i.weight, 0)).toBe(74);
  });

  it('answers every item of the table, in its order, and nothing else', () => {
    expect(findings(filled()).map((f) => f.key)).toEqual(ITEMS.map((i) => i.key));
  });

  it('scores a filled site with no service at the floor, and the site-only number at what is controllable', () => {
    const score = scoreOf(filled());
    // Everything controllable is right except E6 and E7 (project 4): 74 minus 7.
    expect(score.siteOnly).toBe(Math.round((67 / 74) * 100));
    expect(score.overall).toBe(67);
    expect(score.sections.map((s) => [s.key, s.percent])).toEqual([
      ['identity', 100],
      ['crawl', 65],
      ['extractability', 77],
      ['corroboration', 100],
      ['measurement', 60],
      ['signals', 0],
    ]);
  });
});

describe('the visibility score: the rules (ADR-049)', () => {
  it('is pro-rata over documents, next while partial, done with nothing to judge', () => {
    const partial = prorata({
      key: 'C5',
      section: 'crawl',
      checks: checks([true, true, false, false, true]),
      title: 't',
      guide: 'g',
    });
    expect(partial.status).toBe('next');
    expect(partial.earned).toBe(3);
    expect(partial.items?.map((i) => i.label)).toEqual(['d2', 'd3']);
    expect(partial.count).toEqual({ done: 3, total: 5 });
    expect(
      prorata({ key: 'C5', section: 'crawl', checks: [], title: 't', guide: 'g' }),
    ).toMatchObject({ status: 'done', earned: 5 });
    expect(
      prorata({ key: 'C5', section: 'crawl', checks: checks([false]), title: 't', guide: 'g' }),
    ).toMatchObject({ status: 'missing', earned: 0 });
    const many = prorata({
      key: 'E2',
      section: 'extractability',
      checks: checks(Array.from({ length: 14 }, () => false)),
      title: 't',
      guide: 'g',
    });
    expect(many.items).toHaveLength(10);
  });

  it('identity: the English tagline, https profiles, the About page in English, the authors', () => {
    const ok = identity(filled());
    expect(ok.every((f) => f.status === 'done')).toBe(true);
    const bare = identity(
      filled({
        site: {
          tagline: { ar: 'x' },
          social: { x: 'b7rprint', instagram: 'https://instagram.com/b', tiktok: '' },
        },
        pages: [],
        authors: [{ id: 4, name: { ar: 'ضياء' }, bio: {}, photo: null, sameAs: 0 }],
      }),
    );
    expect(by(bare, 'I1').status).toBe('missing');
    expect(by(bare, 'I2')).toMatchObject({ status: 'next', count: { done: 1, total: 3 } });
    expect(by(bare, 'I2').items?.map((i) => i.label)).toEqual(['X', 'TikTok']);
    expect(by(bare, 'I3').status).toBe('missing');
    expect(by(bare, 'I4')).toMatchObject({
      status: 'missing',
      items: [{ label: 'ضياء', href: '/admin/collections/authors/4' }],
    });
    // An author with no published post is not judged.
    const unused = identity(
      filled({
        authors: [
          { id: 9, name: { ar: 'x' }, bio: {}, photo: null, sameAs: 0 },
          ...filled().authors,
        ],
      }),
    );
    expect(by(unused, 'I4').count).toEqual({ done: 1, total: 1 });
  });

  it('crawl: the production flag, IndexNow, the two verifications, the English versions', () => {
    const ok = crawl(
      filled({
        connections: [
          { id: 1, kind: 'google-search-console', enabled: true, lastTestOk: true },
          { id: 2, kind: 'bing-webmaster', enabled: true, lastTestOk: null },
        ],
      }),
    );
    expect(by(ok, 'C1').status).toBe('done');
    expect(by(ok, 'C3').status).toBe('done');
    expect(by(ok, 'C4').status).toBe('next');
    expect(by(ok, 'C5').status).toBe('done');
    const review = crawl(
      filled({
        isProductionSite: false,
        indexNow: false,
        posts: [{ ...filled().posts[0]!, title: { ar: 'عنوان' } }],
      }),
    );
    expect(by(review, 'C1')).toMatchObject({ status: 'missing', earned: 0 });
    expect(by(review, 'C1').guide).toMatch(/noindex/);
    expect(by(review, 'C2').status).toBe('missing');
    expect(by(review, 'C3').status).toBe('missing');
    expect(by(review, 'C5')).toMatchObject({ status: 'next', count: { done: 3, total: 4 } });
    expect(by(review, 'C5').items?.[0]?.href).toBe('/admin/collections/posts/3?locale=en');
    // Not in English: nothing to judge.
    expect(by(crawl(filled({ englishOn: false })), 'C5')).toMatchObject({
      status: 'done',
      count: { done: 0, total: 0 },
    });
  });

  it('extractability: the emitted titles, the alts, the openings, the questions, the FAQ, the project-4 items', () => {
    const s = filled();
    const titles = emitted(s);
    expect(titles.find((t) => t.label === '/ (ar)')?.title).toBe('بحر برنت: طباعة عند الطلب');
    expect(titles.find((t) => t.label === 'هودي (product, ar)')?.title).toBe(
      'هودي للطباعة عند الطلب | بحر برنت',
    );
    expect(titles.find((t) => t.label === 'Hoodie (product, en)')?.description).toContain('89');
    expect(
      titles.find((t) => t.label.startsWith('كيف تبدأ') && t.label.endsWith('(post, ar)'))?.title,
    ).toBe('كيف تبدأ براند ملابس بلا مخزون | بحر برنت');
    const ok = extractability(s);
    expect(by(ok, 'E1').status).toBe('done');
    expect(by(ok, 'E2').status).toBe('done');
    expect(by(ok, 'E3').status).toBe('done');
    expect(by(ok, 'E4').status).toBe('done');
    expect(by(ok, 'E5').status).toBe('done');
    expect(by(ok, 'E6').status).toBe('missing');
    expect(by(ok, 'E7').status).toBe('missing');
    const bad = extractability(
      filled({
        routes: [{ route: '/', title: { ar: 'ع'.repeat(80) }, description: { ar: '' } }],
        media: [
          {
            id: 7,
            filename: 'dhia.jpg',
            alt: { ar: 'ضياء' },
            usedBy: ['ضياء', 'home hero', 'هودي'],
          },
        ],
        posts: [
          {
            ...s.posts[0]!,
            body: { ar: body(paragraph(words(20)), h2('مقدمة')), en: body(paragraph('short')) },
          },
        ],
        faqs: [{ id: 1, question: { ar: 'س؟' } }],
        pages: [
          {
            id: 8,
            slug: 'compare-printful',
            title: { ar: 'مقارنة' },
            seo: { title: { ar: 'مقارنة' }, description: { ar: 'مقارنة بين بحر برنت وبرينتفل.' } },
          },
        ],
      }),
    );
    expect(by(bad, 'E1').items?.[0]).toEqual({
      label: '/ (ar)',
      href: '/admin/globals/seo-defaults',
    });
    expect(by(bad, 'E2')).toMatchObject({
      status: 'missing',
      items: [
        { label: 'dhia.jpg (ضياء, home hero…)', href: '/admin/collections/media/7?locale=en' },
      ],
    });
    expect(by(bad, 'E3')).toMatchObject({ status: 'missing', count: { done: 0, total: 2 } });
    expect(by(bad, 'E4').status).toBe('missing');
    expect(by(bad, 'E5')).toMatchObject({ status: 'missing', count: { done: 0, total: 2 } });
    expect(by(bad, 'E7').status).toBe('done');
  });

  it('reads an opening and a question heading the way the rule says', () => {
    expect(openingWords(body(paragraph(words(42)), paragraph('x')))).toBe(42);
    expect(openingWords(body(h2('عنوان'), paragraph(words(3))))).toBe(3);
    expect(openingWords(null)).toBe(0);
    expect(isQuestion('كيف أبدأ براند ملابس؟', 'ar')).toBe(true);
    expect(isQuestion('هل الشحن مجاني', 'ar')).toBe(true);
    expect(isQuestion('وكيف تحسب السعر', 'ar')).toBe(true);
    expect(isQuestion('الخطوة الأولى', 'ar')).toBe(false);
    expect(isQuestion('What does it cost', 'en')).toBe(true);
    expect(isQuestion('Pricing', 'en')).toBe(false);
    expect(isQuestion('Pricing?', 'en')).toBe(true);
  });

  it('corroboration and measurement: the checklist, the landings, the prompts, the ledger', () => {
    const s = filled();
    expect(by(corroboration(s), 'R1').status).toBe('done');
    const two = corroboration(filled({ checklist: { linkedinCompany: true, youtube: true } }));
    expect(by(two, 'R1')).toMatchObject({
      status: 'next',
      earned: 4,
      count: { done: 2, total: 5 },
    });
    const m = measurement(
      filled({ landings30d: 0, prompts: [], lastLedgerRunAt: '2026-09-15T00:00:00.000Z' }),
    );
    expect(by(m, 'M1').status).toBe('missing');
    expect(by(m, 'M2')).toMatchObject({ status: 'missing', count: { done: 0, total: 2 } });
    expect(by(measurement(filled()), 'M3').status).toBe('missing');
    expect(by(m, 'M3').status).toBe('done');
    expect(
      by(measurement(filled({ lastLedgerRunAt: '2026-01-01T00:00:00.000Z' })), 'M3').status,
    ).toBe('next');
  });

  it('signals: PageSpeed by the median of three, impressions, a category query, the cited-rate', () => {
    const none = signals(filled());
    expect(none.every((f) => f.status === 'missing')).toBe(true);
    expect(by(none, 'P1').guide).toMatch(/Connect PageSpeed/);
    const good = signals(
      filled({
        pagespeed: [
          { date: '2026-09-14', mobilePerformance: [95, 91, 60, 93, 92] },
          { date: '2026-09-15', mobilePerformance: [94, 92, 91, 93, 92] },
          { date: '2026-09-16', mobilePerformance: [96, 90, 92, 93, 92] },
        ],
        searchConsole: { impressions: 120, topQueries: ['بحر برنت', 'طباعة على الطلب السعودية'] },
        citedRate: { runs: 40, cited: 21 },
      }),
    );
    // The third URL's one bad night is outvoted by its median (91).
    expect(by(good, 'P1').status).toBe('done');
    expect(by(good, 'P2').status).toBe('done');
    expect(by(good, 'P3').status).toBe('done');
    expect(by(good, 'P4').status).toBe('done');
    const weak = signals(
      filled({
        pagespeed: [{ date: '2026-09-16', mobilePerformance: [85, 90, 90, 90, 90] }],
        searchConsole: { impressions: 3, topQueries: ['بحر برنت', 'b7r print'] },
        citedRate: { runs: 20, cited: 3 },
      }),
    );
    expect(by(weak, 'P1').status).toBe('next');
    expect(by(weak, 'P3').status).toBe('next');
    expect(by(weak, 'P4').status).toBe('next');
    expect(by(signals(filled({ citedRate: { runs: 10, cited: 0 } })), 'P4').status).toBe('missing');
    expect(THRESHOLDS.cited.next).toBe(0.1);
  });

  it('tells a brand query from a category query after folding', () => {
    expect(isBrandQuery('بَحر برِنت')).toBe(true);
    expect(isBrandQuery('B7R print')).toBe(true);
    expect(isBrandQuery('طباعة على الطلب')).toBe(false);
    expect(isCategoryQuery('أفضل طباعة على الطلب في السعودية')).toBe(true);
    expect(isCategoryQuery('Print On Demand Saudi')).toBe(true);
    expect(isCategoryQuery('بحر')).toBe(false);
  });
});
