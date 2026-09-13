/**
 * The content contract (BRD 8.4): zod schemas for every shape the site reads. Level 2 stores
 * the same shapes in Payload collections of the same names. Every content file parses against
 * its schema in `tests/content-schema.test.ts`; the build fails on drift.
 */
import { z } from 'zod';

const nonEmpty = z.string().trim().min(1);
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be lowercase-hyphenated');
const publicPath = z.string().regex(/^\/[\w\-./]+$/, 'must be a public path starting with /');
const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const SiteSettingsSchema = z.object({
  brandName: nonEmpty,
  brandNameLatin: nonEmpty,
  tagline: nonEmpty,
  contact: z.object({ phone: nonEmpty, phoneIntl: nonEmpty, whatsapp: nonEmpty, email: z.email() }),
  social: z.object({ x: z.url(), instagram: z.url(), tiktok: z.url() }),
  offer: z.object({ welcomeCredit: z.int().positive() }),
  delivery: z.object({ maxDays: z.int().positive(), origin: nonEmpty, region: nonEmpty }),
  bookingUrl: z.url().optional(),
  appUrls: z.object({ register: z.url(), login: z.url() }),
  legalEntity: nonEmpty,
});
export type SiteSettings = z.infer<typeof SiteSettingsSchema>;

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
  loginLabel: nonEmpty,
  skipLinkLabel: nonEmpty,
  menuOpenLabel: nonEmpty,
  menuCloseLabel: nonEmpty,
  menuWhatsappLine: nonEmpty,
});
export type Navigation = z.infer<typeof NavigationSchema>;

export const HeroSlideSchema = z.object({
  id: slug,
  headline: nonEmpty,
  subline: nonEmpty,
  imageDesktop: publicPath,
  imageMobile: publicPath,
  alt: z.string(),
});
export type HeroSlide = z.infer<typeof HeroSlideSchema>;

export const HomeSchema = z.object({
  hero: z.object({
    slides: z.array(HeroSlideSchema).length(4),
    primaryCta: nonEmpty,
    secondaryCta: nonEmpty,
    microcopy: nonEmpty,
    chips: z.array(nonEmpty).length(3),
    slideIndicatorAria: nonEmpty,
    pauseAria: nonEmpty,
    resumeAria: nonEmpty,
  }),
  productStrip: z.object({
    eyebrow: nonEmpty,
    title: nonEmpty,
    lead: nonEmpty,
    pricePrefix: nonEmpty,
    button: nonEmpty,
    order: z.array(slug).length(5),
    swipeHint: nonEmpty,
  }),
  designer: z.object({
    eyebrow: nonEmpty,
    title: nonEmpty,
    lead: nonEmpty,
    groups: z.object({ product: nonEmpty, pricing: nonEmpty }),
    uploadPrompt: nonEmpty,
    uploadHelper: nonEmpty,
    sample: nonEmpty,
    removeAria: nonEmpty,
    canvasHint: nonEmpty,
    baseCostLabel: nonEmpty,
    sellPriceLabel: nonEmpty,
    suggestedPriceHelper: nonEmpty,
    dailySalesLabel: nonEmpty,
    perPieceLabel: nonEmpty,
    monthlyLabel: nonEmpty,
    negativeWarning: nonEmpty,
    footnote: nonEmpty,
    cta: nonEmpty,
    fileError: nonEmpty,
  }),
  steps: z.object({ eyebrow: nonEmpty, title: nonEmpty, link: nonEmpty }),
  video: z.object({ title: nonEmpty, lead: nonEmpty }),
  whyUs: z.object({ eyebrow: nonEmpty, title: nonEmpty }),
  testimonials: z.object({ eyebrow: nonEmpty, title: nonEmpty, placeholderTag: nonEmpty }),
  integrations: z.object({
    title: nonEmpty,
    lead: nonEmpty,
    availableTag: nonEmpty,
    tileAria: nonEmpty,
  }),
  faq: z.object({ title: nonEmpty, link: nonEmpty }),
  ribbon: z.object({ title: nonEmpty, lead: nonEmpty, button: nonEmpty }),
});
export type Home = z.infer<typeof HomeSchema>;

/** A site path, or an absolute URL once the photo lives in the CMS media store (S3). */
const imageSrc = publicPath.or(z.url());

export const ProductColorSchema = z.object({
  slug: slug,
  name: nonEmpty,
  hex,
  images: z.object({ front: imageSrc, back: imageSrc.optional() }),
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

export const StepSchema = z.object({
  order: z.int().positive(),
  title: nonEmpty,
  text: nonEmpty,
  icon: publicPath,
});
export type Step = z.infer<typeof StepSchema>;

export const WhyUsItemSchema = z.object({
  icon: z.enum(['ShieldCheck', 'Workflow', 'Zap']),
  title: nonEmpty,
  text: nonEmpty,
});
export type WhyUsItem = z.infer<typeof WhyUsItemSchema>;

export const TestimonialSchema = z.object({
  quote: nonEmpty,
  name: nonEmpty,
  store: nonEmpty,
  avatar: publicPath.optional(),
  placeholder: z.boolean(),
});
export type Testimonial = z.infer<typeof TestimonialSchema>;

export const IntegrationSchema = z.object({
  slug: z.enum(['salla', 'zid', 'shopify']),
  name: nonEmpty,
  nameLatin: nonEmpty,
  logo: publicPath,
  status: z.literal('available'),
});
export type Integration = z.infer<typeof IntegrationSchema>;

export const FaqItemSchema = z.object({
  group: nonEmpty,
  question: nonEmpty,
  answer: nonEmpty,
  showOnHome: z.boolean(),
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

export const LegalPageSchema = z.object({
  slug: z.enum(['terms', 'shipping', 'privacy']),
  title: nonEmpty,
  updatedAt: isoDate,
  body: nonEmpty,
});
export type LegalPage = z.infer<typeof LegalPageSchema>;

export const BlogHubSchema = z.object({ slug: slug, name: nonEmpty });

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
