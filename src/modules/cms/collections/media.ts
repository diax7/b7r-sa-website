import type { CollectionConfig } from 'payload';
import { isAdmin, isEditorOrAdmin } from '@/modules/cms/access';
import { inLanguage } from '@/modules/cms/fields/message';
import { savedByField, stampSavedBy } from '@/modules/cms/fields/saved-by';
import { applyTranslations } from '@/modules/cms/hooks/translations';
import { collectionComponents } from '@/modules/cms/admin/document/config';
import { adminGroup } from '@/modules/cms/admin/icons';
import { MEDIA_DESCRIPTIONS } from '@/modules/cms/admin/descriptions/site';
import { describeFields } from '@/modules/cms/admin/descriptions/describe';

const ARABIC = /[؀-ۿ]/;

type Validation = { req: { locale?: string; i18n?: { language?: string } } };

/**
 * The image library (BRD 9.2, 9.5): originals kept, four generated sizes with focal-point
 * cropping, alt text required per language. Called "Images" in the panel since it accepts
 * raster images only. Storage is S3 when configured (payload.config) and `public/media` on
 * disk otherwise; either way the site requests images only through `next/image` (ADR-029).
 */
export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: { ar: 'صورة', en: 'Image' }, plural: { ar: 'الصور', en: 'Images' } },
  admin: {
    hideAPIURL: true,
    components: collectionComponents('media', { localized: true }),
    group: adminGroup('site'),
    custom: {
      shows: {
        ar: 'حيثما وُضعت صورة أو أيقونة: المنتجات، الصفحة الرئيسية، أغلفة المدونة',
        en: 'wherever a photo or an icon is placed: products, the home page, the blog covers',
      },
    },
    description: {
      ar: 'صور الموقع وأيقوناته: المنتجات، الرئيسية، أغلفة المدونة. لكل صورة نص بديل باللغتين؛ صور المنتجات مربّعة 1000×1000، وتُولَّد أربعة مقاسات عند الرفع.',
      en: 'The photos and icons the site shows: products, the home page, the blog covers. Every image needs its alt text in both languages; product photos are 1000 by 1000 squares, and four sizes are generated on upload.',
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
  hooks: { beforeChange: [stampSavedBy], afterChange: [applyTranslations] },
  fields: describeFields(
    [
      {
        name: 'alt',
        type: 'text',
        required: true,
        localized: true,
        label: { ar: 'النص البديل', en: 'Alt text' },
        // Arabic in the Arabic locale, any script in English (ADR-043).
        validate: (value: unknown, { req }: Validation) => {
          if (typeof value !== 'string' || value.trim().length < 3) {
            return inLanguage(req, { ar: 'اكتب نصاً بديلاً', en: 'Write the alt text' });
          }
          if (req.locale !== 'en' && !ARABIC.test(value)) {
            return inLanguage(req, {
              ar: 'النص البديل العربي يُكتب بالحروف العربية',
              en: 'The Arabic alt text must be in Arabic script',
            });
          }
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
    MEDIA_DESCRIPTIONS,
  ),
};
