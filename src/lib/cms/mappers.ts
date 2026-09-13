import {
  FaqItemSchema,
  HomeSchema,
  IntegrationSchema,
  NavigationSchema,
  PageSeoSchema,
  ProductSchema,
  SiteSettingsSchema,
  TestimonialSchema,
  type FaqItem,
  type Home,
  type Integration,
  type Navigation,
  type PageSeo,
  type Product,
  type SiteSettings,
  type Testimonial,
} from '@/content/schema';
import type {
  Faq as FaqDoc,
  Home as HomeDoc,
  Integration as IntegrationDoc,
  Media,
  Navigation as NavigationDoc,
  Product as ProductDoc,
  SeoDefault,
  SiteSetting,
  Testimonial as TestimonialDoc,
} from '@/payload-types';

/**
 * Payload documents → the site's content contract (BRD 8.4). Every mapper ends in a zod
 * parse so a CMS field renamed or emptied fails the build/revalidation loudly instead of
 * rendering a hole. Pure functions; unit-tested in tests/cms-mapping.test.ts.
 */

/**
 * A populated upload relation's URL, or undefined when depth was 0. Payload prefixes local
 * files with `serverURL`; that prefix is stripped so same-host media stays a relative path the
 * image optimizer accepts without a remote pattern (S3 URLs keep their host, ADR-029).
 */
export function mediaUrl(
  value: number | Media | null | undefined,
  serverUrl = process.env['PAYLOAD_PUBLIC_SERVER_URL'] || process.env['NEXT_PUBLIC_SITE_URL'] || '',
): string | undefined {
  if (!value || typeof value === 'number') return undefined;
  const url = value.url ?? undefined;
  if (url && serverUrl && url.startsWith(`${serverUrl.replace(/\/$/, '')}/`)) {
    return url.slice(serverUrl.replace(/\/$/, '').length);
  }
  return url;
}

