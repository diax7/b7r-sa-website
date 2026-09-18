import type { CollectionConfig } from 'payload';
import { isEditorOrAdmin } from '@/modules/cms/access';
import { Refused } from '@/modules/cms/refused';
import { SLUG_PATTERN } from '@/modules/cms/collections/pages';
import { inLanguage } from '@/modules/cms/fields/message';
import { savedByField, stampSavedBy } from '@/modules/cms/fields/saved-by';
import { collectionComponents } from '@/modules/cms/admin/document/config';
import { adminGroup } from '@/modules/cms/admin/icons';
import { TAG_DESCRIPTIONS } from '@/modules/cms/admin/descriptions/blog';
import { describeFields } from '@/modules/cms/admin/descriptions/describe';

/**
 * Post tags (BRD 10.1): optional, free, an admin-side way to sort posts. Nothing on the site
 * reads them today (related posts go by hub, ADR-041), and the header says so; keeping or
 * dropping the collection is Dhia's call (ADR-046). No public tag route, so a change here
 * regenerates nothing.
 */
export const Tags: CollectionConfig = {
  slug: 'tags',
  labels: { singular: { ar: 'وسم', en: 'Tag' }, plural: { ar: 'الوسوم', en: 'Tags' } },
  admin: {
    hideAPIURL: true,
    components: collectionComponents('tags', { localized: true }),
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'updatedAt'],
    listSearchableFields: ['name', 'slug'],
    group: adminGroup('blog'),
    custom: {
      shows: {
        ar: 'لا يظهر في الموقع اليوم: الوسوم لترتيب المقالات داخل لوحة التحكم فقط',
        en: 'nowhere on the site today: tags sort posts inside the admin only',
      },
    },
    description: {
      ar: 'وسوم اختيارية لترتيب المقالات داخل لوحة التحكم؛ الموقع لا يقرؤها اليوم.',
      en: 'Optional tags to sort posts inside the admin; the site reads none today.',
    },
  },
  access: {
    read: () => true,
    create: isEditorOrAdmin,
    update: isEditorOrAdmin,
    delete: isEditorOrAdmin,
  },
  hooks: {
    beforeChange: [stampSavedBy],
    beforeValidate: [
      ({ data, req }) => {
        const slug = data?.['slug'];
        if (typeof slug === 'string' && (!SLUG_PATTERN.test(slug) || slug.length > 40)) {
          throw new Refused(
            inLanguage(req, {
              ar: 'معرّف الوسم: حروف لاتينية صغيرة وأرقام وشرطات فقط، حتى 40 حرفاً',
              en: 'Tag id: lowercase letters, digits and hyphens only, up to 40 characters',
            }),
          );
        }
        return data;
      },
    ],
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
            label: { ar: 'معرّف الوسم', en: 'Tag id' },
          },
        ],
      },
      savedByField,
    ],
    TAG_DESCRIPTIONS,
  ),
};
