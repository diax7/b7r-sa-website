import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The seven designed pages in English (BRD 4.9 to 4.12 and Appendix B in translation): the
 * localised fields only, blocks in the Arabic seed's order (matched by position). The legal
 * bodies are English drafts of Appendix B, owed Dhia's read before `/en` goes live.
 */
export type BlockEn = Record<string, unknown>;

export interface PageEn {
  title: string;
  lead?: string;
  blocks: BlockEn[];
  seo: { title: string; description: string };
}

export const legalEn = (slug: 'terms' | 'shipping' | 'privacy'): string =>
  readFileSync(join(process.cwd(), 'src', 'content', 'seed', 'legal', 'en', `${slug}.md`), 'utf8');

export const pagesEn: Record<string, PageEn> = {
  'how-it-works': {
    title: 'How does print on demand work with B7R?',
    lead: 'A business model that lets you sell custom products without printing or storing them.',
    blocks: [
      {
        items: [
          {
            title: 'Create your free account',
            text: 'Sign up in a minute and get SAR 30 of welcome credit.',
          },
          {
            title: 'Pick a product and design it',
            text: 'Upload your design, see it on the product straight away, and set the selling price.',
          },
          {
            title: 'Connect your store',
            text: 'Salla, Zid or Shopify, through a secure connection that shares no sensitive data.',
          },
          {
            title: 'Publish the product in one click',
            text: 'The name, photos, options and price sync to your store automatically.',
          },
          {
            title: 'We print, pack and ship',
            text: 'Every order reaches us the moment it is bought; we deduct the cost from your wallet and ship it under your store name within 5 days at most.',
          },
        ],
      },
      {
        title: 'How is your profit worked out?',
        sell: 'Selling price',
        base: 'Base cost',
        profit: 'Your profit',
        exampleLine: 'Example: a T-shirt you sell for 89 that costs 45 earns you 44 per piece.',
      },
      { title: 'Frequently asked questions', linkLabel: 'All questions' },
    ],
    seo: {
      title: 'How print on demand works with B7R',
      description:
        'Five steps from creating an account to your customer receiving the order: design, connect your store, publish, and we print and ship under your name.',
    },
  },
  about: {
    title: 'About us',
    blocks: [
      {
        heading: 'A story that began with a challenge and became an opportunity',
        text: 'B7R Print was born from the experience of a designer who tried to launch his own label and ran into high costs and logistical hurdles that stalled his dream. The challenge became an opportunity to build a local solution that opens the door for every creator and entrepreneur to launch products at the lowest cost. Today B7R Print is a complete Saudi platform that lets influencers, designers and people with ideas turn their creativity into real products that reach their customers easily and professionally.',
        line: 'We print and ship from Jeddah to every city in the Kingdom.',
      },
      {
        items: [
          {
            title: 'Our mission',
            text: 'To let anyone launch their own brand with ease, through a local print-on-demand service that covers the products, the printing, the packaging and the shipping, with a smart connection to their store.',
          },
          {
            title: 'Our vision',
            text: 'To be the first partner of creators and entrepreneurs in Saudi Arabia and the Gulf for launching their printed products, and to contribute to a sustainable creative economy built on local technology.',
          },
          {
            title: 'Our values',
            text: 'Creativity that turns ideas into products, empowerment that gives every creator a start without risk, and the quality we commit to in printing and packaging.',
          },
        ],
      },
      {
        title: 'Misk Launchpad graduates',
        text: 'B7R Print graduated from the ninth cohort (2026) of Misk Launchpad, the pre-acceleration programme of the Mohammed bin Salman Foundation "Misk".',
      },
    ],
    seo: {
      title: 'About us',
      description:
        'The story of B7R Print, the first Saudi print-on-demand platform, a graduate of the Misk Launchpad programme.',
    },
  },
  contact: {
    title: 'Contact us',
    lead: 'A merchant, a partner or an investor? We answer everyone.',
    blocks: [
      {
        whatsappTitle: 'WhatsApp',
        whatsappText: 'Message us directly',
        emailTitle: 'Email',
        phoneTitle: 'Phone',
        followTitle: 'Follow us',
        booking: {
          title: 'Book a free consultation',
          text: '30 minutes to answer your questions and help you start.',
          button: 'Book your slot',
          whatsappMessage: 'Hello, I would like to book a free consultation.',
        },
      },
    ],
    seo: {
      title: 'Contact us',
      description: 'Message us on WhatsApp or by email, or book a free 30-minute consultation.',
    },
  },
  faq: {
    title: 'Frequently asked questions',
    lead: 'Everything you need to know before you start.',
    blocks: [
      {
        bottomLine: 'Did not find your answer? Message us on WhatsApp.',
        bottomLinkWord: 'WhatsApp',
      },
    ],
    seo: {
      title: 'Print on demand: frequently asked questions',
      description:
        'Straight answers about cost, profit, delivery and connecting your store to B7R Print.',
    },
  },
  terms: {
    title: 'Terms and conditions',
    blocks: [{ body: legalEn('terms') }],
    seo: {
      title: 'Terms and conditions',
      description: 'The terms of use of the B7R Print platform.',
    },
  },
  shipping: {
    title: 'Shipping and delivery',
    blocks: [{ body: legalEn('shipping') }],
    seo: {
      title: 'Shipping and delivery',
      description: 'The B7R Print shipping and delivery policy inside Saudi Arabia.',
    },
  },
  privacy: {
    title: 'Privacy policy',
    blocks: [{ body: legalEn('privacy') }],
    seo: { title: 'Privacy policy', description: 'How B7R Print collects and protects your data.' },
  },
};
