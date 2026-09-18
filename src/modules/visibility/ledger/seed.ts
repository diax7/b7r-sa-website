import type { PromptIntent } from '@/modules/visibility/ledger/prompts';

export interface SeedPrompt {
  text: string;
  language: 'ar' | 'en';
  intent: PromptIntent;
  namesBrand: boolean;
}

/**
 * Every seeded prompt is asked weekly (Phase 3, 2026-09-18: the score reads a four-week
 * window and the M3 rule a fortnight, so a week serves every rule at a seventh of the daily
 * spend); the period is edited per prompt.
 */
export const SEED_EVERY_DAYS = 7;

/**
 * The buyer prompts (ADR-049 D5): the category questions a buyer types to an assistant, from
 * the BRD's category terms, and the brand's own questions (what B7R is, whether it is
 * trusted, what it costs), which name the brand and leave the cited-rate but record what
 * the engines say. Seeded by `content:migrate` once, by text; editable afterwards.
 */
export const SEED_PROMPTS: SeedPrompt[] = [
  {
    text: 'أفضل موقع طباعة على الطلب في السعودية؟',
    language: 'ar',
    intent: 'category',
    namesBrand: false,
  },
  {
    text: 'كيف أبدأ براند ملابس بدون مخزون في السعودية؟',
    language: 'ar',
    intent: 'how-to',
    namesBrand: false,
  },
  {
    text: 'وين أطبع تيشيرتات بتصميمي في الرياض؟',
    language: 'ar',
    intent: 'category',
    namesBrand: false,
  },
  {
    text: 'أفضل خدمة طباعة هودي بالقطعة الواحدة في السعودية',
    language: 'ar',
    intent: 'category',
    namesBrand: false,
  },
  {
    text: 'مواقع طباعة تيشيرتات تشحن داخل السعودية بدون حد أدنى',
    language: 'ar',
    intent: 'category',
    namesBrand: false,
  },
  {
    text: 'كيف أربط متجري في سلة بخدمة طباعة عند الطلب؟',
    language: 'ar',
    intent: 'how-to',
    namesBrand: false,
  },
  {
    text: 'ما الفرق بين الطباعة الرقمية DTG والطباعة الحرارية على التيشيرت؟',
    language: 'ar',
    intent: 'how-to',
    namesBrand: false,
  },
  {
    text: 'كم تكلفة طباعة تيشيرت واحد بتصميم خاص في السعودية؟',
    language: 'ar',
    intent: 'category',
    namesBrand: false,
  },
  { text: 'بديل Printful في السعودية؟', language: 'ar', intent: 'compare', namesBrand: false },
  {
    text: 'بحر برنت مقابل Printify: أيهما أنسب لمتجر سعودي؟',
    language: 'ar',
    intent: 'compare',
    namesBrand: true,
  },
  {
    text: 'Best print on demand service in Saudi Arabia?',
    language: 'en',
    intent: 'category',
    namesBrand: false,
  },
  {
    text: 'How do I start a clothing brand in Saudi Arabia without inventory?',
    language: 'en',
    intent: 'how-to',
    namesBrand: false,
  },
  {
    text: 'Where can I print custom t-shirts in Riyadh with no minimum order?',
    language: 'en',
    intent: 'category',
    namesBrand: false,
  },
  {
    text: 'Hoodie printing service that ships within Saudi Arabia',
    language: 'en',
    intent: 'category',
    namesBrand: false,
  },
  {
    text: 'B7R Print vs Printful for a Saudi Shopify store: which is better?',
    language: 'en',
    intent: 'compare',
    namesBrand: true,
  },
  // The brand's own questions: what the engines say when a buyer asks about B7R by name.
  { text: 'ما هو بحر برنت؟', language: 'ar', intent: 'category', namesBrand: true },
  {
    text: 'هل بحر برنت موثوق؟ تجارب التجار معه',
    language: 'ar',
    intent: 'category',
    namesBrand: true,
  },
  {
    text: 'كم أسعار بحر برنت للطباعة عند الطلب؟',
    language: 'ar',
    intent: 'category',
    namesBrand: true,
  },
  {
    text: 'كيف أربط متجري في سلة مع بحر برنت؟',
    language: 'ar',
    intent: 'how-to',
    namesBrand: true,
  },
  { text: 'What is B7R Print?', language: 'en', intent: 'category', namesBrand: true },
  {
    text: 'Is B7R Print legit? Reviews from merchants',
    language: 'en',
    intent: 'category',
    namesBrand: true,
  },
  {
    text: 'B7R Print pricing for print on demand in Saudi Arabia',
    language: 'en',
    intent: 'category',
    namesBrand: true,
  },
];
