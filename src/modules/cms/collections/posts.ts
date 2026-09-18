import {
  BlockquoteFeature,
  BoldFeature,
  HeadingFeature,
  ItalicFeature,
  lexicalEditor,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  UnorderedListFeature,
  UploadFeature,
} from '@payloadcms/richtext-lexical';
import type { CollectionConfig, PayloadRequest } from 'payload';
import { localePath, requestLocale } from '@/lib/i18n';
import { previewUrl } from '@/lib/preview-token';
import {
  adminField,
  canDeleteVersioned,
  isEditorOrAdmin,
  publishedOrStaff,
} from '@/modules/cms/access';
import { SLUG_PATTERN } from '@/modules/cms/collections/pages';
import { Refused } from '@/modules/cms/refused';
import {
  bodyReadingMinutes,
  editorialWarnings,
  EXCERPT_MAX,
  publishProblems,
  TAKEAWAYS,
  TITLE_MAX,
} from '@/modules/cms/fields/editorial';
import { savedByField, stampSavedBy } from '@/modules/cms/fields/saved-by';
import { isDraftSave, revalidatePosts } from '@/modules/cms/hooks/revalidate';
import { applyTranslations } from '@/modules/cms/hooks/translations';
import { collectionComponents } from '@/modules/cms/admin/document/config';
import { adminGroup } from '@/modules/cms/admin/icons';
import { POST_DESCRIPTIONS } from '@/modules/cms/admin/descriptions/blog';
import { describeFields } from '@/modules/cms/admin/descriptions/describe';

/**
 * The post body's editor: exactly the features the Markdown transformers cover, so the
 * content engine's Markdown converts to the same tree an editor produces (no tables, no H1:
 * the post owns its H1).
 */
export const postEditor = lexicalEditor({
  features: [
    ParagraphFeature(),
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }),
    BoldFeature(),
    ItalicFeature(),
    UnorderedListFeature(),
    OrderedListFeature(),
    BlockquoteFeature(),
    LinkFeature({ enabledCollections: ['pages', 'products', 'posts'] }),
    UploadFeature({ enabledCollections: ['media'] }),
  ],
});

export const POST_ORIGINS = ['manual', 'ai', 'ai-edited'] as const;
export type PostOrigin = (typeof POST_ORIGINS)[number];

/** Why a post slug is refused, or null. */
export function postSlugProblem(slug: unknown): string | null {
  if (typeof slug !== 'string' || !SLUG_PATTERN.test(slug) || slug.length > 64) {
    return 'Slug: lowercase letters, digits and hyphens only, up to 64 characters';
  }
  return null;
}

/** A publish through the API or the admin, never a draft save or an autosave. */
function isPublish(data: Record<string, unknown> | undefined, req: PayloadRequest): boolean {
  return data?.['_status'] === 'published' && !isDraftSave(req);
}

/** The seeded author (`dhia`) as the default byline; the first created one otherwise. */
export const DEFAULT_AUTHOR_SLUG = 'dhia';

async function defaultAuthor({ req }: { req: PayloadRequest }): Promise<number | undefined> {
  const seeded = await req.payload.find({
    collection: 'authors',
    where: { slug: { equals: DEFAULT_AUTHOR_SLUG } },
    limit: 1,
    depth: 0,
    req,
  });
  if (seeded.docs[0]) return seeded.docs[0].id;
  const first = await req.payload.find({
    collection: 'authors',
    limit: 1,
    depth: 0,
    sort: 'createdAt',
    req,
  });
  return first.docs[0]?.id;
}

const EDITED_FIELDS = ['title', 'excerpt', 'body', 'takeaways'] as const;

/**
 * Blog posts (BRD 10.1; ADR-041): drafts with autosave and scheduled publishing, the
 * editorial rules enforced on publish, reading time and warnings computed on every save,
 * `origin` telling a hand-written post from an engine's (`ai`) and from one an editor has
 * touched since (`ai-edited`, exempt from the freshness job).
 */
