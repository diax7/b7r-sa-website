import { copyFor } from '@/content/copy';
import { type Locale, LOCALES } from '@/lib/i18n';
import type { Fact, Finding, Snapshot } from '@/modules/visibility/types';
import {
  editHref,
  emittedTitle,
  finding,
  has,
  hasQuestionHeading,
  loc,
  openingWords,
  prorata,
} from '@/modules/visibility/rules/shared';
import { THRESHOLDS } from '@/modules/visibility/rules/weights';

interface Emitted {
  label: string;
  href: string;
  title: string;
  description: string;
}

/** The locales a document is judged in: Arabic, and English when it has an English title and the site is in English. */
function localesOf(s: Snapshot, title: { ar?: string | null; en?: string | null }): Locale[] {
  return LOCALES.filter((l) => l === 'ar' || (s.englishOn && has(loc(title, 'en'))));
}

/** What each published page emits as its search title and description, per language, as `metadata.ts` derives them. */
export function emitted(s: Snapshot): Emitted[] {
  const out: Emitted[] = [];
  const template = (locale: Locale) =>
    loc(s.titleTemplate, locale) || copyFor(locale).seo.titleTemplate;
  for (const route of s.routes) {
    for (const locale of localesOf(s, route.title)) {
      out.push({
        label: `${route.route} (${locale})`,
        href: `${s.adminRoute}/globals/seo-defaults${locale === 'en' ? '?locale=en' : ''}`,
        title: emittedTitle(template(locale), loc(route.title, locale), route.route === '/'),
        description: loc(route.description, locale),
      });
    }
  }
  for (const page of s.pages) {
    for (const locale of localesOf(s, page.title)) {
      out.push({
        label: `${loc(page.title, locale)} (page, ${locale})`,
        href: editHref(s.adminRoute, 'pages', page.id, locale),
        title: emittedTitle(template(locale), loc(page.seo?.title, locale)),
        description: loc(page.seo?.description, locale),
      });
    }
  }
  for (const product of s.products) {
    for (const locale of localesOf(s, product.title)) {
      const copy = copyFor(locale).seo.product;
      out.push({
        label: `${loc(product.title, locale)} (product, ${locale})`,
        href: editHref(s.adminRoute, 'products', product.id, locale),
        title: emittedTitle(
          template(locale),
          copy.title.replace('{name}', loc(product.title, locale)),
        ),
        description: copy.description
          .replace('{short description}', loc(product.shortDescription, locale).replace(/\.$/, ''))
          .replace('{base}', String(product.baseCost)),
      });
    }
  }
  for (const post of s.posts) {
    for (const locale of localesOf(s, post.title)) {
      out.push({
        label: `${loc(post.title, locale)} (post, ${locale})`,
        href: editHref(s.adminRoute, 'posts', post.id, locale),
        title: emittedTitle(
          template(locale),
          loc(post.seo?.title, locale) || loc(post.title, locale),
        ),
        description: loc(post.seo?.description, locale) || loc(post.excerpt, locale),
      });
    }
  }
  for (const hub of s.hubs) {
    for (const locale of localesOf(s, hub.title)) {
      out.push({
        label: `${loc(hub.title, locale)} (hub, ${locale})`,
        href: editHref(s.adminRoute, 'categories', hub.id, locale),
        title: emittedTitle(template(locale), loc(hub.title, locale)),
        description: loc(hub.lead, locale),
      });
    }
  }
  return out;
}

