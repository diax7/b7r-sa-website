import type { PromptIntent } from '@/modules/visibility/ledger/prompts';

export interface SeedPrompt {
  text: string;
  language: 'ar' | 'en';
  intent: PromptIntent;
  namesBrand: boolean;
}

/**
 * The first fifteen buyer prompts (ADR-049 D5): ten Arabic and five English, from the BRD's
 * category terms, as a buyer types them to an assistant. Seeded by `content:migrate` once,
 * by text; editable afterwards. The two compare prompts name the brand and leave the
 * cited-rate.
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
];
