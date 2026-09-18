import type { Product } from '@/content/schema';

/**
 * BRD Appendix A, verbatim. Seed for the CMS (`pnpm content:migrate`, ADR-026) and the
 * static fallback for the few places that must render without a database (error pages, the
 * proxy). The site itself reads products from Payload (`src/lib/cms/products.ts`).
 */
export const PRINT_AREA_LABEL = 'الواجهة الأمامية، 28 × 38 سم';
export const PRINT_METHOD = 'طباعة رقمية عالية الجودة';

const adultSizes = [
  { label: 'S', measurements: { length: 68, chest: 88, sleeve: 20 } },
  { label: 'M', measurements: { length: 71, chest: 96, sleeve: 21 } },
  { label: 'L', measurements: { length: 74, chest: 104, sleeve: 22 } },
  { label: 'XL', measurements: { length: 77, chest: 112, sleeve: 23 } },
  { label: '2XL', measurements: { length: 80, chest: 120, sleeve: 24 } },
];

const white = (slug: string, back = true) => ({
  slug: 'white',
  name: 'أبيض',
  hex: '#FFFFFF',
  images: {
    front: `/images/products/${slug}/white-front.jpg`,
    ...(back ? { back: `/images/products/${slug}/white-back.jpg` } : {}),
  },
});
const black = (slug: string) => ({
  slug: 'black',
  name: 'أسود',
  hex: '#000000',
  images: {
    front: `/images/products/${slug}/black-front.jpg`,
    back: `/images/products/${slug}/black-back.jpg`,
  },
});

