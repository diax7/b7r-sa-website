import type { CollectionConfig } from 'payload';
import { hiddenUnlessAdmin, isAdmin } from '@/modules/cms/access';
import { collectionComponents } from '@/modules/cms/admin/document/config';
import { adminGroup } from '@/modules/cms/admin/icons';

export const RUN_STATUSES = ['running', 'done', 'failed', 'skipped'] as const;
export type RunStatus = (typeof RUN_STATUSES)[number];

export const RUN_KINDS = ['generate', 'freshness', 'citation'] as const;
export type RunKind = (typeof RUN_KINDS)[number];

/**
 * The audit log (BRD 10.2.3): one row per pipeline execution, written by the pipeline
 * through the Local API and read-only for everyone else. Kept twelve months (the digest job
 * sweeps older rows). `connection` is the row's link to what it cost against (ADR-047);
 * `provider` and `model` stay as text, the history of runs before Connections included.
 */
export const AiRuns: CollectionConfig = {
  slug: 'ai-runs',
  labels: { singular: { ar: 'جولة', en: 'Run' }, plural: { ar: 'السجل', en: 'Runs' } },
  admin: {
    hideAPIURL: true,
    useAsTitle: 'label',
    defaultColumns: ['label', 'status', 'score', 'costUsd', 'durationMs', 'createdAt'],
    listSearchableFields: ['label', 'model'],
    group: adminGroup('blog'),
    components: collectionComponents('ai-runs', { localized: false }),
    custom: {
      shows: {
        ar: 'لا يظهر في الموقع: سجل تشغيلات المحرّك',
        en: 'nowhere on the site: what the engine did, run by run',
      },
    },
    hidden: hiddenUnlessAdmin,
    description: {
      ar: 'سجل جولات المحرّك: الخطوات، الدرجة، التكلفة التقديرية، والمقال الناتج. للقراءة فقط.',
      en: 'Every run of the engine: its steps, score, estimated cost and the resulting post. Read-only.',
    },
  },
  access: { read: isAdmin, create: () => false, update: () => false, delete: isAdmin },
  fields: [
    {
      name: 'label',
      type: 'text',
      required: true,
      label: { ar: 'الوصف', en: 'Label' },
      admin: { readOnly: true },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'kind',
          type: 'select',
          required: true,
          defaultValue: 'generate',
          options: RUN_KINDS.map((value) => ({ value, label: value })),
          label: { ar: 'النوع', en: 'Kind' },
          admin: { readOnly: true },
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'running',
          options: RUN_STATUSES.map((value) => ({ value, label: value })),
          label: { ar: 'الحالة', en: 'Status' },
          admin: { readOnly: true },
        },
        {
          name: 'provider',
          type: 'text',
          label: { ar: 'المزوّد', en: 'Provider' },
          admin: { readOnly: true },
        },
        {
          name: 'model',
          type: 'text',
          label: { ar: 'النموذج', en: 'Model' },
          admin: { readOnly: true },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'score',
          type: 'number',
          label: { ar: 'الدرجة', en: 'Score' },
          admin: { readOnly: true },
        },
        {
          name: 'tokensIn',
          type: 'number',
          label: { ar: 'رموز الدخل', en: 'Tokens in' },
          admin: { readOnly: true },
        },
        {
          name: 'tokensOut',
          type: 'number',
          label: { ar: 'رموز الخرج', en: 'Tokens out' },
          admin: { readOnly: true },
        },
        {
          name: 'costUsd',
          type: 'number',
          label: { ar: 'التكلفة التقديرية (دولار)', en: 'Estimated cost (USD)' },
          admin: { readOnly: true },
        },
        {
          name: 'durationMs',
          type: 'number',
          label: { ar: 'المدة (مللي ثانية)', en: 'Duration (ms)' },
          admin: { readOnly: true },
        },
      ],
    },
    {
      name: 'rubric',
      type: 'json',
      label: { ar: 'تفصيل الدرجة', en: 'Rubric' },
      admin: { readOnly: true },
    },
    {
      name: 'steps',
      type: 'json',
      label: { ar: 'الخطوات', en: 'Steps' },
      admin: { readOnly: true },
    },
    {
      name: 'outline',
      type: 'json',
      label: { ar: 'المخطط', en: 'Outline' },
      admin: {
        readOnly: true,
        description: {
          ar: 'يُعاد التوليد منه عند تحديث الحقائق.',
          en: 'The freshness job regenerates from it.',
        },
      },
    },
    {
      name: 'systemPromptVersion',
      type: 'number',
      label: { ar: 'نسخة التعليمات', en: 'Prompt version' },
      admin: { readOnly: true },
    },
    {
      name: 'connection',
      type: 'relationship',
      relationTo: 'connections',
      label: { ar: 'الاتصال', en: 'Connection' },
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'topic',
      type: 'relationship',
      relationTo: 'ai-topics',
      label: { ar: 'الموضوع', en: 'Topic' },
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'post',
      type: 'relationship',
      relationTo: 'posts',
      label: { ar: 'المقال', en: 'Post' },
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'error',
      type: 'textarea',
      label: { ar: 'الخطأ', en: 'Error' },
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'startedAt',
      type: 'date',
      label: { ar: 'البداية', en: 'Started' },
      admin: { position: 'sidebar', readOnly: true, date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'finishedAt',
      type: 'date',
      label: { ar: 'النهاية', en: 'Finished' },
      admin: { position: 'sidebar', readOnly: true, date: { pickerAppearance: 'dayAndTime' } },
    },
  ],
};
