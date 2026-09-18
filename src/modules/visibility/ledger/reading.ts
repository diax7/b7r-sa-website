import type { Payload, TypedUser } from 'payload';
import { fold } from '@/lib/arabic-fold';
import { riyadh } from '@/lib/riyadh';
import { mentionsBrand } from '@/modules/visibility/ledger/read-answer';
import { editHref } from '@/modules/visibility/rules/shared';

/** The ledger's window on the page and in the score: the last four weeks. */
export const LEDGER_WINDOW_DAYS = 28;

export interface CitationRow {
  id: number;
  date: string;
  connection: number | null;
  provider: string;
  model: string | null;
  prompt: number | null;
  mode: 'search' | 'plain';
  mentioned: boolean;
  linked: boolean;
  namesBrand: boolean;
  urls: string[];
  competitors: string[];
  excerpt: string;
  /** The whole answer as Lexical rich text, when the row has it (rows before 2026-09-16 have the excerpt only). */
  answer: unknown;
  createdAt: string;
}

export interface EngineRate {
  connection: number;
  label: string;
  /** The window's rows on the non-brand prompts, and how many named B7R. */
  runs: number;
  mentioned: number;
  /** Over every row, the compare prompts included: a link is the outcome that matters there. */
  rows: number;
  linked: number;
  /** The connection's monthly limit in USD; null means none, the one brake on a daily cadence. */
  monthlyLimitUsd: number | null;
}

export interface PromptRow {
  id: number;
  text: string;
  language: 'ar' | 'en';
  namesBrand: boolean;
  everyDays: number;
  /** The latest citation per connection in the window, by connection id. */
  latest: Record<number, CitationRow>;
  /** For a prompt no engine names B7R on: the page whose title overlaps it most, to improve. */
  fix: { label: string; href: string } | null;
}

export interface LedgerReading {
  engines: EngineRate[];
  prompts: PromptRow[];
  competitors: Array<{ host: string; count: number }>;
  lastRunAt: string | null;
  /** Over the window, on the non-brand prompts: rows and how many named B7R. */
  citedRate: { runs: number; cited: number } | null;
}

type Access = { user: TypedUser; overrideAccess: false } | { overrideAccess: true };

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];

const idOf = (value: unknown): number | null =>
  typeof value === 'number'
    ? value
    : typeof value === 'object' && value
      ? ((value as { id?: number }).id ?? null)
      : null;

/** The window's citation rows, newest first, as plain values. */
export async function citationRows(
  payload: Payload,
  access: Access,
  now = new Date(),
): Promise<CitationRow[]> {
  const since = riyadh(new Date(now.getTime() - (LEDGER_WINDOW_DAYS - 1) * 86_400_000)).dateKey;
  const found = await payload.find({
    collection: 'citations',
    where: { date: { greater_than_equal: since } },
    sort: '-createdAt',
    depth: 0,
    pagination: false,
    ...access,
  });
  return found.docs.map((c) => ({
    id: c.id,
    date: c.date,
    connection: idOf(c.connection),
    provider: c.provider,
    model: c.model ?? null,
    prompt: idOf(c.prompt),
    mode: c.mode,
    mentioned: c.mentioned === true,
    linked: c.linked === true,
    namesBrand: c.namesBrand === true,
    urls: strings(c.urls),
    competitors: strings(c.competitors),
    excerpt: c.excerpt ?? '',
    answer: c.answer ?? null,
    createdAt: c.createdAt,
  }));
}

/** The cited-rate the score reads (P4, M3): the window's rows on the non-brand prompts. */
export function citedRateOf(rows: CitationRow[]): { runs: number; cited: number } | null {
  const counted = rows.filter((r) => !r.namesBrand);
  if (counted.length === 0) return null;
  return { runs: counted.length, cited: counted.filter((r) => r.mentioned).length };
}

/** The last finished ledger run, for M3. */
export async function lastLedgerRunAt(payload: Payload, access: Access): Promise<string | null> {
  const found = await payload.find({
    collection: 'ai-runs',
    where: { and: [{ kind: { equals: 'citation' } }, { status: { equals: 'done' } }] },
    sort: '-finishedAt',
    limit: 1,
    depth: 0,
    ...access,
  });
  return found.docs[0]?.finishedAt ?? null;
}

/** A document read with `locale: 'all'` as one candidate per language it has a title in. */
function titled(
  doc: { id: number; title?: unknown; slug?: unknown },
  collection: 'posts' | 'pages',
  adminRoute: string,
): Array<{ title: string; label: string; href: string }> {
  const titles =
    typeof doc.title === 'object' && doc.title
      ? (doc.title as Record<string, unknown>)
      : { ar: doc.title };
  return (['ar', 'en'] as const).flatMap((locale) => {
    const title = titles[locale];
    return typeof title === 'string' && title
      ? [
          {
            title,
            // The English title is a different target in the same form: say so beside it.
            label: locale === 'en' ? `${title} (en)` : title,
            href: editHref(adminRoute, collection, doc.id),
          },
        ]
      : [];
  });
}

