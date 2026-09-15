import type { CollectionConfig } from 'payload';
import { isAdmin, isEditorOrAdmin } from '@/modules/cms/access';
import { savedByField, stampSavedBy } from '@/modules/cms/fields/saved-by';
import { collectionComponents } from '@/modules/cms/admin/document/config';
import { adminGroup } from '@/modules/cms/admin/icons';

const ARABIC = /[؀-ۿ]/;

/**
 * Media library (BRD 9.2, 9.5): originals kept, four generated sizes with focal-point
 * cropping, Arabic alt text required. Storage is S3 when configured (payload.config) and
 * `public/media` on disk otherwise; either way the site requests images only through
 * `next/image` (ADR-029).
 */
export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: { ar: 'ملف وسائط', en: 'Media' }, plural: { ar: 'الوسائط', en: 'Media' } },
  admin: {
    components: collectionComponents('media', { localized: true }),
    group: adminGroup('site'),
    custom: {
      shows: {
        ar: 'حيثما وُضعت صورة أو أيقونة: المنتجات، الصفحة الرئيسية، أغلفة المدونة',
        en: 'wherever a photo or an icon is placed: products, the home page, the blog covers',
      },
    },
    description: {
      ar: 'الصور والملفات المستخدمة في الصفحات والمنتجات. اكتب نصاً بديلاً لكل صورة.',
      en: 'Images and files used by pages and products. Give every image alt text.',
    },
    defaultColumns: ['filename', 'alt', 'updatedAt'],
    useAsTitle: 'filename',
    listSearchableFields: ['filename', 'alt'],
  },
  access: {
    read: () => true,
    create: isEditorOrAdmin,
    update: isEditorOrAdmin,
    delete: isAdmin,
  },
  upload: {
    staticDir: 'public/media',
    // Raster only: an editor-uploaded SVG served same-origin would run script in the admin.
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    focalPoint: true,
    imageSizes: [
      { name: 'thumbnail', width: 400, height: undefined, position: 'centre' },
      { name: 'card', width: 800, height: undefined, position: 'centre' },
      { name: 'hero', width: 1920, height: undefined, position: 'centre' },
      { name: 'og', width: 1200, height: 630, fit: 'cover', position: 'centre' },
    ],
    adminThumbnail: 'thumbnail',
  },
  hooks: { beforeChange: [stampSavedBy] },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      localized: true,
      label: { ar: 'النص البديل', en: 'Alt text' },
      admin: {
        description: {
          ar: 'وصف الصورة كما يقرؤه قارئ الشاشة، بلغة التبويب المفتوح. مطلوب.',
          en: 'Describe the image in the language of the open locale tab; required.',
        },
      },
      // Arabic in the Arabic locale, any script in English (ADR-043).
      validate: (value: unknown, { req }: { req: { locale?: string } }) => {
        if (typeof value !== 'string' || value.trim().length < 3) return 'اكتب نصاً بديلاً';
        if (req.locale !== 'en' && !ARABIC.test(value)) return 'النص البديل يجب أن يكون بالعربية';
        return true;
      },
    },
    {
      name: 'credit',
      type: 'text',
      label: { ar: 'المصدر (اختياري)', en: 'Credit (optional)' },
    },
    savedByField,
  ],
};
