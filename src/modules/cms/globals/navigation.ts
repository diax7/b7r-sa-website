import type { Field, GlobalConfig } from 'payload';
import { hiddenUnlessAdmin, isAdmin } from '@/modules/cms/access';
import { revalidateGlobal } from '@/modules/cms/hooks/revalidate';
import { savedByField, stampSavedByGlobal } from '@/modules/cms/fields/saved-by';
import { globalComponents } from '@/modules/cms/admin/document/config';
import { adminGroup } from '@/modules/cms/admin/icons';

const navItem: Field[] = [
  {
    type: 'row',
    fields: [
      {
        name: 'label',
        type: 'text',
        required: true,
        localized: true,
        label: { ar: 'النص', en: 'Label' },
      },
      {
        name: 'href',
        type: 'text',
        required: true,
        label: { ar: 'الرابط', en: 'Link' },
        validate: (value: unknown) =>
          typeof value === 'string' && value.startsWith('/') ? true : 'الرابط يبدأ بـ /',
      },
      {
        name: 'matchPrefix',
        type: 'text',
        label: { ar: 'يُعدّ نشطاً لكل ما يبدأ بـ', en: 'Active prefix' },
        admin: { description: { ar: 'مثال: /products', en: 'e.g. /products' } },
      },
    ],
  },
];

/** BRD 9.4 `navigation` ⇄ `Navigation` in content/schema.ts. Admin only. */
export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: { ar: 'التنقل', en: 'Navigation' },
  admin: {
    components: globalComponents('navigation', { localized: true }),
    group: adminGroup('site'),
    custom: {
      shows: {
        ar: 'كل الصفحات: روابط الترويسة، وروابط السياسات في التذييل، وتسميات القائمة',
        en: "every page: the header links, the footer's policy links and the menu labels",
      },
    },
    hidden: hiddenUnlessAdmin,
    description: {
      ar: 'روابط القائمة الرئيسية والتذييل ونصوص الأزرار.',
      en: 'Header and footer links and the button labels.',
    },
  },
  access: { read: () => true, update: isAdmin },
  hooks: { beforeChange: [stampSavedByGlobal], afterChange: [revalidateGlobal] },
  fields: [
    {
      name: 'primary',
      type: 'array',
      required: true,
      minRows: 6,
      maxRows: 6,
      label: { ar: 'القائمة الرئيسية (6)', en: 'Primary (6)' },
      fields: navItem,
    },
    {
      name: 'policies',
      type: 'array',
      required: true,
      minRows: 4,
      maxRows: 4,
      label: { ar: 'روابط السياسات (4)', en: 'Policies (4)' },
      fields: navItem,
    },
    {
      name: 'ctaLabel',
      type: 'text',
      required: true,
      localized: true,
      label: { ar: 'زر الدعوة', en: 'CTA label' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'skipLinkLabel',
          type: 'text',
          required: true,
          localized: true,
          label: { ar: 'رابط التخطي', en: 'Skip link' },
        },
        {
          name: 'menuOpenLabel',
          type: 'text',
          required: true,
          localized: true,
          label: { ar: 'فتح القائمة', en: 'Menu open' },
        },
        {
          name: 'menuCloseLabel',
          type: 'text',
          required: true,
          localized: true,
          label: { ar: 'إغلاق القائمة', en: 'Menu close' },
        },
      ],
    },
    savedByField,
  ],
};
