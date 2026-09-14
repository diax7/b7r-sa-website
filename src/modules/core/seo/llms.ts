import type { Page, PageSeo, Product, SiteSettings } from '@/content/schema';
import { absoluteUrl } from '@/lib/absolute-url';
import type { PostCard } from '@/lib/cms/blog';
import { copyFor } from '@/content/copy';
import { type Locale, localePath, otherLocale } from '@/lib/i18n';

/**
 * `llms.txt` (BRD 7.10, ADR-043): a plain-text map of the site for answer engines, one per
 * language, built from the CMS the way the sitemap is (titles and descriptions from the SEO
 * defaults and the pages, the catalogue with its cost and suggested price, the published
 * posts with their excerpts). Pure: the route reads and hands the rows here. Facts come from
 * the same records the pages render, never from a literal; the sentences come from the copy
 * banks (`llms` section), reviewed like every other string.
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

/** «بحر برنت (B7R Print)» in Arabic; the English name stands alone when the two are the same. */
function brandWithLatin(site: SiteSettings): string {
  return site.brandName === site.brandNameLatin
    ? site.brandName
    : `${site.brandName} (${site.brandNameLatin})`;
}

function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? ''));
}

const line = (label: string, href: string, detail: string) => `- [${label}](${href}): ${detail}`;

export function llmsText(input: LlmsInput): string {
  const { locale, base, site } = input;
  const t = copyFor(locale).llms;
  const url = (route: string) => absoluteUrl(base, localePath(locale, route));
  const pageRows = [
    ...input.seo
      .filter((row) => row.route !== '/')
      .map((row) => line(row.title, url(row.route), row.description)),
    ...input.pages.map((page) => line(page.title, url(`/${page.slug}`), page.seo.description)),
  ];
  const productRows = input.products
    .toSorted((a, b) => a.sortOrder - b.sortOrder)
    .map((p) =>
      line(
        p.name,
        url(`/products/${p.slug}`),
        fill(t.productLine, {
          description: p.shortDescription,
          cost: p.baseCost,
          price: p.suggestedPrice,
        }),
      ),
    );
  const postRows = input.posts.map((post) =>
    line(post.title, url(`/blog/${post.slug}`), post.excerpt),
  );
  const sections = [
    `# ${site.brandName}`,
    '',
    `> ${site.tagline}`,
    '',
    fill(t.intro, {
      brand: brandWithLatin(site),
      origin: site.delivery.origin,
      days: site.delivery.maxDays,
      credit: site.offer.welcomeCredit,
    }),
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
    `## ${t.otherLanguages}`,
    '',
    `- [${t.otherLanguage}](${absoluteUrl(base, localePath(otherLocale(locale), '/llms.txt'))})`,
    '',
  );
  return sections.join('\n');
}
