import type { BlogPost, Product, SiteSettings } from '@/content/schema';
import { MERCHANT_COST_NOTE } from '@/content/seo-copy';

/**
 * JSON-LD builders (BRD 7.4). Each page renders exactly one `<script type="application/ld+json">`
 * holding a `@graph` of the types the BRD table lists for it; `tests/json-ld.test.ts` asserts
 * the required fields per type. Facts (name, phone, city, delivery days, return window) come
 * from the CMS site settings and the legal texts, never from literals here.
 */
export type JsonLdNode = Record<string, unknown> & { '@type': string };

export interface Crumb {
  name: string;
  path: string;
}

export const LOGO_PATH = '/images/logo/icon.png';
export const RETURN_WINDOW_DAYS = 10;

function absolute(base: string, path: string): string {
  return path === '/' ? base : `${base}${path}`;
}

export function onlineStore(base: string, site: SiteSettings): JsonLdNode {
  return {
    '@type': 'OnlineStore',
    '@id': `${base}/#store`,
    name: site.brandName,
    alternateName: site.brandNameLatin,
    url: base,
    logo: `${base}${LOGO_PATH}`,
    sameAs: [site.social.x, site.social.instagram, site.social.tiktok],
    address: {
      '@type': 'PostalAddress',
      addressLocality: site.delivery.origin,
      addressRegion: site.delivery.region,
      addressCountry: 'SA',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: site.contact.phoneIntl,
      contactType: 'customer support',
      availableLanguage: 'ar',
    },
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      applicableCountry: 'SA',
      returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
      merchantReturnDays: RETURN_WINDOW_DAYS,
      itemDefectReturnFees: 'https://schema.org/FreeReturn',
      customerRemorseReturnFees: 'https://schema.org/ReturnFeesCustomerResponsibility',
    },
    shippingDetails: {
      '@type': 'OfferShippingDetails',
      shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'SA' },
      deliveryTime: {
        '@type': 'ShippingDeliveryTime',
        transitTime: {
          '@type': 'QuantitativeValue',
          minValue: 1,
          maxValue: site.delivery.maxDays,
          unitCode: 'DAY',
        },
      },
    },
  };
}

export function webSite(base: string, site: SiteSettings): JsonLdNode {
  return {
    '@type': 'WebSite',
    '@id': `${base}/#website`,
    name: site.brandName,
    alternateName: site.brandNameLatin,
    url: base,
    inLanguage: 'ar',
    publisher: { '@id': `${base}/#store` },
  };
}

export function breadcrumbs(base: string, crumbs: Crumb[]): JsonLdNode {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: absolute(base, crumb.path),
    })),
  };
}

export function itemList(base: string, paths: string[]): JsonLdNode {
  return {
    '@type': 'ItemList',
    itemListElement: paths.map((path, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: absolute(base, path),
    })),
  };
}

export function product(base: string, item: Product, site: SiteSettings): JsonLdNode {
  const url = `${base}/products/${item.slug}`;
  return {
    '@type': 'Product',
    '@id': `${url}#product`,
    name: item.name,
    description: item.shortDescription,
    image: item.colors.map((c) => `${base}${c.images.front}`),
    brand: { '@type': 'Brand', name: site.brandName },
    material: item.material,
    url,
    offers: {
      '@type': 'Offer',
      url,
      price: item.baseCost,
      priceCurrency: 'SAR',
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      priceSpecification: {
        '@type': 'PriceSpecification',
        price: item.baseCost,
        priceCurrency: 'SAR',
        description: MERCHANT_COST_NOTE,
      },
    },
  };
}

export function webPage(
  base: string,
  route: string,
  name: string,
  description: string,
  dateModified?: string,
): JsonLdNode {
  return {
    '@type': 'WebPage',
    '@id': `${absolute(base, route)}#webpage`,
    url: absolute(base, route),
    name,
    description,
    inLanguage: 'ar',
    isPartOf: { '@id': `${base}/#website` },
    ...(dateModified ? { dateModified } : {}),
  };
}

export function blogPosting(
  base: string,
  post: BlogPost,
  authorName: string,
  site: SiteSettings,
): JsonLdNode {
  const url = `${base}/blog/${post.slug}`;
  return {
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    mainEntityOfPage: url,
    headline: post.title,
    description: post.excerpt,
    image: [`${base}${post.cover}`],
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    inLanguage: 'ar',
    author: { '@type': 'Person', name: authorName, url: `${base}/about` },
    publisher: {
      '@type': 'Organization',
      name: site.brandName,
      logo: { '@type': 'ImageObject', url: `${base}${LOGO_PATH}` },
    },
  };
}

/** Wraps nodes into the single graph a page emits. */
export function graph(nodes: JsonLdNode[]): Record<string, unknown> {
  return { '@context': 'https://schema.org', '@graph': nodes };
}

/** Serialises for a `<script>` body; `<` is escaped so content can never close the tag. */
export function serialize(data: Record<string, unknown>): string {
  return JSON.stringify(data).replaceAll('<', '\\u003c');
}
