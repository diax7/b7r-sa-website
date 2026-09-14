import type { Field, GlobalConfig } from 'payload';
import { hiddenUnlessAdmin, isAdmin } from '@/modules/cms/access';
import { savedByField, stampSavedByGlobal } from '@/modules/cms/fields/saved-by';
import {
  DEFAULT_BANNED_CLAIMS,
  DEFAULT_BANNED_PHRASES,
  DEFAULT_IMAGE_STYLE,
  DEFAULT_STYLE_GUIDE,
  DEFAULT_SYSTEM_PROMPT,
} from '@/modules/ai-content/prompts/defaults';
import { secretField } from '@/modules/ai-content/secret-field';

export const AI_GROUP = { ar: 'المحتوى الآلي', en: 'AI content' };

type Vendor = 'openai' | 'deepseek' | 'anthropic' | 'google';

/** Published prices per million tokens at the time of writing; an estimate, editable. */
const DEFAULT_RATES: Record<Vendor, { input: number; output: number }> = {
  openai: { input: 2, output: 8 },
  deepseek: { input: 0.27, output: 1.1 },
  anthropic: { input: 3, output: 15 },
  google: { input: 1.25, output: 10 },
};

const DEFAULT_MODELS: Record<Vendor, string> = {
  openai: 'gpt-4.1',
  deepseek: 'deepseek-chat',
  anthropic: 'claude-sonnet-4-5',
  google: 'gemini-2.5-pro',
};

const VENDORS: Array<{ value: Vendor; label: string }> = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'google', label: 'Google' },
];

function vendorFields(vendor: { value: Vendor; label: string }): Field {
  return {
    type: 'group',
    name: vendor.value,
    label: vendor.label,
    fields: [
      {
        type: 'row',
        fields: [
          {
            name: 'model',
            type: 'text',
            required: true,
            defaultValue: DEFAULT_MODELS[vendor.value],
            label: { ar: 'معرّف النموذج', en: 'Model id' },
            admin: { description: { ar: 'كما هو في وثائق المزوّد.', en: 'As in the vendor docs.' } },
          },
          secretField('apiKey', { ar: 'مفتاح API', en: 'API key' }),
        ],
      },
      {
        type: 'row',
        fields: [
          number(
            'inputPerMillionUsd',
            { ar: 'سعر المليون رمز داخل (تقديري، دولار)', en: 'Input USD per 1M tokens (estimate)' },
            DEFAULT_RATES[vendor.value].input,
            { min: 0 },
          ),
          number(
            'outputPerMillionUsd',
            {
              ar: 'سعر المليون رمز خارج (تقديري، دولار)',
              en: 'Output USD per 1M tokens (estimate)',
            },
            DEFAULT_RATES[vendor.value].output,
            { min: 0 },
          ),
        ],
      },
    ],
  };
}

interface NumberOptions {
  min?: number;
  max?: number;
  description?: { ar: string; en: string };
}

function number(
  name: string,
  label: { ar: string; en: string },
  defaultValue: number,
  options: NumberOptions = {},
): Field {
  return {
    name,
    type: 'number',
    required: true,
    defaultValue,
    label,
    ...(options.min !== undefined ? { min: options.min } : {}),
    ...(options.max !== undefined ? { max: options.max } : {}),
    ...(options.description ? { admin: { description: options.description } } : {}),
  };
}

/**
 * The engine's settings (BRD 10.2.1; ADR-042): admin only, keys encrypted, the switch off
 * by default, every cap and every text the prompts use. The description carries the
 * research caveat the BRD asks for (10.2.5).
 */
