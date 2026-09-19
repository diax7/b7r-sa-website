import {
  BoldFeature,
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  ItalicFeature,
  lexicalEditor,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  UnorderedListFeature,
  UploadFeature,
} from '@payloadcms/richtext-lexical';
import type { Block, Field, RichTextField } from 'payload';
import { CARD_ICONS, FAQ_SELECTIONS } from '@/content/schema';
import { iconOptions } from '@/modules/cms/admin/icons';
import { twinField } from '@/modules/cms/fields/bilingual';

/**
 * The rich-text feature set (BRD 9.5): H2/H3 (the page owns its H1), bold, italic, lists,
 * links to the site's pages and products or a URL, images from the media library, and the
 * two toolbars (admin audit 2026-09-18, 2.3): a fixed one above the text and one that
 * follows a selection. No H1, no alignment, no code, no tables; the «CTA block» custom node
 * is deferred (ADR-031).
 */
export const PAGE_TEXT_FEATURES = [
  ParagraphFeature(),
  HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }),
  BoldFeature(),
  ItalicFeature(),
  UnorderedListFeature(),
  OrderedListFeature(),
  LinkFeature({ enabledCollections: ['pages', 'products'] }),
  UploadFeature({ enabledCollections: ['media'] }),
  FixedToolbarFeature(),
  InlineToolbarFeature(),
];

export const richTextEditor = lexicalEditor({ features: PAGE_TEXT_FEATURES });

/**
 * The page blocks (BRD 9.4, 9.5; ADR-031): each one is a section the designed pages already
 * have, so an editor assembles a page from the same parts and nothing new is designed in
 * the admin. Field names match the `Block` contract in content/schema.ts.
 */

const text = (name: string, label: { ar: string; en: string }, required = true): Field => ({
  name,
  type: 'text',
  required,
  localized: true,
  label,
});

const textarea = (name: string, label: { ar: string; en: string }, required = true): Field => ({
  name,
  type: 'textarea',
  required,
  localized: true,
  label,
});

const upload = (name: string, label: { ar: string; en: string }, required = true): Field => ({
  name,
  type: 'upload',
  relationTo: 'media',
  required,
  label,
});

const items = (
  fields: Field[],
  min: number,
  max: number,
  label: { ar: string; en: string },
): Field => ({
  name: 'items',
  type: 'array',
  required: true,
  minRows: min,
  maxRows: max,
  label,
  fields,
});

/** The block's body, per language; its English is the twin right under it (ADR-057, PR B). */
const content: RichTextField = {
  name: 'content',
  type: 'richText',
  required: true,
  localized: true,
  editor: richTextEditor,
  label: { ar: 'المحتوى', en: 'Content' },
};

export const RichTextBlock: Block = {
  slug: 'richText',
  labels: {
    singular: { ar: 'نص منسّق', en: 'Rich text' },
    plural: { ar: 'نصوص منسّقة', en: 'Rich text' },
  },
  fields: [
    text('title', { ar: 'العنوان (اختياري)', en: 'Title (optional)' }, false),
    content,
    twinField(content),
  ],
};

/** The About header: the story beside the brand photo, then the facts band (BRD 6.8). */
export const StoryBlock: Block = {
  slug: 'story',
  labels: { singular: { ar: 'الحكاية', en: 'Story' }, plural: { ar: 'الحكايات', en: 'Stories' } },
  fields: [
    text('heading', { ar: 'عنوان الحكاية', en: 'Story heading' }),
    textarea('text', { ar: 'النص', en: 'Text' }),
    text('line', { ar: 'سطر الموقع', en: 'Location line' }),
    upload('photo', { ar: 'الصورة', en: 'Photo' }),
    {
      name: 'withFacts',
      type: 'checkbox',
      defaultValue: true,
      label: { ar: 'شريط الحقائق بعد الحكاية', en: 'Facts band after the story' },
    },
  ],
};

export const CardsBlock: Block = {
  slug: 'cards',
  labels: { singular: { ar: 'بطاقات', en: 'Cards' }, plural: { ar: 'بطاقات', en: 'Cards' } },
  fields: [
    text('title', { ar: 'العنوان (اختياري)', en: 'Title (optional)' }, false),
    items(
      [
        {
          type: 'row',
          fields: [
            {
              name: 'icon',
              type: 'select',
              admin: { components: { Field: '@/modules/cms/admin/fields/icon-select#IconSelect' } },
              required: true,
              options: iconOptions(CARD_ICONS),
              label: { ar: 'الأيقونة', en: 'Icon' },
            },
            text('title', { ar: 'العنوان', en: 'Title' }),
          ],
        },
        textarea('text', { ar: 'النص', en: 'Text' }),
        upload('art', { ar: 'صورة البطاقة (اختياري)', en: 'Card art (optional)' }, false),
      ],
      1,
      6,
      { ar: 'البطاقات', en: 'Cards' },
    ),
  ],
};

