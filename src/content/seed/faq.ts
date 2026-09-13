import type { FaqItem } from '@/content/schema';

const HOME_ORDER = [
  'كم أحتاج لأبدأ؟',
  'كيف أربح؟',
  'هل يعرف عميلي أن الطباعة من بحر برنت؟',
  'كم يستغرق التوصيل؟',
  'ما المتاجر التي أقدر أربطها؟',
];

/** Adds each entry's order inside its group and, for the five home items, their home order (BRD 4.4). */
function ordered(items: Array<Omit<FaqItem, 'order' | 'homeOrder'>>): FaqItem[] {
  const counters = new Map<string, number>();
  return items.map((item) => {
    const order = (counters.get(item.group) ?? 0) + 1;
    counters.set(item.group, order);
    const home = HOME_ORDER.indexOf(item.question);
    return { ...item, order, ...(item.showOnHome && home >= 0 ? { homeOrder: home + 1 } : {}) };
  });
}

/** BRD Appendix D (full FAQ, grouped). `showOnHome` marks the five homepage items (BRD 4.4). */
export const faq: FaqItem[] = ordered([
  {
    group: 'البداية',
    question: 'كم أحتاج لأبدأ؟',
    answer: 'لا شيء. تسجّل مجاناً وتحصل على 30 ريالاً رصيداً ترحيبياً.',
    showOnHome: true,
  },
  {
    group: 'البداية',
    question: 'هل أحتاج سجلاً تجارياً؟',
    answer:
      'تقدر تبدأ بحساب مجاني. لربط متجرك واستلام الطلبات نطلب توثيق هويتك مع سجل تجاري أو وثيقة عمل حر.',
    showOnHome: false,
  },
  {
    group: 'البداية',
    question: 'هل أحتاج تصاميم جاهزة؟',
    answer: 'ارفع تصميمك بصيغة PNG أو JPG أو SVG. وإن لم يكن عندك تصميم، ابدأ بنص أو شعار بسيط.',
    showOnHome: false,
  },
  {
    group: 'الأسعار والربح',
    question: 'كيف أربح؟',
    answer: 'تحدّد سعر البيع في متجرك. عند كل طلب نخصم تكلفة المنتج والشحن من محفظتك، والباقي ربحك.',
    showOnHome: true,
  },
  {
    group: 'الأسعار والربح',
    question: 'كم تكلفة المنتجات؟',
    answer: 'تبدأ من 30 ريالاً للحقيبة القماشية و45 ريالاً للتيشيرت. كل الأسعار في صفحة المنتجات.',
    showOnHome: false,
  },
  {
    group: 'الأسعار والربح',
    question: 'ما هي المحفظة؟',
    answer: 'رصيد مسبق الدفع تُخصم منه تكلفة كل طلب. تعبّئها بالتحويل البنكي، والحد الأدنى 10 ريالات.',
    showOnHome: false,
  },
  {
    group: 'الأسعار والربح',
    question: 'هل هناك اشتراك شهري أو حد أدنى للطلبات؟',
    answer: 'لا. لا اشتراك ولا حد أدنى، تدفع تكلفة الطلب فقط.',
    showOnHome: false,
  },
  {
    group: 'الطلبات والتوصيل',
    question: 'كم يستغرق التوصيل؟',
    answer: '5 أيام كحد أقصى لأي مدينة في السعودية.',
    showOnHome: true,
  },
  {
    group: 'الطلبات والتوصيل',
    question: 'من يدفع الشحن؟',
    answer: 'تُخصم رسوم شحن الطلب من محفظتك حسب شركة الشحن، وتحدّد أنت ما تُحمّله لعميلك في متجرك.',
    showOnHome: false,
  },
  {
    group: 'الطلبات والتوصيل',
    question: 'هل يعرف عميلي أن الطباعة من بحر برنت؟',
    answer: 'لا. الطرد وبوليصة الشحن باسم متجرك فقط.',
    showOnHome: true,
  },
  {
    group: 'الطلبات والتوصيل',
    question: 'ماذا لو وصل المنتج معيباً؟',
    answer:
      'إذا كان الخطأ منا نعيد الطباعة والشحن مجاناً أو نرد المبلغ، بشرط إبلاغنا خلال 10 أيام من الاستلام مع صور.',
    showOnHome: false,
  },
  {
    group: 'المتاجر والربط',
    question: 'ما المتاجر التي أقدر أربطها؟',
    answer: 'سلة وزد وشوبيفاي، والربط مجاني.',
    showOnHome: true,
  },
  {
    group: 'المتاجر والربط',
    question: 'كيف يتم الربط؟',
    answer: 'بتفويض آمن من داخل متجرك بضغطة واحدة، بدون مشاركة أي بيانات حساسة.',
    showOnHome: false,
  },
  {
    group: 'المتاجر والربط',
    question: 'هل أقدر أربط أكثر من متجر؟',
    answer: 'نعم، اربط أكثر من متجر على أكثر من منصة من الحساب نفسه.',
    showOnHome: false,
  },
  {
    group: 'الجودة والدعم',
    question: 'ما طريقة الطباعة؟',
    answer: 'طباعة رقمية عالية الجودة بألوان ثابتة تتحمل الغسيل المتكرر.',
    showOnHome: false,
  },
  {
    group: 'الجودة والدعم',
    question: 'كيف أتواصل معكم؟',
    answer: 'عبر واتساب على 0501699572 أو البريد contact@b7r.sa.',
    showOnHome: false,
  },
]);

/** Homepage order per BRD 4.4: the five flagged entries by their home order. */
export const homeFaq: FaqItem[] = faq
  .filter((f) => f.showOnHome)
  .toSorted((a, b) => (a.homeOrder ?? 99) - (b.homeOrder ?? 99));
