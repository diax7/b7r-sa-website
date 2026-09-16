import type { Payload, TypedUser } from 'payload';
import { riyadh } from '@/lib/riyadh';
import { botByKey, type BotFamily } from '@/lib/traffic/bots';
import {
  type Channel,
  type ChannelGroup,
  CHANNEL_GROUPS,
  channelOf,
} from '@/modules/traffic/channels';
import type { TrafficRow } from '@/modules/traffic/counter';

export interface ChannelTotal {
  channel: Channel;
  hits: number;
  /** The first and last day the channel was seen in the range. */
  firstDay: string;
  lastDay: string;
}

export interface SourceTotal {
  source: string;
  channel: Channel;
  hits: number;
}

export interface PathTotal {
  path: string;
  hits: number;
  /** The channel that brought most of them. */
  top: Channel;
}

export interface BotTotal {
  bot: string;
  family: BotFamily | 'other';
  hits: number;
  /** The three pages it read most. */
  paths: Array<{ path: string; hits: number }>;
}

export interface TrafficSummary {
  days: number;
  /** `YYYY-MM-DD`, the first day of the range in Riyadh. */
  since: string;
  landings: number;
  byGroup: Record<ChannelGroup, number>;
  byChannel: ChannelTotal[];
  bySource: SourceTotal[];
  byPath: PathTotal[];
  crawls: number;
  byBot: BotTotal[];
}

/** The day `days - 1` days before `now`, in Riyadh (`days: 7` is today and the six before). */
export function sinceDay(days: number, now: Date): string {
  return riyadh(new Date(now.getTime() - (days - 1) * 86_400_000)).dateKey;
}

/** Most hits first; equal hits by name, so the order is the same on every render. */
function byHits<T extends { hits: number }>(name: (item: T) => string) {
  return (a: T, b: T) => b.hits - a.hits || name(a).localeCompare(name(b));
}

/** The rows of a range grouped for the card and the page; pure, so the tests feed it rows. */
export function summarise(rows: TrafficRow[], days: number, since: string): TrafficSummary {
  const landings = rows.filter((r) => r.kind === 'landing');
  const crawls = rows.filter((r) => r.kind === 'crawl');
  const byGroup = Object.fromEntries(CHANNEL_GROUPS.map((g) => [g, 0])) as Record<
    ChannelGroup,
    number
  >;
  const channelTotals = new Map<string, ChannelTotal>();
  const sourceTotals = new Map<string, SourceTotal>();
  const pathChannels = new Map<string, Map<string, number>>();
  for (const row of landings) {
    const channel = channelOf(row.source);
    byGroup[channel.group] += row.hits;
    const ct = channelTotals.get(channel.key);
    if (ct) {
      ct.hits += row.hits;
      if (row.date < ct.firstDay) ct.firstDay = row.date;
      if (row.date > ct.lastDay) ct.lastDay = row.date;
    } else {
      channelTotals.set(channel.key, {
        channel,
        hits: row.hits,
        firstDay: row.date,
        lastDay: row.date,
      });
    }
    const st = sourceTotals.get(row.source);
    if (st) st.hits += row.hits;
    else sourceTotals.set(row.source, { source: row.source, channel, hits: row.hits });
    const pc = pathChannels.get(row.path) ?? new Map<string, number>();
    pc.set(channel.key, (pc.get(channel.key) ?? 0) + row.hits);
    pathChannels.set(row.path, pc);
  }
  const byPath: PathTotal[] = [...pathChannels.entries()]
    .map(([path, channels]) => {
      const sorted = [...channels.entries()].toSorted((a, b) => b[1] - a[1]);
      const hits = sorted.reduce((n, [, h]) => n + h, 0);
      const topKey = sorted[0]![0];
      const top = channelTotals.get(topKey)!.channel;
      return { path, hits, top };
    })
    .toSorted(byHits((p) => p.path));
  const botPaths = new Map<string, Map<string, number>>();
  for (const row of crawls) {
    const bp = botPaths.get(row.source) ?? new Map<string, number>();
    bp.set(row.path, (bp.get(row.path) ?? 0) + row.hits);
    botPaths.set(row.source, bp);
  }
  const byBot: BotTotal[] = [...botPaths.entries()]
    .map(([bot, paths]) => {
      const sorted = [...paths.entries()].toSorted((a, b) => b[1] - a[1]);
      const family: BotTotal['family'] = botByKey(bot)?.family ?? 'other';
      return {
        bot,
        family,
        hits: sorted.reduce((n, [, h]) => n + h, 0),
        paths: sorted.slice(0, 3).map(([path, hits]) => ({ path, hits })),
      };
    })
    .toSorted(byHits((b) => b.bot));
  return {
    days,
    since,
    landings: landings.reduce((n, r) => n + r.hits, 0),
    byGroup,
    byChannel: [...channelTotals.values()].toSorted(byHits((c) => c.channel.key)),
    bySource: [...sourceTotals.values()].toSorted(byHits((c) => c.source)),
    byPath,
    crawls: crawls.reduce((n, r) => n + r.hits, 0),
    byBot,
  };
}

/**
 * The summary of the last `days` days. With a `user`, the read runs under that user's
 * access (the Traffic page); without one, as the dashboard's server render (an admin's, by
 * the card's own check).
 */
export async function trafficSummary(
  payload: Payload,
  options: { days: number; now?: Date; user?: TypedUser | null },
): Promise<TrafficSummary> {
  const now = options.now ?? new Date();
  const since = sinceDay(options.days, now);
  const result = await payload.find({
    collection: 'traffic',
    where: { date: { greater_than_equal: since } },
    depth: 0,
    pagination: false,
    sort: 'date',
    ...(options.user ? { user: options.user, overrideAccess: false } : { overrideAccess: true }),
  });
  const rows: TrafficRow[] = result.docs.map((d) => ({
    date: d.date,
    kind: d.kind,
    source: d.source,
    path: d.path,
    hits: d.hits,
  }));
  return summarise(rows, options.days, since);
}