/** The journey (BRD 6.7): numbered steps on a connected path. */
export const StepsBlock: Block = {
  slug: 'steps',
  labels: { singular: { ar: 'خطوات', en: 'Steps' }, plural: { ar: 'خطوات', en: 'Steps' } },
  fields: [
    items(
      [
        text('title', { ar: 'العنوان', en: 'Title' }),
        textarea('text', { ar: 'النص', en: 'Text' }),
        upload('icon', { ar: 'الأيقونة المجسّمة', en: '3D icon' }),
      ],
      2,
      8,
      { ar: 'الخطوات', en: 'Steps' },
    ),
  ],
};

export const ProfitEquationBlock: Block = {
  slug: 'profitEquation',
  labels: {
    singular: { ar: 'معادلة الربح', en: 'Profit equation' },
    plural: { ar: 'معادلات الربح', en: 'Profit equations' },
  },
  fields: [
    text('title', { ar: 'العنوان', en: 'Title' }),
    {
      type: 'row',
      fields: [
        text('sell', { ar: 'سعر البيع', en: 'Sell price label' }),
        text('base', { ar: 'التكلفة', en: 'Base cost label' }),
        text('profit', { ar: 'الربح', en: 'Profit label' }),
      ],
    },
    text('exampleLine', { ar: 'سطر المثال', en: 'Example line' }),
  ],
};

export const FaqListBlock: Block = {
  slug: 'faqList',
  labels: {
    singular: { ar: 'أسئلة شائعة', en: 'FAQ list' },
    plural: { ar: 'أسئلة شائعة', en: 'FAQ lists' },
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'selection',
          type: 'select',
          required: true,
          defaultValue: 'all',
          options: [
            { label: { ar: 'كل الأسئلة مجمّعة', en: 'All, grouped' }, value: 'all' },
            { label: { ar: 'أسئلة الرئيسية', en: 'The home entries' }, value: 'home' },
          ],
          label: { ar: 'الاختيار', en: 'Selection' },
        },
        {
          name: 'offset',
          type: 'number',
          defaultValue: 0,
          min: 0,
          label: { ar: 'تخطَّ', en: 'Skip' },
          admin: { step: 1, condition: (_d, s) => s?.['selection'] === 'home' },
        },
        {
          name: 'limit',
          type: 'number',
          min: 1,
          label: { ar: 'العدد', en: 'Limit' },
          admin: { step: 1, condition: (_d, s) => s?.['selection'] === 'home' },
        },
      ],
    },
    text('title', { ar: 'العنوان (اختياري)', en: 'Title (optional)' }, false),
    {
      type: 'row',
      fields: [
        text('linkLabel', { ar: 'نص الرابط (اختياري)', en: 'Link label (optional)' }, false),
        {
          name: 'linkHref',
          type: 'text',
          label: { ar: 'وجهة الرابط', en: 'Link target' },
          validate: (value: unknown) =>
            !value || (typeof value === 'string' && value.startsWith('/'))
              ? true
              : 'الرابط يبدأ بـ /',
        },
      ],
    },
    text('bottomLine', { ar: 'السطر الختامي (اختياري)', en: 'Closing line (optional)' }, false),
    text('bottomLinkWord', { ar: 'كلمة الرابط فيه', en: 'The word that carries the link' }, false),
  ],
};

export const MiskCredentialBlock: Block = {
  slug: 'miskCredential',
  labels: {
    singular: { ar: 'شهادة مسك', en: 'MISK credential' },
    plural: { ar: 'شهادات', en: 'Credentials' },
  },
  fields: [
    text('title', { ar: 'العنوان', en: 'Title' }),
    textarea('text', { ar: 'النص', en: 'Text' }),
  ],
};

/** The contact section (BRD 6.9): the form (its strings live in code), the cards, booking. */
export const ContactBlock: Block = {
  slug: 'contact',
  labels: { singular: { ar: 'التواصل', en: 'Contact' }, plural: { ar: 'التواصل', en: 'Contact' } },
  fields: [
    {
      type: 'row',
      fields: [
        text('whatsappTitle', { ar: 'بطاقة WhatsApp: العنوان', en: 'WhatsApp card title' }),
        text('whatsappText', { ar: 'بطاقة WhatsApp: النص', en: 'WhatsApp card text' }),
      ],
    },
    {
      type: 'row',
      fields: [
        text('emailTitle', { ar: 'بطاقة البريد', en: 'Email card title' }),
        text('phoneTitle', { ar: 'بطاقة الهاتف', en: 'Phone card title' }),
        text('followTitle', { ar: 'بطاقة المتابعة', en: 'Follow card title' }),
      ],
    },
    {
      name: 'booking',
      type: 'group',
      label: { ar: 'بطاقة الحجز', en: 'Booking card' },
      fields: [
        text('title', { ar: 'العنوان', en: 'Title' }),
        text('text', { ar: 'النص', en: 'Text' }),
        {
          type: 'row',
          fields: [
            text('button', { ar: 'الزر', en: 'Button' }),
            text('whatsappMessage', {
              ar: 'رسالة WhatsApp الجاهزة',
              en: 'Prefilled WhatsApp message',
            }),
          ],
        },
      ],
    },
  ],
};

