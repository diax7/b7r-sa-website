import { type CollectionConfig, type PayloadRequest, ValidationError } from 'payload';
import { FAQ_GROUPS } from '@/content/schema';
import { isAdmin, isEditorOrAdmin } from '@/modules/cms/access';
import { PATHS_FOR_FAQS, revalidateRoutes } from '@/modules/cms/hooks/revalidate';

/** The home accordion shows exactly this many entries (BRD 4.4, 6.4.9). */
export const HOME_FAQ_LIMIT = 5;

export const HOME_LIMIT_MESSAGE = `الرئيسية تعرض ${HOME_FAQ_LIMIT} أسئلة فقط؛ ألغِ اختيار سؤال آخر أولاً.`;

/**
 * Refuses a sixth «show on home» (pure so the unit test needs no database): `othersOnHome`
 * is how many other entries already carry the flag.
 */
export function homeFlagProblem(showOnHome: boolean, othersOnHome: number): string | null {
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
  if (problem) {
    throw new ValidationError({
      collection: 'faqs',
      errors: [{ path: 'showOnHome', message: problem }],
      req,
    });
  }
  return data;
}

/**
 * FAQ entries (BRD 4.10, Appendix D): grouped, ordered, with at most five flagged for the
 * home accordion in their own order. No drafts: each entry is one small, atomic edit — and
 * live the moment it exists, so deleting one is an admin's call (BRD 9.3).
 */
export const Faqs: CollectionConfig = {
  slug: 'faqs',
  labels: {
    singular: { ar: 'سؤال شائع', en: 'FAQ entry' },
    plural: { ar: 'الأسئلة الشائعة', en: 'FAQ' },
  },
  admin: {
    useAsTitle: 'question',
    defaultColumns: ['question', 'group', 'order', 'showOnHome'],
    group: { ar: 'المحتوى', en: 'Content' },
  },
  access: {
    read: () => true,
    create: isEditorOrAdmin,
    update: isEditorOrAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeValidate: [guardHomeLimit],
    afterChange: [revalidateRoutes(PATHS_FOR_FAQS)],
    afterDelete: [revalidateRoutes(PATHS_FOR_FAQS)],
  },
  fields: [
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
      admin: { description: { ar: 'نص عادي، بلا روابط', en: 'Plain text, no links' } },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'group',
          type: 'select',
          required: true,
          options: FAQ_GROUPS.map((g) => ({ label: g, value: g })),
          label: { ar: 'القسم', en: 'Group' },
        },
        {
          name: 'order',
          type: 'number',
          required: true,
          defaultValue: 1,
          label: { ar: 'الترتيب داخل القسم', en: 'Order within the group' },
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
          admin: {
            description: {
              ar: `${HOME_FAQ_LIMIT} أسئلة كحد أقصى`,
              en: `At most ${HOME_FAQ_LIMIT} entries`,
            },
          },
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
  ],
};
