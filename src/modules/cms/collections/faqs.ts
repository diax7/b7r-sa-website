import type { CollectionConfig, PayloadRequest } from 'payload';
import { FAQ_GROUPS } from '@/content/schema';
import { isAdmin, isEditorOrAdmin } from '@/modules/cms/access';
import { Refused } from '@/modules/cms/refused';
import { PATHS_FOR_FAQS, revalidateRoutes } from '@/modules/cms/hooks/revalidate';
import { type Bilingual, inLanguage } from '@/modules/cms/fields/message';
import { applyTranslations } from '@/modules/cms/hooks/translations';
import { savedByField, stampSavedBy } from '@/modules/cms/fields/saved-by';
import { collectionComponents } from '@/modules/cms/admin/document/config';
import { adminGroup } from '@/modules/cms/admin/icons';
import { FAQ_DESCRIPTIONS } from '@/modules/cms/admin/descriptions/catalogue';
import { describeFields } from '@/modules/cms/admin/descriptions/describe';

/** The home accordion shows exactly this many entries (BRD 4.4, 6.4.9). */
export const HOME_FAQ_LIMIT = 5;

export const HOME_LIMIT_MESSAGE: Bilingual = {
  ar: `الصفحة الرئيسية تعرض ${HOME_FAQ_LIMIT} أسئلة على الأكثر؛ ألغِ تعليم سؤال آخر أولاً.`,
  en: `The home page shows ${HOME_FAQ_LIMIT} questions at most; untick another one first.`,
};

/**
 * The FAQ page's group headings are the stored values (Arabic, `FAQ_GROUPS`); the picker
 * names each in both languages.
 */
export const FAQ_GROUP_LABELS: Record<(typeof FAQ_GROUPS)[number], Bilingual> = {
  البداية: { ar: 'البداية', en: 'Getting started' },
  'الأسعار والربح': { ar: 'الأسعار والربح', en: 'Prices and profit' },
  'الطلبات والتوصيل': { ar: 'الطلبات والتوصيل', en: 'Orders and delivery' },
  'المتاجر والربط': { ar: 'المتاجر والربط', en: 'Stores and connection' },
  'الجودة والدعم': { ar: 'الجودة والدعم', en: 'Quality and support' },
};

/**
 * Refuses a sixth «show on home» (pure so the unit test needs no database): `othersOnHome`
 * is how many other entries already carry the flag.
 */
export function homeFlagProblem(showOnHome: boolean, othersOnHome: number): Bilingual | null {
  return showOnHome && othersOnHome >= HOME_FAQ_LIMIT ? HOME_LIMIT_MESSAGE : null;
}

async function guardHomeLimit({
  data,
  req,
  originalDoc,
}: {
  data?: { showOnHome?: boolean };
  req: PayloadRequest;
  originalDoc?: { id?: number | string };
}) {
  if (!data?.showOnHome) return data;
  const others = await req.payload.count({
    collection: 'faqs',
    where: {
      showOnHome: { equals: true },
      ...(originalDoc?.id !== undefined ? { id: { not_equals: originalDoc.id } } : {}),
    },
    req,
  });
  const problem = homeFlagProblem(true, others.totalDocs);
  if (problem) throw new Refused(inLanguage(req, problem));
  return data;
}

/**
 * FAQ entries (BRD 4.10, Appendix D): grouped, ordered, with at most five flagged for the
 * home accordion in their own order. No drafts: each entry is one small, atomic edit, and
 * live the moment it exists, so deleting one is an admin's call (BRD 9.3).
 */
export const Faqs: CollectionConfig = {
  slug: 'faqs',
  labels: {
    singular: { ar: 'سؤال شائع', en: 'FAQ entry' },
    plural: { ar: 'الأسئلة الشائعة', en: 'FAQ' },
  },
  admin: {
    hideAPIURL: true,
    components: collectionComponents('faqs', { localized: true }),
    useAsTitle: 'question',
    defaultColumns: ['question', 'group', 'order', 'showOnHome'],
    listSearchableFields: ['question'],
    group: adminGroup('catalogue'),
    custom: {
      shows: {
        ar: 'صفحة الأسئلة الشائعة، وقسم الأسئلة في الصفحة الرئيسية للمدخلات المحددة له',
        en: "b7r.sa/faq, and the home page's FAQ section for the entries marked for it",
      },
    },
    description: {
      ar: 'الأسئلة الشائعة بمجموعاتها. حتى خمسة أسئلة تظهر في الصفحة الرئيسية.',
      en: 'FAQ entries by group. Up to five show on the home page.',
    },
  },
  defaultSort: 'order',
  access: {
    read: () => true,
    create: isEditorOrAdmin,
    update: isEditorOrAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeValidate: [guardHomeLimit],
    beforeChange: [stampSavedBy],
    afterChange: [revalidateRoutes(PATHS_FOR_FAQS), applyTranslations],
    afterDelete: [revalidateRoutes(PATHS_FOR_FAQS)],
  },
  fields: describeFields(
    [
      {
        name: 'question',
        type: 'text',
        required: true,
        localized: true,
        label: { ar: 'السؤال', en: 'Question' },
      },
      {
        name: 'answer',
        type: 'textarea',
        required: true,
        localized: true,
        label: { ar: 'الإجابة', en: 'Answer' },
      },
      {
        type: 'row',
        fields: [
          {
            name: 'group',
            type: 'select',
            required: true,
            options: FAQ_GROUPS.map((g) => ({ label: FAQ_GROUP_LABELS[g], value: g })),
            label: { ar: 'المجموعة', en: 'Group' },
          },
          {
            name: 'order',
            type: 'number',
            required: true,
            defaultValue: 1,
            label: { ar: 'الترتيب داخل المجموعة', en: 'Order in the group' },
            admin: { step: 1 },
          },
        ],
      },
      {
        type: 'row',
        fields: [
          {
            name: 'showOnHome',
            type: 'checkbox',
            defaultValue: false,
            label: { ar: 'يظهر في الرئيسية', en: 'Show on the home page' },
          },
          {
            name: 'homeOrder',
            type: 'number',
            min: 1,
            max: HOME_FAQ_LIMIT,
            label: { ar: 'الترتيب في الرئيسية', en: 'Order on the home page' },
            admin: {
              step: 1,
              condition: (_data, siblingData) => Boolean(siblingData?.['showOnHome']),
            },
          },
        ],
      },
      savedByField,
    ],
    FAQ_DESCRIPTIONS,
  ),
};
