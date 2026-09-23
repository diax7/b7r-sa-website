/**
 * The content contract (BRD 8.4): zod schemas for every shape the site reads. Level 2 stores
 * the same shapes in Payload collections of the same names. Every content file parses against
 * its schema in `tests/content-schema.test.ts`; the build fails on drift.
 */
import { z } from 'zod';

const nonEmpty = z.string().trim().min(1);
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be lowercase-hyphenated');
const publicPath = z.string().regex(/^\/[\w\-./]+$/, 'must be a public path starting with /');
/** A colour as `#rrggbb`; the admin's colour widget and the hero overlay write this shape. */
export const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
const hex = z.string().regex(HEX_COLOR);

/** At most this many proof chips under the hero copy (ADR-044); none hides the row. */
export const HERO_CHIPS_MAX = 6;
/** The hero overlay's colour when nobody set one (ADR-044). */
export const HERO_OVERLAY_DEFAULT = '#ffffff';
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const SiteSettingsSchema = z.object({
  brandName: nonEmpty,
  brandNameLatin: nonEmpty,
  tagline: nonEmpty,
  contact: z.object({ phone: nonEmpty, phoneIntl: nonEmpty, whatsapp: nonEmpty, email: z.email() }),
  social: z.object({ x: z.url(), instagram: z.url(), tiktok: z.url() }),
  offer: z.object({ welcomeCredit: z.int().positive() }),
  delivery: z.object({ maxDays: z.int().positive(), origin: nonEmpty, region: nonEmpty }),
  legalEntity: nonEmpty,
  /** Every main CTA button with the brand's sheen (ADR-054); the admin's switch, site-wide. */
  ctaShiny: z.boolean().default(false),
  /** The analytics ids (ADR-052): GA loads after consent when `gaId` is set; Umami when both of its values are. */
  analytics: z.object({
    gaId: z.string().optional(),
    umami: z.object({ src: nonEmpty, id: nonEmpty }).optional(),
  }),
});
export type SiteSettings = z.infer<typeof SiteSettingsSchema>;

/** `HH:MM` on a 24-hour clock, the shape the booking hours are typed in (ADR-062). */
export const CLOCK_TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
/** 0 is Sunday, as `Date.getUTCDay()` counts. */
const weekday = z.int().min(0).max(6);

/**
 * The host as the booker's event pane shows them (ADR-063): the author record's name and
 * role in the page's language, and its photo when it has one (the initials disc otherwise).
 */
export const BookingHostSchema = z.object({
  name: nonEmpty,
  role: z.string(),
  photo: z.string().nullable(),
});
export type BookingHost = z.infer<typeof BookingHostSchema>;

/**
 * The booking settings (BRD 11.2 as rewritten by ADR-062): the switch, the consultation's
 * name, the host and the blurb of the event pane (ADR-063), the slot arithmetic (minutes and
 * days), the weekly hours and the closed dates, all in Riyadh time, and the Workspace user
 * whose calendar takes the events.
 */
export const BookingSettingsSchema = z.object({
  enabled: z.boolean(),
  title: nonEmpty,
  blurb: z.string(),
  host: BookingHostSchema.nullable(),
  durationMinutes: z.int().min(10).max(240),
  bufferMinutes: z.int().min(0).max(120),
  noticeHours: z.int().min(0).max(336),
  horizonDays: z.int().min(1).max(90),
  maxPerDay: z.int().min(1).max(24),
  hours: z.array(
    z.object({
      day: weekday,
      from: z.string().regex(CLOCK_TIME),
      to: z.string().regex(CLOCK_TIME),
    }),
  ),
  closedDates: z.array(z.object({ date: isoDate, reason: z.string() })),
  hostEmail: z.email().or(z.literal('')),
});
export type BookingSettings = z.infer<typeof BookingSettingsSchema>;

export const NavItemSchema = z.object({
  label: nonEmpty,
  href: z.string().startsWith('/'),
  matchPrefix: z.string().startsWith('/').optional(),
});
export type NavItem = z.infer<typeof NavItemSchema>;

export const NavigationSchema = z.object({
  primary: z.array(NavItemSchema).length(6),
  policies: z.array(NavItemSchema).length(4),
  ctaLabel: nonEmpty,
  skipLinkLabel: nonEmpty,
  menuOpenLabel: nonEmpty,
  menuCloseLabel: nonEmpty,
});
export type Navigation = z.infer<typeof NavigationSchema>;

