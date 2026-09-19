import type { Described } from '@/modules/cms/admin/descriptions/describe';

/** A size measure: the label says which, the sentence says where and what empty does. */
const SIZE_MEASURE = {
  ar: 'بالسنتيمتر في صفحة المنتج. فارغ في كل المقاسات يخفيه.',
  en: "In centimetres, on the product's page. Empty on every size hides it.",
};

/** Products: what each field does on the site (ADR-046). */
export const PRODUCT_DESCRIPTIONS: Described = {
  name: {
    ar: 'في البطاقة، وعنوان صفحته، وقائمة المصمّم، وملف llms.txt.',
    en: "On the card, the page title, the designer's picker and llms.txt.",
  },
  slug: {
    ar: 'آخر رابط الصفحة: b7r.sa/products/tee-essential. حروف لاتينية صغيرة وشرطات؛ تغييره بعد النشر يكسر الروابط القديمة.',
    en: 'The end of the page address: b7r.sa/products/tee-essential. Lowercase letters and hyphens; a change after publishing breaks old links.',
  },
  shortDescription: {
    ar: 'سطر واحد تحت الاسم في البطاقة، ووصف البحث لصفحة المنتج، وسطره في llms.txt.',
    en: "One line under the name on the card, the product's search description, and its line in llms.txt.",
  },
  description: {
    ar: 'الفقرة أعلى صفحة المنتج، تحت الاسم.',
    en: "The paragraph at the top of the product's page, under the name.",
  },
  baseCost: {
    ar: 'ما يدفعه التاجر عن القطعة: صفحة المنتج، والحاسبة، وشريط الرئيسية، وملف llms.txt. يساوي سعر التطبيق.',
    en: "What the merchant pays per piece: the product page, the calculator, the home strip and llms.txt. Must equal the app's price.",
  },
  suggestedPrice: {
    ar: 'ما نقترحه على التاجر سعراً للبيع: صفحة المنتج، والحاسبة، وملف llms.txt. يساوي التطبيق.',
    en: "The sell price suggested to the merchant: the product page, the calculator and llms.txt. Must equal the app's.",
  },
  colors: {
    ar: 'مربعات اللون في البطاقة، وخيارات اللون في صفحة المنتج والمصمّم. الأول هو الافتراضي.',
    en: 'The swatches on the card, and the colour choice on the page and in the designer. The first is the default.',
  },
  'colors.slug': {
    ar: 'تستخدمه مربعات البطاقة والمصمّم: black، white. حروف لاتينية صغيرة؛ لا يظهر للزائر.',
    en: "Used by the card's swatches and the designer: black, white. Lowercase; never shown to a visitor.",
  },
  'colors.name': {
    ar: 'ما يقرؤه الزائر عند اختيار اللون في صفحة المنتج والمصمّم.',
    en: 'What a visitor reads when choosing the colour on the page and in the designer.',
  },
  'colors.hex': {
    ar: 'يلوّن المربع الصغير: #000000. يطابق القماش الفعلي قدر الإمكان.',
    en: 'The colour of the small swatch: #000000. As close to the real fabric as possible.',
  },
  'colors.front': {
    ar: 'بهذا اللون: البطاقة، وصفحة المنتج، وتحت التصميم في المصمّم. مربّعة 1000×1000.',
    en: 'In this colour: the card, the page, and under the design in the designer. Square, 1000 by 1000.',
  },
  'colors.back': {
    ar: 'بهذا اللون: زر «الخلف» في معرض صفحة المنتج. اتركها فارغة إن لم تتوفر.',
    en: "In this colour: the «back» toggle of the page's gallery. Leave empty if there is none.",
  },
  sizes: {
    ar: 'في صفحة المنتج، بهذا الترتيب.',
    en: "On the product's page, in this order.",
  },
  'sizes.label': {
    ar: 'اسم المقاس في صفحة المنتج: S، M، مقاس واحد.',
    en: "The size name on the product's page: S, M, One size.",
  },
  'sizes.length': SIZE_MEASURE,
  'sizes.chest': SIZE_MEASURE,
  'sizes.sleeve': SIZE_MEASURE,
  sizesSummary: {
    ar: 'يظهر في بطاقة المنتج تحت السعر. قصير: «S – 2XL»، «مقاس واحد».',
    en: 'Shows on the product card under the price. Short: "S – 2XL", "One size".',
  },
  material: {
    ar: 'في سطر مواصفات صفحة المنتج: قطن 100%، كانفاس.',
    en: "In the product page's facts line: 100% cotton, canvas.",
  },
  weightGrams: {
    ar: 'في سطر المواصفات؛ التجار يسألون عنه قبل الطلب.',
    en: 'In the facts line; merchants ask for it before ordering.',
  },
  printArea: {
    ar: 'ما يقرؤه الزائر في صفحة المنتج، وأين يضع المصمّم التصميم فوق الصورة.',
    en: 'What a visitor reads on the page, and where the designer places the design on the photo.',
  },
  'printArea.label': {
    ar: 'كما تذكره صفحة المنتج: «الواجهة الأمامية، 28 × 38 سم».',
    en: 'As the page states it: "Front, 28 by 38 cm".',
  },
  'printArea.canvas': {
    ar: 'أين تقع المنطقة فوق صورة المنتج في المصمّم، كنِسَب من عرض الصورة وارتفاعها.',
    en: "Where the area sits over the product photo in the designer, as fractions of the photo's width and height.",
  },
  'printArea.canvas.x': {
    ar: 'كنسبة من عرض الصورة الأمامية (0 إلى 1)؛ يحرّك التصميم في المصمّم.',
    en: "As a fraction of the front photo's width (0 to 1); moves the design in the designer.",
  },
  'printArea.canvas.y': {
    ar: 'كنسبة من ارتفاع الصورة الأمامية (0 إلى 1).',
    en: "As a fraction of the front photo's height (0 to 1).",
  },
  'printArea.canvas.w': {
    ar: 'كنسبة من عرض الصورة (0 إلى 1): أقصى عرض للتصميم.',
    en: "As a fraction of the photo's width (0 to 1): the widest a design can be.",
  },
  'printArea.canvas.h': {
    ar: 'كنسبة من ارتفاع الصورة (0 إلى 1): أقصى ارتفاع للتصميم.',
    en: "As a fraction of the photo's height (0 to 1): the tallest a design can be.",
  },
  printMethodLabel: {
    ar: 'في سطر مواصفات صفحة المنتج: طباعة رقمية عالية الجودة.',
    en: "In the product page's facts line: high-quality digital print.",
  },
  sortOrder: {
    ar: 'في صفحة المنتجات وملف llms.txt: 1 يظهر أولاً. شريط الرئيسية له ترتيبه (الصفحة الرئيسية، شريط المنتجات).',
    en: 'On the products page and in llms.txt: 1 shows first. The home strip has its own order (Home page, Product strip).',
  },
};