export const products: Product[] = [
  {
    slug: 'tee-essential',
    name: 'تيشيرت أساسي',
    shortDescription: 'تيشيرت كلاسيكي بياقة دائرية وقصة منتظمة، قطن ناعم بوزن 180 غم.',
    description:
      'تيشيرت كلاسيكي بياقة دائرية وقصة منتظمة تناسب الجميع. مصنوع من نسيج قطني ناعم وعالي الجودة يوفر راحة مثالية طوال اليوم، وهو الخيار الأول للبراندات التي تبحث عن قطعة أساسية تدوم طويلاً وتتحمل الاستخدام المتكرر.',
    baseCost: 45,
    suggestedPrice: 89,
    colors: [white('tee-essential'), black('tee-essential')],
    sizes: adultSizes,
    sizesSummary: 'S – 2XL',
    material: 'قطن ناعم عالي الجودة',
    weightGrams: 180,
    printArea: {
      label: PRINT_AREA_LABEL,
      widthCm: 28,
      heightCm: 38,
      canvas: { x: 0.33, y: 0.26, w: 0.34, h: 0.46 },
    },
    printMethodLabel: PRINT_METHOD,
    sortOrder: 1,
    updatedAt: '2026-09-12',
  },
  {
    slug: 'tee-oversize',
    name: 'تيشيرت أوفرسايز',
    shortDescription: 'قصة واسعة وأكتاف منسدلة، قماش ثقيل بوزن 240 غم يناسب تصاميم الشارع.',
    description:
      'يتميز هذا التيشيرت بقصة واسعة وأكتاف منسدلة ليعطي مظهراً عصرياً وجريئاً. القماش ثقيل ومتين ليناسب أزياء الشارع، مما يوفر مساحة واسعة ومسطحة تسمح بتصاميم إبداعية كبيرة الحجم بجودة احترافية.',
    baseCost: 55,
    suggestedPrice: 119,
    colors: [white('tee-oversize'), black('tee-oversize')],
    sizes: adultSizes,
    sizesSummary: 'S – 2XL',
    material: 'قطن ثقيل متين بقصة واسعة',
    weightGrams: 240,
    printArea: {
      label: PRINT_AREA_LABEL,
      widthCm: 28,
      heightCm: 38,
      canvas: { x: 0.33, y: 0.27, w: 0.34, h: 0.46 },
    },
    printMethodLabel: PRINT_METHOD,
    sortOrder: 2,
    updatedAt: '2026-09-12',
  },
  {
    slug: 'hoodie',
    name: 'هودي',
    shortDescription: 'هودي دافئ بفتحات للإبهام، قماش فاخر ببطانة ناعمة بوزن 520 غم.',
    description:
      'هودي دافئ وعصري مزود بفتحات عند نهاية الأكمام لإدخال الإبهام، مما يساعد في ثبات الأكمام ويوفر تدفئة إضافية لليدين. مصنوع من قماش فاخر ببطانة ناعمة، مما يجعله خياراً ممتازاً للمجموعات الشتوية والملابس الرياضية.',
    baseCost: 95,
    suggestedPrice: 189,
    colors: [white('hoodie'), black('hoodie')],
    sizes: adultSizes.slice(0, 4),
    sizesSummary: 'S – XL',
    material: 'قماش فاخر ببطانة ناعمة، مع فتحات للإبهام',
    weightGrams: 520,
    printArea: {
      label: PRINT_AREA_LABEL,
      widthCm: 28,
      heightCm: 38,
      canvas: { x: 0.365, y: 0.27, w: 0.27, h: 0.36 },
    },
    printMethodLabel: PRINT_METHOD,
    sortOrder: 3,
    updatedAt: '2026-09-12',
  },
  {
    slug: 'baby-onesie',
    name: 'بربتوز أطفال',
    shortDescription: 'قطعة واحدة ناعمة على بشرة الرضيع، بفتحات مرنة لسهولة اللبس.',
    description:
      'ملابس أطفال قطعة واحدة مصممة بعناية لتكون ناعمة جداً على بشرة الرضيع الحساسة. يتميز بفتحات مرنة لسهولة اللبس والخلع، ونستخدم فيه تقنيات طباعة تضمن بقاء الألوان زاهية وسلامة التصميم حتى بعد دورات غسيل متعددة.',
    baseCost: 35,
    suggestedPrice: 69,
    colors: [white('baby-onesie')],
    sizes: [
      { label: '0–3M', measurements: { chest: 22, length: 38 } },
      { label: '3–6M', measurements: { chest: 24, length: 42 } },
      { label: '6–12M', measurements: { chest: 26, length: 46 } },
      { label: '12–18M', measurements: { chest: 28, length: 50 } },
    ],
    sizesSummary: '0–3M – 12–18M',
    material: 'قطن ناعم مناسب لبشرة الرضيع',
    weightGrams: 80,
    printArea: {
      label: PRINT_AREA_LABEL,
      widthCm: 28,
      heightCm: 38,
      canvas: { x: 0.36, y: 0.24, w: 0.28, h: 0.38 },
    },
    printMethodLabel: PRINT_METHOD,
    sortOrder: 4,
    updatedAt: '2026-09-12',
  },
  {
    slug: 'tote-bag',
    name: 'حقيبة قماشية',
    shortDescription: 'كانفاس متين بمساحة واسعة للطباعة ومقابض تتحمل الاستخدام اليومي.',
    description:
      'حقيبة قماشية عملية ومتينة مصنوعة من الكانفاس عالي الجودة، مصممة لتكون رفيقاً يومياً مثالياً للتسوق أو العمل. تتميز بمساحة واسعة تسمح بطباعة تصاميم فنية كبيرة وواضحة، مع مقابض قوية تتحمل الاستخدام المستمر والأوزان المختلفة.',
    baseCost: 30,
    suggestedPrice: 65,
    colors: [
      {
        slug: 'beige',
        name: 'بيج',
        hex: '#F5F5DC',
        images: { front: '/images/products/tote-bag/beige-front.jpg' },
      },
    ],
    sizes: [{ label: 'مقاس واحد' }],
    sizesSummary: 'مقاس واحد',
    material: 'كانفاس عالي الجودة بمقابض قوية',
    weightGrams: 220,
    printArea: {
      label: PRINT_AREA_LABEL,
      widthCm: 28,
      heightCm: 38,
      canvas: { x: 0.33, y: 0.41, w: 0.34, h: 0.46 },
    },
    printMethodLabel: PRINT_METHOD,
    sortOrder: 5,
    updatedAt: '2026-09-12',
  },
];