/** A site path, or an absolute URL once the photo lives in the CMS media store (S3). */
const imageSrc = publicPath.or(z.url());
/**
 * The blur-up placeholder of a CMS photo (ADR-029, amended 2026-09-19): a data URL the media
 * library computed on upload, inlined by `next/image` until the photo arrives. Absent for the
 * seed's paths and for a media document uploaded before the field existed.
 */
const blurDataUrl = z.string().startsWith('data:image/');

export const HeroSlideSchema = z.object({
  /** Stable key: the CMS row id, or the seed's slug. */
  id: nonEmpty,
  headline: nonEmpty,
  subline: nonEmpty,
  imageDesktop: imageSrc,
  imageMobile: imageSrc,
  blurDesktop: blurDataUrl.optional(),
  blurMobile: blurDataUrl.optional(),
  alt: z.string(),
});
export type HeroSlide = z.infer<typeof HeroSlideSchema>;

export const StepSchema = z.object({
  order: z.int().positive(),
  title: nonEmpty,
  text: nonEmpty,
  icon: imageSrc,
});
export type Step = z.infer<typeof StepSchema>;

export const WhyUsItemSchema = z.object({
  icon: z.enum(['ShieldCheck', 'Workflow', 'Zap']),
  title: nonEmpty,
  text: nonEmpty,
});
export type WhyUsItem = z.infer<typeof WhyUsItemSchema>;

/**
 * The home page content (BRD 4.4): what an editor writes. Interface strings (aria labels,
 * hints, input labels, validation) live in `src/messages/ar.json` (ADR-031).
 */
/**
 * The shape of a background set's key (spec 010): a short lowercase slug that starts with a
 * letter, so it cannot leave the `data-surface` selector it is written into.
 */
export const SURFACE_KEY = /^[a-z][a-z0-9-]{0,31}$/;

/**
 * A section's background (spec 010, phase 2): the key of a set, or absent for the section's
 * own. Only its shape is checked here; a key no set has paints the page's white.
 */
const surfaceKey = z.string().regex(SURFACE_KEY);
const background = { background: surfaceKey.optional() };

/**
 * The home sections that may take a background set: every section but the opening slides (a
 * photograph) and the bottom banner (the brand's blue between two waves).
 */
export const HOME_BACKGROUND_SECTIONS = [
  'productStrip',
  'designer',
  'steps',
  'video',
  'whyUs',
  'testimonials',
  'integrations',
  'faq',
] as const;

export type HomeBackgroundSection = (typeof HOME_BACKGROUND_SECTIONS)[number];

export const HomeSchema = z.object({
  hero: z.object({
    slides: z.array(HeroSlideSchema).length(4),
    primaryCta: nonEmpty,
    secondaryCta: nonEmpty,
    microcopy: nonEmpty,
    /** Zero to six proof chips; none hides the row (ADR-044). */
    chips: z.array(nonEmpty).max(HERO_CHIPS_MAX),
    /** The legibility fade over the photo: off, or its colour (ADR-044). */
    overlay: z.object({ enabled: z.boolean(), color: hex }),
  }),
  productStrip: z.object({
    eyebrow: nonEmpty,
    title: nonEmpty,
    lead: nonEmpty,
    pricePrefix: nonEmpty,
    button: nonEmpty,
    order: z.array(slug).length(5),
  }),
  designer: z.object({ eyebrow: nonEmpty, title: nonEmpty, lead: nonEmpty, cta: nonEmpty }),
  steps: z.object({
    enabled: z.boolean(),
    eyebrow: nonEmpty,
    title: nonEmpty,
    link: nonEmpty,
    items: z.array(StepSchema).length(3),
  }),
  video: z.object({ enabled: z.boolean(), title: nonEmpty, lead: nonEmpty }),
  whyUs: z.object({
    enabled: z.boolean(),
    eyebrow: nonEmpty,
    title: nonEmpty,
    items: z.array(WhyUsItemSchema).length(3),
  }),
  testimonials: z.object({ enabled: z.boolean(), eyebrow: nonEmpty, title: nonEmpty }),
  integrations: z.object({ enabled: z.boolean(), title: nonEmpty, lead: nonEmpty }),
  faq: z.object({ enabled: z.boolean(), title: nonEmpty, link: nonEmpty }),
  ribbon: z.object({ title: nonEmpty, lead: nonEmpty, button: nonEmpty }),
  /** The sections an editor gave a background set, by section; the rest keep their own. */
  backgrounds: z.partialRecord(z.enum(HOME_BACKGROUND_SECTIONS), surfaceKey).optional(),
});
export type Home = z.infer<typeof HomeSchema>;

