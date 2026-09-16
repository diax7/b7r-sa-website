import type { Section } from '@/modules/visibility/types';

/**
 * The score's one table (ADR-049, quoted there): every item, its section and its weight;
 * the weights of a section sum to the section's, the sections to 100. A change here is one
 * reviewed line. `siteOnly` names the items that need no outside service or assistant.
 */
export const SECTIONS: Array<{ key: Section; weight: number; label: string }> = [
  { key: 'identity', weight: 15, label: 'Identity' },
  { key: 'crawl', weight: 20, label: 'Crawl access' },
  { key: 'extractability', weight: 30, label: 'Extractability' },
  { key: 'corroboration', weight: 10, label: 'Corroboration' },
  { key: 'measurement', weight: 10, label: 'Measurement' },
  { key: 'signals', weight: 15, label: 'Outside signals' },
];

export interface ItemSpec {
  key: string;
  section: Section;
  weight: number;
  /** Needs no outside service or assistant: part of the site-only percentage. */
  siteOnly: boolean;
}

export const ITEMS: ItemSpec[] = [
  { key: 'I1', section: 'identity', weight: 4, siteOnly: true },
  { key: 'I2', section: 'identity', weight: 4, siteOnly: true },
  { key: 'I3', section: 'identity', weight: 3, siteOnly: true },
  { key: 'I4', section: 'identity', weight: 4, siteOnly: true },
  { key: 'C1', section: 'crawl', weight: 5, siteOnly: true },
  { key: 'C2', section: 'crawl', weight: 3, siteOnly: true },
  { key: 'C3', section: 'crawl', weight: 4, siteOnly: false },
  { key: 'C4', section: 'crawl', weight: 3, siteOnly: false },
  { key: 'C5', section: 'crawl', weight: 5, siteOnly: true },
  { key: 'E1', section: 'extractability', weight: 6, siteOnly: true },
  { key: 'E2', section: 'extractability', weight: 4, siteOnly: true },
  { key: 'E3', section: 'extractability', weight: 6, siteOnly: true },
  { key: 'E4', section: 'extractability', weight: 4, siteOnly: true },
  { key: 'E5', section: 'extractability', weight: 3, siteOnly: true },
  { key: 'E6', section: 'extractability', weight: 4, siteOnly: true },
  { key: 'E7', section: 'extractability', weight: 3, siteOnly: true },
  { key: 'R1', section: 'corroboration', weight: 10, siteOnly: true },
  { key: 'M1', section: 'measurement', weight: 3, siteOnly: true },
  { key: 'M2', section: 'measurement', weight: 3, siteOnly: true },
  { key: 'M3', section: 'measurement', weight: 4, siteOnly: false },
  { key: 'P1', section: 'signals', weight: 6, siteOnly: false },
  { key: 'P2', section: 'signals', weight: 3, siteOnly: false },
  { key: 'P3', section: 'signals', weight: 2, siteOnly: false },
  { key: 'P4', section: 'signals', weight: 4, siteOnly: false },
];

export function weightOf(key: string): number {
  const item = ITEMS.find((i) => i.key === key);
  if (!item) throw new Error(`visibility: no weight for ${key}`);
  return item.weight;
}

/** The thresholds the rules read, with the reason each one is what it is. */
export const THRESHOLDS = {
  /** The config's `maxLength` on a search title (`TITLE_MAX`); an engine truncates past it. */
  titleMax: 70,
  /** BRD 7.3: a description up to 155 characters shows whole in a result. */
  descriptionMax: 155,
  /** An answer-first opening: the first paragraph, in words (the GEO prompt's 40 to 60, with room). */
  answerWords: { min: 40, max: 80 },
  /** The FAQ: at least this many published entries per language (no ceiling). */
  faqMin: 5,
  /** Prompts per language before the ledger means anything. */
  promptsMin: 5,
  /** A ledger run this recent counts as "running". */
  ledgerDays: 14,
  /** Landings this recent count as "the counter is receiving". */
  landingDays: 30,
  /** PageSpeed mobile performance, the median of the last three snapshots. */
  pagespeed: { done: 90, next: 80 },
  /** The cited-rate over four weeks on the non-brand prompts. */
  cited: { done: 0.5, next: 0.1 },
} as const;

/** Interrogatives a question heading may start with, per language (E4). */
export const INTERROGATIVES = {
  ar: ['كيف', 'ما', 'ماذا', 'هل', 'لماذا', 'متى', 'أين', 'كم'],
  en: ['how', 'what', 'why', 'when', 'where', 'which', 'can', 'does'],
} as const;

/** The category terms a healthy top-ten Search Console query list should carry (P3). */
export const CATEGORY_TERMS = [
  'طباعة على الطلب',
  'طباعة عند الطلب',
  'براند ملابس',
  'تيشيرت',
  'هودي',
  'طباعة تيشيرتات',
  'print on demand',
  'clothing brand',
  'custom t-shirt',
  'hoodie printing',
] as const;

/** Names of ours that make a query or a prompt a brand one, after `fold()`. */
export const BRAND_TERMS = ['بحر برنت', 'b7r'] as const;