/** FAQ entries. */
export const FAQ_DESCRIPTIONS: Described = {
  question: {
    ar: 'كما يظهر في صفحة الأسئلة الشائعة، وفي قسم الرئيسية إن عُلِّم له.',
    en: 'As it reads on the FAQ page, and in the home section when flagged for it.',
  },
  answer: {
    ar: 'تحت السؤال في صفحة الأسئلة وقسم الرئيسية: نص عادي بلا روابط، جملتان إلى أربع.',
    en: 'Under the question on the FAQ page and in the home section: plain text, no links, two to four sentences.',
  },
  group: {
    ar: 'تحتها يُعرض السؤال في صفحة الأسئلة الشائعة؛ عناوين المجموعات ثابتة.',
    en: 'Where the question is listed on the FAQ page; the group headings are fixed.',
  },
  order: {
    ar: 'داخل مجموعته في صفحة الأسئلة الشائعة: 1 أولاً.',
    en: 'Inside its group on the FAQ page: 1 first.',
  },
  showOnHome: {
    ar: 'مفعّل: يظهر السؤال أيضاً في قسم الأسئلة بالرئيسية (خمسة على الأكثر، بحسب «الترتيب في الرئيسية»).',
    en: 'On: the question also shows in the home FAQ section (five at most, by "Order on the home page").',
  },
  homeOrder: {
    ar: 'في قسم الرئيسية، للأسئلة المعلَّمة «يظهر في الرئيسية»: 1 أولاً.',
    en: 'In the home section, for questions flagged "show on the home page": 1 first.',
  },
};

/** Testimonials. */
export const TESTIMONIAL_DESCRIPTIONS: Described = {
  quote: {
    ar: 'كلام التاجر كما يظهر في بطاقة الرأي بالرئيسية. جملتان إلى ثلاث، بلا أرقام لا يمكن إثباتها.',
    en: "The merchant's words on the card on the home page. Two or three sentences, no numbers that cannot be proven.",
  },
  name: {
    ar: 'تحت الرأي في الرئيسية.',
    en: 'Under the quote on the home page.',
  },
  store: {
    ar: 'تحت اسم التاجر في البطاقة.',
    en: "Under the merchant's name on the card.",
  },
  avatar: {
    ar: 'لا يقرؤها الموقع اليوم: البطاقة تعرض الاسم والمتجر بلا صورة. محفوظة لليوم الذي تعرض فيه البطاقات صوراً.',
    en: 'Read by nothing on the site today: the card shows the name and the store, no photo. Kept for the day the cards carry photos.',
  },
  order: {
    ar: 'في قسم الرئيسية: 1 أولاً.',
    en: 'In the home page section: 1 first.',
  },
  placeholder: {
    ar: 'يظهر بشارة «نموذج» في المعاينة ويُخفى على b7r.sa حتى يُنشر رأي حقيقي.',
    en: 'Shows a "sample" badge on previews and is left off b7r.sa until a real testimonial exists.',
  },
};

/** Connected stores (the store platforms). */
export const INTEGRATION_DESCRIPTIONS: Described = {
  platform: {
    ar: 'يختار الشعار المعروض في قسم المتاجر المتصلة؛ حقلا الاسم يحددان كيف يُكتب.',
    en: 'Picks the logo shown in the connected-stores section; the name fields say how it is written.',
  },
  order: {
    ar: 'في قسم الرئيسية: 1 أولاً.',
    en: 'In the home page section: 1 first.',
  },
  name: {
    ar: 'كما يقرؤه الزائر تحت الشعار: سلة، زد.',
    en: "The platform's name as a visitor reads it under the logo: Salla, Zid.",
  },
  nameLatin: {
    ar: 'في بيانات البحث والنص البديل للشعار: Salla، Zid، Shopify.',
    en: "In the search data and the logo's alt text: Salla, Zid, Shopify.",
  },
};
