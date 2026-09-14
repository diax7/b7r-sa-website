import type { CollectionConfig } from 'payload';
import { isEditorOrAdmin } from '@/modules/cms/access';
import { Refused } from '@/modules/cms/refused';
import { SLUG_PATTERN } from '@/modules/cms/collections/pages';
import { savedByField, stampSavedBy } from '@/modules/cms/fields/saved-by';
import { collectionLocaleNote } from '@/modules/cms/admin/locale/config';

/**
 * Post tags (BRD 10.1): optional, free, used by related posts after the hub. No public tag
 * route in this phase, so a change here regenerates nothing.
 */
export const Tags: CollectionConfig = {
  slug: 'tags',
  labels: { singular: { ar: 'وسم', en: 'Tag' }, plural: { ar: 'الوسوم', en: 'Tags' } },
  admin: {
    components: collectionLocaleNote,
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'updatedAt'],
    listSearchableFields: ['name', 'slug'],
    group: { ar: 'المدونة', en: 'Blog' },
    description: {
      ar: 'وسوم اختيارية تربط المقالات ذات الصلة.',
      en: 'Optional tags that connect related posts.',
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
          label: { ar: 'المعرّف', en: 'Slug' },
          admin: { description: { ar: 'حروف لاتينية صغيرة وشرطات', en: 'lowercase-hyphenated' } },
        },
      ],
    },
    savedByField,
  ],
};
