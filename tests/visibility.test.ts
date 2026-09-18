import { describe, expect, it } from 'vitest';
import { crawl } from '@/modules/visibility/rules/crawl';
import { emitted, extractability } from '@/modules/visibility/rules/extractability';
import { identity } from '@/modules/visibility/rules/identity';
import {
  corroboration,
  isBrandQuery,
  isCategoryQuery,
  measurement,
  signals,
} from '@/modules/visibility/rules/rest';
import {
  isQuestion,
  openingWords,
  prorata,
  same,
  words as wordCount,
} from '@/modules/visibility/rules/shared';
import { blogPostBody, blogPosts } from '@/content/seed/blog';
import { blogPostBodyEn } from '@/content/seed/en/blog';
import { ITEMS, SECTIONS, THRESHOLDS } from '@/modules/visibility/rules/weights';
import { findings, pickScore, scoreOf } from '@/modules/visibility/score';
import type { Snapshot } from '@/modules/visibility/types';
import { body, filled, h2, paragraph, words } from './helpers/visibility-snapshot';

/** Documents for a pro-rata rule, one per flag. */
const checks = (oks: boolean[]) =>
  oks.map((ok, i) => ({ ok, label: same(`d${i}`), href: `/x/${i}` }));
const t = same('t');
const g = same('g');

