import type { AdminStrings } from '@/modules/cms/admin/strings';

/**
 * The dashboard's range control (ADR-059): 7, 30 or 90 days as a search param
 * (`/admin?days=30`), server-rendered, read by the visits tile, the published tile and the
 * visits section. Anything else is the week: a typed `?days=12` shows the default, not an
 * error.
 */
export const DASHBOARD_RANGES = [7, 30, 90] as const;
export type DashboardRange = (typeof DASHBOARD_RANGES)[number];
export const DEFAULT_RANGE: DashboardRange = 7;

export function rangeOf(raw: string | string[] | undefined): DashboardRange {
  const n = Number(Array.isArray(raw) ? raw[0] : raw);
  return DASHBOARD_RANGES.find((r) => r === n) ?? DEFAULT_RANGE;
}

export type Daypart = 'morning' | 'afternoon' | 'evening';

/** The greeting by the Riyadh hour: morning from 5, afternoon from 12, evening from 17. */
export function daypartOf(hour: number): Daypart {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  return 'evening';
}

/** The change of a count against the previous range, as a whole percentage; null from zero. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** The list of a collection filtered on its status, as Payload's list view reads the query. */
export function statusListHref(adminRoute: string, collection: string, status: string): string {
  return `${adminRoute}/collections/${collection}?where[_status][equals]=${status}`;
}

export interface HandItem {
  key: string;
  href: string;
  text: string;
}

/** What the "needs a hand" line reads; a reader that was skipped or failed hands null. */
export interface HandInput {
  /** `ai-runs` that failed in the last seven days. */
  failedRuns: number | null;
  connections: Array<{
    id: number;
    label: string;
    spentUsd: number;
    limitUsd: number | null;
  }> | null;
  missingEnglish: Array<{ collection: string; count: number; href: string | null }> | null;
  drafts: Array<{ collection: string; label: string; stale: number }> | null;
}

/**
 * The line under the greeting (ADR-059): failed runs this week, a connection at or over its
 * monthly limit, a document without its English, drafts nobody touched for a week; each a
 * link to the place that fixes it, in the order an owner acts. Nothing to say is a sentence,
 * never an empty line.
 */
export function needsAHand(
  input: HandInput,
  s: AdminStrings['dashboard']['hand'],
  adminRoute: string,
): HandItem[] {
  const items: HandItem[] = [];
  if (input.failedRuns) {
    items.push({
      key: 'failed-runs',
      href: `${adminRoute}/collections/ai-runs?where[status][equals]=failed`,
      text: s.failedRuns(input.failedRuns),
    });
  }
  for (const c of input.connections ?? []) {
    if (c.limitUsd !== null && c.spentUsd >= c.limitUsd) {
      items.push({
        key: `over-limit-${c.id}`,
        href: `${adminRoute}/collections/connections/${c.id}`,
        text: s.overLimit.replace('{label}', c.label),
      });
    }
  }
  const missing = (input.missingEnglish ?? []).filter((m) => m.count > 0);
  const missingCount = missing.reduce((n, m) => n + m.count, 0);
  if (missingCount > 0) {
    const first = missing[0]!;
    items.push({
      key: 'missing-english',
      href: first.href ?? `${adminRoute}/collections/${first.collection}?locale=en`,
      text: s.missingEnglish(missingCount),
    });
  }
  for (const d of input.drafts ?? []) {
    if (d.stale > 0) {
      items.push({
        key: `stale-drafts-${d.collection}`,
        href: statusListHref(adminRoute, d.collection, 'draft'),
        text: s.staleDrafts(d.stale, d.label),
      });
    }
  }
  return items;
}
