import type { Described } from '@/modules/cms/admin/descriptions/describe';

/** Products: what each field does on the site (ADR-046). */
export const PRODUCT_DESCRIPTIONS: Described = {
  shortDescription: {
    ar: 'سطر واحد تحت الاسم في بطاقة المنتج، ووصف نتيجة Google لصفحة المنتج، وسطر المنتج في ملف llms.txt.',
    en: "One line under the name on the product card, the description of the product page's Google result, and the product's line in llms.txt.",
  },
  baseCost: {
    ar: 'ما يدفعه التاجر عن القطعة: صفحة المنتج، والحاسبة، والشريط في الرئيسية، وملف llms.txt. يساوي سعر التطبيق؛ لا مزامنة بينهما.',
    en: "What the merchant pays per piece: the product page, the calculator, the home strip and llms.txt. Must equal the app's price: there is no sync.",
  },
  suggestedPrice: {
    ar: 'سعر البيع المقترح للتاجر: صفحة المنتج، والحاسبة، وملف llms.txt. يساوي التطبيق؛ لا مزامنة بينهما.',
    en: "The sell price we suggest to the merchant: the product page, the calculator and llms.txt. Must equal the app's: there is no sync.",
  },
  sizesSummary: {
    ar: 'يظهر في بطاقة المنتج تحت السعر. قصير: «S – 2XL»، «مقاس واحد».',
    en: 'Shows on the product card under the price. Short: "S – 2XL", "One size".',
  },
  name: {
    ar: 'اسم المنتج كما يظهر في البطاقة، وعنوان صفحته، وقائمة المصمّم، وملف llms.txt.',
    en: "The product's name on its card, its page title, the designer's picker and llms.txt.",
  },
  slug: {
    ar: 'الجزء الأخير من رابط الصفحة: b7r.sa/products/tee-essential. حروف لاتينية صغيرة وشرطات فقط؛ تغييره بعد النشر يكسر الروابط القديمة.',
    en: 'The last part of the page address: b7r.sa/products/tee-essential. Lowercase letters and hyphens only; changing it after publishing breaks old links.',
  },
  description: {
    ar: 'الفقرة التعريفية أعلى صفحة المنتج، تحت الاسم.',
    en: "The paragraph at the top of the product's page, under the name.",
  },
  sortOrder: {
    ar: 'ترتيب المنتج في صفحة المنتجات وفي ملف llms.txt: 1 يظهر أولاً. شريط الرئيسية له ترتيبه الخاص (الصفحة الرئيسية، شريط المنتجات).',
    en: 'Where the product sits on the products page and in llms.txt: 1 shows first. The home strip has its own order (Home page, Product strip tab).',
  },
  colors: {
    ar: 'ألوان المنتج: مربعات اللون في البطاقة، وخيارات اللون في صفحة المنتج والمصمّم. اللون الأول هو الافتراضي.',
    en: "The product's colours: the swatches on the card, the colour choice on the page and in the designer. The first is the default.",
  },
  'colors.slug': {
    ar: 'معرّف اللون الذي تستخدمه مربعات البطاقة والمصمّم: black، white. حروف لاتينية صغيرة؛ لا يظهر للزائر.',
    en: "The colour's id, used by the card's swatches and the designer: black, white. Lowercase; never shown to a visitor.",
  },
  'colors.name': {
    ar: 'اسم اللون كما يقرؤه الزائر عند اختياره في صفحة المنتج والمصمّم.',
    en: 'The colour name a visitor reads when choosing it on the page and in the designer.',
  },
  'colors.hex': {
    ar: 'لون المربع الصغير: #000000. يطابق القماش الفعلي قدر الإمكان.',
    en: 'The colour of the small swatch: #000000. As close to the real fabric as possible.',
  },
  'colors.front': {
    ar: 'صورة الواجهة الأمامية بهذا اللون: البطاقة، وصفحة المنتج، والمصمّم يضع التصميم فوقها. مربّعة 1000×1000.',
    en: 'The front photo in this colour: the card, the page, and the designer lays the design over it. Square, 1000 by 1000.',
  },
  'colors.back': {
    ar: 'صورة الخلفية بهذا اللون؛ زر «الخلف» في معرض صفحة المنتج. اتركها فارغة إن لم تتوفر.',
    en: "The back photo in this colour: the «back» toggle of the page's gallery. Leave empty if there is none.",
  },
  sizes: {
    ar: 'المقاسات المتاحة: جدول المقاسات في صفحة المنتج، بترتيبها هنا.',
    en: "The sizes on offer: the size table on the product's page, in this order.",
  },
  'sizes.label': {
    ar: 'اسم المقاس في جدول المقاسات بصفحة المنتج: S، M، مقاس واحد.',
    en: "The size name in the product page's size table: S, M, One size.",
  },
  'sizes.length': {
    ar: 'طول القطعة بالسنتيمتر في جدول المقاسات. فارغ في كل المقاسات يخفي العمود.',
    en: "The piece's length in centimetres in the size table. Empty on every size hides the column.",
  },
  'sizes.chest': {
    ar: 'عرض الصدر بالسنتيمتر في جدول المقاسات. فارغ في كل المقاسات يخفي العمود.',
    en: 'The chest width in centimetres in the size table. Empty on every size hides the column.',
  },
  'sizes.sleeve': {
    ar: 'طول الكم بالسنتيمتر في جدول المقاسات. فارغ في كل المقاسات يخفي العمود.',
    en: 'The sleeve length in centimetres in the size table. Empty on every size hides the column.',
  },
  material: {
    ar: 'الخامة في سطر مواصفات صفحة المنتج: قطن 100%، كانفاس.',
    en: "The material in the product page's facts line: 100% cotton, canvas.",
  },
  weightGrams: {
    ar: 'وزن القطعة بالغرام في سطر المواصفات؛ يُذكر لأن التجار يسألون عنه قبل الطلب.',
    en: 'The weight in grams in the facts line; merchants ask for it before ordering.',
  },
  printArea: {
    ar: 'منطقة الطباعة: ما يقرؤه الزائر في صفحة المنتج، وأين يضع المصمّم التصميم فوق الصورة.',
    en: 'The print area: what a visitor reads on the page, and where the designer places the design on the photo.',
  },
  'printArea.label': {
    ar: 'وصف المنطقة في صفحة المنتج: «الواجهة الأمامية، 28 × 38 سم».',
    en: 'The area as the page states it: "Front, 28 by 38 cm".',
  },
  'printArea.canvas.x': {
    ar: 'بداية المنطقة من يسار الصورة الأمامية، كنسبة من عرضها (0 إلى 1). يحرّك التصميم في المصمّم.',
    en: 'Where the area starts from the left of the front photo, as a fraction of its width (0 to 1). Moves the design in the designer.',
  },
  'printArea.canvas.y': {
    ar: 'بداية المنطقة من أعلى الصورة الأمامية، كنسبة من ارتفاعها (0 إلى 1).',
    en: 'Where the area starts from the top of the front photo, as a fraction of its height (0 to 1).',
  },
  'printArea.canvas.w': {
    ar: 'عرض المنطقة كنسبة من عرض الصورة (0 إلى 1): أقصى عرض للتصميم في المصمّم.',
    en: "The area's width as a fraction of the photo's width (0 to 1): the widest a design can be in the designer.",
  },
  'printArea.canvas.h': {
    ar: 'ارتفاع المنطقة كنسبة من ارتفاع الصورة (0 إلى 1): أقصى ارتفاع للتصميم في المصمّم.',
    en: "The area's height as a fraction of the photo's height (0 to 1): the tallest a design can be in the designer.",
  },
  printMethodLabel: {
    ar: 'طريقة الطباعة في سطر مواصفات صفحة المنتج: طباعة رقمية عالية الجودة.',
    en: "The print method in the product page's facts line: high-quality digital print.",
  },
};

