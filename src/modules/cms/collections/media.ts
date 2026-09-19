import type { CollectionConfig } from 'payload';
import { isAdmin, isEditorOrAdmin } from '@/modules/cms/access';
import { inLanguage } from '@/modules/cms/fields/message';
import { savedByField, stampSavedBy } from '@/modules/cms/fields/saved-by';
import { BLUR_FIELD, stampBlur } from '@/modules/cms/hooks/blur';
import { applyTranslations } from '@/modules/cms/hooks/translations';
import { optimizedSrc } from '@/lib/image-url';
import { mediaUrl } from '@/lib/cms/mappers';
import { collectionComponents } from '@/modules/cms/admin/document/config';
import { adminGroup } from '@/modules/cms/admin/icons';
import { MEDIA_DESCRIPTIONS } from '@/modules/cms/admin/descriptions/site';
import { describeFields } from '@/modules/cms/admin/descriptions/describe';

const ARABIC = /[؀-ۿ]/;

type Validation = { req: { locale?: string; i18n?: { language?: string } } };

/**
 * The image library (BRD 9.2, 9.5): the original only, alt text required per language.
 * Called "Images" in the panel since it accepts raster images only. Storage is S3 when
 * configured (payload.config) and `public/media` on disk otherwise; either way the site
 * requests images only through `next/image` (ADR-029), which is why no rendition is
 * generated on upload (amended 2026-09-19): the optimizer resizes the original on demand,
 * and the admin's own thumbnail comes from it too. A hidden `blur` field holds the blur-up
 * placeholder the photo components inline (`stampBlur`).
 */
export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: { ar: 'صورة', en: 'Image' }, plural: { ar: 'الصور', en: 'Images' } },
  admin: {
    hideAPIURL: true,
    components: collectionComponents('media'),
    group: adminGroup('site'),
    custom: {
      shows: {
        ar: 'حيثما وُضعت صورة أو أيقونة: المنتجات، الصفحة الرئيسية، أغلفة المدونة',
        en: 'wherever a photo or an icon is placed: products, the home page, the blog covers',
      },
    },
    description: {
      ar: 'صور الموقع وأيقوناته: المنتجات، الرئيسية، أغلفة المدونة. لكل صورة نص بديل باللغتين؛ ارفع الصورة بأعلى دقة لديك (صور المنتجات مربّعة)، فالموقع يصغّرها بنفسه لكل شاشة.',
      en: 'The photos and icons the site shows: products, the home page, the blog covers. Every image needs its alt text in both languages; upload the largest file you have (product photos are squares), the site resizes it for every screen itself.',
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
    // The panel's thumbnail is a 384 px transform of the original by the image optimizer
    // (a same-host URL stays relative, an S3 one is in `remotePatterns`), never the original.
    adminThumbnail: ({ doc }) => {
      const url = typeof doc['url'] === 'string' ? mediaUrl({ url: doc['url'] }) : undefined;
      return url ? optimizedSrc(url, 384, 75) : null;
    },
  },
  hooks: { beforeChange: [stampSavedBy, stampBlur], afterChange: [applyTranslations] },
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
      {
        name: BLUR_FIELD,
        type: 'text',
        label: { ar: 'صورة التحميل الضبابية', en: 'Blur placeholder' },
        admin: { hidden: true },
      },
      savedByField,
    ],
    MEDIA_DESCRIPTIONS,
  ),
};
