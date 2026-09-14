import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The blog in English (BRD 10.1, ADR-043): the six hubs, the author and the three Level 1
 * posts, keyed by the shared slug; written into the `en` locale of the Arabic documents by
 * `content:migrate`. Agent-written translations of the Arabic seed (owed Dhia's read,
 * Appendix G); the facts are the seed's (SAR 45 / 89, Jeddah, 5 days, 28 × 38 cm).
 */
export interface HubEn {
  name: string;
  description: string;
  lead: string;
}

export const blogHubsEn: Record<string, HubEn> = {
  'getting-started': {
    name: 'Getting started',
    description:
      'The first step towards your brand: the idea, the first design and the store, with no factory and no stock.',
    lead: 'Everything you need to start from zero.',
  },
  'pod-basics': {
    name: 'Print-on-demand basics',
    description:
      'How print on demand works in Saudi Arabia, how it differs from dropshipping, and which technique suits your design.',
    lead: 'Understand the model before you sell the first piece.',
  },
  'salla-zid-shopify': {
    name: 'Salla, Zid and Shopify',
    description:
      'Connecting your store to print on demand, setting up products and sizes, and the apps that help.',
    lead: 'Your store runs on its own once connected.',
  },
  design: {
    name: 'Design',
    description:
      'Print file sizes, Arabic type, the ideas that sell in Saudi Arabia, and intellectual property.',
    lead: 'Designs that print right and sell more.',
  },
  'pricing-profit': {
    name: 'Pricing and profit',
    description:
      'How to price your printed products, work out your margin, and handle shipping and tax.',
    lead: 'Clear numbers before the first order.',
  },
  seasons: {
    name: 'Seasons',
    description:
      'National Day, Founding Day, Ramadan and back to school: when to prepare your store and what to sell.',
    lead: 'Prepare your store weeks before the season.',
  },
};

export const blogAuthorEn = {
  name: 'Dhia',
  role: 'Founder of B7R Print',
  bio: 'Founder of B7R Print. Writes about print on demand and building brands in Saudi Arabia from daily experience with merchants.',
};

export interface PostEn {
  title: string;
  excerpt: string;
  takeaways: [string, string, string];
}

export const blogPostsEn: Record<string, PostEn> = {
  'start-clothing-brand-saudi-no-factory-no-stock': {
    title: 'Start a clothing brand in Saudi Arabia with no factory and no stock',
    excerpt:
      'Three things are enough to start: a name, one design and a store. The rest happens after the first order.',
    takeaways: [
      'You sell the piece before it is printed, so you pay only the cost of what actually sold.',
      'You need a name, one design and a store on Salla, Zid or Shopify.',
      'The essential T-shirt is the best start: SAR 45 cost and a suggested price of SAR 89.',
    ],
  },
  'what-is-print-on-demand-saudi-examples': {
    title: 'What is print on demand? A plain explanation with Saudi examples',
    excerpt:
      'No piece is printed until your customer buys it. A full example from the order to the shipment.',
    takeaways: [
      'No stock and no minimum: you pay the cost of one piece with every sale.',
      'The order reaches us automatically from your store; we print it in Jeddah and ship it under your name within 5 days.',
      'Five products with a front print area of 28 × 38 cm.',
    ],
  },
  'how-to-price-printed-tshirt-saudi': {
    title: 'How to price a printed T-shirt in Saudi Arabia',
    excerpt: 'Start from the base cost, add shipping and tax, then set a margin worth the effort.',
    takeaways: [
      'The base cost covers the product, the print and the packaging, not shipping and tax.',
      'The suggested price for the essential T-shirt is SAR 89, an estimated profit of SAR 44 per piece.',
      'Test a price for two weeks before you change it; permanent discounts teach your customer to wait.',
    ],
  },
};

/** The English body of a seeded post: Markdown, converted to Lexical by the seed. */
export function blogPostBodyEn(slug: string): string {
  return readFileSync(
    join(process.cwd(), 'src', 'content', 'seed', 'blog', 'en', `${slug}.md`),
    'utf8',
  );
}
