import {
  type Block,
  FaqItemSchema,
  HERO_OVERLAY_DEFAULT,
  HomeSchema,
  PageSchema,
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
  type Page,
  type PageSeo,
  type Product,
  type SiteSettings,
  type Testimonial,
} from '@/content/schema';
import { type Locale, localePath } from '@/lib/i18n';
import type {
  Faq as FaqDoc,
  Home as HomeDoc,
  Integration as IntegrationDoc,
  Media,
  Page as PageDoc,
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
  value: number | Pick<Media, 'url'> | null | undefined,
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

/**
 * The blur-up placeholder of a populated upload (ADR-029, amended 2026-09-19): the data URL
 * the media library computed on upload, or nothing (depth 0, or a file uploaded before the
 * field existed and not yet backfilled by `scripts/media-blur.ts`).
 */
export function mediaBlur(value: number | Media | null | undefined): string | undefined {
  return value && typeof value !== 'number' && value.blur ? value.blur : undefined;
}

/** `{ [key]: blur }` when the upload has a placeholder, `{}` otherwise (exactOptionalPropertyTypes). */
function blurOf<K extends string>(
  key: K,
  value: number | Media | null | undefined,
): Partial<Record<K, string>> {
  const blur = mediaBlur(value);
  return blur ? ({ [key]: blur } as Record<K, string>) : {};
}

export function toProduct(doc: ProductDoc): Product {
  const colors = (doc.colors ?? []).map((c) => {
    const front = mediaUrl(c.front);
    if (!front) throw new Error(`Product ${doc.slug}: colour ${c.slug} has no front photo`);
    const back = mediaUrl(c.back);
    return {
      slug: c.slug,
      name: c.name,
      hex: c.hex,
      images: {
        front,
        ...(back ? { back } : {}),
        ...blurOf('frontBlur', c.front),
        ...(back ? blurOf('backBlur', c.back) : {}),
      },
    };
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
    legalEntity: doc.legalEntity,
    ctaShiny: Boolean(doc.ctaShiny),
    analytics: {
      ...(doc.analytics?.gaId ? { gaId: doc.analytics.gaId } : {}),
      ...(doc.analytics?.umamiSrc && doc.analytics?.umamiId
        ? { umami: { src: doc.analytics.umamiSrc, id: doc.analytics.umamiId } }
        : {}),
    },
  });
}

/** The `menu` group of the site settings (the former Navigation global, ADR-046). */
type MenuDoc = SiteSetting['menu'];

function navItem(locale: Locale) {
  return (row: NonNullable<MenuDoc['primary']>[number]) => ({
    label: row.label,
    href: localePath(locale, row.href),
    ...(row.matchPrefix ? { matchPrefix: localePath(locale, row.matchPrefix) } : {}),
  });
}

/**
 * The navigation, read from the site settings' `menu` group, with its hrefs under the locale's
 * prefix (`/en/products` for English).
 */
export function toNavigation(doc: SiteSetting, locale: Locale): Navigation {
  const menu = doc.menu;
  return NavigationSchema.parse({
    primary: (menu.primary ?? []).map(navItem(locale)),
    policies: (menu.policies ?? []).map(navItem(locale)),
    ctaLabel: menu.ctaLabel,
    skipLinkLabel: menu.skipLinkLabel,
    menuOpenLabel: menu.menuOpenLabel,
    menuCloseLabel: menu.menuCloseLabel,
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

/**
 * Alt text of a populated upload: empty when depth was 0, and empty (decorative) when the
 * request locale has none yet (an English page reads without fallback, ADR-043); the seed
 * writes the English alt of every file it ships.
 */
function mediaAlt(value: number | Media | null | undefined): string {
  return value && typeof value !== 'number' ? (value.alt ?? '') : '';
}

/**
 * The `home` global → the `Home` contract. Reads need `depth: 1` so the hero photos, the
 * step icons and the strip products are populated; the strip keeps the admin's order as
 * product slugs.
 */
export interface MapOptions {
  /** A preview render (ADR-039): the latest draft is what the editor asked to see. */
  draft?: boolean;
}

export function toHome(doc: HomeDoc, options: MapOptions = {}): Home {
  // `draft: false` returns the main row whatever its status: a never-published home must not
  // render its draft copy, unless this is a preview.
  if (!options.draft && doc._status !== 'published') throw new Error('home: not published yet');
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
        ...blurOf('blurDesktop', slide.imageDesktop),
        ...blurOf('blurMobile', slide.imageMobile),
        alt: mediaAlt(slide.imageDesktop),
      })),
      primaryCta: doc.hero.primaryCta,
      secondaryCta: doc.hero.secondaryCta,
      microcopy: doc.hero.microcopy,
      // The rows are shared by both languages, the text is per language: a row written on the
      // Arabic tab has no English text until an editor adds one, and hides until then.
      chips: (doc.hero.chips ?? []).map((c) => c.text).filter((t): t is string => !!t?.trim()),
      overlay: {
        enabled: doc.hero.overlay?.enabled ?? true,
        color: doc.hero.overlay?.color ?? HERO_OVERLAY_DEFAULT,
      },
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

type BlockDoc = PageDoc['blocks'][number];

/** An optional title field: present only when set (exactOptionalPropertyTypes). */
const optional = (v: string | null | undefined) => (v ? { title: v } : {});

/** One block document → the block contract; media populated (depth ≥ 1) becomes `{ src, alt }`. */
function toBlock(block: BlockDoc, where: string, index: number): Block {
  const id = block.id ?? `${block.blockType}-${index}`;
  switch (block.blockType) {
    case 'richText':
      return { id, blockType: 'richText', ...optional(block.title), content: block.content };
    case 'story':
      return {
        id,
        blockType: 'story',
        heading: block.heading,
        text: block.text,
        line: block.line,
        photo: {
          src: requiredMedia(block.photo, `${where}.photo`),
          alt: mediaAlt(block.photo),
          ...blurOf('blur', block.photo),
        },
        withFacts: block.withFacts ?? true,
      };
    case 'cards':
      return {
        id,
        blockType: 'cards',
        ...optional(block.title),
        items: block.items.map((item) => {
          const art = mediaUrl(item.art);
          return { icon: item.icon, title: item.title, text: item.text, ...(art ? { art } : {}) };
        }),
      };
    case 'steps':
      return {
        id,
        blockType: 'steps',
        items: block.items.map((item, i) => ({
          order: i + 1,
          title: item.title,
          text: item.text,
          icon: requiredMedia(item.icon, `${where}.items[${i}].icon`),
        })),
      };
    case 'profitEquation':
      return {
        id,
        blockType: 'profitEquation',
        title: block.title,
        sell: block.sell,
        base: block.base,
        profit: block.profit,
        exampleLine: block.exampleLine,
      };
    case 'compare':
      return {
        id,
        blockType: 'compare',
        ...optional(block.title),
        ...(block.intro ? { intro: block.intro } : {}),
        ours: block.ours,
        theirs: block.theirs,
        asOf: String(block.asOf).slice(0, 10),
        rows: block.rows.map((r) => ({ criterion: r.criterion, ours: r.ours, theirs: r.theirs })),
        bestFor: block.bestFor.map((b) => b.text),
        notBestFor: block.notBestFor.map((b) => b.text),
        ...(block.closing ? { closing: block.closing } : {}),
      };
    case 'faqList':
      return {
        id,
        blockType: 'faqList',
        selection: block.selection,
        offset: block.offset ?? 0,
        ...(block.limit ? { limit: block.limit } : {}),
        ...optional(block.title),
        ...(block.linkLabel && block.linkHref
          ? { link: { label: block.linkLabel, href: block.linkHref } }
          : {}),
        ...(block.bottomLine ? { bottomLine: block.bottomLine } : {}),
        ...(block.bottomLinkWord ? { bottomLinkWord: block.bottomLinkWord } : {}),
      };
    case 'miskCredential':
      return { id, blockType: 'miskCredential', title: block.title, text: block.text };
    case 'contact':
      return {
        id,
        blockType: 'contact',
        whatsappTitle: block.whatsappTitle,
        whatsappText: block.whatsappText,
        emailTitle: block.emailTitle,
        phoneTitle: block.phoneTitle,
        followTitle: block.followTitle,
        booking: {
          title: block.booking.title,
          text: block.booking.text,
          button: block.booking.button,
          whatsappMessage: block.booking.whatsappMessage,
        },
      };
    case 'legalBody':
      return {
        id,
        blockType: 'legalBody',
        updatedAt: block.updatedAt.slice(0, 10),
        body: block.body,
      };
    case 'mediaBanner':
      return {
        id,
        blockType: 'mediaBanner',
        media: {
          src: requiredMedia(block.media, `${where}.media`),
          alt: mediaAlt(block.media),
          ...blurOf('blur', block.media),
        },
        ...(block.caption ? { caption: block.caption } : {}),
      };
    default:
      throw new Error(`${where}: unknown block ${(block as { blockType: string }).blockType}`);
  }
}

/** A page document (depth ≥ 1) → the `Page` contract; published documents only. */
export function toPage(doc: PageDoc, options: MapOptions = {}): Page {
  if (!options.draft && doc._status !== 'published') {
    throw new Error(`page ${doc.slug}: not published`);
  }
  const blocks = doc.blocks.map((b, i) => toBlock(b, `page ${doc.slug} blocks[${i}]`, i));
  const legal = blocks.find((b) => b.blockType === 'legalBody');
  const ogImage = mediaUrl(doc.seo.ogImage);
  // A draft may not have its search title and description yet; a preview shows the page's.
  const seoTitle = doc.seo.title || (options.draft ? doc.title : doc.seo.title);
  const seoDescription =
    doc.seo.description || (options.draft ? doc.lead || doc.title : doc.seo.description);
  return PageSchema.parse({
    slug: doc.slug,
    title: doc.title,
    ...(doc.lead ? { lead: doc.lead } : {}),
    blocks,
    seo: {
      title: seoTitle,
      description: seoDescription,
      ...(ogImage ? { ogImage } : {}),
    },
    updatedAt: legal ? legal.updatedAt : doc.updatedAt.slice(0, 10),
  });
}
