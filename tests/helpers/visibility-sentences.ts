import { CHECKLIST_ITEMS } from '@/modules/visibility/rules/rest';
import { facts, findings } from '@/modules/visibility/score';
import type { Snapshot, Text } from '@/modules/visibility/types';
import { body, filled, paragraph } from './visibility-snapshot';

/**
 * Every sentence the visibility rules can say (ADR-049, ADR-056): the titles, guides,
 * facts and listed documents over three snapshots that walk every branch, plus the
 * checklist's labels. Read by `tests/visibility-rules-strings.test.ts` (both languages,
 * the ux-araby rules) and `tests/admin-glossary.test.ts` (the glossary).
 */
export const SNAPSHOTS: Array<{ name: string; snapshot: Snapshot }> = [
  { name: 'filled', snapshot: filled() },
  {
    name: 'services connected, GEO pages present, GA4 off, Arabic only',
    snapshot: filled({
      englishOn: false,
      gaConfigured: false,
      pages: [
        {
          id: 9,
          slug: 'faq',
          title: { ar: 'الأسئلة الشائعة' },
          blocks: [],
          seo: { title: { ar: 'الأسئلة' }, description: { ar: 'كل ما تحتاج معرفته.' } },
        },
        {
          id: 8,
          slug: 'compare-printful',
          title: { ar: 'مقارنة' },
          blocks: [{ type: 'compare', asOf: '2026-01-01' }],
          seo: { title: { ar: 'مقارنة' }, description: { ar: 'مقارنة بين بحر برنت وبرينتفل.' } },
        },
      ],
      pagespeed: [{ date: '2026-09-15', mobilePerformance: { '/': 85 } }],
      searchConsole: { impressions: 3, topQueries: ['بحر برنت'] },
      citedRate: { runs: 20, cited: 3 },
      lastLedgerRunAt: '2026-01-01T00:00:00.000Z',
    }),
  },
  {
    name: 'everything failing: every listed document',
    snapshot: filled({
      isProductionSite: false,
      indexNow: false,
      site: { tagline: { ar: 'x' }, social: { x: 'b7rprint', instagram: '', tiktok: '' } },
      routes: [{ route: '/', title: { ar: 'ع'.repeat(80) }, description: { ar: '' } }],
      pages: [],
      posts: [
        {
          ...filled().posts[0]!,
          title: { ar: 'عنوان' },
          seo: { title: {}, description: {} },
          body: { ar: body(paragraph('قصير')) },
        },
      ],
      authors: [{ id: 4, name: { ar: 'ضياء' }, bio: {}, photo: null, sameAs: 0 }],
      media: [{ id: 7, filename: 'a.jpg', alt: { ar: 'ضياء' }, usedBy: ['ضياء', 'b', 'c'] }],
      faqs: [],
      checklist: {},
      landings30d: 0,
      prompts: [],
    }),
  },
];

export interface Sentence {
  where: string;
  text: Text;
}

export function ruleSentences(): Sentence[] {
  const out: Sentence[] = [];
  for (const { name, snapshot } of SNAPSHOTS) {
    for (const f of findings(snapshot)) {
      out.push({ where: `${name}: ${f.key} title`, text: f.title });
      out.push({ where: `${name}: ${f.key} guide`, text: f.guide });
      for (const item of f.items ?? []) {
        out.push({ where: `${name}: ${f.key} item ${item.href}`, text: item.label });
      }
    }
    for (const [n, fact] of facts(snapshot).entries()) {
      out.push({ where: `${name}: ${fact.section} fact ${n}`, text: fact.text });
    }
  }
  for (const item of CHECKLIST_ITEMS)
    out.push({ where: `checklist ${item.key}`, text: item.label });
  return out;
}
