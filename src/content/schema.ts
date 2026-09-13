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

/** A site path, or an absolute URL once the photo lives in the CMS media store (S3). */
const imageSrc = publicPath.or(z.url());

export const HeroSlideSchema = z.object({
  /** Stable key: the CMS row id, or the seed's slug. */
  id: nonEmpty,
  headline: nonEmpty,
  subline: nonEmpty,
  imageDesktop: imageSrc,
  imageMobile: imageSrc,
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
export const HomeSchema = z.object({
  hero: z.object({
    slides: z.array(HeroSlideSchema).length(4),
    primaryCta: nonEmpty,
    secondaryCta: nonEmpty,
    microcopy: nonEmpty,
    chips: z.array(nonEmpty).length(3),
  }),
  productStrip: z.object({
    eyebrow: nonEmpty,
    title: nonEmpty,
    lead: nonEmpty,
    pricePrefix: nonEmpty,
    button: nonEmpty,
    order: z.array(slug).length(5),
  }),
  designer: z.object({
    eyebrow: nonEmpty,
    title: nonEmpty,
    lead: nonEmpty,
    sample: nonEmpty,
    cta: nonEmpty,
  }),
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
});
export type Home = z.infer<typeof HomeSchema>;

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