export const LegalBodyBlock: Block = {
  slug: 'legalBody',
  labels: {
    singular: { ar: 'نص قانوني', en: 'Legal body' },
    plural: { ar: 'نصوص قانونية', en: 'Legal bodies' },
  },
  fields: [
    {
      name: 'updatedAt',
      type: 'date',
      required: true,
      label: { ar: 'آخر تحديث', en: 'Last updated' },
      admin: { date: { pickerAppearance: 'dayOnly' } },
    },
    {
      name: 'body',
      type: 'textarea',
      required: true,
      localized: true,
      label: { ar: 'النص (Markdown)', en: 'Body (Markdown)' },
      admin: { rows: 30 },
    },
  ],
};

export const MediaBannerBlock: Block = {
  slug: 'mediaBanner',
  labels: {
    singular: { ar: 'صورة عريضة', en: 'Media banner' },
    plural: { ar: 'صور عريضة', en: 'Media banners' },
  },
  fields: [
    upload('media', { ar: 'الصورة', en: 'Image' }),
    text('caption', { ar: 'التعليق (اختياري)', en: 'Caption (optional)' }, false),
  ],
};

const list = (name: string, label: { ar: string; en: string }): Field => ({
  name,
  type: 'array',
  required: true,
  minRows: 1,
  label,
  labels: { singular: { ar: 'بند', en: 'Item' }, plural: { ar: 'بنود', en: 'Items' } },
  fields: [text('text', { ar: 'النص', en: 'Text' })],
});

/** A comparison table (ADR-050): B7R against one other service, with the date its pages were read. */
export const CompareBlock: Block = {
  slug: 'compare',
  labels: {
    singular: { ar: 'مقارنة', en: 'Comparison' },
    plural: { ar: 'مقارنات', en: 'Comparisons' },
  },
  fields: [
    text('title', { ar: 'العنوان (اختياري)', en: 'Title (optional)' }, false),
    textarea('intro', { ar: 'المقدمة (اختياري)', en: 'Intro (optional)' }, false),
    {
      type: 'row',
      fields: [
        text('ours', { ar: 'عمودنا', en: 'Our column' }),
        text('theirs', { ar: 'عمود الطرف الآخر', en: 'Their column' }),
        {
          name: 'asOf',
          type: 'date',
          required: true,
          label: { ar: 'تاريخ القراءة', en: 'Read on' },
          admin: { date: { pickerAppearance: 'dayOnly' } },
          hooks: {
            // The admin's day picker already stores noon UTC; a REST write may not. Pinned to
            // noon so the day the page shows is the day that was picked in any zone.
            beforeChange: [
              ({ value }) =>
                typeof value === 'string' ? `${value.slice(0, 10)}T12:00:00.000Z` : value,
            ],
          },
        },
      ],
    },
    {
      name: 'rows',
      type: 'array',
      required: true,
      minRows: 3,
      label: { ar: 'الصفوف', en: 'Rows' },
      labels: { singular: { ar: 'صف', en: 'Row' }, plural: { ar: 'صفوف', en: 'Rows' } },
      fields: [
        text('criterion', { ar: 'المعيار', en: 'Criterion' }),
        {
          type: 'row',
          fields: [
            text('ours', { ar: 'عندنا', en: 'Ours' }),
            text('theirs', { ar: 'عندهم', en: 'Theirs' }),
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        list('bestFor', { ar: 'الأنسب لـ', en: 'Best for' }),
        list('notBestFor', { ar: 'ليس الأنسب لـ', en: 'Not best for' }),
      ],
    },
    textarea('closing', { ar: 'الخاتمة (اختياري)', en: 'Closing (optional)' }, false),
  ],
};

export const PAGE_BLOCKS: Block[] = [
  RichTextBlock,
  StoryBlock,
  CardsBlock,
  StepsBlock,
  ProfitEquationBlock,
  FaqListBlock,
  MiskCredentialBlock,
  ContactBlock,
  LegalBodyBlock,
  MediaBannerBlock,
  CompareBlock,
];

export { FAQ_SELECTIONS };
