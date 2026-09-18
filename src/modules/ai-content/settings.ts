import type { Field, GlobalConfig } from 'payload';
import { hiddenUnlessAdmin, isAdmin } from '@/modules/cms/access';
import { savedByField, stampSavedByGlobal } from '@/modules/cms/fields/saved-by';
import { requestLocale } from '@/lib/i18n';
import { DEFAULT_IMAGE_STYLE, DEFAULT_STYLE } from '@/modules/ai-content/prompts/defaults';
import { secretField } from '@/modules/cms/fields/secret-field';
import { CONNECTIONS } from '@/modules/connections/collection';
import { kindsThat, mockAllowed } from '@/modules/connections/kinds';
import { globalComponents } from '@/modules/cms/admin/document/config';
import { adminGroup } from '@/modules/cms/admin/icons';
import { AI_SETTINGS_DESCRIPTIONS } from '@/modules/ai-content/descriptions';
import { describeFields } from '@/modules/cms/admin/descriptions/describe';

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
 * The engine's settings (BRD 10.2.1; ADR-042, ADR-047): admin only, the connection it writes
 * with (its key lives under Connections), the switch off by default, every cap and every
 * text the prompts use. The description carries the research caveat the BRD asks for
 * (10.2.5).
 */
export const AiSettings: GlobalConfig = {
  slug: 'ai-settings',
  label: { ar: 'إعدادات المحرّك', en: 'Engine settings' },
  admin: {
    hideAPIURL: true,
    components: globalComponents('ai-settings', { localized: true }),
    group: adminGroup('blog'),
    custom: {
      shows: {
        ar: 'لا يظهر في الموقع: كيف يكتب المحرّك وبأي وتيرة',
        en: 'nowhere on the site: how the engine writes and how often',
      },
    },
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
  fields: describeFields(
    [
      {
        type: 'tabs',
        tabs: [
          {
            label: { ar: 'الجدولة والحدود', en: 'Schedule and limits' },
            fields: [
              {
                name: 'connection',
                type: 'relationship',
                relationTo: CONNECTIONS,
                filterOptions: {
                  kind: { in: kindsThat('ai').filter((k) => k !== 'mock' || mockAllowed()) },
                },
                label: { ar: 'الاتصال', en: 'Connection' },
              },
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
                  number(
                    'maxPostsPerMonth',
                    { ar: 'الحد الشهري للمقالات', en: 'Monthly post cap' },
                    31,
                    { min: 0 },
                  ),
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
                    { ar: 'مقالات تُراجع قبل النشر', en: 'Posts to review before publishing' },
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
            description: {
              ar: 'لكل لغة دليلها وتعليماتها وعباراتها الممنوعة.',
              en: 'Each language has its own guide, instructions and banned phrases.',
            },
            fields: [
              {
                name: 'styleGuide',
                type: 'textarea',
                required: true,
                localized: true,
                defaultValue: ({ locale }) => DEFAULT_STYLE[requestLocale(locale)].styleGuide,
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
                    localized: true,
                    defaultValue: ({ locale }) => DEFAULT_STYLE[requestLocale(locale)].systemPrompt,
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
                localized: true,
                defaultValue: ({ locale }) =>
                  DEFAULT_STYLE[requestLocale(locale)].bannedPhrases.join('\n'),
                label: { ar: 'عبارات ممنوعة (سطر لكل عبارة)', en: 'Banned phrases (one per line)' },
                admin: { rows: 6 },
              },
              {
                name: 'bannedClaims',
                type: 'textarea',
                required: true,
                localized: true,
                defaultValue: ({ locale }) => DEFAULT_STYLE[requestLocale(locale)].bannedClaims,
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
                label: { ar: 'كلمات إضافية لبحث الصور', en: 'Extra words for the photo search' },
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
    AI_SETTINGS_DESCRIPTIONS,
  ),
};
