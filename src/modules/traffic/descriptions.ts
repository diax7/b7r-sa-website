import type { Described } from '@/modules/cms/admin/descriptions/describe';

/** Traffic rows: what each column holds (ADR-046, ADR-048). Read-only, so these explain rather than guide. */
export const TRAFFIC_DESCRIPTIONS: Described = {
  date: {
    ar: 'بتوقيت الرياض؛ صف لكل يوم ومصدر وصفحة.',
    en: 'In Riyadh time; one row per day, source and page.',
  },
  kind: {
    ar: '«زيارة»: زائر وصل من موقع آخر أو مباشرة. «زحف»: زاحف ذكاء اصطناعي أو محرك بحث قرأ الصفحة.',
    en: '"Landing": a visitor arriving from another site or directly. "Crawl": an AI or search bot reading the page.',
  },
  source: {
    ar: 'للزيارة: الموقع المُحيل بعد طيّ www وروابط التطبيقات (chatgpt.com، google.com) أو «direct»؛ وللزحف: اسم الزاحف (gptbot).',
    en: 'For a landing, the referring site with www and app links folded (chatgpt.com, google.com) or "direct"; for a crawl, the bot (gptbot).',
  },
  path: {
    ar: 'ما وصل إليه الزائر أو قرأه الزاحف، بلا استعلام: /، /products/hoodie، llms.txt.',
    en: 'What the visitor landed on or the bot read, without a query string: /, /products/hoodie, llms.txt.',
  },
  hits: {
    ar: 'كم زيارة أو قراءة في ذلك اليوم لهذا المصدر وهذه الصفحة.',
    en: 'How many landings or reads that day for this source and page.',
  },
};