export const ProductColorSchema = z.object({
  slug: slug,
  name: nonEmpty,
  hex,
  images: z.object({
    front: imageSrc,
    back: imageSrc.optional(),
    frontBlur: blurDataUrl.optional(),
    backBlur: blurDataUrl.optional(),
  }),
});
export type ProductColor = z.infer<typeof ProductColorSchema>;

export const SizeSchema = z.object({
  label: nonEmpty,
  measurements: z.record(z.string(), z.number()).optional(),
});

export const PrintAreaCanvasSchema = z.object({
  x: z.number().gt(0).lt(1),
  y: z.number().gt(0).lt(1),
  w: z.number().gt(0).lt(1),
  h: z.number().gt(0).lt(1),
});
export type PrintAreaCanvas = z.infer<typeof PrintAreaCanvasSchema>;

export const ProductSchema = z
  .object({
    slug: slug,
    name: nonEmpty,
    shortDescription: nonEmpty,
    description: nonEmpty,
    baseCost: z.int().positive(),
    suggestedPrice: z.int().positive(),
    colors: z.array(ProductColorSchema).min(1),
    sizes: z.array(SizeSchema).min(1),
    sizesSummary: nonEmpty,
    material: nonEmpty,
    weightGrams: z.int().positive(),
    printArea: z.object({
      label: nonEmpty,
      widthCm: z.literal(28),
      heightCm: z.literal(38),
      canvas: PrintAreaCanvasSchema,
    }),
    printMethodLabel: nonEmpty,
    sortOrder: z.int(),
    updatedAt: isoDate,
  })
  .refine((p) => p.suggestedPrice >= p.baseCost, { message: 'suggestedPrice must be >= baseCost' });
export type Product = z.infer<typeof ProductSchema>;

export const TestimonialSchema = z.object({
  quote: nonEmpty,
  name: nonEmpty,
  store: nonEmpty,
  avatar: imageSrc.optional(),
  placeholder: z.boolean(),
});
export type Testimonial = z.infer<typeof TestimonialSchema>;

export const INTEGRATION_PLATFORMS = ['salla', 'zid', 'shopify'] as const;

export const IntegrationSchema = z.object({
  slug: z.enum(INTEGRATION_PLATFORMS),
  name: nonEmpty,
  nameLatin: nonEmpty,
  /** Brand SVG shipped with the code, derived from the slug. */
  logo: publicPath,
  status: z.literal('available'),
});
export type Integration = z.infer<typeof IntegrationSchema>;

export const FAQ_GROUPS = [
  'البداية',
  'الأسعار والربح',
  'الطلبات والتوصيل',
  'المتاجر والربط',
  'الجودة والدعم',
] as const;

export const FaqItemSchema = z.object({
  group: z.enum(FAQ_GROUPS),
  question: nonEmpty,
  answer: nonEmpty,
  order: z.int().positive(),
  showOnHome: z.boolean(),
  /** Position in the home accordion (1–5) when `showOnHome` is set. */
  homeOrder: z.int().positive().optional(),
});
export type FaqItem = z.infer<typeof FaqItemSchema>;

export const PageSeoSchema = z.object({
  route: z.string().startsWith('/'),
  title: nonEmpty,
  description: nonEmpty.max(160),
  ogImage: publicPath.optional(),
  /** Sitemap `lastModified` (BRD 7.5); bump only on a real content change. */
  updatedAt: isoDate,
});
export type PageSeo = z.infer<typeof PageSeoSchema>;

/** Icons a card may carry (BRD 6.4.6, 6.8): the why-us trio and the About trio. */
export const CARD_ICONS = ['ShieldCheck', 'Workflow', 'Zap', 'Target', 'Eye', 'Heart'] as const;
export const FAQ_SELECTIONS = ['all', 'home'] as const;

const optionalText = z.string().trim().optional();

/**
 * Page blocks (BRD 9.4, 9.5; ADR-031): each is a designed section. `richText` carries the
 * Lexical editor state as Payload stores it; every other block is plain fields.
 */
const blockId = { id: nonEmpty, ...background };

