import type { CollectionConfig } from 'payload';
import { isAdmin, isEditorOrAdmin } from '@/modules/cms/access';
import { Refused } from '@/modules/cms/refused';
import { SLUG_PATTERN } from '@/modules/cms/collections/pages';
import { revalidateBlogListings } from '@/modules/cms/hooks/revalidate';
import { inLanguage } from '@/modules/cms/fields/message';
import { applyTranslations } from '@/modules/cms/hooks/translations';
import { savedByField, stampSavedBy } from '@/modules/cms/fields/saved-by';
import { collectionComponents } from '@/modules/cms/admin/document/config';
import { adminGroup } from '@/modules/cms/admin/icons';
import { CATEGORY_DESCRIPTIONS } from '@/modules/cms/admin/descriptions/blog';
import { describeFields } from '@/modules/cms/admin/descriptions/describe';

/**
 * The blog's hubs (BRD 10.1, Appendix E): six seeded categories, each with its own page at
 * `/blog/category/{slug}`, a description, a lead and a default cover the engine falls back
 * to. Admins add hubs; editors may polish the copy.
 */
export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: { ar: 'قسم', en: 'Hub' }, plural: { ar: 'أقسام المدونة', en: 'Hubs' } },
  admin: {
    hideAPIURL: true,
    components: collectionComponents('categories'),
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
  defaultSort: 'order',
  access: { read: () => true, create: isAdmin, update: isEditorOrAdmin, delete: isAdmin },
  hooks: {
    beforeChange: [stampSavedBy],
    beforeValidate: [
      ({ data, req }) => {
        const slug = data?.['slug'];
        if (typeof slug === 'string' && (!SLUG_PATTERN.test(slug) || slug.length > 40)) {
          throw new Refused(
            inLanguage(req, {
              ar: 'المعرّف في الرابط: حروف لاتينية صغيرة وأرقام وشرطات فقط، حتى 40 حرفاً',
              en: 'Address ending: lowercase letters, digits and hyphens only, up to 40 characters',
            }),
          );
        }
        return data;
      },
    ],
    afterChange: [revalidateBlogListings, applyTranslations],
    afterDelete: [revalidateBlogListings],
  },
  fields: describeFields(
    [
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
            label: { ar: 'المعرّف في الرابط', en: 'Address ending (slug)' },
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
        label: { ar: 'السطر تحت العنوان (اختياري)', en: 'Line under the title (optional)' },
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
    CATEGORY_DESCRIPTIONS,
  ),
};
