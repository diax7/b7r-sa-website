import type { Payload, PayloadRequest, TypedUser } from 'payload';
import { localeEnabledWith } from '@/lib/cms/locale-enabled';
import { riyadhDayWindow } from '@/lib/riyadh';
import { BOOKINGS, type BookingStatus, UPCOMING_STATUSES } from '@/modules/bookings/status';
import { kindsThat } from '@/modules/connections/kinds';
import { connectionSpend } from '@/modules/connections/spend';
import { sinceDay } from '@/modules/traffic/summary';
import { METRICS } from '@/modules/visibility/metrics';
import { editHref } from '@/modules/visibility/rules/shared';
import type { UmamiDay, UmamiRangeDays, UmamiRow } from '@/modules/visibility/services/umami';

/** The collections with drafts (`versions.drafts`), the ones the content section counts. */
export const CONTENT_COLLECTIONS = ['posts', 'pages', 'products'] as const;
export type ContentSlug = (typeof CONTENT_COLLECTIONS)[number];

/** The field an editor recognises, per collection: the one whose English decides the English page. */
const TITLE_FIELD: Record<ContentSlug, string> = {
  posts: 'title',
  pages: 'title',
  products: 'name',
};

const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;

type Access = { user: TypedUser; overrideAccess: false } | { overrideAccess: true };

function accessOf(user: TypedUser | null | undefined): Access {
  return user ? { user, overrideAccess: false } : { overrideAccess: true };
}

/** The Riyadh midnight that opens a range of `days` (today and the days before it). */
export function rangeStart(days: number, now: Date): Date {
  return new Date(`${sinceDay(days, now)}T00:00:00+03:00`);
}

/** Umami's people over a range (ADR-048 amended), as the visits tile and the card read them. */
export interface PeopleSummary extends UmamiDay {
  /** The previous range's numbers (Umami's own comparison); null when the rows were summed. */
  previous: UmamiDay | null;
  /**
   * True while no row of the range carries the range object (rows from before the ranges
   * were pulled): the days' uniques added up, so a person who came on three days counts
   * three times, and the tile and the card say so.
   */
  summed: boolean;
}

const five = (n: Partial<UmamiDay>): UmamiDay => ({
  visitors: Number(n.visitors ?? 0),
  pageviews: Number(n.pageviews ?? 0),
  visits: Number(n.visits ?? 0),
  bounces: Number(n.bounces ?? 0),
  totaltime: Number(n.totaltime ?? 0),
});

/**
 * The people of the last `days` days by Umami: the range object of the newest `umami` row
 * that carries one (the range's unique visitors ending on that day, with the previous
 * range's numbers; the pull writes it on yesterday's row), else the rows of the range summed
 * (the fallback, said as such). No `umami` row in the range reads null, and the visits tile
 * and the card then read as they do without the connection. Admins: the caller has checked
 * the collection's read.
 */
export async function peopleSummary(
  payload: Payload,
  args: { days: number; now?: Date },
): Promise<PeopleSummary | null> {
  const since = sinceDay(args.days, args.now ?? new Date());
  const { docs } = await payload.find({
    collection: METRICS,
    where: { and: [{ source: { equals: 'umami' } }, { date: { greater_than_equal: since } }] },
    depth: 0,
    pagination: false,
    sort: '-date',
    select: { date: true, data: true },
    overrideAccess: true,
  });
  if (docs.length === 0) return null;
  const rows = docs.map((d) => (d.data ?? {}) as Partial<UmamiRow>);
  const range = rows.map((r) => r.ranges?.[args.days as UmamiRangeDays]).find((r) => r);
  if (range) return { ...five(range), previous: five(range.previous ?? {}), summed: false };
  const summary: PeopleSummary = { ...five({}), previous: null, summed: true };
  for (const row of rows) {
    const day = five(row);
    summary.visitors += day.visitors;
    summary.pageviews += day.pageviews;
    summary.visits += day.visits;
    summary.bounces += day.bounces;
    summary.totaltime += day.totaltime;
  }
  return summary;
}

export interface PublishedCount {
  collection: ContentSlug;
  count: number;
}

/**
 * What went live in the range: posts by `publishedAt`, pages and products by the last save of
 * a published document (`updatedAt` with `_status: published`), as the audit's table says.
 */