export const BlockSchema = z.discriminatedUnion('blockType', [
  z.object({
    ...blockId,
    blockType: z.literal('richText'),
    title: optionalText,
    content: z.record(z.string(), z.unknown()),
  }),
  z.object({
    ...blockId,
    blockType: z.literal('story'),
    heading: nonEmpty,
    text: nonEmpty,
    line: nonEmpty,
    photo: z.object({ src: imageSrc, alt: z.string(), blur: blurDataUrl.optional() }),
    withFacts: z.boolean(),
  }),
  z.object({
    ...blockId,
    blockType: z.literal('cards'),
    title: optionalText,
    items: z
      .array(
        z.object({
          icon: z.enum(CARD_ICONS),
          title: nonEmpty,
          text: nonEmpty,
          art: imageSrc.optional(),
        }),
      )
      .min(1),
  }),
  z.object({
    ...blockId,
    blockType: z.literal('steps'),
    items: z.array(StepSchema).min(2),
  }),
  z.object({
    ...blockId,
    blockType: z.literal('profitEquation'),
    title: nonEmpty,
    sell: nonEmpty,
    base: nonEmpty,
    profit: nonEmpty,
    exampleLine: nonEmpty,
  }),
  z.object({
    ...blockId,
    blockType: z.literal('faqList'),
    selection: z.enum(FAQ_SELECTIONS),
    offset: z.int().min(0),
    limit: z.int().positive().optional(),
    title: optionalText,
    link: z.object({ label: nonEmpty, href: z.string().startsWith('/') }).optional(),
    bottomLine: optionalText,
    bottomLinkWord: optionalText,
  }),
  z.object({ ...blockId, blockType: z.literal('miskCredential'), title: nonEmpty, text: nonEmpty }),
  z.object({
    ...blockId,
    blockType: z.literal('contact'),
    whatsappTitle: nonEmpty,
    whatsappText: nonEmpty,
    emailTitle: nonEmpty,
    phoneTitle: nonEmpty,
    followTitle: nonEmpty,
    booking: z.object({
      title: nonEmpty,
      text: nonEmpty,
      button: nonEmpty,
      whatsappMessage: nonEmpty,
    }),
  }),
  z.object({ ...blockId, blockType: z.literal('legalBody'), updatedAt: isoDate, body: nonEmpty }),
  // A comparison (ADR-050): a criteria table, "best for" and "not best for", the date the other
  // side's pages were read. No URL: external links only to the app, the profiles and Misk.
  z.object({
    ...blockId,
    blockType: z.literal('compare'),
    title: optionalText,
    intro: optionalText,
    ours: nonEmpty,
    theirs: nonEmpty,
    asOf: isoDate,
    rows: z.array(z.object({ criterion: nonEmpty, ours: nonEmpty, theirs: nonEmpty })).min(3),
    bestFor: z.array(nonEmpty).min(1),
    notBestFor: z.array(nonEmpty).min(1),
    closing: optionalText,
  }),
  z.object({
    ...blockId,
    blockType: z.literal('mediaBanner'),
    media: z.object({ src: imageSrc, alt: z.string(), blur: blurDataUrl.optional() }),
    caption: optionalText,
  }),
]);
export type Block = z.infer<typeof BlockSchema>;
export type BlockOf<T extends Block['blockType']> = Extract<Block, { blockType: T }>;

/** The seven designed pages carry a route folder in code; the collection may hold more. */
export const RESERVED_PAGE_SLUGS = [
  'about',
  'how-it-works',
  'contact',
  'faq',
  'terms',
  'shipping',
  'privacy',
] as const;
export type ReservedPageSlug = (typeof RESERVED_PAGE_SLUGS)[number];

export const PageSchema = z.object({
  slug: slug,
  title: nonEmpty,
  lead: optionalText,
  blocks: z.array(BlockSchema).min(1),
  seo: z.object({
    title: nonEmpty.max(70),
    description: nonEmpty.max(160),
    ogImage: imageSrc.optional(),
  }),
  /** Sitemap `lastModified`: the legal body's date when there is one, else the document's. */
  updatedAt: isoDate,
  /** Seeded unpublished (ADR-050): the public route answers 404 until an admin publishes it. */
  draft: z.literal(true).optional(),
});
export type Page = z.infer<typeof PageSchema>;

export const BlogHubSchema = z.object({
  slug: slug,
  name: nonEmpty,
  description: nonEmpty,
  lead: nonEmpty,
  cover: publicPath,
});
export type BlogHub = z.infer<typeof BlogHubSchema>;

export const BlogAuthorSchema = z.object({
  slug: slug,
  name: nonEmpty,
  role: nonEmpty,
  bio: nonEmpty,
});
export type BlogAuthor = z.infer<typeof BlogAuthorSchema>;

export const BlogPostSchema = z.object({
  slug: slug,
  title: nonEmpty,
  hub: slug,
  sample: z.boolean(),
  excerpt: nonEmpty.max(160),
  cover: publicPath,
  publishedAt: isoDate,
  updatedAt: isoDate,
  takeaways: z.array(nonEmpty).length(3),
  author: nonEmpty,
});
export type BlogPost = z.infer<typeof BlogPostSchema>;
