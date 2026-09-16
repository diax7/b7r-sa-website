import type { LexicalState } from '@/lib/lexical';

/** A localized value as `locale: 'all'` returns it: one string per language, or none. */
export type Loc = { ar?: string | null; en?: string | null };

export type Section =
  | 'identity'
  | 'crawl'
  | 'extractability'
  | 'corroboration'
  | 'measurement'
  | 'signals';

export type Status = 'done' | 'next' | 'missing';

/** A document a finding points at: the admin link opens the locale that is missing. */
export interface Item {
  label: string;
  href: string;
}

/**
 * One rule's answer (ADR-049): the weight it could earn, what it earned, and the sentence,
 * the guide and the documents that tell an admin what to do. `done` earns the weight,
 * `missing` nothing; a rule over documents is pro-rata and `next` while partial.
 */
export interface Finding {
  key: string;
  section: Section;
  weight: number;
  earned: number;
  status: Status;
  title: string;
  guide: string;
  href?: string;
  items?: Item[];
  /** How many of how many, for a pro-rata rule. */
  count?: { done: number; total: number };
}

/** What a section guarantees by construction: listed as facts, worth no points. */
export interface Fact {
  section: Section;
  text: string;
}

export interface SnapshotDoc {
  id: number;
  slug: string;
  /** The title-like field per language. */
  title: Loc;
  /** The search title and description as the document stores them (posts, pages). */
  seo?: { title: Loc; description: Loc };
  /** The lead or excerpt the description falls back to. */
  lead?: Loc;
}

export interface SnapshotProduct extends SnapshotDoc {
  shortDescription: Loc;
  baseCost: number;
  sortOrder: number;
}

export interface SnapshotPost extends SnapshotDoc {
  excerpt: Loc;
  body: { ar?: LexicalState | null; en?: LexicalState | null };
  author: number | null;
}

export interface SnapshotAuthor {
  id: number;
  name: Loc;
  bio: Loc;
  photo: number | null;
  sameAs: number;
}

export interface SnapshotMedia {
  id: number;
  filename: string;
  alt: Loc;
  /** Which published documents use it (their labels), for the finding's items. */
  usedBy: string[];
}

export interface SnapshotConnection {
  id: number;
  kind: string;
  enabled: boolean;
  lastTestOk: boolean | null;
}

export interface Snapshot {
  at: string;
  adminRoute: string;
  isProductionSite: boolean;
  englishOn: boolean;
  indexNow: boolean;
  gaConfigured: boolean;
  site: { tagline: Loc; social: { x: string; instagram: string; tiktok: string } };
  titleTemplate: Loc;
  /** The code-owned routes' titles and descriptions from the search defaults. */
  routes: Array<{ route: string; title: Loc; description: Loc }>;
  pages: SnapshotDoc[];
  products: SnapshotProduct[];
  posts: SnapshotPost[];
  hubs: SnapshotDoc[];
  authors: SnapshotAuthor[];
  faqs: Array<{ id: number; question: Loc }>;
  media: SnapshotMedia[];
  checklist: Record<string, boolean>;
  connections: SnapshotConnection[];
  /** Landings counted in the last 30 days (ADR-048). */
  landings30d: number;
  /** Project 3c: the prompts and the ledger; empty until they exist. */
  prompts: Array<{ language: 'ar' | 'en'; enabled: boolean; namesBrand: boolean }>;
  lastLedgerRunAt: string | null;
  /** Over four weeks, on the non-brand prompts: runs and how many named B7R. */
  citedRate: { runs: number; cited: number } | null;
  /** Project 3b: the latest snapshots; null until they exist. */
  pagespeed: Array<{ date: string; mobilePerformance: Record<string, number> }>;
  searchConsole: { impressions: number; topQueries: string[] } | null;
}
