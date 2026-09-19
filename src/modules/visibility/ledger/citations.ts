import type { CollectionConfig } from 'payload';
import { hiddenUnlessAdmin, isAdmin } from '@/modules/cms/access';
import { describeFields } from '@/modules/cms/admin/descriptions/describe';
import { collectionComponents } from '@/modules/cms/admin/document/config';
import { adminGroup } from '@/modules/cms/admin/icons';
import { CITATION_DESCRIPTIONS } from '@/modules/visibility/descriptions';

export const CITATIONS = 'citations' as const;

const never = () => false;

/**
 * The citation ledger (ADR-049 D5): one row per prompt, per connection, per batch, written
 * by the weekly run; admins may delete a wrong batch (a test connection, a mis-set model)
 * so it leaves the four-week window the score reads. `connection` and `prompt` are links
 * (a deleted row nulls them, as `ai-runs` does); `provider`, `model`, `promptText` and
 * `namesBrand` stay as values, so a row still says what was asked of whom after an edit.
 */
export const Citations: CollectionConfig = {
  slug: CITATIONS,
  labels: {
    singular: { ar: 'استشهاد', en: 'Citation' },
    plural: { ar: 'سجل الاستشهادات', en: 'Citations' },
  },
  admin: {
    hideAPIURL: true,
    useAsTitle: 'title',
    defaultColumns: ['title', 'promptText', 'mentioned', 'linked', 'mode'],
    listSearchableFields: ['title', 'promptText', 'excerpt'],
    group: adminGroup('visibility'),
    components: collectionComponents(CITATIONS),
    custom: {
      shows: {
        ar: 'لا يظهر في الموقع: ما أجاب به كل مساعد عن كل سؤال، ومن ذكر بحر برنت',
        en: 'nowhere on the site: what each assistant answered to each prompt, and who named B7R',
      },
    },
    hidden: hiddenUnlessAdmin,
    description: {
      ar: 'إجابة كل مساعد عن كل سؤال في كل جولة: هل ذكر بحر برنت، هل ربط إليه، ومن ذكر من المنافسين. للقراءة فقط.',
      en: 'Each assistant’s answer to each prompt in each run: whether it named B7R, linked to it, and which competitors it named. Read-only.',
    },
  },
  access: { read: isAdmin, create: never, update: never, delete: isAdmin },
  defaultSort: '-createdAt',
  fields: describeFields(
    [
      {
        name: 'title',
        type: 'text',
        required: true,
        label: { ar: 'اليوم والمحرّك', en: 'Day and engine' },
        admin: { readOnly: true },
      },
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
            name: 'provider',
            type: 'text',
            required: true,
            label: { ar: 'الخدمة', en: 'Service' },
            admin: { readOnly: true },
          },
          {
            name: 'model',
            type: 'text',
            label: { ar: 'النموذج', en: 'Model' },
            admin: { readOnly: true },
          },
          {
            name: 'mode',
            type: 'select',
            required: true,
            options: [
              { value: 'search', label: { ar: 'مفعّل', en: 'On' } },
              { value: 'plain', label: { ar: 'معطّل', en: 'Off' } },
            ],
            label: { ar: 'بحث الويب', en: 'Web search' },
            admin: { readOnly: true },
          },
        ],
      },
      {
        type: 'row',
        fields: [
          {
            name: 'mentioned',
            type: 'checkbox',
            defaultValue: false,
            label: { ar: 'ذكر بحر برنت', en: 'Named B7R' },
            admin: { readOnly: true },
          },
          {
            name: 'linked',
            type: 'checkbox',
            defaultValue: false,
            label: { ar: 'ربط إلى الموقع', en: 'Linked to the site' },
            admin: { readOnly: true },
          },
          {
            name: 'namesBrand',
            type: 'checkbox',
            defaultValue: false,
            label: { ar: 'السؤال يذكر العلامة', en: 'The prompt names the brand' },
            admin: { readOnly: true },
          },
        ],
      },
      {
        name: 'promptText',
        type: 'textarea',
        label: { ar: 'نص السؤال', en: 'Prompt text' },
        admin: { readOnly: true },
      },
      {
        name: 'excerpt',
        type: 'textarea',
        label: { ar: 'مقتطف', en: 'Excerpt' },
        admin: { readOnly: true },
      },
      {
        name: 'answer',
        type: 'richText',
        label: { ar: 'الإجابة كاملة', en: 'The full answer' },
        admin: { readOnly: true },
      },
      {
        name: 'urls',
        type: 'json',
        label: { ar: 'الروابط', en: 'URLs' },
        admin: { readOnly: true },
      },
      {
        name: 'competitors',
        type: 'json',
        label: { ar: 'المنافسون المذكورون', en: 'Competitors named' },
        admin: { readOnly: true },
      },
      {
        name: 'prompt',
        type: 'relationship',
        relationTo: 'prompts',
        label: { ar: 'السؤال', en: 'Prompt' },
        admin: {
          position: 'sidebar',
          readOnly: true,
          condition: (data) => Boolean(data?.['prompt']),
        },
      },
      {
        name: 'connection',
        type: 'relationship',
        relationTo: 'connections',
        label: { ar: 'الاتصال', en: 'Connection' },
        admin: {
          position: 'sidebar',
          readOnly: true,
          condition: (data) => Boolean(data?.['connection']),
        },
      },
      {
        name: 'run',
        type: 'relationship',
        relationTo: 'ai-runs',
        label: { ar: 'الجولة', en: 'Run' },
        admin: {
          position: 'sidebar',
          readOnly: true,
          condition: (data) => Boolean(data?.['run']),
        },
      },
    ],
    CITATION_DESCRIPTIONS,
  ),
};
