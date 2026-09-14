import type { Integration, Product, SiteSettings } from '@/content/schema';

/**
 * The facts sheet (BRD 10.2.1): what the engine may state about B7R, built from the site
 * settings, the products and the integrations, never from a literal in a prompt. The text
 * goes into every prompt; the numbers (with their unit and context) are what the review
 * compares a draft's figures against (BRD 10.2.4 step 5).
 */
export type FactUnit = 'sar' | 'days' | 'cm' | 'g' | 'count';

export interface FactNumber {
  value: number;
  unit: FactUnit;
  label: string;
}

export interface FactsSheet {
  text: string;
  numbers: FactNumber[];
  /** The site paths a post may link to. */
  links: string[];
}

export interface FactsInput {
  site: SiteSettings;
  products: Product[];
  integrations: Integration[];
}

export function factsSheet({ site, products, integrations }: FactsInput): FactsSheet {
  const numbers: FactNumber[] = [
    { value: site.offer.welcomeCredit, unit: 'sar', label: 'الرصيد الترحيبي' },
    { value: site.delivery.maxDays, unit: 'days', label: 'مدة التوصيل القصوى' },
    { value: products.length, unit: 'count', label: 'عدد المنتجات' },
  ];
  const productLines = products
    .toSorted((a, b) => a.sortOrder - b.sortOrder)
    .map((p) => {
      numbers.push(
        { value: p.baseCost, unit: 'sar', label: `تكلفة ${p.name}` },
        { value: p.suggestedPrice, unit: 'sar', label: `السعر المقترح لـ${p.name}` },
        { value: p.suggestedPrice - p.baseCost, unit: 'sar', label: `الربح التقديري لـ${p.name}` },
        { value: p.weightGrams, unit: 'g', label: `وزن ${p.name}` },
        { value: p.printArea.widthCm, unit: 'cm', label: 'عرض منطقة الطباعة' },
        { value: p.printArea.heightCm, unit: 'cm', label: 'ارتفاع منطقة الطباعة' },
      );
      const colours = p.colors.map((c) => c.name).join('، ');
      return (
        `- ${p.name} (/products/${p.slug}): التكلفة ${p.baseCost} ريالاً، السعر المقترح ` +
        `${p.suggestedPrice} ريالاً، أي ربح تقديري ${p.suggestedPrice - p.baseCost} ريالاً للقطعة قبل ` +
        `الشحن والضريبة. المقاسات: ${p.sizesSummary}. الخامة: ${p.material}. الألوان: ${colours}. ` +
        `منطقة الطباعة: ${p.printArea.label} (${p.printArea.widthCm} × ${p.printArea.heightCm} سم). ` +
        `الطباعة: ${p.printMethodLabel}.`
      );
    });
  const platforms = integrations.map((i) => i.name).join('، ');
  const text = [
    `الشركة: ${site.brandName} (${site.brandNameLatin})، ${site.tagline}`,
    `الخدمة: الطباعة عند الطلب. لا مخزون ولا حد أدنى: تُطبع القطعة بعد أن يشتريها العميل من متجر التاجر.`,
    `الطباعة والشحن من ${site.delivery.origin} (${site.delivery.region}) باسم متجر التاجر خلال ${site.delivery.maxDays} أيام كحد أقصى داخل المملكة.`,
    `الرصيد الترحيبي عند التسجيل: ${site.offer.welcomeCredit} ريالاً. الحساب مجاني.`,
    `المنصات المربوطة: ${platforms}.`,
    `التواصل: ${site.contact.email}، واتساب ${site.contact.whatsapp}.`,
    `المنتجات (${products.length}):`,
    ...productLines,
  ].join('\n');
  const links = [
    '/',
    '/how-it-works',
    '/products',
    '/faq',
    '/about',
    '/contact',
    ...products.map((p) => `/products/${p.slug}`),
  ];
  return { text, numbers, links };
}