export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: { ar: 'مقال', en: 'Post' }, plural: { ar: 'المقالات', en: 'Posts' } },
  admin: {
    components: collectionComponents('posts', { localized: true }),
    useAsTitle: 'title',
    preview: (doc, { req, locale }) =>
      typeof doc['slug'] === 'string' && doc['slug']
        ? previewUrl(
            req.payload.config.serverURL,
            localePath(requestLocale(locale), `/blog/${doc['slug']}`),
            req.payload.secret,
          )
        : null,
    defaultColumns: ['title', 'hub', 'publishedAt', 'origin', '_status'],
    listSearchableFields: ['title', 'slug', 'excerpt'],
    group: adminGroup('blog'),
    custom: {
      shows: {
        ar: 'المدونة وصفحة كل مقال، وخلاصة RSS، وملف llms.txt',
        en: "b7r.sa/blog and each post's page, the RSS feed and llms.txt",
      },
    },
    description: {
      ar: 'مقالات المدونة. المسودات لا تُنشر؛ النشر يلزمه غلاف وثلاث نقاط ورابطان داخليان.',
      en: 'Blog posts. Drafts stay private; publishing needs a cover, three takeaways and two internal links.',
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
    beforeValidate: [
      ({ data, originalDoc, req }) => {
        const slug = data?.['slug'];
        if (slug) {
          const problem = postSlugProblem(slug);
          if (problem) throw new Refused(problem);
        }
        if (isPublish(data, req)) {
          const problems = publishProblems({ ...originalDoc, ...data });
          if (problems.length > 0) throw new Refused(problems.join('; '));
        }
        return data;
      },
    ],
    beforeChange: [
      stampSavedBy,
      ({ data, originalDoc, req }) => {
        // Both computed in the language being saved (the fields are localised, ADR-043).
        const merged = { ...originalDoc, ...data };
        const locale = requestLocale(req.locale);
        data['readingMinutes'] = bodyReadingMinutes(merged['body'], locale);
        data['warnings'] = editorialWarnings(merged, locale).map((text) => ({ text }));
        if (isPublish(data, req) && !merged['publishedAt']) {
          data['publishedAt'] = new Date().toISOString();
        }
        // A person's change to an engine's post: it is theirs now (the freshness job leaves it).
        const edited = EDITED_FIELDS.some(
          (field) =>
            field in data && JSON.stringify(data[field]) !== JSON.stringify(originalDoc?.[field]),
        );
        if (req.user && originalDoc?.['origin'] === 'ai' && edited && !isDraftSave(req)) {
          data['origin'] = 'ai-edited';
        }
        return data;
      },
    ],
    afterChange: [revalidatePosts, applyTranslations],
    afterDelete: [revalidatePosts],
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
                    maxLength: TITLE_MAX,
                    label: { ar: `العنوان (حتى ${TITLE_MAX} حرفاً)`, en: `Title (≤ ${TITLE_MAX})` },
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
                        ar: 'حروف لاتينية صغيرة وشرطات؛ يصبح /blog/المعرّف',
                        en: 'lowercase-hyphenated; served at /blog/slug',
                      },
                    },
                  },
                ],
              },
              {
                name: 'body',
                type: 'richText',
                required: true,
                localized: true,
                editor: postEditor,
                label: { ar: 'المتن', en: 'Body' },
                admin: {
                  description: {
                    ar: 'عناوين H2 بصيغة أسئلة، فقرات قصيرة، رابطان على الأقل إلى صفحات الموقع.',
                    en: 'H2s as questions, short paragraphs, at least two links to pages of this site.',
                  },
                },
              },
            ],
          },
          {
            label: { ar: 'الملخص والغلاف', en: 'Summary & cover' },
            fields: [
              {
                name: 'excerpt',
                type: 'textarea',
                required: true,
                localized: true,
                maxLength: EXCERPT_MAX,
                label: {
                  ar: `المقتطف (حتى ${EXCERPT_MAX} حرفاً)`,
                  en: `Excerpt (≤ ${EXCERPT_MAX})`,
                },
                admin: {
                  description: {
                    ar: 'جملة أو جملتان تظهران في بطاقة المقال وفي نتائج البحث.',
                    en: 'One or two sentences on the post card and in search results.',
                  },
                },
              },
              {
                type: 'row',
                fields: [
                  {
                    name: 'hub',
                    type: 'relationship',
                    relationTo: 'categories',
                    required: true,
                    label: { ar: 'القسم', en: 'Hub' },
                  },
                  {
                    name: 'tags',
                    type: 'relationship',
                    relationTo: 'tags',
                    hasMany: true,
                    label: { ar: 'الوسوم (اختياري)', en: 'Tags (optional)' },
                  },
                ],
              },
              {
                name: 'cover',
                type: 'upload',
                relationTo: 'media',
                required: true,
                label: { ar: 'الغلاف (16:9)', en: 'Cover (16:9)' },
                admin: {
                  description: {
                    ar: 'صورة الغلاف مع نص بديل عربي في المكتبة.',
                    en: 'The cover with its Arabic alt text in the library.',
                  },
                },
              },
              {
                name: 'takeaways',
                type: 'array',
                required: true,
                localized: true,
                minRows: TAKEAWAYS,
                maxRows: TAKEAWAYS,
                label: { ar: 'أهم النقاط (ثلاث)', en: 'Key takeaways (three)' },
                labels: {
                  singular: { ar: 'نقطة', en: 'Takeaway' },
                  plural: { ar: 'نقاط', en: 'Takeaways' },
                },
                fields: [
                  {
                    name: 'text',
                    type: 'text',
                    required: true,
                    label: { ar: 'النقطة', en: 'Takeaway' },
                  },
                ],
              },
            ],
          },
          {
            label: { ar: 'البحث', en: 'Search' },
            fields: [
              {
                name: 'seo',
                type: 'group',
                label: { ar: 'محركات البحث', en: 'SEO' },
                admin: {
                  description: {
                    ar: 'اختياري: يُستخدم العنوان والمقتطف عندما تُترك فارغة.',
                    en: 'Optional: the title and the excerpt are used when left empty.',
                  },
                },
                fields: [
                  {
                    name: 'title',
                    type: 'text',
                    localized: true,
                    maxLength: TITLE_MAX,
                    label: {
                      ar: `عنوان الصفحة (حتى ${TITLE_MAX} حرفاً)`,
                      en: `Meta title (≤ ${TITLE_MAX})`,
                    },
                  },
                  {
                    name: 'description',
                    type: 'textarea',
                    localized: true,
                    maxLength: EXCERPT_MAX,
                    label: {
                      ar: `الوصف (حتى ${EXCERPT_MAX} حرفاً)`,
                      en: `Meta description (≤ ${EXCERPT_MAX})`,
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
      {
        name: 'author',
        type: 'relationship',
        relationTo: 'authors',
        required: true,
        defaultValue: defaultAuthor,
        label: { ar: 'الكاتب', en: 'Author' },
        admin: { position: 'sidebar' },
      },
      {
        name: 'publishedAt',
        type: 'date',
        label: { ar: 'تاريخ النشر', en: 'Published at' },
        admin: {
          position: 'sidebar',
          date: { pickerAppearance: 'dayAndTime' },
          description: {
            ar: 'يُملأ عند أول نشر إن تُرك فارغاً.',
            en: 'Filled on the first publish when left empty.',
          },
        },
      },
      {
        name: 'contentUpdatedAt',
        type: 'date',
        label: { ar: 'تاريخ التحديث (اختياري)', en: 'Updated at (optional)' },
        admin: {
          position: 'sidebar',
          date: { pickerAppearance: 'dayAndTime' },
          description: {
            ar: 'يُعرض على المقال عندما يتغيّر محتواه فعلاً.',
            en: 'Shown on the post when its content really changed.',
          },
        },
      },
      {
        name: 'readingMinutes',
        type: 'number',
        localized: true,
        label: { ar: 'دقائق القراءة', en: 'Reading minutes' },
        admin: { position: 'sidebar', readOnly: true },
      },
      {
        name: 'origin',
        type: 'select',
        required: true,
        defaultValue: 'manual',
        options: [
          { label: { ar: 'كتابة يدوية', en: 'Written by hand' }, value: 'manual' },
          { label: { ar: 'المحرّك الآلي', en: 'Content engine' }, value: 'ai' },
          { label: { ar: 'آلي ثم عُدّل', en: 'Engine, then edited' }, value: 'ai-edited' },
        ],
        label: { ar: 'المصدر', en: 'Origin' },
        access: { update: adminField },
        admin: {
          position: 'sidebar',
          description: {
            ar: 'تعديل محرّر على مقال آلي يجعله "آلي ثم عُدّل" ويستثنيه من التحديث الآلي.',
            en: 'A change by an editor to an engine post marks it "engine, then edited" and exempts it from the freshness job.',
          },
        },
      },
      {
        // The facts sheet's numbers when the engine (or the seed) wrote the post: the freshness
        // job's baseline (ADR-042). Hidden from the form; the runs log is swept yearly, the post
        // is not.
        name: 'factsBaseline',
        type: 'json',
        access: { update: adminField },
        admin: { hidden: true },
      },
      {
        name: 'engineActions',
        type: 'ui',
        admin: {
          position: 'sidebar',
          components: { Field: '@/modules/ai-content/admin/post-engine-actions#PostEngineActions' },
        },
      },
      {
        name: 'warnings',
        type: 'array',
        localized: true,
        label: { ar: 'تنبيهات التحرير', en: 'Editorial warnings' },
        admin: {
          position: 'sidebar',
          readOnly: true,
          components: { Field: '@/modules/cms/admin/fields/warnings-field#WarningsField' },
        },
        fields: [{ name: 'text', type: 'text' }],
      },
      savedByField,
    ],
    POST_DESCRIPTIONS,
  ),
};