export async function publishedInRange(
  payload: Payload,
  args: { collections: readonly ContentSlug[]; days: number; now?: Date; user?: TypedUser | null },
): Promise<PublishedCount[]> {
  const since = rangeStart(args.days, args.now ?? new Date()).toISOString();
  const access = accessOf(args.user);
  return Promise.all(
    args.collections.map(async (collection) => {
      const dateField = collection === 'posts' ? 'publishedAt' : 'updatedAt';
      const { totalDocs } = await payload.count({
        collection,
        where: {
          and: [
            { _status: { equals: 'published' } },
            { [dateField]: { greater_than_equal: since } },
          ],
        },
        ...access,
      });
      return { collection, count: totalDocs };
    }),
  );
}

export interface DraftCount {
  collection: ContentSlug;
  /** Documents whose newest version is a draft: never published, or a draft over the live one. */
  waiting: number;
  /** Of those, the ones nobody touched for a week. */
  stale: number;
}

/**
 * Drafts waiting, per collection: the one number Payload does not answer from the documents
 * table (a newer draft over a published version lives in the versions table only), so it is
 * two `countVersions` on `latest: true` per collection, the dashboard's one non-trivial query
 * (ADR-059); each count links to the list filtered on `_status`.
 */
export async function draftsWaiting(
  payload: Payload,
  args: { collections: readonly ContentSlug[]; now?: Date; user?: TypedUser | null },
): Promise<DraftCount[]> {
  const weekAgo = new Date((args.now ?? new Date()).getTime() - WEEK_MS).toISOString();
  const access = accessOf(args.user);
  const draft = [{ latest: { equals: true } }, { 'version._status': { equals: 'draft' } }];
  return Promise.all(
    args.collections.map(async (collection) => {
      const [waiting, stale] = await Promise.all([
        payload.countVersions({ collection, where: { and: draft }, ...access }),
        payload.countVersions({
          collection,
          where: { and: [...draft, { updatedAt: { less_than: weekAgo } }] },
          ...access,
        }),
      ]);
      return { collection, waiting: waiting.totalDocs, stale: stale.totalDocs };
    }),
  );
}

export interface MissingEnglish {
  collection: ContentSlug;
  count: number;
  /** The form of the first document without it, at its title: the English column beside it is the place that fixes the finding. */
  href: string | null;
}

/**
 * Published documents without their English title (the English page does not exist without
 * it, ADR-043), per collection, read with `locale: 'all'` and no fallback so an empty English
 * reads as empty. Nothing to count while the site is Arabic only.
 */
export async function missingEnglish(
  payload: Payload,
  args: { collections: readonly ContentSlug[]; user?: TypedUser | null },
): Promise<MissingEnglish[]> {
  if (!(await localeEnabledWith(payload, 'en'))) {
    return args.collections.map((collection) => ({ collection, count: 0, href: null }));
  }
  const access = accessOf(args.user);
  const adminRoute = payload.config.routes.admin;
  return Promise.all(
    args.collections.map(async (collection) => {
      const field = TITLE_FIELD[collection];
      const { docs } = await payload.find({
        collection,
        where: { _status: { equals: 'published' } },
        locale: 'all',
        fallbackLocale: false,
        depth: 0,
        pagination: false,
        select: { [field]: true },
        ...access,
      });
      const without = (docs as unknown as Array<Record<string, unknown> & { id: number }>).filter(
        (d) => {
          const value = d[field];
          const en =
            typeof value === 'object' && value ? (value as { en?: unknown }).en : undefined;
          return typeof en !== 'string' || en.trim() === '';
        },
      );
      const first = without[0];
      return {
        collection,
        count: without.length,
        href: first ? editHref(adminRoute, collection, first.id, field) : null,
      };
    }),
  );
}

export interface ConnectionRow {
  id: number;
  label: string;
  enabled: boolean;
  limitUsd: number | null;
  spentUsd: number;
  runs: number;
  lastTestAt: string | null;
  lastTestOk: boolean | null;
}

/**
 * One row per AI connection for the spend table (admins): the plain fields from the row and
 * the month's spend and runs from `connectionSpend`, once per request (`req.context` caches
 * it for the virtual fields too). The service kinds (Search Console, Bing, PageSpeed) spend
 * nothing and stay out.
 */
