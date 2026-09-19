import type { CollectionConfig } from 'payload';
import { hiddenUnlessAdmin, isAdmin } from '@/modules/cms/access';
import { describeFields } from '@/modules/cms/admin/descriptions/describe';
import { collectionComponents } from '@/modules/cms/admin/document/config';
import { adminGroup } from '@/modules/cms/admin/icons';
import { TRAFFIC_DESCRIPTIONS } from '@/modules/traffic/descriptions';

export const TRAFFIC = 'traffic' as const;

const never = () => false;

/**
 * The site's own traffic count (ADR-048): one row per day, kind, source and page, with the
 * hits. Written only by the batcher's upsert (`counter.ts`), read by admins; the API creates,
 * changes and deletes nothing. The channel is not a column: `channelOf(source)` derives it
 * at read, so the classifier can improve and re-bucket the history. Nothing here identifies
 * a visitor: no IP, no user agent, no time finer than the day.
 */
export const Traffic: CollectionConfig = {
  slug: TRAFFIC,
  labels: {
    singular: { ar: 'عدّاد يومي', en: 'Daily count' },
    plural: { ar: 'العدّادات', en: 'Counts' },
  },
  admin: {
    hideAPIURL: true,
    useAsTitle: 'path',
    defaultColumns: ['date', 'kind', 'source', 'path', 'hits'],
    listSearchableFields: ['source', 'path'],
    group: adminGroup('visibility'),
    components: collectionComponents(TRAFFIC),
    custom: {
      shows: {
        ar: 'لا يظهر في الموقع: عدّاد الزيارات وزواحف الذكاء الاصطناعي',
        en: 'nowhere on the site: the count of visitors and AI crawlers',
      },
    },
    hidden: hiddenUnlessAdmin,
    description: {
      ar: 'من أين يأتي الزوار وماذا تقرأ زواحف الذكاء الاصطناعي: عدّاد يومي خاص بالموقع، بلا ملفات ارتباط ولا عناوين IP. للقراءة فقط.',
      en: "Where visitors come from and what the AI crawlers read: the site's own daily count, no cookies, no IP addresses. Read-only.",
    },
  },
  access: { read: isAdmin, create: never, update: never, delete: never },
  indexes: [{ fields: ['date', 'kind', 'source', 'path'], unique: true }],
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
            name: 'kind',
            type: 'select',
            required: true,
            options: [
              { value: 'landing', label: { ar: 'زيارة', en: 'Landing' } },
              { value: 'crawl', label: { ar: 'زحف', en: 'Crawl' } },
            ],
            label: { ar: 'النوع', en: 'Kind' },
            admin: { readOnly: true },
          },
          {
            name: 'hits',
            type: 'number',
            required: true,
            label: { ar: 'العدد', en: 'Count' },
            admin: { readOnly: true },
          },
        ],
      },
      {
        type: 'row',
        fields: [
          {
            name: 'source',
            type: 'text',
            required: true,
            label: { ar: 'المصدر', en: 'Source' },
            admin: { readOnly: true },
          },
          {
            name: 'path',
            type: 'text',
            required: true,
            label: { ar: 'الصفحة', en: 'Page' },
            admin: { readOnly: true },
          },
        ],
      },
    ],
    TRAFFIC_DESCRIPTIONS,
  ),
};
