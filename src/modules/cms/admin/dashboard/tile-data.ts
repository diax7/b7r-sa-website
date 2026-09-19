import { Footprints, Newspaper } from 'lucide-react';
import type {
  DraftCount,
  PeopleSummary,
  PublishedCount,
} from '@/modules/cms/admin/dashboard/readers';
import { type DashboardRange, percentChange } from '@/modules/cms/admin/dashboard/rules';
import type { Tile } from '@/modules/cms/admin/dashboard/tiles';
import { formatDate, formatNumber } from '@/modules/cms/admin/format';
import { ADMIN_VIEWS, COLLECTION_ICONS } from '@/modules/cms/admin/icons';
import { type AdminStrings, adminStringsFor } from '@/modules/cms/admin/strings';
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
  /** Umami's people the same way (ADR-048 amended); no row in the range reads as no Umami. */
  people?: { current: PeopleSummary; double: PeopleSummary } | null | undefined;
  ledger: LedgerReading | null | undefined;
  score: { score: Score<string>; trend: ScoreTrend | null } | null | undefined;
  published: PublishedCount[] | null | undefined;
  drafts: DraftCount[] | null | undefined;
}

const sum = (rows: Array<{ count?: number; waiting?: number }>, key: 'count' | 'waiting') =>
  rows.reduce((n, r) => n + (r[key] ?? 0), 0);

type Words = AdminStrings['dashboard']['tiles'];

/** The change against the previous range in words; `previous` null when nothing is known of it. */
function changeLine(
  current: number,
  previous: number | null,
  days: number,
  t: Words,
): string | null {
  if (previous === null) return null;
  const change = percentChange(current, previous);
  if (change === null) return t.visitsFirst(days);
  return change > 0
    ? t.visitsUp(change, days)
    : change < 0
      ? t.visitsDown(-change, days)
      : t.visitsSame(days);
}

/**
 * The visits tile (ADR-059; ADR-048 amended): our landings with their change; when Umami has
 * a row in the range, its visitors are the number (the truest people count: it loads for
 * everyone, GA4 only after consent), the landings move to the line under, and the change is
 * the visitors' own where the previous range has rows.
 */
function visitsTile(input: TileInputs, t: Words): Tile {
  const { days, adminRoute, language } = input;
  const href = `${adminRoute}${ADMIN_VIEWS.traffic.path}?days=${days}`;
  const people = input.people?.current.days ? input.people : null;
  const landings = input.traffic?.current.landings ?? null;
  const tile: Tile = {
    key: 'visits',
    href,
    label: t.visits,
    value: '',
    detail: '',
    icon: Footprints,
    hue: 'pink',
  };
  if (people) {
    const visitors = people.current.visitors;
    const previous =
      people.double.days > people.current.days ? people.double.visitors - visitors : null;
    const line = changeLine(visitors, previous, days, t);
    return {
      ...tile,
      label: t.visitors,
      value: formatNumber(visitors, language),
      detail: [
        landings === null ? '' : t.landings(landings, formatNumber(landings, language)),
        line ?? '',
      ]
        .filter(Boolean)
        .join(' · '),
      data: { 'data-admin-tile-visitors': visitors },
    };
  }
  if (!input.traffic) return { ...tile, value: t.unavailable };
  const previous = input.traffic.double.landings - input.traffic.current.landings;
  return {
    ...tile,
    value: formatNumber(input.traffic.current.landings, language),
    detail: changeLine(input.traffic.current.landings, previous, days, t) ?? '',
  };
}

/** The numbers at a glance (ADR-059), in the audit's order: visits, cited rate, score, published. */
export function dashboardTiles(input: TileInputs): Tile[] {
  const { days, adminRoute, language } = input;
  const s = adminStringsFor(language);
  const t = s.dashboard.tiles;
  const tiles: Tile[] = [];
  if (input.traffic !== undefined) tiles.push(visitsTile(input, t));
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
