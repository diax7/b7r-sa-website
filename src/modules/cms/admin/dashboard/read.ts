import type { I18nClient } from '@payloadcms/translations';
import type { Payload, PayloadRequest, SanitizedPermissions, TypedUser } from 'payload';
import type { HealthReport } from '@/lib/cms/health';
import { healthReport } from '@/lib/cms/health';
import { type EngineSummary, engineSummary } from '@/modules/ai-content/admin/engine-card';
import { can, recentActivity, type RecentItem } from '@/modules/cms/admin/dashboard/data';
import {
  CONTENT_COLLECTIONS,
  type ConnectionRow,
  connectionRows,
  type ContentSlug,
  type DraftCount,
  draftsWaiting,
  failedRuns,
  type MissingEnglish,
  missingEnglish,
  type PublishedCount,
  publishedInRange,
} from '@/modules/cms/admin/dashboard/readers';
import type { DashboardRange } from '@/modules/cms/admin/dashboard/rules';
import { type TrafficSummary, trafficSummary } from '@/modules/traffic/summary';
import { type LedgerReading, ledgerReading } from '@/modules/visibility/ledger/reading';
import { reading } from '@/modules/visibility/reading';
import type { Score } from '@/modules/visibility/score';
import { type ScoreTrend, scoreTrend } from '@/modules/visibility/signals';

const FAILED_RUNS_DAYS = 7;

/**
 * A reader's answer: `undefined` when the user may not run it (its section is not rendered),
 * `null` when it failed (its section shows the "not available" word), else the numbers.
 */
export type Read<T> = T | null | undefined;

export interface DashboardData {
  health: Read<HealthReport>;
  recent: Read<RecentItem[]>;
  traffic: Read<{ current: TrafficSummary; double: TrafficSummary }>;
  score: Read<{ score: Score; trend: ScoreTrend | null }>;
  ledger: Read<LedgerReading>;
  engine: Read<EngineSummary>;
  connections: Read<ConnectionRow[]>;
  failedRuns: Read<number>;
  published: Read<PublishedCount[]>;
  drafts: Read<DraftCount[]>;
  missingEnglish: Read<MissingEnglish[]>;
  /** The content collections the user may read, in the audit's order. */
  contentCollections: ContentSlug[];
}

/** One reader, guarded: a failing read logs and hands null, so the page still renders. */
async function guarded<T>(
  payload: Payload,
  name: string,
  allowed: boolean,
  read: () => Promise<T>,
): Promise<Read<T>> {
  if (!allowed) return undefined;
  try {
    return await read();
  } catch (error) {
    payload.logger.error({
      msg: `dashboard: the ${name} reader failed; its section is empty`,
      error,
    });
    return null;
  }
}

/**
 * Every number the dashboard shows (ADR-059), read once per render, in parallel, with the
 * user's permissions deciding which readers run: the traffic, the score, the ledger, the
 * engine, the connections and the runs need an admin (the collections and globals they read
 * are admin-only); the content readers run on the collections the user may read; the health
 * report and the latest saves run for everyone. Nothing here is cached beyond what the
 * readers cache themselves (the score reading keeps its minute).
 */
export async function readDashboard(args: {
  payload: Payload;
  req: PayloadRequest;
  user: TypedUser | undefined;
  permissions: SanitizedPermissions | undefined;
  i18n: I18nClient;
  days: DashboardRange;
  now: Date;
}): Promise<DashboardData> {
  const { payload, req, user, permissions, i18n, days, now } = args;
  const reads = (slug: string) => can(permissions, 'collections', slug, 'read');
  const contentCollections = CONTENT_COLLECTIONS.filter(reads);
  const content = { collections: contentCollections, now, user: user ?? null };
  const someContent = contentCollections.length > 0;
  const [
    health,
    recent,
    traffic,
    score,
    ledger,
    engine,
    connections,
    failed,
    published,
    drafts,
    missing,
  ] = await Promise.all([
    guarded(payload, 'health', true, () => healthReport()),
    guarded(payload, 'latest saves', true, () =>
      recentActivity({ payload, req, user, permissions, i18n }),
    ),
    guarded(payload, 'traffic', reads('traffic'), async () => {
      const [current, double] = await Promise.all([
        trafficSummary(payload, { days, now }),
        trafficSummary(payload, { days: days * 2, now }),
      ]);
      return { current, double };
    }),
    guarded(
      payload,
      'score',
      can(permissions, 'globals', 'visibility-checklist', 'read'),
      async () => {
        const r = await reading(payload, { user: user ?? null });
        return { score: r.score, trend: await scoreTrend(payload, r.score.overall) };
      },
    ),
    guarded(payload, 'ledger', reads('citations'), () =>
      ledgerReading(payload, { user: user ?? null, now }),
    ),
    guarded(payload, 'engine', can(permissions, 'globals', 'ai-settings', 'read'), () =>
      engineSummary(payload, now),
    ),
    guarded(payload, 'connections', reads('connections'), () => connectionRows(payload, req, now)),
    guarded(payload, 'failed runs', reads('ai-runs'), () =>
      failedRuns(payload, { days: FAILED_RUNS_DAYS, now, user: user ?? null }),
    ),
    guarded(payload, 'published', someContent, () =>
      publishedInRange(payload, { ...content, days }),
    ),
    guarded(payload, 'drafts', someContent, () => draftsWaiting(payload, content)),
    guarded(payload, 'missing English', someContent, () => missingEnglish(payload, content)),
  ]);
  return {
    health,
    recent,
    traffic,
    score,
    ledger,
    engine,
    connections,
    failedRuns: failed,
    published,
    drafts,
    missingEnglish: missing,
    contentCollections,
  };
}