/** The extractability rules over a site whose only pages are the GEO ones (E6, E7). */
const geo = (pages: Snapshot['pages'], at = '2026-09-16T10:00:00.000Z') =>
  extractability(filled({ pages, at }));

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

  it('picks one language for a page (ADR-056): the sentences and the listed documents, the numbers untouched', () => {
    const score = scoreOf(filled({ posts: [{ ...filled().posts[0]!, title: { ar: 'عنوان' } }] }));
    const ar = pickScore(score, 'ar');
    const en = pickScore(score, 'en');
    expect([ar.overall, ar.siteOnly]).toEqual([score.overall, score.siteOnly]);
    expect(ar.findings.map((f) => f.key)).toEqual(score.findings.map((f) => f.key));
    expect(ar.sections.map((s) => [s.key, s.percent])).toEqual(
      score.sections.map((s) => [s.key, s.percent]),
    );
    for (const f of ar.findings) {
      expect(f.title, f.key).toMatch(/[؀-ۿ]/);
      expect(f.guide, f.key).toMatch(/[؀-ۿ]/);
    }
    expect(en.findings.map((f) => f.title)).toEqual(score.findings.map((f) => f.title.en));
    const c5 = ar.findings.find((f) => f.key === 'C5');
    expect(c5?.items?.[0]).toEqual({
      label: 'عنوان (مقال)',
      href: '/admin/collections/posts/3?locale=en',
    });
    expect(en.sections[0]?.facts.map((f) => f.text)).toEqual(
      score.sections[0]?.facts.map((f) => f.text.en),
    );
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
      title: t,
      guide: g,
    });
    expect(partial.status).toBe('next');
    expect(partial.earned).toBe(3);
    expect(partial.items?.map((i) => i.label.en)).toEqual(['d2', 'd3']);
    expect(partial.count).toEqual({ done: 3, total: 5 });
    expect(prorata({ key: 'C5', section: 'crawl', checks: [], title: t, guide: g })).toMatchObject({
      status: 'done',
      earned: 5,
    });
    expect(
      prorata({ key: 'C5', section: 'crawl', checks: checks([false]), title: t, guide: g }),
    ).toMatchObject({ status: 'missing', earned: 0 });
    const many = prorata({
      key: 'E2',
      section: 'extractability',
      checks: checks(Array.from({ length: 14 }, () => false)),
      title: t,
      guide: g,
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
    expect(by(bare, 'I2').items?.map((i) => i.label.en)).toEqual(['X', 'TikTok']);
    expect(by(bare, 'I3').status).toBe('missing');
    expect(by(bare, 'I4')).toMatchObject({
      status: 'missing',
      items: [{ label: { en: 'ضياء', ar: 'ضياء' }, href: '/admin/collections/authors/4' }],
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
    expect(by(review, 'C1').guide.en).toMatch(/noindex/);
    expect(by(review, 'C1').guide.ar).toMatch(/noindex/);
    expect(by(review, 'C2').status).toBe('missing');
    expect(by(review, 'C3').status).toBe('missing');
    // Four documents and one author, the post without English: 4 of 5.
    expect(by(review, 'C5')).toMatchObject({ status: 'next', count: { done: 4, total: 5 } });
    expect(by(review, 'C5').items?.[0]).toEqual({
      label: { en: 'عنوان (post)', ar: 'عنوان (مقال)' },
      href: '/admin/collections/posts/3?locale=en',
    });
    // Not in English: nothing to judge.
    expect(by(crawl(filled({ englishOn: false })), 'C5')).toMatchObject({
      status: 'done',
      count: { done: 0, total: 0 },
    });
  });

  it('extractability: the emitted titles, the alts, the openings, the questions, the FAQ, the project-4 items', () => {
    const s = filled();
    const titles = emitted(s);
    const labelled = (en: string) => titles.find((e) => e.label.en === en);
    expect(labelled('/ (Arabic)')?.title).toBe('بحر برنت: طباعة عند الطلب');
    expect(labelled('هودي (product, Arabic)')?.title).toBe('هودي للطباعة عند الطلب | بحر برنت');
    expect(labelled('هودي (product, Arabic)')?.label.ar).toBe('هودي (منتج، بالعربية)');
    expect(labelled('Hoodie (product, English)')?.description).toContain('89');
    expect(
      titles.find((e) => e.label.en.startsWith('كيف تبدأ') && e.label.en.endsWith('(post, Arabic)'))
        ?.title,
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
            blocks: [{ type: 'compare', asOf: '2026-09-16' }],
            seo: { title: { ar: 'مقارنة' }, description: { ar: 'مقارنة بين بحر برنت وبرينتفل.' } },
          },
        ],
      }),
    );
    expect(by(bad, 'E1').items?.[0]).toEqual({
      label: { en: '/ (Arabic)', ar: '/ (بالعربية)' },
      href: '/admin/globals/seo-defaults',
    });
    expect(by(bad, 'E2')).toMatchObject({
      status: 'missing',
      items: [
        {
          label: { en: 'dhia.jpg (ضياء, home hero…)', ar: 'dhia.jpg (ضياء، home hero…)' },
          href: '/admin/collections/media/7?locale=en',
        },
      ],
    });
    expect(by(bad, 'E3')).toMatchObject({ status: 'missing', count: { done: 0, total: 2 } });
    expect(by(bad, 'E4').status).toBe('missing');
    expect(by(bad, 'E5')).toMatchObject({ status: 'missing', count: { done: 0, total: 2 } });
    expect(by(bad, 'E7').status).toBe('done');
    // E6 reads the FAQ page's section; E7 the compare page's as-of date (ADR-050).
    const faqPage = {
      id: 9,
      slug: 'faq',
      title: { ar: 'الأسئلة الشائعة' },
      blocks: [{ type: 'faqList', asOf: null }],
      seo: { title: { ar: 'الأسئلة' }, description: { ar: 'كل ما تحتاج معرفته قبل أن تبدأ.' } },
    };
    expect(by(geo([faqPage]), 'E6')).toMatchObject({
      status: 'done',
      href: '/admin/collections/pages/9',
    });
    expect(by(geo([{ ...faqPage, blocks: [] }]), 'E6')).toMatchObject({
      status: 'missing',
      guide: { en: expect.stringMatching(/no FAQ section/) },
    });
    expect(by(geo([]), 'E6').guide.en).toMatch(/not published/);
    expect(by(geo([]), 'E6').guide.ar).toMatch(/غير منشورة/);
    const compare = s.pages[0]!;
    const comparePage = {
      ...compare,
      id: 8,
      slug: 'compare-printful',
      blocks: [{ type: 'compare', asOf: '2026-03-01' }],
    };
    expect(by(geo([comparePage]), 'E7')).toMatchObject({
      status: 'next',
      guide: { en: expect.stringMatching(/older than 180 days/) },
      href: '/admin/collections/pages/8',
    });
    expect(by(geo([comparePage], '2026-08-27T00:00:00.000Z'), 'E7').status).toBe('done');
    expect(by(geo([{ ...comparePage, blocks: [] }]), 'E7').status).toBe('done');
  });

  it('reads an opening and a question heading the way the rule says', () => {
    expect(openingWords(body(paragraph(words(42)), paragraph('x')))).toBe(42);
    // An editor's empty first line is skipped.
    expect(openingWords(body(paragraph(''), paragraph(words(50))))).toBe(50);
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

  it('the seeded posts open with a 40 to 80-word answer and carry a question heading (ADR-050)', () => {
    const { answerWords } = THRESHOLDS;
    for (const slug of blogPosts.map((p) => p.slug)) {
      const ar = blogPostBody(slug);
      const en = blogPostBodyEn(slug);
      for (const [locale, markdown] of [
        ['ar', ar],
        ['en', en],
      ] as const) {
        const opening = markdown.split(/\n\s*\n/)[0] ?? '';
        const n = wordCount(opening.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1'));
        expect(n, `${slug} (${locale}) opening`).toBeGreaterThanOrEqual(answerWords.min);
        expect(n, `${slug} (${locale}) opening`).toBeLessThanOrEqual(answerWords.max);
        const headings = markdown.split('\n').filter((l) => l.startsWith('## '));
        expect(
          headings.some((h) => isQuestion(h.slice(3), locale)),
          `${slug} (${locale}) question heading`,
        ).toBe(true);
      }
    }
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
    expect(by(none, 'P1').guide.en).toMatch(/Connect PageSpeed/);
    const good = signals(
      filled({
        // Keyed by URL: the night that failed /p is left out for /p, not shifted onto /blog.
        pagespeed: [
          {
            date: '2026-09-14',
            mobilePerformance: { '/': 95, '/products': 91, '/blog': 60, '/p': 93 },
          },
          {
            date: '2026-09-15',
            mobilePerformance: { '/': 94, '/products': 92, '/blog': 91, '/p': 93 },
          },
          { date: '2026-09-16', mobilePerformance: { '/': 96, '/products': 90, '/blog': 92 } },
        ],
        searchConsole: { impressions: 120, topQueries: ['بحر برنت', 'طباعة على الطلب السعودية'] },
        citedRate: { runs: 40, cited: 21 },
      }),
    );
    // /blog's one bad night is outvoted by its median (91); /p reads its two good nights.
    expect(by(good, 'P1').status).toBe('done');
    expect(by(good, 'P2').status).toBe('done');
    expect(by(good, 'P3').status).toBe('done');
    expect(by(good, 'P4').status).toBe('done');
    const weak = signals(
      filled({
        pagespeed: [{ date: '2026-09-16', mobilePerformance: { '/': 85, '/products': 90 } }],
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
