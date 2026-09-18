import type { CollectionConfig } from 'payload';
import { RESERVED_PAGE_SLUGS } from '@/content/schema';
import { CODE_TOP_LEVEL } from '@/lib/site-routes';
import { canDeleteVersioned, isEditorOrAdmin, publishedOrStaff } from '@/modules/cms/access';
import { Refused } from '@/modules/cms/refused';
import { PAGE_BLOCKS } from '@/modules/cms/blocks';
import { isDraftSave, revalidatePages } from '@/modules/cms/hooks/revalidate';
import { type Bilingual, inLanguage } from '@/modules/cms/fields/message';
import { applyTranslations } from '@/modules/cms/hooks/translations';
import { savedByField, stampSavedBy } from '@/modules/cms/fields/saved-by';
import { localePath, requestLocale } from '@/lib/i18n';
import { previewUrl } from '@/lib/preview-token';
import { collectionComponents } from '@/modules/cms/admin/document/config';
import { adminGroup } from '@/modules/cms/admin/icons';
import { PAGE_DESCRIPTIONS } from '@/modules/cms/admin/descriptions/pages';
import { describeFields } from '@/modules/cms/admin/descriptions/describe';

/** Slugs a page may never take: every code-owned segment except the seven designed pages. */
export const FORBIDDEN_PAGE_SLUGS: readonly string[] = CODE_TOP_LEVEL.filter(
  (s) => !(RESERVED_PAGE_SLUGS as readonly string[]).includes(s),
);

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Why a slug is refused, in both languages, or null. Pure so the unit test needs no database. */
export function pageSlugProblem(slug: unknown): Bilingual | null {
  if (typeof slug !== 'string' || !SLUG_PATTERN.test(slug) || slug.length > 64) {
    return {
      ar: 'المعرّف في الرابط: حروف لاتينية صغيرة وأرقام وشرطات فقط، حتى 64 حرفاً',
      en: 'Address ending: lowercase letters, digits and hyphens only, up to 64 characters',
    };
  }
  if (FORBIDDEN_PAGE_SLUGS.includes(slug)) {
    return {
      ar: `«${slug}» محجوز للموقع نفسه`,
      en: `"${slug}" is reserved by the site itself`,
    };
  }
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
    hideAPIURL: true,
    components: collectionComponents('pages', { localized: true }),
    useAsTitle: 'title',
    // «معاينة»: a signed link that turns on draft mode and lands on the page (ADR-039).
    preview: (doc, { req, locale }) =>
      typeof doc['slug'] === 'string' && doc['slug']
        ? previewUrl(
            req.payload.config.serverURL,
            localePath(requestLocale(locale), `/${doc['slug']}`),
            req.payload.secret,
          )
        : null,
    defaultColumns: ['title', 'slug', 'updatedAt', '_status'],
    listSearchableFields: ['title', 'slug'],
    group: adminGroup('site'),
    custom: {
      shows: {
        ar: 'الصفحات الثابتة بلغتيها: كيف تعمل، من نحن، تواصل معنا، الأسئلة الشائعة، والصفحات القانونية',
        en: 'b7r.sa/<slug> and b7r.sa/en/<slug>: how it works, about, contact, FAQ and the legal pages',
      },
    },
    description: {
      ar: 'صفحات الموقع كأقسام قابلة للتحرير. الصفحات السبع الأساسية ثابتة الرابط؛ أضف صفحات جديدة بحرّية.',
      en: 'Site pages as editable blocks. The seven designed pages keep their URLs; add new ones freely.',
    },
  },
  versions: { drafts: { autosave: { interval: 1500 }, schedulePublish: true }, maxPerDoc: 50 },
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
          throw new Refused(
            inLanguage(req, {
              ar: 'لهذه الصفحة مسار ثابت في الموقع؛ معرّفها لا يتغيّر',
              en: 'This page has a fixed route on the site; its address ending cannot change',
            }),
          );
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
          throw new Refused(
            inLanguage(req, {
              ar: 'هذه الصفحة جزء من الموقع؛ لا يمكن إلغاء نشرها',
              en: 'This page is part of the site; it cannot be unpublished',
            }),
          );
        }
        // A draft autosave may carry no slug yet; `required` refuses the empty slug at publish.
        if (!slug) return data;
        const problem = pageSlugProblem(slug);
        if (problem) throw new Refused(inLanguage(req, problem));
        return data;
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        const doc = await req.payload.findByID({ collection: 'pages', id, depth: 0, req });
        if (reserved(doc.slug)) {
          throw new Refused(
            inLanguage(req, {
              ar: 'لهذه الصفحة مسار ثابت في الموقع؛ لا يمكن حذفها',
              en: 'This page has a fixed route on the site; it cannot be deleted',
            }),
          );
        }
      },
    ],
    afterChange: [revalidatePages, applyTranslations],
    afterDelete: [revalidatePages],
  },
  fields: describeFields(
    [
      {
        type: 'tabs',
        tabs: [
          {
            label: { ar: 'المحتوى', en: 'Content' },
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
                    label: { ar: 'المعرّف في الرابط', en: 'Address ending (slug)' },
                  },
                ],
              },
              {
                name: 'lead',
                type: 'text',
                localized: true,
                label: { ar: 'السطر تحت العنوان (اختياري)', en: 'Line under the title (optional)' },
              },
              {
                name: 'blocks',
                type: 'blocks',
                required: true,
                minRows: 1,
                blocks: PAGE_BLOCKS,
                label: { ar: 'الأقسام', en: 'Sections' },
                labels: {
                  singular: { ar: 'قسم', en: 'Section' },
                  plural: { ar: 'الأقسام', en: 'Sections' },
                },
              },
            ],
          },
          {
            label: { ar: 'البحث', en: 'Search' },
            fields: [
              {
                name: 'seo',
                type: 'group',
                label: { ar: 'محركات البحث', en: 'Search engines' },
                fields: [
                  {
                    name: 'title',
                    type: 'text',
                    required: true,
                    localized: true,
                    maxLength: 70,
                    label: {
                      ar: 'عنوان البحث (حتى 70 حرفاً)',
                      en: 'Search title (up to 70 characters)',
                    },
                  },
                  {
                    name: 'description',
                    type: 'textarea',
                    required: true,
                    localized: true,
                    maxLength: 160,
                    label: {
                      ar: 'وصف البحث (حتى 160 حرفاً)',
                      en: 'Search description (up to 160 characters)',
                    },
                  },
                  {
                    name: 'ogImage',
                    type: 'upload',
                    relationTo: 'media',
                    label: { ar: 'صورة المشاركة (اختياري)', en: 'Share image (optional)' },
                  },
                ],
              },
            ],
          },
        ],
      },
      savedByField,
    ],
    PAGE_DESCRIPTIONS,
  ),
};
