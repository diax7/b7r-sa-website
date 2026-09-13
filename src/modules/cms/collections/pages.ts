import type { CollectionConfig } from 'payload';
import { RESERVED_PAGE_SLUGS } from '@/content/schema';
import { CODE_TOP_LEVEL } from '@/lib/site-routes';
import { canDeleteVersioned, isEditorOrAdmin, publishedOrStaff } from '@/modules/cms/access';
import { Refused } from '@/modules/cms/refused';
import { PAGE_BLOCKS } from '@/modules/cms/blocks';
import { isDraftSave, revalidatePages } from '@/modules/cms/hooks/revalidate';
import { savedByField, stampSavedBy } from '@/modules/cms/fields/saved-by';
import { previewUrl } from '@/lib/preview-token';

/** Slugs a page may never take: every code-owned segment except the seven designed pages. */
export const FORBIDDEN_PAGE_SLUGS: readonly string[] = CODE_TOP_LEVEL.filter(
  (s) => !(RESERVED_PAGE_SLUGS as readonly string[]).includes(s),
);

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Why a slug is refused, or null. Pure so the unit test needs no database. */
export function pageSlugProblem(slug: unknown): string | null {
  if (typeof slug !== 'string' || !SLUG_PATTERN.test(slug) || slug.length > 64) {
    return 'المعرّف: حروف لاتينية صغيرة وأرقام وشرطات فقط، حتى 64 حرفاً';
  }
  if (FORBIDDEN_PAGE_SLUGS.includes(slug)) return `«${slug}» محجوز للموقع نفسه`;
  return null;
}

const reserved = (slug: unknown) =>
  typeof slug === 'string' && (RESERVED_PAGE_SLUGS as readonly string[]).includes(slug);

/**
 * Pages (BRD 9.4, 9.5; ADR-031): the seven designed pages (their route folders live in the
 * code and render the matching document) plus any page an editor assembles from the block
 * set, served by `/[slug]`. Drafts with autosave; published reads only on the site.
 */
export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: { ar: 'صفحة', en: 'Page' }, plural: { ar: 'الصفحات', en: 'Pages' } },
  admin: {
    useAsTitle: 'title',
    // «معاينة»: a signed link that turns on draft mode and lands on the page (ADR-039).
    preview: (doc, { req }) =>
      typeof doc['slug'] === 'string' && doc['slug']
        ? previewUrl(req.payload.config.serverURL, `/${doc['slug']}`, req.payload.secret)
        : null,
    defaultColumns: ['title', 'slug', 'updatedAt', '_status'],
    listSearchableFields: ['title', 'slug'],
    group: { ar: 'المحتوى', en: 'Content' },
    description: {
      ar: 'صفحات الموقع كأقسام قابلة للتحرير. الصفحات السبع الأساسية ثابتة الرابط؛ أضف صفحات جديدة بحرّية.',
      en: 'Site pages as editable blocks. The seven designed pages keep their URLs; add new ones freely.',
    },
  },
  versions: { drafts: { autosave: { interval: 1500 }, schedulePublish: true }, maxPerDoc: 25 },
  access: {
    read: publishedOrStaff,
    create: isEditorOrAdmin,
    update: isEditorOrAdmin,
    delete: canDeleteVersioned,
  },
  hooks: {
    beforeChange: [stampSavedBy],
    beforeValidate: [
      ({ data, originalDoc, req }) => {
        const slug = data?.['slug'];
        const isReserved = reserved(originalDoc?.['slug']);
        // The seven designed pages keep their slug: a route folder renders each one.
        if (isReserved && slug && slug !== originalDoc?.['slug']) {
          throw new Refused('هذه الصفحة لها مسار ثابت في الموقع؛ لا يمكن تغيير معرّفها');
        }
        // …and stay published: «Unpublish» writes `_status: draft` to the main row (no
        // `draft=true` on the request), which would leave the route with nothing to render.
        // A draft save or autosave (`?draft=true`) creates a version and passes.
        const unpublishing =
          isReserved &&
          data?.['_status'] === 'draft' &&
          originalDoc?.['_status'] === 'published' &&
          !isDraftSave(req);
        if (unpublishing) {
          throw new Refused('هذه الصفحة ثابتة في الموقع؛ لا يمكن إلغاء نشرها');
        }
        // A draft autosave may carry no slug yet; `required` refuses the empty slug at publish.
        if (!slug) return data;
        const problem = pageSlugProblem(slug);
        if (problem) throw new Refused(problem);
        return data;
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        const doc = await req.payload.findByID({ collection: 'pages', id, depth: 0, req });
        if (reserved(doc.slug)) {
          throw new Refused('هذه الصفحة لها مسار ثابت في الموقع؛ لا يمكن حذفها');
        }
      },
    ],
    afterChange: [revalidatePages],
    afterDelete: [revalidatePages],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          localized: true,
          label: { ar: 'العنوان', en: 'Title' },
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
              ar: 'حروف لاتينية صغيرة وشرطات؛ يصبح /المعرّف',
              en: 'lowercase-hyphenated; served at /slug',
            },
          },
        },
      ],
    },
    {
      name: 'lead',
      type: 'text',
      localized: true,
      label: { ar: 'السطر تحت العنوان (اختياري)', en: 'Lead (optional)' },
    },
    {
      name: 'blocks',
      type: 'blocks',
      required: true,
      minRows: 1,
      blocks: PAGE_BLOCKS,
      label: { ar: 'الأقسام', en: 'Sections' },
      labels: { singular: { ar: 'قسم', en: 'Section' }, plural: { ar: 'الأقسام', en: 'Sections' } },
    },
    {
      name: 'seo',
      type: 'group',
      label: { ar: 'محركات البحث', en: 'SEO' },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          localized: true,
          maxLength: 70,
          label: { ar: 'عنوان الصفحة (حتى 70 حرفاً)', en: 'Meta title (≤ 70)' },
        },
        {
          name: 'description',
          type: 'textarea',
          required: true,
          localized: true,
          maxLength: 160,
          label: { ar: 'الوصف (حتى 160 حرفاً)', en: 'Meta description (≤ 160)' },
        },
        {
          name: 'ogImage',
          type: 'upload',
          relationTo: 'media',
          label: { ar: 'صورة المشاركة (اختياري)', en: 'Share image (optional)' },
        },
      ],
    },
    savedByField,
  ],
};
