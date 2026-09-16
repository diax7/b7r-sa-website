import type { Payload } from 'payload';
import { isServiceKind } from '@/modules/connections/kinds';
import { latestMetrics } from '@/modules/visibility/metrics';
import type {
  BingSnapshot,
  PageSpeedSnapshot,
  SearchConsoleSnapshot,
} from '@/modules/visibility/pull';

export interface SignalRows {
  searchConsole: { date: string; data: SearchConsoleSnapshot } | null;
  bing: { date: string; data: BingSnapshot } | null;
  pagespeed: { date: string; data: PageSpeedSnapshot } | null;
  /** Which services have an enabled connection, by kind. */
  connected: Record<'google-search-console' | 'bing-webmaster' | 'pagespeed', boolean>;
}

export interface ScoreTrend {
  /** The stored score the trend compares against, and its date. */
  since: { date: string; overall: number };
  /** Today's overall minus that. */
  delta: number;
}

/** The latest snapshot per service and which services are connected, for the Score page. */
export async function signalRows(payload: Payload): Promise<SignalRows> {
  const [sc, bing, psi, connections] = await Promise.all([
    latestMetrics<SearchConsoleSnapshot>(payload, 'search-console', 1),
    latestMetrics<BingSnapshot>(payload, 'bing', 1),
    latestMetrics<PageSpeedSnapshot>(payload, 'pagespeed', 1),
    payload.find({
      collection: 'connections',
      where: { enabled: { equals: true } },
      depth: 0,
      limit: 20,
      overrideAccess: true,
    }),
  ]);
  const kinds = new Set(connections.docs.map((c) => c.kind).filter(isServiceKind));
  return {
    searchConsole: sc[0] ?? null,
    bing: bing[0] ?? null,
    pagespeed: psi[0] ?? null,
    connected: {
      'google-search-console': kinds.has('google-search-console'),
      'bing-webmaster': kinds.has('bing-webmaster'),
      pagespeed: kinds.has('pagespeed'),
    },
  };
}

/** The score row nearest to a week ago (the oldest of the last eight), against today's. */
export async function scoreTrend(payload: Payload, overall: number): Promise<ScoreTrend | null> {
  const rows = await latestMetrics<{ overall?: unknown }>(payload, 'score', 8);
  const since = rows.at(-1);
  if (!since || rows.length < 2 || typeof since.data.overall !== 'number') return null;
  return {
    since: { date: since.date, overall: since.data.overall },
    delta: overall - since.data.overall,
  };
}