/** Extractability (ADR-049 E1 to E7): what an engine can lift from a page as an answer. */
export function extractability(s: Snapshot): Finding[] {
  const { titleMax, descriptionMax, answerWords, faqMin } = THRESHOLDS;
  const titles = emitted(s).map((e) => ({
    ok:
      has(e.title) &&
      e.title.length <= titleMax &&
      has(e.description) &&
      e.description.length <= descriptionMax,
    label: e.label,
    href: e.href,
  }));
  const alts = s.media.map((m) => ({
    ok: has(loc(m.alt, 'en')),
    label: `${m.filename} (${m.usedBy.slice(0, 2).join(', ')}${m.usedBy.length > 2 ? '…' : ''})`,
    href: editHref(s.adminRoute, 'media', m.id, 'en'),
  }));
  const perPostLocale = (judge: (post: Snapshot['posts'][number], locale: Locale) => boolean) =>
    s.posts.flatMap((post) =>
      localesOf(s, post.title).map((locale) => ({
        ok: judge(post, locale),
        label: `${loc(post.title, locale)} (${locale})`,
        href: editHref(s.adminRoute, 'posts', post.id, locale),
      })),
    );
  const openings = perPostLocale((post, locale) => {
    const n = openingWords(post.body[locale]);
    return n >= answerWords.min && n <= answerWords.max;
  });
  const questions = perPostLocale((post, locale) => hasQuestionHeading(post.body[locale], locale));
  const faqLocales = LOCALES.filter((l) => l === 'ar' || s.englishOn).map((locale) => ({
    ok: s.faqs.filter((f) => has(loc(f.question, locale))).length >= faqMin,
    label: locale === 'ar' ? 'Arabic' : 'English',
    href: `${s.adminRoute}/collections/faqs`,
  }));
  const compare = s.pages.some((p) => /^(compare|vs)(-|$)/.test(p.slug));
  return [
    prorata({
      key: 'E1',
      section: 'extractability',
      checks: titles,
      title: 'Every page has a search title and description that fit',
      guide: `The title as the tab shows it (the template included) within ${titleMax} characters, the description within ${descriptionMax}, both present, in every language the page exists in. A result shows them whole; an engine quotes them.`,
    }),
    prorata({
      key: 'E2',
      section: 'extractability',
      checks: alts,
      title: 'Every photo in use has English alt text',
      guide:
        'The Arabic alt is required; the English one is what the English page and an engine reading it get. Media → the file → the English tab.',
    }),
    prorata({
      key: 'E3',
      section: 'extractability',
      checks: openings,
      title: 'Every post opens with the answer',
      guide: `The first paragraph answers the question the post is for, in ${answerWords.min} to ${answerWords.max} words, before any story: that block is what an assistant lifts.`,
    }),
    prorata({
      key: 'E4',
      section: 'extractability',
      checks: questions,
      title: 'Every post has a heading phrased as a question',
      guide:
        'At least one H2 worded the way a buyer asks (كيف…؟ / What is…?): the engines match questions to headings.',
    }),
    prorata({
      key: 'E5',
      section: 'extractability',
      checks: faqLocales,
      title: `At least ${faqMin} FAQ entries per language`,
      guide:
        'The FAQ page is the site’s most quotable page: a question and its answer in plain HTML. Catalogue → FAQ, both languages.',
    }),
    finding({
      key: 'E6',
      section: 'extractability',
      status: 'missing',
      title: 'FAQPage schema on the FAQ page',
      guide:
        'The visible questions repeated as FAQPage JSON-LD so an engine reads them as Q&A. Ships with the GEO content (project 4); nothing to do in the admin.',
    }),
    finding({
      key: 'E7',
      section: 'extractability',
      status: compare ? 'done' : 'missing',
      title: 'A compare page exists',
      guide:
        'A page whose slug starts with "compare" or "vs" (B7R vs Printful for Saudi merchants), with a table and "best for / not best for": the page type assistants cite most. Ships with the GEO content (project 4).',
    }),
  ];
}

export function extractabilityFacts(): Fact[] {
  return [
    {
      section: 'extractability',
      text: 'A post cannot be published without three takeaways, a cover and two internal links; a product cannot be published without a front photo, a short description, sizes and a price.',
    },
    {
      section: 'extractability',
      text: 'Every product page states the delivery days and the price with its prefix from the site settings; every photo has Arabic alt text (required).',
    },
  ];
}
