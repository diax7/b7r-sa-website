import type { CollectionConfig } from 'payload';
import { hiddenUnlessAdmin, isAdmin } from '@/modules/cms/access';
import { describeFields } from '@/modules/cms/admin/descriptions/describe';
import { collectionComponents } from '@/modules/cms/admin/document/config';
import { adminGroup } from '@/modules/cms/admin/icons';
import { savedByField, stampSavedBy } from '@/modules/cms/fields/saved-by';
import { PROMPT_DESCRIPTIONS } from '@/modules/visibility/descriptions';

export const PROMPTS = 'prompts' as const;
export const PROMPT_INTENTS = ['category', 'compare', 'how-to'] as const;
export type PromptIntent = (typeof PROMPT_INTENTS)[number];

/**
 * The questions a buyer asks an assistant (ADR-049 D5): the ledger runs every morning and
 * asks each enabled prompt to every enabled AI connection on the prompt's own period (every
 * N days, 1 = daily), recording who named B7R. A prompt that names the brand itself (a
 * compare prompt, "what is B7R Print?") is asked too but leaves the cited-rate's denominator.
 * Seeded from the BRD's category terms plus the brand's own questions; editable.
 */
export const Prompts: CollectionConfig = {
  slug: PROMPTS,
  labels: {
    singular: { ar: 'سؤال', en: 'Question' },
    plural: { ar: 'أسئلة المشترين', en: 'Buyer questions' },
  },
  admin: {
    hideAPIURL: true,
    useAsTitle: 'text',
    defaultColumns: ['text', 'language', 'intent', 'enabled'],
    listSearchableFields: ['text'],
    group: adminGroup('visibility'),
    components: collectionComponents(PROMPTS),
    custom: {
      shows: {
        ar: 'لا يظهر في الموقع: ما يُسأل عنه مساعدو الذكاء الاصطناعي كل أسبوع',
        en: 'nowhere on the site: what the AI assistants are asked every week',
      },
    },
    hidden: hiddenUnlessAdmin,
    description: {
      ar: 'الأسئلة التي يطرحها المشتري على مساعد ذكاء اصطناعي، والتي ينبغي أن يُذكر فيها بحر برنت؛ يسألها السجل كل أسبوع.',
      en: 'The questions a buyer asks an AI assistant, the ones B7R should be named for; the ledger asks them every week.',
    },
  },
  access: { read: isAdmin, create: isAdmin, update: isAdmin, delete: isAdmin },
  defaultSort: 'order',
  hooks: { beforeChange: [stampSavedBy] },
  fields: describeFields(
    [
      {
        name: 'text',
        type: 'textarea',
        required: true,
        maxLength: 300,
        label: { ar: 'السؤال', en: 'Question' },
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
          },
          {
            name: 'intent',
            type: 'select',
            required: true,
            defaultValue: 'category',
            options: [
              { value: 'category', label: { ar: 'فئة', en: 'Category' } },
              { value: 'compare', label: { ar: 'مقارنة', en: 'Compare' } },
              { value: 'how-to', label: { ar: 'كيف', en: 'How-to' } },
            ],
            label: { ar: 'القصد', en: 'Intent' },
          },
          {
            name: 'order',
            type: 'number',
            required: true,
            defaultValue: 100,
            min: 0,
            label: { ar: 'الترتيب', en: 'Order' },
          },
          {
            name: 'everyDays',
            type: 'number',
            required: true,
            defaultValue: 7,
            min: 1,
            max: 365,
            label: { ar: 'يُسأل كل (أيام)', en: 'Ask every (days)' },
          },
        ],
      },
      {
        name: 'namesBrand',
        type: 'checkbox',
        defaultValue: false,
        label: { ar: 'يذكر العلامة', en: 'Names the brand' },
        admin: { position: 'sidebar' },
      },
      {
        name: 'enabled',
        type: 'checkbox',
        defaultValue: true,
        label: { ar: 'مفعّل', en: 'On' },
        admin: {
          position: 'sidebar',
          components: { Field: '@/modules/cms/admin/fields/enabled-switch#EnabledSwitch' },
        },
      },
      savedByField,
    ],
    PROMPT_DESCRIPTIONS,
  ),
};
