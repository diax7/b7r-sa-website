import type { Integration, Product, SiteSettings } from '@/content/schema';
import { type Locale, localePath } from '@/lib/i18n';

/**
 * The facts sheet (BRD 10.2.1): what the engine may state about B7R, built from the site
 * settings, the products and the integrations, never from a literal in a prompt. The text
 * goes into every prompt; the numbers (with their unit and context) are what the review
 * compares a draft's figures against (BRD 10.2.4 step 5). Written in the topic's language
 * (ADR-043): the caller reads the settings and the catalogue in that locale, the sheet's own
 * wording and the link targets follow it.
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

export function factsSheet(
  { site, products, integrations }: FactsInput,
  locale: Locale = 'ar',
): FactsSheet {
  const t = SHEET_TEXT[locale];
  const numbers: FactNumber[] = [
    { value: site.offer.welcomeCredit, unit: 'sar', label: t.welcomeCredit },
    { value: site.delivery.maxDays, unit: 'days', label: t.maxDays },
    { value: products.length, unit: 'count', label: t.productCount },
  ];
  const productLines = products
    .toSorted((a, b) => a.sortOrder - b.sortOrder)
    .map((p) => {
      numbers.push(
        { value: p.baseCost, unit: 'sar', label: t.cost(p.name) },
        { value: p.suggestedPrice, unit: 'sar', label: t.suggested(p.name) },
        { value: p.suggestedPrice - p.baseCost, unit: 'sar', label: t.profit(p.name) },
        { value: p.weightGrams, unit: 'g', label: t.weight(p.name) },
        { value: p.printArea.widthCm, unit: 'cm', label: t.printWidth },
        { value: p.printArea.heightCm, unit: 'cm', label: t.printHeight },
      );
      return t.productLine(p, localePath(locale, `/products/${p.slug}`));
    });
  const text = [...t.header(site, integrations, products.length), ...productLines].join('\n');
  const links = [
    '/',
    '/how-it-works',
    '/products',
    '/faq',
    '/about',
    '/contact',
    ...products.map((p) => `/products/${p.slug}`),
  ].map((path) => localePath(locale, path));
  return { text, numbers, links };
}

interface SheetText {
  welcomeCredit: string;
  maxDays: string;
  productCount: string;
  printWidth: string;
  printHeight: string;
  cost(name: string): string;
  suggested(name: string): string;
  profit(name: string): string;
  weight(name: string): string;
  productLine(p: Product, path: string): string;
  header(site: SiteSettings, integrations: Integration[], count: number): string[];
}

const SHEET_TEXT: Record<Locale, SheetText> = {
  ar: {
    welcomeCredit: 'الرصيد الترحيبي',
    maxDays: 'مدة التوصيل القصوى',
    productCount: 'عدد المنتجات',
    printWidth: 'عرض منطقة الطباعة',
    printHeight: 'ارتفاع منطقة الطباعة',
    cost: (name) => `تكلفة ${name}`,
    suggested: (name) => `السعر المقترح لـ${name}`,
    profit: (name) => `الربح التقديري لـ${name}`,
    weight: (name) => `وزن ${name}`,
    productLine: (p, path) =>
      `- ${p.name} (${path}): التكلفة ${p.baseCost} ريالاً، السعر المقترح ` +
      `${p.suggestedPrice} ريالاً، أي ربح تقديري ${p.suggestedPrice - p.baseCost} ريالاً للقطعة قبل ` +
      `الشحن والضريبة. المقاسات: ${p.sizesSummary}. الخامة: ${p.material}. الألوان: ${p.colors.map((c) => c.name).join('، ')}. ` +
      `منطقة الطباعة: ${p.printArea.label} (${p.printArea.widthCm} × ${p.printArea.heightCm} سم). ` +
      `الطباعة: ${p.printMethodLabel}.`,
    header: (site, integrations, count) => [
      `الشركة: ${site.brandName} (${site.brandNameLatin})، ${site.tagline}`,
      `الخدمة: الطباعة عند الطلب. لا مخزون ولا حد أدنى: تُطبع القطعة بعد أن يشتريها العميل من متجر التاجر.`,
      `الطباعة والشحن من ${site.delivery.origin} (${site.delivery.region}) باسم متجر التاجر خلال ${site.delivery.maxDays} أيام كحد أقصى داخل المملكة.`,
      `الرصيد الترحيبي عند التسجيل: ${site.offer.welcomeCredit} ريالاً. الحساب مجاني.`,
      `المنصات المربوطة: ${integrations.map((i) => i.name).join('، ')}.`,
      `التواصل: ${site.contact.email}، واتساب ${site.contact.whatsapp}.`,
      `المنتجات (${count}):`,
    ],
  },
  en: {
    welcomeCredit: 'welcome credit',
    maxDays: 'maximum delivery time',
    productCount: 'number of products',
    printWidth: 'print area width',
    printHeight: 'print area height',
    cost: (name) => `cost of the ${name}`,
    suggested: (name) => `suggested price of the ${name}`,
    profit: (name) => `estimated profit on the ${name}`,
    weight: (name) => `weight of the ${name}`,
    productLine: (p, path) =>
      `- ${p.name} (${path}): cost SAR ${p.baseCost}, suggested price SAR ${p.suggestedPrice}, ` +
      `an estimated profit of SAR ${p.suggestedPrice - p.baseCost} per piece before shipping and tax. ` +
      `Sizes: ${p.sizesSummary}. Material: ${p.material}. Colours: ${p.colors.map((c) => c.name).join(', ')}. ` +
      `Print area: ${p.printArea.label} (${p.printArea.widthCm} × ${p.printArea.heightCm} cm). ` +
      `Printing: ${p.printMethodLabel}.`,
    header: (site, integrations, count) => [
      `Company: ${site.brandName} (${site.brandNameLatin}), ${site.tagline}`,
      `Service: print on demand. No stock and no minimum: a piece is printed after the customer buys it from the merchant's store.`,
      `Printed and shipped from ${site.delivery.origin} (${site.delivery.region}) under the merchant's store name within ${site.delivery.maxDays} days at most inside the Kingdom.`,
      `Welcome credit at sign-up: SAR ${site.offer.welcomeCredit}. The account is free.`,
      `Connected platforms: ${integrations.map((i) => i.name).join(', ')}.`,
      `Contact: ${site.contact.email}, WhatsApp ${site.contact.whatsapp}.`,
      `Products (${count}):`,
    ],
  },
};