export async function connectionRows(
  payload: Payload,
  req: PayloadRequest,
  now = new Date(),
): Promise<ConnectionRow[]> {
  const { docs } = await payload.find({
    collection: 'connections',
    where: { kind: { in: kindsThat('ai') } },
    sort: 'id',
    depth: 0,
    pagination: false,
    select: {
      label: true,
      enabled: true,
      monthlyLimitUsd: true,
      lastTestAt: true,
      lastTestOk: true,
    },
    req,
    user: req.user,
    overrideAccess: false,
  });
  return Promise.all(
    docs.map(async (doc) => {
      const spend = await connectionSpend(payload, doc.id, now);
      return {
        id: doc.id,
        label: doc.label,
        enabled: doc.enabled !== false,
        limitUsd: doc.monthlyLimitUsd ?? null,
        spentUsd: spend.spentUsd,
        runs: spend.calls,
        lastTestAt: doc.lastTestAt ?? null,
        lastTestOk: doc.lastTestOk ?? null,
      };
    }),
  );
}

/** The window of the "failed runs" figure: the dashboard's hand line and the sidebar's badge on Runs read it. */
export const FAILED_RUNS_DAYS = 7;

/** Engine and ledger runs that failed in the last `days` days (admins). */
export async function failedRuns(
  payload: Payload,
  args: { days: number; now?: Date; user?: TypedUser | null },
): Promise<number> {
  const since = new Date((args.now ?? new Date()).getTime() - args.days * DAY_MS).toISOString();
  const { totalDocs } = await payload.count({
    collection: 'ai-runs',
    where: {
      and: [{ status: { equals: 'failed' } }, { startedAt: { greater_than_equal: since } }],
    },
    ...accessOf(args.user),
  });
  return totalDocs;
}

/** How many messages, and how many bookings, the dashboard card lists. */
export const INBOX_PREVIEW = 3;

export interface InboxReading {
  /** Messages nobody has opened: the card's first number. */
  newCount: number;
  /** The newest `INBOX_PREVIEW` new messages, for the card's rows. */
  newest: Array<{
    id: number;
    name: string;
    inquiry: string;
    message: string;
    createdAt: string;
  }>;
  /** Bookings still ahead that start today in Riyadh: the card's second number. */
  todayCount: number;
  /** The next `INBOX_PREVIEW` bookings ahead, soonest first, for the card's rows. */
  next: Array<{
    id: number;
    name: string;
    start: string;
    status: BookingStatus;
  }>;
  /** `newCount + todayCount`: the sidebar's badge on the inbox section (`inbox.waiting`). */
  waiting: number;
}

/**
 * The inbox for the dashboard and the sidebar (ADR-061, ADR-062): the count of `status:
 * new` messages with the newest three, the count of bookings still ahead that start today
 * (Riyadh) with the next three whichever day they fall on, and the two counts added for
 * the badge; read with the user's access, admins and editors alike (the two collections
 * share one read rule, so a user who sees one sees both).
 */
export async function inboxReading(
  payload: Payload,
  args: { user?: TypedUser | null; now?: Date },
): Promise<InboxReading> {
  const now = args.now ?? new Date();
  const access = accessOf(args.user);
  const [dayStart, dayEnd] = riyadhDayWindow(now);
  const ahead = { status: { in: [...UPCOMING_STATUSES] } };
  const [messages, today, bookings] = await Promise.all([
    payload.find({
      collection: 'messages',
      where: { status: { equals: 'new' } },
      sort: '-createdAt',
      limit: INBOX_PREVIEW,
      depth: 0,
      select: { name: true, inquiry: true, message: true, createdAt: true },
      ...access,
    }),
    payload.count({
      collection: BOOKINGS,
      where: {
        and: [
          ahead,
          { start: { greater_than_equal: dayStart.toISOString() } },
          { start: { less_than: dayEnd.toISOString() } },
        ],
      },
      ...access,
    }),
    payload.find({
      collection: BOOKINGS,
      where: { and: [ahead, { end: { greater_than: now.toISOString() } }] },
      sort: 'start',
      limit: INBOX_PREVIEW,
      depth: 0,
      select: { name: true, start: true, status: true },
      ...access,
    }),
  ]);
  return {
    newCount: messages.totalDocs,
    newest: messages.docs.map((doc) => ({
      id: doc.id,
      name: doc.name,
      inquiry: doc.inquiry,
      message: doc.message,
      createdAt: doc.createdAt,
    })),
    todayCount: today.totalDocs,
    next: bookings.docs.map((doc) => ({
      id: doc.id,
      name: doc.name,
      start: doc.start,
      status: doc.status,
    })),
    waiting: messages.totalDocs + today.totalDocs,
  };
}
