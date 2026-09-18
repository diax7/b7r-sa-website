import { type PostgresAdapter, sql } from '@payloadcms/db-postgres';
import type { CollectionConfig, Payload } from 'payload';
import { hiddenUnlessAdmin, isAdmin } from '@/modules/cms/access';
import { describeFields } from '@/modules/cms/admin/descriptions/describe';
import { collectionComponents } from '@/modules/cms/admin/document/config';
import { adminGroup } from '@/modules/cms/admin/icons';
import { METRICS_DESCRIPTIONS } from '@/modules/visibility/descriptions';

export const METRICS = 'metrics' as const;
export const METRIC_SOURCES = ['search-console', 'bing', 'pagespeed', 'score'] as const;
export type MetricSource = (typeof METRIC_SOURCES)[number];

const never = () => false;

/**
 * The nightly snapshots (ADR-049): one row per day (Riyadh) and source, the pull's answer as
 * JSON; the `score` source keeps the day's percentages, which is the score's only history.
 * Written by the pull's upsert alone, read by admins; the API creates, changes and deletes
 * nothing.
 */
export const Metrics: CollectionConfig = {
  slug: METRICS,
  labels: {
    singular: { ar: 'لقطة', en: 'Snapshot' },
    plural: { ar: 'اللقطات', en: 'Snapshots' },
  },
  admin: {
    hideAPIURL: true,
    useAsTitle: 'date',
    defaultColumns: ['date', 'source', 'updatedAt'],
    listSearchableFields: ['date', 'source'],
    group: adminGroup('visibility'),
    components: collectionComponents(METRICS, { localized: false }),
    custom: {
      shows: {
        ar: 'لا يظهر في الموقع: قراءات الخدمات الخارجية ودرجة كل يوم',
        en: "nowhere on the site: the outside services' readings and each day's score",
      },
    },
    hidden: hiddenUnlessAdmin,
    description: {
      ar: 'لقطة كل ليلة من Search Console وBing وPageSpeed، ودرجة الظهور ذلك اليوم. للقراءة فقط.',
      en: 'A nightly snapshot from Search Console, Bing and PageSpeed, and that day’s visibility score. Read-only.',
    },
  },
  access: { read: isAdmin, create: never, update: never, delete: never },
  indexes: [{ fields: ['date', 'source'], unique: true }],
  fields: describeFields(
    [
      {
        type: 'row',
        fields: [
          {
            name: 'date',
            type: 'text',
            required: true,
            label: { ar: 'اليوم', en: 'Day' },
            admin: { readOnly: true },
          },
          {
            name: 'source',
            type: 'select',
            required: true,
            options: [
              { value: 'search-console', label: { ar: 'Search Console', en: 'Search Console' } },
              { value: 'bing', label: { ar: 'Bing', en: 'Bing' } },
              { value: 'pagespeed', label: { ar: 'PageSpeed', en: 'PageSpeed' } },
              { value: 'score', label: { ar: 'الدرجة', en: 'Score' } },
            ],
            label: { ar: 'المصدر', en: 'Source' },
            admin: { readOnly: true },
          },
        ],
      },
      {
        name: 'data',
        type: 'json',
        required: true,
        label: { ar: 'البيانات', en: 'Data' },
        admin: { readOnly: true },
      },
    ],
    METRICS_DESCRIPTIONS,
  ),
};

/** Writes the day's row for a source, replacing the day's earlier one: a second pull the same day is the same row. */
export async function upsertMetric(
  payload: Payload,
  row: { date: string; source: MetricSource; data: unknown },
): Promise<void> {
  const { drizzle } = payload.db as unknown as Pick<PostgresAdapter, 'drizzle'>;
  await drizzle.execute(sql`
    INSERT INTO "metrics" ("date", "source", "data", "updated_at", "created_at")
    VALUES (${row.date}, ${row.source}::"enum_metrics_source", ${JSON.stringify(row.data)}::jsonb, now(), now())
    ON CONFLICT ("date", "source")
    DO UPDATE SET "data" = excluded."data", "updated_at" = now();`);
}

/** The latest rows of a source, newest first. */
export async function latestMetrics<T = unknown>(
  payload: Payload,
  source: MetricSource,
  limit: number,
): Promise<Array<{ date: string; data: T }>> {
  const result = await payload.find({
    collection: METRICS,
    where: { source: { equals: source } },
    sort: '-date',
    limit,
    depth: 0,
    overrideAccess: true,
  });
  return result.docs.map((d) => ({ date: d.date, data: d.data as T }));
}