function measurements(size: NonNullable<ProductDoc['sizes']>[number]) {
  const entries: Array<[string, number]> = [];
  if (typeof size.length === 'number') entries.push(['length', size.length]);
  if (typeof size.chest === 'number') entries.push(['chest', size.chest]);
  if (typeof size.sleeve === 'number') entries.push(['sleeve', size.sleeve]);
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

export function toProduct(doc: ProductDoc): Product {
  const colors = (doc.colors ?? []).map((c) => {
    const front = mediaUrl(c.front);
    if (!front) throw new Error(`Product ${doc.slug}: colour ${c.slug} has no front photo`);
    const back = mediaUrl(c.back);
    return { slug: c.slug, name: c.name, hex: c.hex, images: { front, ...(back ? { back } : {}) } };
  });
  return ProductSchema.parse({
    slug: doc.slug,
    name: doc.name,
    shortDescription: doc.shortDescription,
    description: doc.description,
    baseCost: doc.baseCost,
    suggestedPrice: doc.suggestedPrice,
    colors,
    sizes: (doc.sizes ?? []).map((s) => {
      const m = measurements(s);
      return m ? { label: s.label, measurements: m } : { label: s.label };
    }),
    sizesSummary: doc.sizesSummary,
    material: doc.material,
    weightGrams: doc.weightGrams,
    printArea: {
      label: doc.printArea.label,
      widthCm: doc.printArea.widthCm,
      heightCm: doc.printArea.heightCm,
      canvas: doc.printArea.canvas,
    },
    printMethodLabel: doc.printMethodLabel,
    sortOrder: doc.sortOrder,
    updatedAt: doc.updatedAt.slice(0, 10),
  });
}

export function toSiteSettings(doc: SiteSetting): SiteSettings {
  return SiteSettingsSchema.parse({
    brandName: doc.brandName,
    brandNameLatin: doc.brandNameLatin,
    tagline: doc.tagline,
    contact: {
      phone: doc.contact.phone,
      phoneIntl: doc.contact.phoneIntl,
      whatsapp: doc.contact.whatsapp,
      email: doc.contact.email,
    },
    social: { x: doc.social.x, instagram: doc.social.instagram, tiktok: doc.social.tiktok },
    offer: { welcomeCredit: doc.welcomeCredit },
    delivery: {
      maxDays: doc.deliveryMaxDays,
      origin: doc.deliveryOrigin,
      region: doc.deliveryRegion,
    },
    ...(doc.bookingUrl ? { bookingUrl: doc.bookingUrl } : {}),
    appUrls: { register: doc.appUrls.register, login: doc.appUrls.login },
    legalEntity: doc.legalEntity,
  });
}

function navItem(row: NonNullable<NavigationDoc['primary']>[number]) {
  return {
    label: row.label,
    href: row.href,
    ...(row.matchPrefix ? { matchPrefix: row.matchPrefix } : {}),
  };
}

export function toNavigation(doc: NavigationDoc): Navigation {
  return NavigationSchema.parse({
    primary: (doc.primary ?? []).map(navItem),
    policies: (doc.policies ?? []).map(navItem),
    ctaLabel: doc.ctaLabel,
    loginLabel: doc.loginLabel,
    skipLinkLabel: doc.skipLinkLabel,
    menuOpenLabel: doc.menuOpenLabel,
    menuCloseLabel: doc.menuCloseLabel,
    menuWhatsappLine: doc.menuWhatsappLine,
  });
}

export function toSeoRows(doc: SeoDefault): PageSeo[] {
  return (doc.routes ?? []).map((row) =>
    PageSeoSchema.parse({
      route: row.route,
      title: row.title,
      description: row.description,
      ...(row.ogImage ? { ogImage: row.ogImage } : {}),
      updatedAt: row.updatedAt.slice(0, 10),
    }),
  );
}

/** A required upload relation's URL; throws with the field's name when depth was 0 or empty. */
function requiredMedia(value: number | Media | null | undefined, field: string): string {
  const url = mediaUrl(value);
  if (!url) throw new Error(`${field}: no media (populate with depth ≥ 1 and upload a file)`);
  return url;
}

/** Alt text of a populated upload, empty when depth was 0. */
function mediaAlt(value: number | Media | null | undefined): string {
  return value && typeof value !== 'number' ? value.alt : '';
}

/**
 * The `home` global → the `Home` contract. Reads need `depth: 1` so the hero photos, the
 * step icons and the strip products are populated; the strip keeps the admin's order as
 * product slugs.
 */
export function toHome(doc: HomeDoc): Home {
  // `draft: false` returns the main row whatever its status: a never-published home must not
  // render its draft copy.
  if (doc._status !== 'published') throw new Error('home: not published yet');
  const strip = doc.productStrip.products.map((p, i) => {
    if (typeof p === 'number') throw new Error(`home.productStrip.products[${i}]: not populated`);
    return p.slug;
  });
  return HomeSchema.parse({
    hero: {
      slides: doc.hero.slides.map((slide, i) => ({
        id: slide.id ?? `slide-${i + 1}`,
        headline: slide.headline,
        subline: slide.subline,
        imageDesktop: requiredMedia(slide.imageDesktop, `home.hero.slides[${i}].imageDesktop`),
        imageMobile: requiredMedia(slide.imageMobile, `home.hero.slides[${i}].imageMobile`),
        alt: mediaAlt(slide.imageDesktop),
      })),
      primaryCta: doc.hero.primaryCta,
      secondaryCta: doc.hero.secondaryCta,
      microcopy: doc.hero.microcopy,
      chips: doc.hero.chips.map((c) => c.text),
    },
    productStrip: {
      eyebrow: doc.productStrip.eyebrow,
      title: doc.productStrip.title,
      lead: doc.productStrip.lead,
      pricePrefix: doc.productStrip.pricePrefix,
      button: doc.productStrip.button,
      order: strip,
    },
    designer: {
      eyebrow: doc.designer.eyebrow,
      title: doc.designer.title,
      lead: doc.designer.lead,
      sample: doc.designer.sample,
      cta: doc.designer.cta,
    },
    steps: {
      enabled: doc.steps.enabled ?? true,
      eyebrow: doc.steps.eyebrow,
      title: doc.steps.title,
      link: doc.steps.link,
      items: doc.steps.items.map((step, i) => ({
        order: i + 1,
        title: step.title,
        text: step.text,
        icon: requiredMedia(step.icon, `home.steps.items[${i}].icon`),
      })),
    },
    video: { enabled: doc.video.enabled ?? true, title: doc.video.title, lead: doc.video.lead },
    whyUs: {
      enabled: doc.whyUs.enabled ?? true,
      eyebrow: doc.whyUs.eyebrow,
      title: doc.whyUs.title,
      items: doc.whyUs.items.map((item) => ({
        icon: item.icon,
        title: item.title,
        text: item.text,
      })),
    },
    testimonials: {
      enabled: doc.testimonials.enabled ?? true,
      eyebrow: doc.testimonials.eyebrow,
      title: doc.testimonials.title,
    },
    integrations: {
      enabled: doc.integrations.enabled ?? true,
      title: doc.integrations.title,
      lead: doc.integrations.lead,
    },
    faq: { enabled: doc.faq.enabled ?? true, title: doc.faq.title, link: doc.faq.link },
    ribbon: { title: doc.ribbon.title, lead: doc.ribbon.lead, button: doc.ribbon.button },
  });
}

export function toFaq(doc: FaqDoc): FaqItem {
  return FaqItemSchema.parse({
    group: doc.group,
    question: doc.question,
    answer: doc.answer,
    order: doc.order,
    showOnHome: doc.showOnHome ?? false,
    ...(doc.showOnHome && typeof doc.homeOrder === 'number' ? { homeOrder: doc.homeOrder } : {}),
  });
}

export function toTestimonial(doc: TestimonialDoc): Testimonial {
  const avatar = mediaUrl(doc.avatar);
  return TestimonialSchema.parse({
    quote: doc.quote,
    name: doc.name,
    store: doc.store,
    ...(avatar ? { avatar } : {}),
    placeholder: doc.placeholder ?? false,
  });
}

/** The logo is the brand SVG that ships with the code, chosen by the platform. */
export function toIntegration(doc: IntegrationDoc): Integration {
  return IntegrationSchema.parse({
    slug: doc.platform,
    name: doc.name,
    nameLatin: doc.nameLatin,
    logo: `/images/integrations/${doc.platform}.svg`,
    status: 'available',
  });
}
