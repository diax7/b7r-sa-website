import type { LexicalState } from '@/lib/lexical';
import { CHECKLIST_ITEMS } from '@/modules/visibility/rules/rest';
import type { Snapshot } from '@/modules/visibility/types';

export const paragraph = (text: string) => ({
  type: 'paragraph',
  children: [{ type: 'text', text }],
});
export const h2 = (text: string) => ({
  type: 'heading',
  tag: 'h2',
  children: [{ type: 'text', text }],
});
export const body = (...children: unknown[]): LexicalState =>
  ({ root: { type: 'root', children } }) as unknown as LexicalState;
export const words = (n: number) => Array.from({ length: n }, (_, i) => `كلمة${i}`).join(' ');

/** A filled production site: everything an admin controls is right, nothing outside is connected. */
export function filled(overrides: Partial<Snapshot> = {}): Snapshot {
  return {
    at: '2026-09-16T09:00:00.000Z',
    adminRoute: '/admin',
    isProductionSite: true,
    englishOn: true,
    indexNow: true,
    gaConfigured: true,
    site: {
      tagline: { ar: 'اطبع براندك بلا مخزون', en: 'Print your brand with no stock' },
      social: {
        x: 'https://x.com/b7rprint',
        instagram: 'https://instagram.com/b7rprint',
        tiktok: 'https://tiktok.com/@b7rprint',
      },
    },
    titleTemplate: { ar: '%s | بحر برنت', en: '%s | B7R Print' },
    routes: [
      {
        route: '/',
        title: { ar: 'بحر برنت: طباعة عند الطلب', en: 'B7R Print: print on demand' },
        description: {
          ar: 'وصف الرئيسية بطول مناسب لمحركات البحث في السعودية.',
          en: 'A home description of a fitting length for search engines in Saudi Arabia.',
        },
      },
    ],
    pages: [
      {
        id: 1,
        slug: 'about',
        title: { ar: 'من نحن', en: 'About' },
        blocks: [{ type: 'story', asOf: null }],
        seo: {
          title: { ar: 'من نحن', en: 'About B7R' },
          description: {
            ar: 'قصة بحر برنت وفريقها ومن أين تشحن.',
            en: 'The story of B7R Print, its team and where it ships from.',
          },
        },
      },
    ],
    products: [
      {
        id: 2,
        slug: 'hoodie',
        title: { ar: 'هودي', en: 'Hoodie' },
        shortDescription: {
          ar: 'هودي قطني ثقيل بطباعة واضحة.',
          en: 'A heavy cotton hoodie with a crisp print.',
        },
        baseCost: 89,
        sortOrder: 1,
      },
    ],
    posts: [
      {
        id: 3,
        slug: 'start-a-brand',
        title: { ar: 'كيف تبدأ براند ملابس', en: 'How to start a clothing brand' },
        excerpt: { ar: 'مقدمة المقال', en: 'The post intro' },
        seo: {
          title: { ar: 'كيف تبدأ براند ملابس بلا مخزون', en: 'Start a clothing brand with no stock' },
          description: {
            ar: 'خطوات البدء بدون مصنع ولا مخزون، بالأرقام.',
            en: 'The steps to start with no factory and no stock, in numbers.',
          },
        },
        body: {
          ar: body(paragraph(words(50)), h2('كيف أبدأ؟'), paragraph('نص')),
          en: body(
            paragraph(Array.from({ length: 45 }, () => 'word').join(' ')),
            h2('What does it cost?'),
          ),
        },
        author: 4,
      },
    ],
    hubs: [
      {
        id: 5,
        slug: 'getting-started',
        title: { ar: 'البداية', en: 'Getting started' },
        lead: { ar: 'أول خطوة نحو براندك.', en: 'The first step towards your brand.' },
      },
    ],
    authors: [
      {
        id: 4,
        name: { ar: 'ضياء', en: 'Dhia' },
        bio: { ar: 'مؤسس بحر برنت', en: 'Founder' },
        photo: 7,
        sameAs: 1,
      },
    ],
    faqs: Array.from({ length: 6 }, (_, i) => ({
      id: 10 + i,
      question: { ar: `سؤال ${i}؟`, en: `Question ${i}?` },
    })),
    media: [{ id: 7, filename: 'dhia.jpg', alt: { ar: 'ضياء', en: 'Dhia' }, usedBy: ['ضياء'] }],
    checklist: Object.fromEntries(CHECKLIST_ITEMS.map((i) => [i.key, true])),
    connections: [],
    landings30d: 12,
    prompts: [
      ...Array.from({ length: 5 }, () => ({
        language: 'ar' as const,
        enabled: true,
        namesBrand: false,
      })),
      ...Array.from({ length: 5 }, () => ({
        language: 'en' as const,
        enabled: true,
        namesBrand: false,
      })),
    ],
    lastLedgerRunAt: null,
    citedRate: null,
    pagespeed: [],
    searchConsole: null,
    ...overrides,
  };
}
