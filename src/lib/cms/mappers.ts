import {
  NavigationSchema,
  PageSeoSchema,
  ProductSchema,
  SiteSettingsSchema,
  type Navigation,
  type PageSeo,
  type Product,
  type SiteSettings,
} from '@/content/schema';
import type {
  Media,
  Navigation as NavigationDoc,
  Product as ProductDoc,
  SeoDefault,
  SiteSetting,
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
