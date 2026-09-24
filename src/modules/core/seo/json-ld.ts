import { copyFor } from '@/content/copy';
import type { Product, SiteSettings } from '@/content/schema';
import { absoluteUrl } from '@/lib/absolute-url';
import { type Locale, languageTag, localePath } from '@/lib/i18n';

/** What the blog nodes need of a post, an author and a hub (`lib/cms/blog.ts` shapes). */
export interface PostForSchema {
  slug: string;
  title: string;
  excerpt: string;
  cover: { src: string };
  publishedAt: string;
  contentUpdatedAt: string | null;
  author: AuthorForSchema;
}

export interface AuthorForSchema {
  slug: string;
  name: string;
  role: string;
  bio?: string | null;
  photo?: string | null;
  sameAs?: string[];
}

export interface HubForSchema {
  slug: string;
  name: string;
  description: string;
}

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

/** The Organization logo: the mark drawn in the brand's colours at 512 px (`src/app/icon.tsx`). */
export const LOGO_PATH = '/icon/512';
export const RETURN_WINDOW_DAYS = 10;

export function onlineStore(base: string, site: SiteSettings): JsonLdNode {
  return {
    '@type': 'OnlineStore',
    '@id': `${base}/#store`,
    name: site.brandName,
    alternateName: site.brandNameLatin,
    url: base,
    logo: `${base}${LOGO_PATH}`,
    slogan: site.tagline,
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
      availableLanguage: ['ar', 'en'],
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
    inLanguage: ['ar', 'en'],
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
      item: absoluteUrl(base, crumb.path),
    })),
  };
}

export function itemList(base: string, paths: string[]): JsonLdNode {
  return {
    '@type': 'ItemList',
    itemListElement: paths.map((path, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: absoluteUrl(base, path),
    })),
  };
}

export function product(
  base: string,
  locale: Locale,
  item: Product,
  site: SiteSettings,
): JsonLdNode {
  const url = `${base}${localePath(locale, `/products/${item.slug}`)}`;
  return {
    '@type': 'Product',
    '@id': `${url}#product`,
    name: item.name,
    description: item.shortDescription,
    image: item.colors.map((c) => absoluteUrl(base, c.images.front)),
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
        description: copyFor(locale).seo.merchantCostNote,
      },
    },
  };
}

export function webPage(
  base: string,
  locale: Locale,
  route: string,
  name: string,
  description: string,
  dateModified?: string,
): JsonLdNode {
  const path = localePath(locale, route);
  return {
    '@type': 'WebPage',
    '@id': `${absoluteUrl(base, path)}#webpage`,
    url: absoluteUrl(base, path),
    name,
    description,
    inLanguage: languageTag(locale),
    isPartOf: { '@id': `${base}/#website` },
    ...(dateModified ? { dateModified } : {}),
  };
}

/** A markdown link or emphasis flattened to its text: the answers are plain text already. */
function plainText(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * The FAQ page's questions as `FAQPage` (ADR-050, BRD 7.4 and 7.10 amended): the visible
 * entries, in order, each a `Question` with its `Answer` as plain text. Google dropped the
 * rich result; the answer engines read the schema. Nothing when there is no entry.
 */
export function faqPage(
  base: string,
  locale: Locale,
  route: string,
  items: ReadonlyArray<{ question: string; answer: string }>,
): JsonLdNode | null {
  if (items.length === 0) return null;
  const path = localePath(locale, route);
  return {
    '@type': 'FAQPage',
    '@id': `${absoluteUrl(base, path)}#faq`,
    url: absoluteUrl(base, path),
    inLanguage: languageTag(locale),
    isPartOf: { '@id': `${absoluteUrl(base, path)}#webpage` },
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: plainText(item.question),
      acceptedAnswer: { '@type': 'Answer', text: plainText(item.answer) },
    })),
  };
}

export function person(base: string, locale: Locale, author: AuthorForSchema): JsonLdNode {
  const url = `${base}${localePath(locale, `/author/${author.slug}`)}`;
  return {
    '@type': 'Person',
    '@id': `${base}/author/${author.slug}#person`,
    name: author.name,
    jobTitle: author.role,
    url,
    ...(author.bio ? { description: author.bio } : {}),
    ...(author.photo ? { image: absoluteUrl(base, author.photo) } : {}),
    ...(author.sameAs && author.sameAs.length > 0 ? { sameAs: author.sameAs } : {}),
  };
}

export function blogPosting(
  base: string,
  locale: Locale,
  post: PostForSchema,
  site: SiteSettings,
): JsonLdNode {
  const url = `${base}${localePath(locale, `/blog/${post.slug}`)}`;
  return {
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    mainEntityOfPage: url,
    headline: post.title,
    description: post.excerpt,
    image: [absoluteUrl(base, post.cover.src)],
    datePublished: post.publishedAt,
    dateModified: post.contentUpdatedAt ?? post.publishedAt,
    inLanguage: languageTag(locale),
    author: person(base, locale, post.author),
    publisher: {
      '@type': 'Organization',
      name: site.brandName,
      logo: { '@type': 'ImageObject', url: `${base}${LOGO_PATH}` },
    },
  };
}

/** The author page (BRD 10.1): a `ProfilePage` whose main entity is the person. */
export function profilePage(base: string, locale: Locale, author: AuthorForSchema): JsonLdNode {
  const url = `${base}${localePath(locale, `/author/${author.slug}`)}`;
  return {
    '@type': 'ProfilePage',
    '@id': `${url}#profile`,
    url,
    name: author.name,
    inLanguage: languageTag(locale),
    isPartOf: { '@id': `${base}/#website` },
    mainEntity: person(base, locale, author),
  };
}

/** A hub page: a `CollectionPage` listing its posts. */
export function collectionPage(
  base: string,
  locale: Locale,
  hub: HubForSchema,
  posts: Array<Pick<PostForSchema, 'slug'>>,
): JsonLdNode {
  const url = `${base}${localePath(locale, `/blog/category/${hub.slug}`)}`;
  return {
    '@type': 'CollectionPage',
    '@id': `${url}#collection`,
    url,
    name: hub.name,
    description: hub.description,
    inLanguage: languageTag(locale),
    isPartOf: { '@id': `${base}/#website` },
    hasPart: posts.map((post) => ({
      '@id': `${base}${localePath(locale, `/blog/${post.slug}`)}#article`,
    })),
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
