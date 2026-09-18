import type { Field, GlobalConfig } from 'payload';
import { hiddenUnlessAdmin, isAdmin } from '@/modules/cms/access';
import { describeFields } from '@/modules/cms/admin/descriptions/describe';
import { globalComponents } from '@/modules/cms/admin/document/config';
import { adminGroup } from '@/modules/cms/admin/icons';
import { savedByField, stampSavedByGlobal } from '@/modules/cms/fields/saved-by';
import { CHECKLIST_DESCRIPTIONS } from '@/modules/visibility/descriptions';
import { CHECKLIST_ITEMS } from '@/modules/visibility/rules/rest';

export const CHECKLIST = 'visibility-checklist' as const;

/**
 * The off-site work the score cannot see (ADR-049 R1): five boxes an admin ticks once the
 * thing exists, labelled as R1 lists them. Each box's description says what counts. Admins
 * only, under the Score page.
 */
export const VisibilityChecklist: GlobalConfig = {
  slug: CHECKLIST,
  label: { ar: 'قائمة الحضور الخارجي', en: 'Off-site checklist' },
  admin: {
    hideAPIURL: true,
    components: globalComponents(CHECKLIST),
    group: adminGroup('visibility'),
    custom: {
      shows: {
        ar: 'لا يظهر في الموقع: ما أُنجز خارج الموقع ليقرأه محرّكو الإجابة',
        en: 'nowhere on the site: what was done off-site for the answer engines to read',
      },
    },
    hidden: hiddenUnlessAdmin,
    description: {
      ar: 'ما يقوله الآخرون عن العلامة: خمسة أعمال خارج الموقع تُعلَّم هنا عند إنجازها، وتدخل في درجة الظهور.',
      en: 'What others say about the brand: five pieces of off-site work, ticked here once done, counted in the visibility score.',
    },
  },
  access: { read: isAdmin, update: isAdmin },
  hooks: { beforeChange: [stampSavedByGlobal] },
  fields: describeFields(
    [
      ...CHECKLIST_ITEMS.map((item): Field => ({
        name: item.key,
        type: 'checkbox',
        defaultValue: false,
        label: item.label,
      })),
      savedByField,
    ],
    CHECKLIST_DESCRIPTIONS,
  ),
};