export const AiSettings: GlobalConfig = {
  slug: 'ai-settings',
  label: { ar: 'إعدادات المحرّك', en: 'Engine settings' },
  admin: {
    group: AI_GROUP,
    hidden: hiddenUnlessAdmin,
    description: {
      ar: 'المحرّك ينشر تلقائياً بلا مراجعة بشرية (قرار D-44). النشر الآلي بكميات كبيرة دون مراجعة يعرّض الموقع لسياسة Google للمحتوى الموسّع؛ أبقِ الوتيرة معتدلة وبوابات الجودة صارمة.',
      en: 'The engine publishes without a human step (D-44). Unreviewed high-volume AI publishing risks the scaled-content policy of Google: keep the cadence moderate and the quality gates strict.',
    },
  },
  access: { read: isAdmin, update: isAdmin },
  hooks: {
    beforeChange: [
      stampSavedByGlobal,
      ({ data, originalDoc }) => {
        // The system prompt is versioned: a change bumps the number the runs record.
        const before = (originalDoc as { style?: { systemPrompt?: string } } | undefined)?.style
          ?.systemPrompt;
        const style = data['style'] as { systemPrompt?: string; systemPromptVersion?: number };
        if (style && before !== undefined && style.systemPrompt !== before) {
          style.systemPromptVersion = (style.systemPromptVersion ?? 1) + 1;
        }
        return data;
      },
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: { ar: 'المزوّدون', en: 'Providers' },
          fields: [
            {
              name: 'activeProvider',
              type: 'select',
              required: true,
              defaultValue: 'openai',
              options: [
                ...VENDORS,
                { value: 'mock', label: { ar: 'تجريبي (اختبارات فقط)', en: 'Mock (tests only)' } },
              ],
              label: { ar: 'المزوّد الفعّال', en: 'Active provider' },
              admin: {
                description: {
                  ar: 'التجريبي يعمل فقط عندما يكون AI_CONTENT_MOCK=1 في البيئة.',
                  en: 'The mock only runs when AI_CONTENT_MOCK=1 is set in the environment.',
                },
              },
            },
            { type: 'group', name: 'providers', label: false, fields: VENDORS.map(vendorFields) },
          ],
        },
        {
          label: { ar: 'الوتيرة', en: 'Cadence' },
          fields: [
            {
              name: 'enabled',
              type: 'checkbox',
              defaultValue: false,
              label: { ar: 'المحرّك يعمل', en: 'Engine on' },
              admin: {
                description: {
                  ar: 'مفتاح الإيقاف. عند الإيقاف لا تبدأ أي جولة جديدة خلال ساعة.',
                  en: 'The kill switch. Off, no new run starts within the hour.',
                },
              },
            },
            {
              type: 'row',
              fields: [
                number('postsPerDay', { ar: 'مقالات في اليوم', en: 'Posts per day' }, 1, {
                  min: 0,
                  max: 5,
                  description: {
                    ar: 'التوصية المدعومة بالدراسات: 8 إلى 16 مقالة شهرياً؛ الجودة قبل الكمية.',
                    en: 'The research-backed range: 8 to 16 posts a month; quality before quantity.',
                  },
                }),
                number(
                  'publishHourRiyadh',
                  { ar: 'ساعة النشر (الرياض)', en: 'Publish hour (Riyadh)' },
                  9,
                  {
                    min: 0,
                    max: 23,
                  },
                ),
                number('maxPostsPerMonth', { ar: 'الحد الشهري', en: 'Monthly cap' }, 31, {
                  min: 0,
                }),
              ],
            },
            {
              type: 'row',
              fields: [
                number(
                  'dailyCostCapUsd',
                  { ar: 'سقف التكلفة اليومي (دولار)', en: 'Daily cost cap (USD)' },
                  5,
                  {
                    min: 0,
                  },
                ),
                number(
                  'reviewFirstRuns',
                  { ar: 'أول مقالات حيّة كمسودات', en: 'First live posts as drafts' },
                  3,
                  {
                    min: 0,
                    description: {
                      ar: 'ما دام العدد فوق الصفر تُحفظ مقالات المزوّد الحي كمسودات لتقرأها؛ ضعه صفراً عندما تطمئن.',
                      en: 'While above zero the posts of a live provider land as drafts for your read; set it to 0 once they read well.',
                    },
                  },
                ),
              ],
            },
          ],
        },
        {
          label: { ar: 'اللغة والأسلوب', en: 'Language and style' },
          name: 'style',
          fields: [
            {
              name: 'styleGuide',
              type: 'textarea',
              required: true,
              defaultValue: DEFAULT_STYLE_GUIDE,
              label: { ar: 'دليل الأسلوب', en: 'Style guide' },
              admin: { rows: 14 },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'systemPrompt',
                  type: 'textarea',
                  required: true,
                  defaultValue: DEFAULT_SYSTEM_PROMPT,
                  label: { ar: 'التعليمات الأساسية', en: 'System prompt' },
                  admin: { rows: 8, width: '80%' },
                },
                {
                  name: 'systemPromptVersion',
                  type: 'number',
                  defaultValue: 1,
                  label: { ar: 'النسخة', en: 'Version' },
                  admin: { readOnly: true, width: '20%' },
                },
              ],
            },
            {
              name: 'bannedPhrases',
              type: 'textarea',
              required: true,
              defaultValue: DEFAULT_BANNED_PHRASES.join('\n'),
              label: { ar: 'عبارات ممنوعة (سطر لكل عبارة)', en: 'Banned phrases (one per line)' },
              admin: { rows: 6 },
            },
            {
              name: 'bannedClaims',
              type: 'textarea',
              required: true,
              defaultValue: DEFAULT_BANNED_CLAIMS,
              label: { ar: 'ادعاءات ممنوعة', en: 'Banned claims' },
              admin: { rows: 8 },
            },
          ],
        },
        {
          label: { ar: 'ورقة الحقائق', en: 'Facts sheet' },
          fields: [
            {
              name: 'factsSheet',
              type: 'ui',
              admin: {
                components: {
                  Field: '@/modules/ai-content/admin/facts-sheet-field#FactsSheetField',
                },
              },
            },
          ],
        },
        {
          label: { ar: 'الصور', en: 'Images' },
          name: 'images',
          fields: [
            {
              name: 'imageMode',
              type: 'select',
              required: true,
              defaultValue: 'hubDefault',
              options: [
                {
                  value: 'hubDefault',
                  label: { ar: 'غلاف القسم الافتراضي', en: 'The hub’s default cover' },
                },
                { value: 'stock', label: { ar: 'صورة من Pexels', en: 'A stock photo (Pexels)' } },
                {
                  value: 'generate',
                  label: { ar: 'توليد (غير متاح بعد)', en: 'Generate (not wired yet)' },
                },
              ],
              label: { ar: 'مصدر الغلاف', en: 'Cover source' },
              admin: {
                description: {
                  ar: 'التوليد يُرفض حتى يُربط مزوّد صور؛ Pexels يحتاج مفتاحاً.',
                  en: 'Generation is refused until an image provider is wired; Pexels needs a key.',
                },
              },
            },
            {
              name: 'imageStyle',
              type: 'text',
              defaultValue: DEFAULT_IMAGE_STYLE,
              label: { ar: 'ملحق أسلوب الصورة', en: 'Image style suffix' },
            },
            secretField('pexelsKey', { ar: 'مفتاح Pexels', en: 'Pexels API key' }),
          ],
        },
        {
          label: { ar: 'الجودة', en: 'Quality' },
          name: 'quality',
          fields: [
            {
              type: 'row',
              fields: [
                number(
                  'qualityThreshold',
                  { ar: 'حد الجودة (0 إلى 100)', en: 'Quality threshold (0 to 100)' },
                  80,
                  {
                    min: 0,
                    max: 100,
                  },
                ),
                number('maxRevisionPasses', { ar: 'جولات المراجعة', en: 'Revision passes' }, 1, {
                  min: 0,
                  max: 3,
                }),
                number('minWords', { ar: 'أقل عدد كلمات', en: 'Min words' }, 800, { min: 100 }),
                number('maxWords', { ar: 'أعلى عدد كلمات', en: 'Max words' }, 1600, { min: 200 }),
              ],
            },
          ],
        },
        {
          label: { ar: 'التنبيهات', en: 'Notifications' },
          name: 'notifications',
          fields: [
            {
              name: 'notifyEmail',
              type: 'email',
              label: { ar: 'البريد', en: 'E-mail' },
              admin: {
                description: {
                  ar: 'يستقبل تنبيهات الفشل والملخص الأسبوعي.',
                  en: 'Gets failure alerts and the weekly digest.',
                },
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'weeklyDigest',
                  type: 'checkbox',
                  defaultValue: true,
                  label: { ar: 'ملخص أسبوعي', en: 'Weekly digest' },
                },
                {
                  name: 'failureAlerts',
                  type: 'checkbox',
                  defaultValue: true,
                  label: { ar: 'تنبيه عند الفشل', en: 'Failure alerts' },
                },
              ],
            },
          ],
        },
      ],
    },
    savedByField,
  ],
};
