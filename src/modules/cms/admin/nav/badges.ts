import type { Payload, TypedUser } from 'payload';
import { riyadhMonthStart } from '@/lib/riyadh';
import type { CollectionSlug } from '@/modules/cms/admin/icons';
import { overLimitConnections } from '@/modules/connections/spend';

/**
 * The sidebar's badges (ADR-058): a number only where it asks for action, never a count of
 * documents. Three exist: runs that failed this month on Runs (red), posts still in draft
 * on Posts (amber; `_status` is the cheap proxy, a newer draft over a published post is not
 * counted) and connections past their monthly limit on Connections (red). Zero is no badge.
 */
export type NavBadgeKind = 'failedRuns' | 'drafts' | 'overLimit';

export interface NavBadge {
  kind: NavBadgeKind;
  count: number;
  tone: 'error' | 'warning';
}

export const BADGE_TONE: Record<NavBadgeKind, NavBadge['tone']> = {
  failedRuns: 'error',
  drafts: 'warning',
  overLimit: 'error',
};

/** The entry a badge sits on. */
export const BADGE_ENTRY: Record<NavBadgeKind, CollectionSlug> = {
  failedRuns: 'ai-runs',
  drafts: 'posts',
  overLimit: 'connections',
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
  failedRuns: async ({ payload, user, now }) =>
    (
      await payload.count({
        collection: 'ai-runs',
        where: {
          and: [
            { status: { equals: 'failed' } },
            { startedAt: { greater_than_equal: riyadhMonthStart(now).toISOString() } },
          ],
        },
        overrideAccess: false,
        user,
      })
    ).totalDocs,
  drafts: async ({ payload, user }) =>
    (
      await payload.count({
        collection: 'posts',
        where: { _status: { equals: 'draft' } },
        overrideAccess: false,
        user,
      })
    ).totalDocs,
  overLimit: ({ payload, now }) => overLimitConnections(payload, now),
};

/**
 * The badges for the entries this user sees, read in parallel with the user's access, one
 * cheap query each (the connections one is two), never cached: a badge that lags a fix is
 * worse than none. A failed read logs and leaves that entry without a badge.
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
