import type { CollectionConfig } from 'payload';
import { isAdmin, isEditorOrAdmin } from '@/modules/cms/access';
import { inLanguage } from '@/modules/cms/fields/message';
import { savedByField, stampSavedBy } from '@/modules/cms/fields/saved-by';
import { refuseAnimated } from '@/modules/cms/hooks/animated';
import { BLUR_FIELD, stampBlur } from '@/modules/cms/hooks/blur';
import { applyTranslations } from '@/modules/cms/hooks/translations';
import { optimizedSrc } from '@/lib/image-url';
import { mediaUrl } from '@/lib/cms/mappers';
import { hasRendition, mediaImageSizes, renditionUrl } from '@/lib/renditions';
import { collectionComponents } from '@/modules/cms/admin/document/config';
import { adminGroup } from '@/modules/cms/admin/icons';
import { MEDIA_DESCRIPTIONS } from '@/modules/cms/admin/descriptions/site';
import { describeFields } from '@/modules/cms/admin/descriptions/describe';

const ARABIC = /[؀-ۿ]/;

type Validation = { req: { locale?: string; i18n?: { language?: string } } };

/**
 * The image library (BRD 9.2, 9.5): the original and its renditions, alt text required per
 * language. Called "Images" in the panel since it accepts raster images only. Storage is S3
 * when configured (payload.config) and `public/media` on disk otherwise. Every upload is
 * encoded once into the ladder of `src/lib/renditions.ts` (ADR-064): ten widths in AVIF and
 * WebP, named `{stem}-{width}.{format}` beside the original, which is what the site's
 * `<Photo>` and the designer request straight from the storage CDN; the image optimizer
 * keeps only the `og:image` JPEG. No focal point and no crop: a width-only rendition keeps
 * the whole frame, and a crop would rewrite the file under its own name, which the edge
 * caches for a month (replace a photo by uploading it again; it gets a new name). A hidden
 * `blur` field holds the blur-up placeholder the photo components inline (`stampBlur`).
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
      ar: 'صور الموقع وأيقوناته: المنتجات، الرئيسية، أغلفة المدونة. ارفع أعلى دقة لديك؛ الموقع يصغّرها لكل شاشة.',
      en: 'The photos and icons the site shows: products, the home page, the blog covers. Upload the largest file; the site resizes it.',
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
    imageSizes: mediaImageSizes(),
    focalPoint: false,
    crop: false,
    // The panel's thumbnail is the 384 px WebP rendition (a same-host URL stays relative, an
    // S3 one is on the admin's `img-src`); a document uploaded before the renditions existed
    // falls back to the optimizer's transform of the original until the backfill runs.
    adminThumbnail: ({ doc }) => {
      const url = typeof doc['url'] === 'string' ? mediaUrl({ url: doc['url'] }) : undefined;
      if (!url) return null;
      return hasRendition(doc, 'webp384')
        ? renditionUrl(url, 384, 'webp')
        : optimizedSrc(url, 384, 75);
    },
  },
  hooks: {
    beforeOperation: [refuseAnimated],
    beforeChange: [stampSavedBy, stampBlur],
    afterChange: [applyTranslations],
  },
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
