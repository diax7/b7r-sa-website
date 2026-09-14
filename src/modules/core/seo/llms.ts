import type { Page, PageSeo, Product, SiteSettings } from '@/content/schema';
import { absoluteUrl } from '@/lib/absolute-url';
import type { PostCard } from '@/lib/cms/blog';
import { type Locale, localePath, otherLocale } from '@/lib/i18n';

/**
 * `llms.txt` (BRD 7.10, ADR-043): a plain-text map of the site for answer engines, one per
 * language, built from the CMS the way the sitemap is (titles and descriptions from the SEO
 * defaults and the pages, the catalogue with its cost and suggested price, the published
 * posts with their excerpts). Pure: the route reads and hands the rows here. Facts come from
 * the same records the pages render, never from a literal.
 */
export interface LlmsInput {
  locale: Locale;
  base: string;
  site: SiteSettings;
  seo: PageSeo[];
  pages: Array<Pick<Page, 'slug' | 'title' | 'seo'>>;
  products: Product[];
  posts: PostCard[];
}

interface LlmsText {
  intro(site: SiteSettings): string;
  pages: string;
  products: string;
  productLine(p: Product): string;
  blog: string;
  other: string;
  otherLanguage: string;
}

/** «بحر برنت (B7R Print)» in Arabic; the English name stands alone when the two are the same. */
function brandWithLatin(site: SiteSettings): string {
  return site.brandName === site.brandNameLatin
    ? site.brandName
    : `${site.brandName} (${site.brandNameLatin})`;
}

const TEXT: Record<Locale, LlmsText> = {
  ar: {
    intro: (site) =>
      `${brandWithLatin(site)} منصة طباعة عند الطلب في السعودية: التاجر يبيع تصميمه في متجره على سلة أو زد أو شوبيفاي، ونحن نطبع القطعة في ${site.delivery.origin} ونشحنها باسم متجره خلال ${site.delivery.maxDays} أيام كحد أقصى داخل المملكة. لا مخزون ولا حد أدنى، والحساب مجاني برصيد ترحيبي ${site.offer.welcomeCredit} ريالاً.`,
    pages: 'الصفحات',
    products: 'المنتجات (التكلفة للتاجر والسعر المقترح بالريال السعودي)',
    productLine: (p) =>
      `${p.shortDescription} التكلفة ${p.baseCost} ريالاً، السعر المقترح ${p.suggestedPrice} ريالاً.`,
    blog: 'المدونة',
    other: 'لغات أخرى',
    otherLanguage: 'النسخة الإنجليزية',
  },
  en: {
    intro: (site) =>
      `${brandWithLatin(site)} is a print-on-demand platform in Saudi Arabia: a merchant sells their design in their Salla, Zid or Shopify store, and we print the piece in ${site.delivery.origin} and ship it under the store's name within ${site.delivery.maxDays} days at most inside the Kingdom. No stock and no minimum; the account is free with SAR ${site.offer.welcomeCredit} of welcome credit.`,
    pages: 'Pages',
    products: 'Products (merchant cost and suggested price in Saudi riyals)',
    productLine: (p) =>
      `${p.shortDescription} Cost SAR ${p.baseCost}, suggested price SAR ${p.suggestedPrice}.`,
    blog: 'Blog',
    other: 'Other languages',
    otherLanguage: 'Arabic version',
  },
};

const line = (label: string, href: string, detail: string) => `- [${label}](${href}): ${detail}`;

export function llmsText(input: LlmsInput): string {
  const { locale, base, site } = input;
  const t = TEXT[locale];
  const url = (route: string) => absoluteUrl(base, localePath(locale, route));
  const pageRows = [
    ...input.seo
      .filter((row) => row.route !== '/')
      .map((row) => line(row.title, url(row.route), row.description)),
    ...input.pages.map((page) => line(page.title, url(`/${page.slug}`), page.seo.description)),
  ];
  const productRows = input.products
    .toSorted((a, b) => a.sortOrder - b.sortOrder)
    .map((p) => line(p.name, url(`/products/${p.slug}`), t.productLine(p)));
  const postRows = input.posts.map((post) =>
    line(post.title, url(`/blog/${post.slug}`), post.excerpt),
  );
  const sections = [
    `# ${site.brandName}`,
    '',
    `> ${site.tagline}`,
    '',
    t.intro(site),
    '',
    `## ${t.pages}`,
    '',
    line(site.brandName, url('/'), site.tagline),
    ...pageRows,
    '',
    `## ${t.products}`,
    '',
    ...productRows,
  ];
  if (postRows.length > 0) sections.push('', `## ${t.blog}`, '', ...postRows);
  sections.push(
    '',
    `## ${t.other}`,
    '',
    `- [${t.otherLanguage}](${absoluteUrl(base, localePath(otherLocale(locale), '/llms.txt'))})`,
    '',
  );
  return sections.join('\n');
}
