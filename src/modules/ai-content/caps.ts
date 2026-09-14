/**
 * The guards before a run (BRD 10.2.4 scheduling, 10.2.5): the switch, the env override,
 * the daily and monthly caps counted on runs started in the period (never on published
 * posts, so a second runner or a restart mid-run cannot publish twice), the cost cap, and
 * the publish hour in Riyadh. Pure: the tick and the "Generate now" route feed it.
 */
export const RIYADH = 'Asia/Riyadh';

export interface RiyadhTime {
  hour: number;
  /** `YYYY-MM-DD` in Riyadh. */
  dateKey: string;
  /** `YYYY-MM` in Riyadh. */
  monthKey: string;
}

const parts = new Intl.DateTimeFormat('en-CA', {
  timeZone: RIYADH,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  hour12: false,
});

export function riyadh(now: Date): RiyadhTime {
  const map = Object.fromEntries(parts.formatToParts(now).map((p) => [p.type, p.value]));
  const dateKey = `${map['year']}-${map['month']}-${map['day']}`;
  return { hour: Number(map['hour']) % 24, dateKey, monthKey: dateKey.slice(0, 7) };
}

/** The UTC instant Riyadh's day began, for "runs started today" queries. */
export function riyadhDayStart(now: Date): Date {
  const { dateKey } = riyadh(now);
  // Riyadh is UTC+3 all year (no daylight saving).
  return new Date(`${dateKey}T00:00:00+03:00`);
}

export function riyadhMonthStart(now: Date): Date {
  const { monthKey } = riyadh(now);
  return new Date(`${monthKey}-01T00:00:00+03:00`);
}

export interface CapSettings {
  enabled: boolean;
  postsPerDay: number;
  publishHourRiyadh: number;
  maxPostsPerMonth: number;
  dailyCostCapUsd: number;
}

export interface CapCounts {
  runsToday: number;
  runsThisMonth: number;
  costTodayUsd: number;
}

export interface CapDecision {
  allowed: boolean;
  reason: string | null;
}

/** `AI_CONTENT_ENABLED=false` (or `0`) stops every run whatever the settings say. */
export function envAllows(raw: Record<string, string | undefined> = process.env): boolean {
  const value = raw['AI_CONTENT_ENABLED'];
  return !(value === 'false' || value === '0' || value === 'off');
}

/**
 * Whether a scheduled run may start now. `manual` skips the hour (a person pressed the
 * button) but never the switch, the env or the caps.
 */
export function capDecision(args: {
  settings: CapSettings;
  counts: CapCounts;
  now: Date;
  manual?: boolean;
  env?: Record<string, string | undefined>;
}): CapDecision {
  const { settings, counts, now, manual = false } = args;
  if (!envAllows(args.env)) return { allowed: false, reason: 'AI_CONTENT_ENABLED is off' };
  if (!settings.enabled) return { allowed: false, reason: 'the engine is switched off' };
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
  if (counts.costTodayUsd >= settings.dailyCostCapUsd) {
    return {
      allowed: false,
      reason: `today's cost ${counts.costTodayUsd.toFixed(2)} USD reached the cap ${settings.dailyCostCapUsd} USD`,
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