/** The page or post whose title shares the most words with the prompt (after folding); null when none shares any. */
export function bestMatch(
  prompt: string,
  candidates: Array<{ title: string; label: string; href: string }>,
): { label: string; href: string } | null {
  const words = new Set(
    fold(prompt)
      .split(/[^\p{L}\p{N}]+/u)
      .filter((w) => w.length >= 3),
  );
  let best: { overlap: number; label: string; href: string } | null = null;
  for (const c of candidates) {
    const overlap = [...new Set(fold(c.title).split(/[^\p{L}\p{N}]+/u))].filter((w) =>
      words.has(w),
    ).length;
    if (overlap > 0 && (!best || overlap > best.overlap)) best = { overlap, ...c };
  }
  return best ? { label: best.label, href: best.href } : null;
}

/**
 * The page's ledger section (ADR-049 D5): the rates per engine over four weeks on the
 * non-brand prompts, the latest answer per prompt and engine, the competitors named most,
 * and for a prompt no engine names B7R on, the page to improve.
 */
export async function ledgerReading(
  payload: Payload,
  options: { user?: TypedUser | null; now?: Date } = {},
): Promise<LedgerReading> {
  const now = options.now ?? new Date();
  const access: Access = options.user
    ? { user: options.user, overrideAccess: false }
    : { overrideAccess: true };
  const adminRoute = payload.config.routes.admin;
  const [rows, prompts, connections, lastRunAt, posts, pages] = await Promise.all([
    citationRows(payload, access, now),
    payload.find({
      collection: 'prompts',
      where: { enabled: { equals: true } },
      sort: 'order',
      depth: 0,
      pagination: false,
      ...access,
    }),
    // The label and the limit only: the spend's virtual fields would each cost a query per row.
    payload.find({
      collection: 'connections',
      depth: 0,
      pagination: false,
      select: { label: true, monthlyLimitUsd: true },
      ...access,
    }),
    lastLedgerRunAt(payload, access),
    payload.find({
      collection: 'posts',
      where: { _status: { equals: 'published' } },
      depth: 0,
      locale: 'all',
      pagination: false,
      select: { title: true, slug: true },
      ...access,
    }),
    payload.find({
      collection: 'pages',
      where: { _status: { equals: 'published' } },
      depth: 0,
      locale: 'all',
      pagination: false,
      select: { title: true, slug: true },
      ...access,
    }),
  ]);
  const labels = new Map(connections.docs.map((c) => [c.id, c.label]));
  const limits = new Map(connections.docs.map((c) => [c.id, c.monthlyLimitUsd ?? null]));
  const engines = new Map<number, EngineRate>();
  for (const row of rows) {
    if (row.connection === null) continue;
    const engine = engines.get(row.connection) ?? {
      connection: row.connection,
      label: labels.get(row.connection) ?? row.provider,
      runs: 0,
      mentioned: 0,
      rows: 0,
      linked: 0,
      monthlyLimitUsd: limits.get(row.connection) ?? null,
    };
    engine.rows += 1;
    if (row.linked) engine.linked += 1;
    if (!row.namesBrand) {
      engine.runs += 1;
      if (row.mentioned) engine.mentioned += 1;
    }
    engines.set(row.connection, engine);
  }
  // A candidate per language: the English prompt finds the English title and its edit form.
  const candidates = [
    ...posts.docs.flatMap((p) => titled(p, 'posts', adminRoute)),
    ...pages.docs.flatMap((p) => titled(p, 'pages', adminRoute)),
  ];
  const promptRows: PromptRow[] = prompts.docs.map((p) => {
    const latest: Record<number, CitationRow> = {};
    for (const row of rows) {
      if (row.prompt !== p.id || row.connection === null) continue;
      if (!latest[row.connection]) latest[row.connection] = row;
    }
    const answered = Object.values(latest);
    const uncited = answered.length > 0 && answered.every((r) => !r.mentioned);
    const namesBrand = p.namesBrand === true || mentionsBrand(p.text);
    return {
      id: p.id,
      text: p.text,
      language: p.language,
      namesBrand,
      everyDays: Math.max(1, Number(p.everyDays ?? 1)),
      latest,
      fix: uncited && !namesBrand ? bestMatch(p.text, candidates) : null,
    };
  });
  const named = new Map<string, number>();
  for (const row of rows)
    for (const host of row.competitors) named.set(host, (named.get(host) ?? 0) + 1);
  return {
    engines: [...engines.values()].toSorted((a, b) => a.connection - b.connection),
    prompts: promptRows,
    competitors: [...named.entries()]
      .map(([host, count]) => ({ host, count }))
      .toSorted((a, b) => b.count - a.count)
      .slice(0, 5),
    lastRunAt,
    citedRate: citedRateOf(rows),
  };
}
