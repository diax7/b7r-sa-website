import type { CollectionConfig } from 'payload';
import { isAdmin, isEditorOrAdmin } from '@/modules/cms/access';
import { Refused } from '@/modules/cms/refused';
import { SLUG_PATTERN } from '@/modules/cms/collections/pages';
import { revalidateBlogListings } from '@/modules/cms/hooks/revalidate';
import { savedByField, stampSavedBy } from '@/modules/cms/fields/saved-by';
import { collectionComponents } from '@/modules/cms/admin/document/config';
import { adminGroup } from '@/modules/cms/admin/icons';

/**
 * The blog's hubs (BRD 10.1, Appendix E): six seeded categories, each with its own page at
 * `/blog/category/{slug}`, a description, a lead and a default cover the engine falls back
 * to. Admins add hubs; editors may polish the copy.
 */
export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: { ar: 'قسم', en: 'Hub' }, plural: { ar: 'أقسام المدونة', en: 'Hubs' } },
  admin: {
    components: collectionComponents('categories', { localized: true }),
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'order', 'updatedAt'],
    listSearchableFields: ['name', 'slug'],
    group: adminGroup('blog'),
    custom: {
      shows: {
        ar: 'صفحات الأقسام في المدونة وسطر القسم في كل مقال',
        en: "the blog's hub pages and the hub line on each post",
      },
    },
    description: {
      ar: 'أقسام المدونة الستة. لكل قسم صفحته ووصفه وصورته الافتراضية.',
      en: 'The six blog hubs. Each has its own page, description and default cover.',
    },
  },
  access: { read: () => true, create: isAdmin, update: isEditorOrAdmin, delete: isAdmin },
  hooks: {
    beforeChange: [stampSavedBy],
    beforeValidate: [
      ({ data }) => {
        const slug = data?.['slug'];
        if (typeof slug === 'string' && (!SLUG_PATTERN.test(slug) || slug.length > 40)) {
          throw new Refused(
            'Slug: lowercase letters, digits and hyphens only, up to 40 characters',
          );
        }
        return data;
      },
    ],
    afterChange: [revalidateBlogListings],
    afterDelete: [revalidateBlogListings],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          localized: true,
          label: { ar: 'الاسم', en: 'Name' },
        },
        {
          name: 'slug',
          type: 'text',
          required: true,
          unique: true,
          index: true,
          label: { ar: 'المعرّف في الرابط', en: 'Slug' },
          admin: {
            description: {
              ar: 'حروف لاتينية صغيرة وشرطات؛ يصبح /blog/category/المعرّف',
              en: 'lowercase-hyphenated; served at /blog/category/slug',
            },
          },
        },
      ],
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      localized: true,
      label: { ar: 'الوصف', en: 'Description' },
      admin: {
        description: {
          ar: 'جملة واحدة تظهر تحت عنوان القسم وفي بطاقات المدونة.',
          en: 'One sentence under the hub title and on the blog cards.',
        },
      },
    },
    {
      name: 'lead',
      type: 'text',
      localized: true,
      label: { ar: 'السطر تحت العنوان (اختياري)', en: 'Lead (optional)' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'defaultCover',
          type: 'upload',
          relationTo: 'media',
          label: { ar: 'الغلاف الافتراضي', en: 'Default cover' },
          admin: {
            description: {
              ar: 'يُستخدم عندما لا يملك المقال غلافاً خاصاً.',
              en: 'Used when a post has no cover of its own.',
            },
          },
        },
        {
          name: 'order',
          type: 'number',
          required: true,
          defaultValue: 1,
          label: { ar: 'الترتيب', en: 'Order' },
        },
      ],
    },
    savedByField,
  ],
};
