import type { Described } from '@/modules/cms/admin/descriptions/describe';

/** Traffic rows: what each column holds (ADR-046, ADR-048). Read-only, so these explain rather than guide. */
export const TRAFFIC_DESCRIPTIONS: Described = {
  date: {
    ar: 'اليوم بتوقيت الرياض الذي وقعت فيه الزيارات أو الزحف؛ صف واحد لكل يوم ومصدر وصفحة.',
    en: 'The day in Riyadh time the landings or crawls happened; one row per day, source and page.',
  },
  kind: {
    ar: '«زيارة»: زائر وصل من موقع آخر أو مباشرة. «زحف»: زاحف ذكاء اصطناعي أو محرك بحث قرأ الصفحة.',
    en: '"Landing": a visitor arriving from another site or directly. "Crawl": an AI or search bot reading the page.',
  },
  source: {
    ar: 'للزيارة: الموقع المُحيل بعد طيّ www وروابط التطبيقات (chatgpt.com، google.com) أو «direct». للزحف: اسم الزاحف (gptbot). القناة تُشتق منه عند القراءة.',
    en: 'For a landing: the referring site with www and app links folded (chatgpt.com, google.com), or "direct". For a crawl: the bot (gptbot). The channel is derived from it at read.',
  },
  path: {
    ar: 'الصفحة التي وصل إليها الزائر أو قرأها الزاحف، بلا استعلام: /، /products/hoodie، /en/blog/… أو llms.txt.',
    en: 'The page the visitor landed on or the bot read, without a query string: /, /products/hoodie, /en/blog/…, or llms.txt.',
  },
  hits: {
    ar: 'عدد الزيارات أو القراءات في ذلك اليوم لهذا المصدر وهذه الصفحة.',
    en: 'How many landings or reads that day for this source and page.',
  },
};