/** FAQ entries. */
export const FAQ_DESCRIPTIONS: Described = {
  answer: {
    ar: 'الجواب تحت السؤال في صفحة الأسئلة وقسم الرئيسية: نص عادي بلا روابط، جملتان إلى أربع.',
    en: 'The answer under the question on the FAQ page and in the home section: plain text, no links, two to four sentences.',
  },
  showOnHome: {
    ar: 'مفعّل: السؤال يظهر أيضاً في قسم الأسئلة بالرئيسية (خمسة على الأكثر، بترتيب «الترتيب في الرئيسية»).',
    en: 'On: the entry also shows in the home FAQ section (five at most, sorted by "Order on the home page").',
  },
  question: {
    ar: 'السؤال كما يظهر في صفحة الأسئلة الشائعة، وفي قسم الأسئلة بالرئيسية إن عُلِّم له.',
    en: 'The question as it reads on the FAQ page, and in the home page section when flagged for it.',
  },
  group: {
    ar: 'المجموعة التي يُعرض السؤال تحتها في صفحة الأسئلة الشائعة؛ عناوين المجموعات ثابتة.',
    en: 'The group the question is listed under on the FAQ page; the group headings are fixed.',
  },
  order: {
    ar: 'ترتيب السؤال داخل مجموعته في صفحة الأسئلة الشائعة: 1 أولاً.',
    en: 'Where the question sits inside its group on the FAQ page: 1 first.',
  },
  homeOrder: {
    ar: 'ترتيب السؤال في قسم الأسئلة بالرئيسية، للمُعلَّم «يظهر في الرئيسية» فقط: 1 أولاً.',
    en: 'Where the question sits in the home page section, for entries flagged «show on home»: 1 first.',
  },
};

