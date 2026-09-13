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
import { blogCopy, blogHubs, blogPosts } from '@/content/blog';
import { seo } from '@/content/seed/seo';
import { MERCHANT_COST_NOTE, productSeo } from '@/content/seo-copy';
import {
  contactEmail,
  errorPage,
  faqPage,
  gonePage,
  legalCopy,
  productsPage,
  aboutPage,
  contactPage,
  footerCopy,
  howItWorksPage,
  notFoundPage,
} from '@/content/pages';
import { products } from '@/content/seed/products';
import { site } from '@/content/seed/site';
import { howItWorksSteps } from '@/content/steps';
import messages from '@/messages/ar.json';

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
  'messages/ar.json': {
    designer: [
      messages.designer.productGroup,
      messages.designer.pricingGroup,
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
      messages.designer.footnote,
      messages.designer.fileError,
    ],
    strip: messages.strip.swipeHint,
    testimonials: messages.testimonials,
    integrations: messages.integrations,
  },
  'products.ts': products.map(({ colors, ...p }) => ({
    ...p,
    colorNames: colors.map((c) => c.name),
  })),
  'steps.ts': howItWorksSteps,
  'seed/faq.ts': faq,
  'pages.ts': [
    productsPage,
    howItWorksPage,
    aboutPage,
    contactPage,
    contactEmail,
    faqPage,
    legalCopy,
    footerCopy,
    notFoundPage,
    gonePage,
    errorPage,
  ],
  'seo.ts': [seo, productSeo, MERCHANT_COST_NOTE],
  // Post titles and hub names are BRD 4.13; excerpts, takeaways and bodies are agent-written
  // samples listed for Dhia (ADR-018), so only the BRD fields are checked here.
  'blog/index.ts': [blogCopy, blogHubs, blogPosts.map((p) => p.title)],
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
