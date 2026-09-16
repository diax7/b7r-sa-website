import { riyadh } from '@/lib/riyadh';

/**
 * The guards before a run (BRD 10.2.4 scheduling, 10.2.5): the switch, the env override,
 * the connection (none, or off), the daily and monthly caps counted on runs started in the
 * period (never on published posts, so a second runner or a restart mid-run cannot publish
 * twice), the cost cap, the connection's monthly limit, and the publish hour in Riyadh.
 * Pure: the tick and the "Generate now" route feed it.
 */
export interface CapSettings {
  enabled: boolean;
  postsPerDay: number;
  publishHourRiyadh: number;
  maxPostsPerMonth: number;
  dailyCostCapUsd: number;
  /** The engine's connection (ADR-047): null when the settings name none. */
  connection: { label: string; enabled: boolean; monthlyLimitUsd: number | null } | null;
}

export interface CapCounts {
  /** `generate` runs started today and this month (a freshness run rewrites, it does not add). */
  runsToday: number;
  runsThisMonth: number;
  /** The writing engine's cost today (`generate` and `freshness`); the ledger's `citation` runs are the connection's limit's business, not this cap's. */
  costTodayUsd: number;
  /** The connection's runs this month, whatever their kind; a Test never counts. */
  connectionSpentMonthUsd: number;
}

export interface CapDecision {
  allowed: boolean;
  reason: string | null;
}

/** Today's cost as the daily cap reads it: the writing engine's runs, never the ledger's (ADR-049 D5). */
export function costTodayOf(
  runs: Array<{ kind?: string | null; costUsd?: number | null }>,
): number {
  return runs.filter((r) => r.kind !== 'citation').reduce((n, r) => n + (r.costUsd ?? 0), 0);
}

/** `AI_CONTENT_ENABLED=false` (or `0`) stops every run whatever the settings say. */
export function envAllows(raw: Record<string, string | undefined> = process.env): boolean {
  const value = raw['AI_CONTENT_ENABLED'];
  return !(value === 'false' || value === '0' || value === 'off');
}

/**
 * Whether a run may start now. `manual` skips the hour (a person pressed the button) but
 * never the switch, the env, the connection or the caps. A `freshness` run rewrites a post
 * that exists, so the posts-per-day and per-month caps and the hour do not apply to it; the
 * switch, the env, the connection, the daily cost cap and the connection's monthly limit do.
 * The limit refuses at `spent >= limit`, so the overshoot is at most one run.
 */
export function capDecision(args: {
  settings: CapSettings;
  counts: CapCounts;
  now: Date;
  manual?: boolean;
  kind?: 'generate' | 'freshness';
  env?: Record<string, string | undefined>;
}): CapDecision {
  const { settings, counts, now, manual = false, kind = 'generate' } = args;
  if (!envAllows(args.env)) return { allowed: false, reason: 'AI_CONTENT_ENABLED is off' };
  if (!settings.enabled) return { allowed: false, reason: 'the engine is switched off' };
  const connection = settings.connection;
  if (!connection)
    return { allowed: false, reason: 'no connection: pick one in the engine settings' };
  if (!connection.enabled) {
    return { allowed: false, reason: `the connection "${connection.label}" is off` };
  }
  if (counts.costTodayUsd >= settings.dailyCostCapUsd) {
    return {
      allowed: false,
      reason: `today's cost ${counts.costTodayUsd.toFixed(2)} USD reached the cap ${settings.dailyCostCapUsd} USD`,
    };
  }
  const limit = connection.monthlyLimitUsd;
  if (limit !== null && counts.connectionSpentMonthUsd >= limit) {
    return {
      allowed: false,
      reason: `this month's cost ${counts.connectionSpentMonthUsd.toFixed(2)} USD on the connection "${connection.label}" reached its limit ${limit} USD`,
    };
  }
  if (kind === 'freshness') return { allowed: true, reason: null };
  if (counts.runsToday >= settings.postsPerDay) {
    return {
      allowed: false,
      reason: `${counts.runsToday} run(s) today already (cap ${settings.postsPerDay})`,
    };
  }
  if (counts.runsThisMonth >= settings.maxPostsPerMonth) {
    return {
      allowed: false,
      reason: `${counts.runsThisMonth} run(s) this month already (cap ${settings.maxPostsPerMonth})`,
    };
  }
  if (!manual && riyadh(now).hour < settings.publishHourRiyadh) {
    return {
      allowed: false,
      reason: `before the publish hour (${settings.publishHourRiyadh}:00 Riyadh)`,
    };
  }
  return { allowed: true, reason: null };
}
