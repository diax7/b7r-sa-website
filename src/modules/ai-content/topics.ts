import type { CollectionConfig } from 'payload';
import { hiddenUnlessAdmin, isAdmin } from '@/modules/cms/access';
import { savedByField, stampSavedBy } from '@/modules/cms/fields/saved-by';
import { collectionComponents } from '@/modules/cms/admin/document/config';
import { adminGroup } from '@/modules/cms/admin/icons';
import { AI_TOPICS_DESCRIPTIONS } from '@/modules/ai-content/descriptions';
import { describeFields } from '@/modules/cms/admin/descriptions/describe';

export const TOPIC_STATUSES = [
  'backlog',
  'scheduled',
  'generating',
  'published',
  'failed',
  'rejected',
] as const;
export type TopicStatus = (typeof TOPIC_STATUSES)[number];

export const TOPIC_INTENTS = ['informational', 'commercial', 'seasonal'] as const;
export type TopicIntent = (typeof TOPIC_INTENTS)[number];

/**
 * The backlog (BRD 10.2.2): what the engine writes about, in priority order, with a window
 * for seasonal topics. Admin only; `status` is the pipeline's, `post` and `lastRun` the
 * trail back to what it produced.
 */
export const AiTopics: CollectionConfig = {
  slug: 'ai-topics',
  labels: { singular: { ar: 'موضوع', en: 'Topic' }, plural: { ar: 'المواضيع', en: 'Topics' } },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'language', 'hub', 'status', 'priority', 'windowStart', 'post'],
    listSearchableFields: ['title', 'primaryKeyword'],
    group: adminGroup('blog'),
    custom: {
      shows: {
        ar: 'لا يظهر في الموقع: قائمة المواضيع التي سيكتبها المحرّك',
        en: "nowhere on the site: the engine's backlog of posts to write",
      },
    },
    hidden: hiddenUnlessAdmin,
    description: {
      ar: 'قائمة المواضيع التي يكتب عنها المحرّك، بالأولوية. الموسمية لها نافذة نشر.',
      en: 'What the engine writes about, by priority. Seasonal topics carry a publish window.',
    },
    components: {
      ...collectionComponents('ai-topics', { localized: false }),
      edit: { beforeDocumentControls: ['@/modules/ai-content/admin/generate-now#GenerateNow'] },
      beforeList: ['@/modules/ai-content/admin/import-topics#ImportTopics'],
    },
  },
  access: { read: isAdmin, create: isAdmin, update: isAdmin, delete: isAdmin },
  hooks: { beforeChange: [stampSavedBy] },
  fields: describeFields(
    [
      {
        name: 'title',
        type: 'text',
        required: true,
        label: { ar: 'العنوان المقترح', en: 'Working title' },
      },
      {
        type: 'row',
        fields: [
          {
            name: 'language',
            type: 'select',
            required: true,
            defaultValue: 'ar',
            options: [
              { value: 'ar', label: { ar: 'العربية', en: 'Arabic' } },
              { value: 'en', label: { ar: 'الإنجليزية', en: 'English' } },
            ],
            label: { ar: 'اللغة', en: 'Language' },
            admin: {
              description: {
                ar: 'لغة المقال الذي سيُكتب: يُنشر على المدونة العربية أو الإنجليزية.',
                en: 'The language the post is written in: it lands on the Arabic or the English blog.',
              },
            },
          },
          {
            name: 'hub',
            type: 'relationship',
            relationTo: 'categories',
            required: true,
            label: { ar: 'القسم', en: 'Hub' },
          },
          {
            name: 'intent',
            type: 'select',
            required: true,
            defaultValue: 'informational',
            options: [
              { value: 'informational', label: { ar: 'معلوماتي', en: 'Informational' } },
              { value: 'commercial', label: { ar: 'تجاري', en: 'Commercial' } },
              { value: 'seasonal', label: { ar: 'موسمي', en: 'Seasonal' } },
            ],
            label: { ar: 'القصد', en: 'Intent' },
          },
          {
            name: 'priority',
            type: 'number',
            required: true,
            defaultValue: 3,
            min: 1,
            max: 5,
            label: { ar: 'الأولوية (1 إلى 5)', en: 'Priority (1 to 5)' },
          },
        ],
      },
      {
        name: 'primaryKeyword',
        type: 'text',
        required: true,
        label: { ar: 'الكلمة المفتاحية', en: 'Primary keyword' },
      },
      {
        name: 'secondaryKeywords',
        type: 'array',
        label: { ar: 'كلمات ثانوية', en: 'Secondary keywords' },
        labels: {
          singular: { ar: 'كلمة', en: 'Keyword' },
          plural: { ar: 'كلمات', en: 'Keywords' },
        },
        fields: [
          { name: 'keyword', type: 'text', required: true, label: { ar: 'الكلمة', en: 'Keyword' } },
        ],
      },
      {
        type: 'row',
        fields: [
          {
            name: 'windowStart',
            type: 'date',
            label: { ar: 'بداية نافذة النشر', en: 'Window start' },
            admin: { date: { pickerAppearance: 'dayOnly' } },
          },
          {
            name: 'windowEnd',
            type: 'date',
            label: { ar: 'نهاية نافذة النشر', en: 'Window end' },
            admin: {
              date: { pickerAppearance: 'dayOnly' },
              description: {
                ar: 'للمواضيع الموسمية: يُنشر داخل النافذة فقط. اتركهما فارغين لموضوع دائم.',
                en: 'Seasonal topics publish inside the window only. Leave both empty for an evergreen topic.',
              },
            },
          },
        ],
      },
      {
        type: 'row',
        fields: [
          {
            name: 'status',
            type: 'select',
            required: true,
            defaultValue: 'backlog',
            options: TOPIC_STATUSES.map((value) => ({ value, label: value })),
            label: { ar: 'الحالة', en: 'Status' },
          },
          {
            name: 'source',
            type: 'select',
            required: true,
            defaultValue: 'manual',
            options: [
              { value: 'seed', label: { ar: 'القائمة الأولى', en: 'Seed' } },
              { value: 'manual', label: { ar: 'يدوي', en: 'Manual' } },
              { value: 'searchConsole', label: 'Search Console' },
            ],
            label: { ar: 'المصدر', en: 'Source' },
          },
        ],
      },
      { name: 'notes', type: 'textarea', label: { ar: 'ملاحظات', en: 'Notes' } },
      {
        name: 'post',
        type: 'relationship',
        relationTo: 'posts',
        label: { ar: 'المقال الناتج', en: 'Resulting post' },
        admin: { position: 'sidebar', readOnly: true },
      },
      {
        name: 'lastRun',
        type: 'relationship',
        relationTo: 'ai-runs',
        label: { ar: 'آخر جولة', en: 'Last run' },
        admin: { position: 'sidebar', readOnly: true },
      },
      {
        name: 'lastError',
        type: 'textarea',
        label: { ar: 'آخر خطأ', en: 'Last error' },
        admin: { position: 'sidebar', readOnly: true },
      },
      savedByField,
    ],
    AI_TOPICS_DESCRIPTIONS,
  ),
};
