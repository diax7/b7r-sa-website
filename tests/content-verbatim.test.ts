/**
 * Every user-visible Arabic string in the content files must appear verbatim in the BRD
 * (BRD 0.4.3, constitution III). Strings written under the 0.5 fallback rule are listed in
 * TODO_COPY below and flagged for Dhia's review in the PR.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { faq } from '@/content/seed/faq';
import { home } from '@/content/seed/home';
import { navigation } from '@/content/seed/navigation';
import { ar } from '@/content/copy/ar';
import { en } from '@/content/copy/en';
import { blogAuthor, blogHubs, blogPosts } from '@/content/seed/blog';
import { seo } from '@/content/seed/seo';
import { pages } from '@/content/seed/pages';
import { products } from '@/content/seed/products';
import { site } from '@/content/seed/site';

const {
  blog: blogCopy,
  contactEmail,
  contactForm,
  errorPage,
  gonePage,
  productsPage,
  footer: footerCopy,
  notFoundPage,
} = ar;
const messages = ar;

const TODO_COPY = new Set<string>([
  // Designer upload target and its remove control (design review 2026-09-13, Appendix G).
  messages.designer.uploadPrompt,
  messages.designer.remove,
  errorPage.title,
  errorPage.text,
  footerCopy.newsletterUnavailable,
  gonePage.title,
  blogCopy.allHubs,
  blogCopy.emptyHub,
  blogCopy.copied,
  // Level 3 template strings and the hub and author copy (BRD 10.1 names them, not their
  // text); listed for Dhia in Appendix G.
  blogCopy.toc,
  blogCopy.updatedPrefix,
  blogCopy.previousPost,
  blogCopy.nextPost,
  blogCopy.featured,
  blogCopy.latest,
  ...Object.values(blogCopy.search),
  ...Object.values(blogCopy.pagination),
  blogCopy.hubIntro,
  blogCopy.authorIntro,
  blogCopy.authorPosts,
  ...blogHubs.flatMap((h) => [h.description, h.lead]),
  blogAuthor.bio,
]);

const brd = readFileSync(join(process.cwd(), 'B7R-WEBSITE-MASTER-BRD.md'), 'utf8').replace(
  /\s+/g,
  ' ',
);

const ARABIC = /[؀-ۿ]/;

function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') {
    if (ARABIC.test(value)) out.push(value);
  } else if (Array.isArray(value)) {
    for (const v of value) collectStrings(v, out);
  } else if (value && typeof value === 'object') {
    for (const v of Object.values(value)) collectStrings(v, out);
  }
  return out;
}

// testimonials.ts is not checked: its three sample cards are agent-written on Dhia's
// instruction (ADR-023) and stay `placeholder: true` until Dhia publishes them.
const sources: Record<string, unknown> = {
  'site.ts': site,
  'navigation.ts': navigation,
  // Alt text is written by the agent per BRD 3.9 (meaningful Arabic), so it is excluded.
  'seed/home.ts': {
    ...home,
    hero: { ...home.hero, slides: home.hero.slides.map(({ alt: _alt, ...s }) => s) },
  },
  // Interface strings that left the content files (ADR-031); aria labels stay agent-written.
  'copy/ar.ts (microcopy)': {
    designer: [
      messages.designer.productGroup,
      messages.designer.uploadPrompt,
      messages.designer.uploadHelper,
      messages.designer.remove,
      messages.designer.canvasHint,
      messages.designer.baseCost,
      messages.designer.sellPrice,
      messages.designer.suggestedPrice,
      messages.designer.dailySales,
      messages.designer.perPiece,
      messages.designer.monthly,
      messages.designer.negativeWarning,
      messages.designer.fileError,
    ],
    strip: messages.strip.swipeHint,
    testimonials: messages.testimonials,
    integrations: messages.integrations,
    legal: messages.legal.updatedPrefix,
  },
  'products.ts': products.map(({ colors, ...p }) => ({
    ...p,
    colorNames: colors.map((c) => c.name),
  })),
  'seed/faq.ts': faq,
  'copy/ar.ts (pages)': [
    productsPage,
    contactForm,
    contactEmail,
    footerCopy,
    notFoundPage,
    gonePage,
    errorPage,
  ],
  // The seven pages' blocks; legal bodies are Appendix B (checked by length, not verbatim,
  // because the BRD lays them out as tables) and the SEO rows are BRD 4.16.
  'seed/pages.ts': pages.map((p) => ({
    ...p,
    blocks: p.blocks.filter((b) => b.blockType !== 'legalBody'),
  })),
  'seo.ts': [seo, ar.seo.product, ar.seo.merchantCostNote],
  // Post titles and hub names are BRD 4.13; excerpts, takeaways and bodies are agent-written
  // samples listed for Dhia (ADR-018), so only the BRD fields are checked here.
  'copy/ar.ts (blog)': [blogCopy],
  // Hub names, the author line and post titles are BRD 4.13 / Appendix E; hub copy, the bio,
  // excerpts, takeaways and bodies are agent-written and listed for Dhia (ADR-018, ADR-041).
  'seed/blog.ts': [
    blogHubs.map((h) => h.name),
    blogAuthor.name,
    blogAuthor.role,
    blogPosts.map((p) => p.title),
  ],
};

describe('copy is verbatim from the BRD', () => {
  for (const [file, value] of Object.entries(sources)) {
    it(file, () => {
      const missing = collectStrings(value)
        .filter((s) => !TODO_COPY.has(s))
        .map((s) => s.replace(/\s+/g, ' ').trim())
        // Template placeholders like {n} and {year} are BRD syntax; compare the literal.
        .filter((s) => !brd.includes(s));
      expect(missing, `strings in content/${file} not found verbatim in the BRD`).toEqual([]);
    });
  }

  it('hero alt text is descriptive Arabic (BRD 3.9)', () => {
    for (const slide of home.hero.slides) expect(slide.alt.length).toBeGreaterThan(20);
  });
});

/** Every string of the English bank, leaves only. */
function leaves(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) for (const v of value) leaves(v, out);
  else if (value && typeof value === 'object') for (const v of Object.values(value)) leaves(v, out);
  return out;
}

describe('the English copy bank (Appendix H, ADR-043)', () => {
  const appendixStart = brd.indexOf('Appendix H: The English copy bank');

  it('is verbatim in the BRD appendix', () => {
    // A pipe is escaped inside the appendix table.
    const missing = leaves(en)
      .map((s) =>
        s
          .replace(/\s+/g, ' ')
          .trim()
          .replaceAll('|', String.raw`\|`),
      )
      .filter((s) => brd.indexOf(s, appendixStart) === -1);
    expect(missing).toEqual([]);
  });

  it('carries no Arabic and no em dash', () => {
    for (const s of leaves(en)) {
      expect(s, s).not.toMatch(ARABIC);
      expect(s, s).not.toContain(String.fromCharCode(0x2014));
    }
  });
});
