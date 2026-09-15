import type { CollectionConfig } from 'payload';
import { isAdmin, isEditorOrAdmin } from '@/modules/cms/access';
import { Refused } from '@/modules/cms/refused';
import { SLUG_PATTERN } from '@/modules/cms/collections/pages';
import { revalidateBlogListings } from '@/modules/cms/hooks/revalidate';
import { savedByField, stampSavedBy } from '@/modules/cms/fields/saved-by';
import { collectionComponents } from '@/modules/cms/admin/document/config';
import { adminGroup } from '@/modules/cms/admin/icons';
import { AUTHOR_DESCRIPTIONS } from '@/modules/cms/admin/descriptions/blog';
import { describeFields } from '@/modules/cms/admin/descriptions/describe';

/**
 * Blog authors (BRD 10.1): one seeded author (ضياء, مؤسس بحر برنت) with a page at
 * `/author/{slug}` and `ProfilePage` structured data. Every post carries a human byline
 * (D-47); the engine never adds an author of its own.
 */
export const Authors: CollectionConfig = {
  slug: 'authors',
  labels: { singular: { ar: 'كاتب', en: 'Author' }, plural: { ar: 'الكتّاب', en: 'Authors' } },
  admin: {
    components: collectionComponents('authors', { localized: true }),
    useAsTitle: 'name',
    defaultColumns: ['name', 'role', 'slug', 'updatedAt'],
    listSearchableFields: ['name', 'slug'],
    group: adminGroup('blog'),
    custom: {
      shows: {
        ar: 'سطر الكاتب في كل مقال وصفحة الكاتب',
        en: "the byline on each post and the author's page",
      },
    },
    description: {
      ar: 'من يوقّع مقالات المدونة. لكل كاتب صفحته على الموقع.',
      en: 'Who signs the blog posts. Each author has a page on the site.',
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
            label: { ar: 'المعرّف في الرابط', en: 'Slug' },
            admin: {
              description: {
                ar: 'حروف لاتينية صغيرة وشرطات؛ يصبح /author/المعرّف',
                en: 'lowercase-hyphenated; served at /author/slug',
              },
            },
          },
        ],
      },
      {
        name: 'role',
        type: 'text',
        required: true,
        localized: true,
        label: { ar: 'الصفة', en: 'Role' },
        admin: {
          description: { ar: 'مثل: مؤسس بحر برنت', en: 'For example: founder of B7R Print' },
        },
      },
      {
        name: 'bio',
        type: 'textarea',
        localized: true,
        label: { ar: 'نبذة (اختياري)', en: 'Bio (optional)' },
      },
      {
        name: 'photo',
        type: 'upload',
        relationTo: 'media',
        label: { ar: 'الصورة (اختياري)', en: 'Photo (optional)' },
      },
      {
        name: 'sameAs',
        type: 'array',
        label: { ar: 'روابط الحسابات (اختياري)', en: 'Profile links (optional)' },
        labels: { singular: { ar: 'رابط', en: 'Link' }, plural: { ar: 'روابط', en: 'Links' } },
        admin: {
          description: {
            ar: 'حسابات الكاتب العامة (X، لينكدإن…) لبيانات الصفحة المنظّمة.',
            en: 'Public profiles (X, LinkedIn…) for the structured data of the page.',
          },
        },
        fields: [
          {
            name: 'url',
            type: 'text',
            required: true,
            label: { ar: 'الرابط', en: 'URL' },
            validate: (value: unknown) =>
              typeof value === 'string' && /^https:\/\/[^\s"'<>]+$/.test(value)
                ? true
                : 'An https:// URL',
          },
        ],
      },
      savedByField,
    ],
    AUTHOR_DESCRIPTIONS,
  ),
};
