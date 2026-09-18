import { Footprints, Newspaper } from 'lucide-react';
import type { DraftCount, PublishedCount } from '@/modules/cms/admin/dashboard/readers';
import { type DashboardRange, percentChange } from '@/modules/cms/admin/dashboard/rules';
import type { Tile } from '@/modules/cms/admin/dashboard/tiles';
import { formatDate, formatNumber } from '@/modules/cms/admin/format';
import { ADMIN_VIEWS, COLLECTION_ICONS } from '@/modules/cms/admin/icons';
import { adminStringsFor } from '@/modules/cms/admin/strings';
import type { TrafficSummary } from '@/modules/traffic/summary';
import { LEDGER_WINDOW_DAYS, type LedgerReading } from '@/modules/visibility/ledger/reading';
import type { Score } from '@/modules/visibility/score';
import type { ScoreTrend } from '@/modules/visibility/signals';

/**
 * A tile's input: `undefined` when the user may not see it (no tile), `null` when its reader
 * failed (the tile stands with the "not available" word), else the numbers.
 */
export interface TileInputs {
  days: DashboardRange;
  adminRoute: string;
  language: string;
  /** The range and the double range, so the previous range is the difference. */
  traffic: { current: TrafficSummary; double: TrafficSummary } | null | undefined;
  ledger: LedgerReading | null | undefined;
  score: { score: Score<string>; trend: ScoreTrend | null } | null | undefined;
  published: PublishedCount[] | null | undefined;
  drafts: DraftCount[] | null | undefined;
}

const sum = (rows: Array<{ count?: number; waiting?: number }>, key: 'count' | 'waiting') =>
  rows.reduce((n, r) => n + (r[key] ?? 0), 0);

/** The numbers at a glance (ADR-059), in the audit's order: visits, cited rate, score, published. */
export function dashboardTiles(input: TileInputs): Tile[] {
  const { days, adminRoute, language } = input;
  const s = adminStringsFor(language);
  const t = s.dashboard.tiles;
  const tiles: Tile[] = [];
  if (input.traffic !== undefined) {
    const current = input.traffic?.current.landings ?? null;
    const previous =
      input.traffic === null
        ? null
        : input.traffic.double.landings - input.traffic.current.landings;
    const change = current === null || previous === null ? null : percentChange(current, previous);
    tiles.push({
      key: 'visits',
      href: `${adminRoute}${ADMIN_VIEWS.traffic.path}?days=${days}`,
      label: t.visits,
      value: current === null ? t.unavailable : formatNumber(current, language),
      detail:
        current === null
          ? ''
          : change === null
            ? t.visitsFirst(days)
            : change > 0
              ? t.visitsUp(change, days)
              : change < 0
                ? t.visitsDown(-change, days)
                : t.visitsSame(days),
      icon: Footprints,
      hue: 'pink',
    });
  }
  if (input.ledger !== undefined) {
    const rate = input.ledger?.citedRate ?? null;
    const engines = input.ledger?.engines.length ?? 0;
    tiles.push({
      key: 'cited',
      href: `${adminRoute}${ADMIN_VIEWS.visibility.path}`,
      label: t.cited,
      value:
        input.ledger === null
          ? t.unavailable
          : rate === null
            ? '0%'
            : `${Math.round((rate.cited / rate.runs) * 100)}%`,
      detail: input.ledger === null ? '' : rate === null ? t.citedNone : t.citedDetail(engines),
      icon: COLLECTION_ICONS.citations,
      hue: 'pink',
      data: { 'data-admin-cited-window': LEDGER_WINDOW_DAYS },
    });
  }
  if (input.score !== undefined) {
    const overall = input.score?.score.overall ?? null;
    const trend = input.score?.trend ?? null;
    const p = s.visibility.page;
    tiles.push({
      key: 'score',
      href: `${adminRoute}${ADMIN_VIEWS.visibility.path}`,
      label: t.score,
      value: overall === null ? t.unavailable : `${overall}%`,
      detail:
        input.score === null
          ? ''
          : trend === null
            ? p.siteOnly.replace('{n}', String(input.score.score.siteOnly))
            : (trend.delta > 0 ? p.up : trend.delta < 0 ? p.down : p.same)
                .replace('{n}', String(Math.abs(trend.delta)))
                .replace('{date}', formatDate(new Date(trend.since.date), language)),
      icon: ADMIN_VIEWS.visibility.icon,
      hue: 'pink',
      data:
        overall === null
          ? {}
          : { 'data-admin-visibility': '', 'data-admin-visibility-overall': overall },
    });
  }
  if (input.published !== undefined) {
    const published = input.published === null ? null : sum(input.published, 'count');
    const drafts = input.drafts ? sum(input.drafts, 'waiting') : null;
    tiles.push({
      key: 'published',
      href: `${adminRoute}/collections/posts?sort=-publishedAt`,
      label: t.published,
      value: published === null ? t.unavailable : formatNumber(published, language),
      detail: [t.publishedDetail(days), drafts === null ? '' : t.drafts(drafts)]
        .filter(Boolean)
        .join('; '),
      icon: Newspaper,
      hue: 'violet',
    });
  }
  return tiles;
}