/** Testimonials. */
export const TESTIMONIAL_DESCRIPTIONS: Described = {
  quote: {
    ar: 'كلام التاجر كما يظهر في بطاقة الرأي بالرئيسية. جملتان إلى ثلاث، بلا أرقام لا يمكن إثباتها.',
    en: "The merchant's words as they read on the card on the home page. Two or three sentences, no numbers that cannot be proven.",
  },
  name: {
    ar: 'اسم التاجر تحت الرأي في الرئيسية.',
    en: "The merchant's name under the quote on the home page.",
  },
  store: {
    ar: 'اسم متجر التاجر تحت اسمه في البطاقة.',
    en: "The merchant's store name under their name on the card.",
  },
  avatar: {
    ar: 'لا يقرؤه الموقع اليوم: البطاقة تعرض الاسم والمتجر بلا صورة. محفوظ لليوم الذي تعرض فيه البطاقات صوراً.',
    en: 'Read by nothing on the site today: the card shows the name and the store, no photo. Kept for the day the cards carry photos.',
  },
  order: {
    ar: 'ترتيب البطاقة في قسم آراء التجار بالرئيسية: 1 أولاً.',
    en: 'Where the card sits in the home page section: 1 first.',
  },
};

/** Store integrations. */
export const INTEGRATION_DESCRIPTIONS: Described = {
  platform: {
    ar: 'أي منصة هذه: يختار الشعار المعروض في قسم المتاجر المتصلة؛ حقلا الاسم يحددان كيف يُكتب.',
    en: 'Which platform this is: picks the logo shown in the connected-stores section; the name fields say how it is written.',
  },
  order: {
    ar: 'ترتيب شعار المنصة في قسم المتاجر المتصلة بالرئيسية: 1 أولاً.',
    en: "Where the platform's logo sits in the home page section: 1 first.",
  },
  name: {
    ar: 'اسم المنصة كما يقرؤه الزائر تحت شعارها: سلة، زد.',
    en: "The platform's name as a visitor reads it under its logo: Salla, Zid.",
  },
  nameLatin: {
    ar: 'الاسم اللاتيني للمنصة: للبيانات المهيكلة ونص الشعار البديل. Salla، Zid، Shopify.',
    en: "The platform's Latin name: structured data and the logo's alt text. Salla, Zid, Shopify.",
  },
};
