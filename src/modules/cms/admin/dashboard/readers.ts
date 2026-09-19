import type { Payload, PayloadRequest, TypedUser } from 'payload';
import { localeEnabledWith } from '@/lib/cms/locale-enabled';
import { kindsThat } from '@/modules/connections/kinds';
import { connectionSpend } from '@/modules/connections/spend';
import { sinceDay } from '@/modules/traffic/summary';
import { editHref } from '@/modules/visibility/rules/shared';

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

/** How many messages the dashboard card lists (the newest ones that still read New). */
export const INBOX_PREVIEW = 3;

export interface InboxReading {
  /** Messages nobody has opened: the badge, the card's number. */
  newCount: number;
  /** The newest `INBOX_PREVIEW` new messages, for the card's rows. */
  newest: Array<{
    id: number;
    name: string;
    inquiry: string;
    message: string;
    createdAt: string;
  }>;
}

/**
 * The inbox for the dashboard and the sidebar (ADR-061): the count of `status: new` (the
 * sidebar's badge on Messages reads the same number) and the newest three of them, read
 * with the user's access; admins and editors alike.
 */
export async function inboxReading(
  payload: Payload,
  args: { user?: TypedUser | null },
): Promise<InboxReading> {
  const { docs, totalDocs } = await payload.find({
    collection: 'messages',
    where: { status: { equals: 'new' } },
    sort: '-createdAt',
    limit: INBOX_PREVIEW,
    depth: 0,
    select: { name: true, inquiry: true, message: true, createdAt: true },
    ...accessOf(args.user),
  });
  return {
    newCount: totalDocs,
    newest: docs.map((doc) => ({
      id: doc.id,
      name: doc.name,
      inquiry: doc.inquiry,
      message: doc.message,
      createdAt: doc.createdAt,
    })),
  };
}
