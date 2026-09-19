import type { Payload, TypedUser } from 'payload';
import {
  draftsWaiting,
  FAILED_RUNS_DAYS,
  failedRuns,
  inboxReading,
} from '@/modules/cms/admin/dashboard/readers';
import type { CollectionSlug } from '@/modules/cms/admin/icons';
import { overLimitConnections } from '@/modules/connections/spend';

/**
 * The sidebar's badges (ADR-058): a number only where it asks for action, never a count of
 * documents. Four exist: runs that failed this week on Runs (red), posts whose newest
 * version is a draft on Posts (amber), connections past their monthly limit on
 * Connections (red) and messages nobody has opened on Messages (red, ADR-061). The runs,
 * the drafts and the inbox are the dashboard's own readers (ADR-059), so the badge, the
 * tile or the card and the hand line show one number. Zero is no badge.
 */
export type NavBadgeKind = 'failedRuns' | 'drafts' | 'overLimit' | 'inbox';

export interface NavBadge {
  kind: NavBadgeKind;
  count: number;
  tone: 'error' | 'warning';
}

export const BADGE_TONE: Record<NavBadgeKind, NavBadge['tone']> = {
  failedRuns: 'error',
  drafts: 'warning',
  overLimit: 'error',
  inbox: 'error',
};

/** The entry a badge sits on. */
export const BADGE_ENTRY: Record<NavBadgeKind, CollectionSlug> = {
  failedRuns: 'ai-runs',
  drafts: 'posts',
  overLimit: 'connections',
  inbox: 'messages',
};

/** The rule: a badge for a positive count in the kind's tone; nothing for zero or less. */
export function badgeFor(kind: NavBadgeKind, count: number): NavBadge | undefined {
  return Number.isInteger(count) && count > 0 ? { kind, count, tone: BADGE_TONE[kind] } : undefined;
}

type Reader = (args: {
  payload: Payload;
  user: TypedUser | undefined;
  now: Date;
}) => Promise<number>;

const READERS: Record<NavBadgeKind, Reader> = {
  failedRuns: ({ payload, user, now }) =>
    failedRuns(payload, { days: FAILED_RUNS_DAYS, now, user: user ?? null }),
  drafts: async ({ payload, user, now }) =>
    (await draftsWaiting(payload, { collections: ['posts'], now, user: user ?? null }))[0]
      ?.waiting ?? 0,
  overLimit: ({ payload, now }) => overLimitConnections(payload, now),
  inbox: async ({ payload, user }) =>
    (await inboxReading(payload, { user: user ?? null })).newCount,
};

/**
 * The badges for the entries this user sees, read in parallel with the user's access (one
 * `count` for the runs, two `countVersions` for the drafts, two `find`s for the
 * connections, one `find` for the inbox), never cached: a badge that lags a fix is worse
 * than none. A failed read logs and leaves that entry without a badge.
 */
export async function navBadges(args: {
  payload: Payload;
  user: TypedUser | undefined;
  visible: ReadonlySet<string>;
  now?: Date;
}): Promise<Partial<Record<CollectionSlug, NavBadge>>> {
  const { payload, user, visible, now = new Date() } = args;
  const kinds = (Object.keys(READERS) as NavBadgeKind[]).filter((k) => visible.has(BADGE_ENTRY[k]));
  const read = await Promise.all(
    kinds.map(async (kind) => {
      try {
        return [kind, badgeFor(kind, await READERS[kind]({ payload, user, now }))] as const;
      } catch (error) {
        payload.logger.error({ err: error, msg: `nav: the ${kind} badge failed` });
        return [kind, undefined] as const;
      }
    }),
  );
  return Object.fromEntries(
    read.flatMap(([kind, badge]) => (badge ? [[BADGE_ENTRY[kind], badge]] : [])),
  );
}
