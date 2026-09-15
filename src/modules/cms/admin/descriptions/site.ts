import type { Described } from '@/modules/cms/admin/descriptions/describe';

/** The home page, section by section (ADR-046). */
export const HOME_DESCRIPTIONS: Described = {
  'hero.slides': {
    ar: 'الشرائح الأربع أعلى الرئيسية، تتبدّل تلقائياً؛ الأولى هي ما يراه الزائر أولاً. لكل شريحة عنوان، سطر، وصورتان لكل لغة.',
    en: 'The four slides at the top of the home page, rotating; the first is what a visitor sees first. Each has a headline, a subline and two photos per language.',
  },
  'hero.slides.headline': {
    ar: 'العنوان الكبير على الشريحة، وH1 الصفحة للشريحة الأولى. سطران على الحاسوب: حتى 6 كلمات.',
    en: "The big headline on the slide, and the page's H1 for the first one. Two rows on a desktop: up to 6 words.",
  },
  'hero.slides.subline': {
    ar: 'السطر تحت العنوان على الشريحة. سطر واحد على الحاسوب: حتى 10 كلمات.',
    en: 'The line under the headline on the slide. One row on a desktop: up to 10 words.',
  },
  'hero.primaryCta': {
    ar: 'نص الزر الأزرق تحت الشرائح؛ يفتح تسجيل حساب في التطبيق.',
    en: "The blue button under the slides; opens the app's sign-up.",
  },
  'hero.secondaryCta': {
    ar: 'نص الرابط بجانب الزر؛ يفتح صفحة المنتجات.',
    en: 'The link beside the button; opens the products page.',
  },
  'hero.microcopy': {
    ar: 'سطر الرصيد الترحيبي في شريط الحقائق بصفحة «من نحن» (يُبنى من الرئيسية).',
    en: 'The welcome-credit line in the facts band of the About page (built from the home page).',
  },
  'hero.chips.text': {
    ar: 'نص الشارة الصغيرة تحت الزرين: «توصيل لكل المملكة خلال 5 أيام». كلمتان إلى خمس.',
    en: 'The small chip under the buttons: "Kingdom-wide delivery in 5 days". Two to five words.',
  },
  'productStrip.eyebrow': {
    ar: 'الكلمة الصغيرة فوق عنوان شريط المنتجات.',
    en: "The small word above the product strip's title.",
  },
  'productStrip.title': {
    ar: 'عنوان شريط المنتجات (H2).',
    en: "The product strip's heading (H2).",
  },
  'productStrip.lead': {
    ar: 'سطر تحت عنوان الشريط.',
    en: "The line under the strip's heading.",
  },
  'productStrip.pricePrefix': {
    ar: 'الكلمة قبل السعر في كل بطاقة: «من». السعر نفسه من المنتج.',
    en: 'The word before the price on each card: "from". The price itself comes from the product.',
  },
  'productStrip.button': {
    ar: 'نص زر «كل المنتجات» تحت الشريط؛ يفتح صفحة المنتجات.',
    en: 'The "all products" button under the strip; opens the products page.',
  },
  'designer.eyebrow': {
    ar: 'الكلمة الصغيرة فوق عنوان قسم المصمّم والحاسبة.',
    en: "The small word above the designer section's title.",
  },
  'designer.title': {
    ar: 'عنوان قسم المصمّم والحاسبة (H2).',
    en: "The designer section's heading (H2).",
  },
  'designer.lead': {
    ar: 'سطر تحت عنوان قسم المصمّم: ما يفعله الزائر هنا.',
    en: "The line under the designer's heading: what a visitor does here.",
  },
  'designer.cta': {
    ar: 'نص الزر في نهاية المصمّم؛ يفتح تسجيل حساب في التطبيق.',
    en: "The button at the end of the designer; opens the app's sign-up.",
  },
  'steps.eyebrow': {
    ar: 'الكلمة الصغيرة فوق عنوان الخطوات الثلاث.',
    en: "The small word above the three steps' title.",
  },
  'steps.title': {
    ar: 'عنوان قسم الخطوات الثلاث (H2).',
    en: "The three steps' heading (H2).",
  },
  'steps.link': {
    ar: 'نص رابط «اعرف أكثر» تحت الخطوات؛ يفتح صفحة «كيف تعمل».',
    en: 'The "learn more" link under the steps; opens the how-it-works page.',
  },
  'steps.items': {
    ar: 'الخطوات الثلاث بترتيبها: أيقونة مجسّمة، عنوان، نص.',
    en: 'The three steps in order: a 3D icon, a title, a text.',
  },
  'steps.items.title': {
    ar: 'عنوان الخطوة بجانب رقمها؛ كلمتان إلى أربع.',
    en: "The step's title beside its number; two to four words.",
  },
  'steps.items.text': {
    ar: 'شرح الخطوة تحت العنوان: جملة واحدة.',
    en: "The step's explanation under the title: one sentence.",
  },
  'steps.items.icon': {
    ar: 'الأيقونة المجسّمة للخطوة، من المكتبة (icons-3d-*).',
    en: "The step's 3D icon, from the library (icons-3d-*).",
  },
  'video.title': {
    ar: 'العنوان فوق الفيديو؛ المقطع نفسه ملف ثابت في الموقع.',
    en: 'The heading above the video; the loop itself ships with the site.',
  },
  'video.lead': {
    ar: 'السطر تحت عنوان الفيديو.',
    en: "The line under the video's heading.",
  },
  'whyUs.eyebrow': {
    ar: 'الكلمة الصغيرة فوق عنوان «لماذا بحر».',
    en: 'The small word above the "why us" title.',
  },
  'whyUs.title': {
    ar: 'عنوان قسم «لماذا بحر» (H2).',
    en: 'The "why us" heading (H2).',
  },
  'whyUs.items': {
    ar: 'البطاقات الثلاث بترتيبها: أيقونة، عنوان، نص. تظهر أيضاً في شريط الحقائق بصفحة «من نحن».',
    en: 'The three cards in order: an icon, a title, a text. Also the facts band of the About page.',
  },
  'whyUs.items.icon': {
    ar: 'أيقونة البطاقة، من المجموعة الثابتة.',
    en: "The card's icon, from the fixed set.",
  },
  'whyUs.items.title': {
    ar: 'عنوان البطاقة؛ كلمتان إلى أربع.',
    en: "The card's title; two to four words.",
  },
  'whyUs.items.text': {
    ar: 'نص البطاقة: جملة واحدة برقم أو وعد يمكن الوفاء به.',
    en: "The card's text: one sentence with a number or a promise that can be kept.",
  },
  'testimonials.eyebrow': {
    ar: 'الكلمة الصغيرة فوق عنوان آراء التجار.',
    en: "The small word above the testimonials' title.",
  },
  'testimonials.title': {
    ar: 'عنوان قسم آراء التجار (H2)؛ الآراء نفسها من مجموعة «آراء التجار».',
    en: 'The testimonials heading (H2); the quotes come from the Testimonials collection.',
  },
  'integrations.title': {
    ar: 'عنوان قسم المتاجر المتصلة (H2)؛ الشعارات من مجموعة «المتاجر المتصلة».',
    en: 'The connected-stores heading (H2); the logos come from Store integrations.',
  },
  'integrations.lead': {
    ar: 'السطر تحت عنوان المتاجر المتصلة.',
    en: 'The line under the connected-stores heading.',
  },
  'faq.title': {
    ar: 'عنوان قسم الأسئلة في الرئيسية (H2)؛ الأسئلة من مجموعة الأسئلة المعلَّمة «يظهر في الرئيسية».',
    en: 'The home FAQ heading (H2); the entries come from the FAQ flagged «show on home».',
  },
  'faq.link': {
    ar: 'نص رابط «كل الأسئلة» تحت القسم؛ يفتح صفحة الأسئلة الشائعة.',
    en: 'The "all questions" link under the section; opens the FAQ page.',
  },
  'ribbon.title': {
    ar: 'عنوان شريط الدعوة أسفل كل صفحة، فوق التذييل.',
    en: 'The CTA ribbon heading at the bottom of every page, above the footer.',
  },
  'ribbon.lead': {
    ar: 'السطر تحت عنوان شريط الدعوة.',
    en: "The line under the ribbon's heading.",
  },
  'ribbon.button': {
    ar: 'نص زر شريط الدعوة؛ يفتح تسجيل حساب في التطبيق.',
    en: "The ribbon's button; opens the app's sign-up.",
  },
};

/** Site settings. */
export const SITE_SETTINGS_DESCRIPTIONS: Described = {
  welcomeCredit: {
    ar: 'الرصيد الترحيبي بالريال: سطر الرصيد في شريط حقائق «من نحن» وملف llms.txt. يساوي التطبيق؛ لا مزامنة بينهما.',
    en: "The welcome credit in SAR: the credit line in the About facts band and llms.txt. Must equal the app's: there is no sync.",
  },
  deliveryMaxDays: {
    ar: 'أقصى أيام التوصيل داخل المملكة: وعد «خلال N أيام» في llms.txt وبيانات الشحن لمحركات البحث. يساوي التطبيق؛ لا مزامنة.',
    en: 'The most days a delivery takes inside the Kingdom: the "within N days" promise in llms.txt and the shipping data search engines read. Must equal the app: there is no sync.',
  },
  bookingUrl: {
    ar: 'رابط حجز الاستشارة (Cal.com) لبطاقة الحجز في صفحة التواصل. فارغ يفتح واتساب بالرسالة الجاهزة بدلاً منه.',
    en: 'The consultation booking link (Cal.com) for the contact page booking card. Empty opens WhatsApp with the prefilled message instead.',
  },
  brandName: {
    ar: 'اسم العلامة كما يقرؤه الزائر: التذييل، سطر llms.txt الأول، وبيانات المنظمة لمحركات البحث.',
    en: "The brand's name as a visitor reads it: the footer, the first line of llms.txt, and the organisation data search engines read.",
  },
  brandNameLatin: {
    ar: 'الاسم اللاتيني للعلامة: الاسم البديل في بيانات المنظمة لمحركات البحث، وورقة حقائق المحرّك. B7R Print.',
    en: "The brand's Latin name: the alternate name in the organisation data search engines read, and the engine's facts sheet. B7R Print.",
  },
  tagline: {
    ar: 'الجملة التعريفية الواحدة: تحت الشعار في التذييل، السطر الأول في llms.txt، وورقة حقائق المحرّك. الجملة نفسها في كل مكان.',
    en: "The one-line definition: under the logo in the footer, the first line of llms.txt, and the engine's facts sheet. The same sentence everywhere.",
  },
  contact: {
    ar: 'طرق التواصل: التذييل، صفحة التواصل، أداة واتساب، وبيانات المنظمة.',
    en: 'How to reach us: the footer, the contact page, the WhatsApp widget and the organisation data.',
  },
  'contact.phone': {
    ar: 'الرقم كما يُعرض للزائر في التذييل وصفحة التواصل: 0501699572.',
    en: 'The number as a visitor sees it in the footer and on the contact page: 0501699572.',
  },
  'contact.phoneIntl': {
    ar: 'الرقم الدولي الذي يطلبه الهاتف عند النقر، وبيانات المنظمة: +966501699572.',
    en: 'The international number the phone dials on a tap, and the organisation data: +966501699572.',
  },
  'contact.whatsapp': {
    ar: 'أرقام واتساب بلا + ولا مسافات، لرابط wa.me في الأداة وكل أزرار واتساب: 966501699572.',
    en: 'The WhatsApp digits, no + and no spaces, for the wa.me link in the widget and every WhatsApp button: 966501699572.',
  },
  'contact.email': {
    ar: 'البريد في التذييل وصفحة التواصل، ورابط mailto عند النقر: contact@b7r.sa.',
    en: 'The e-mail in the footer and on the contact page, and the mailto link on a tap: contact@b7r.sa.',
  },
  social: {
    ar: 'الحسابات الرسمية: أيقونات التذييل وقائمة الجوال، وروابط sameAs في بيانات المنظمة. الروابط الحقيقية فقط.',
    en: 'The official accounts: the footer and phone-menu icons, and the sameAs links in the organisation data. Real links only.',
  },
  'social.x': {
    ar: 'رابط حساب X الكامل: https://x.com/b7rprint',
    en: 'The full X profile link: https://x.com/b7rprint',
  },
  'social.instagram': {
    ar: 'رابط حساب إنستغرام الكامل: https://instagram.com/b7rprint',
    en: 'The full Instagram profile link: https://instagram.com/b7rprint',
  },
  'social.tiktok': {
    ar: 'رابط حساب تيك توك الكامل: https://tiktok.com/@b7rprint',
    en: 'The full TikTok profile link: https://tiktok.com/@b7rprint',
  },
  'menu.primary.label': {
    ar: 'نص الرابط في الترويسة، وقائمة الجوال، وعمود «روابط» في التذييل.',
    en: 'The link text in the header, the phone menu and the "Links" column of the footer.',
  },
  'menu.primary.href': {
    ar: 'المسار الذي يفتحه الرابط، يبدأ بـ /: /products. الموقع الإنجليزي يضيف /en وحده.',
    en: 'The path the link opens, starting with /: /products. The English site adds /en by itself.',
  },
  'menu.policies.label': {
    ar: 'نص الرابط في عمود «السياسات» بالتذييل.',
    en: 'The link text in the "Policies" column of the footer.',
  },
  'menu.policies.href': {
    ar: 'المسار الذي يفتحه الرابط، يبدأ بـ /: /privacy.',
    en: 'The path the link opens, starting with /: /privacy.',
  },
  deliveryOrigin: {
    ar: 'مدينة الشحن في عنوان المنظمة لمحركات البحث وفي ورقة حقائق المحرّك: جدة.',
    en: "The shipping city in the organisation's address for search engines and in the engine's facts sheet: Jeddah.",
  },
  deliveryRegion: {
    ar: 'منطقة المنشأ في بيانات المنظمة لمحركات البحث (حقل addressRegion): منطقة مكة المكرمة. لا يظهر للزائر.',
    en: 'The origin region in the organisation data search engines read (addressRegion): Makkah Region. Not shown to a visitor.',
  },
  legalEntity: {
    ar: 'اسم الكيان القانوني في سطر الحقوق أسفل التذييل وفي الصفحات القانونية.',
    en: "The legal entity's name in the footer's copyright line and on the legal pages.",
  },
};

/** Search defaults. */
export const SEO_DEFAULTS_DESCRIPTIONS: Described = {
  titleTemplate: {
    ar: 'عنوان التبويب ونتيجة Google لكل صفحة: يحلّ %s محلّ عنوان الصفحة نفسها. ما بعد الشرطة العمودية أقل من 15 حرفاً.',
    en: 'The browser tab and the Google result title of every page: %s becomes the page title itself. Keep the part after the bar under 15 characters.',
  },
  routes: {
    ar: 'صف لكل صفحة ثابتة: عنوان البحث ووصفه وتاريخ آخر تغيير في محتواها.',
    en: 'One row per fixed page: its search title, its description and the date its content last changed.',
  },
  'routes.updatedAt': {
    ar: 'تاريخ آخر تغيير حقيقي في محتوى الصفحة: تاريخ التعديل في خريطة الموقع لهذا المسار (محركات البحث تعيد الزحف عنده).',
    en: 'The date the page content last really changed: the sitemap lastmod for this route (search engines recrawl on it).',
  },
  'routes.description': {
    ar: 'الوصف تحت العنوان في نتيجة Google لهذا المسار. جملة أو جملتان، حتى 155 حرفاً.',
    en: 'The description under the title in the Google result for this route. One or two sentences, up to 155 characters.',
  },
  verification: {
    ar: 'الرمزان اللذان أعطتهما Google Search Console وBing Webmaster Tools لإثبات الملكية (وسما meta في الرئيسية). فارغ يستخدم متغيّرات البيئة.',
    en: 'The tokens Google Search Console and Bing Webmaster Tools gave you to prove ownership (meta tags on the home page). Empty uses the environment variables.',
  },
  'routes.route': {
    ar: 'مسار الصفحة الثابتة التي ينطبق عليها هذا الصف: / أو /products أو /blog.',
    en: 'The fixed page this row is for: /, /products or /blog.',
  },
  'routes.title': {
    ar: 'عنوان نتيجة البحث وتبويب المتصفح لهذا المسار؛ يُضاف إليه اسم الموقع من القالب. حتى 70 حرفاً.',
    en: "The search result's title and the browser tab for this route; the site name from the template is appended. Up to 70 characters.",
  },
  'routes.ogImage': {
    ar: 'مسار صورة المشاركة لهذا المسار: /og/products.png. فارغ يستخدم /og/default.png.',
    en: "The share image's path for this route: /og/products.png. Empty uses /og/default.png.",
  },
  'verification.google': {
    ar: 'رمز التحقق من Google Search Console (وسم meta في الرئيسية). فارغ يستخدم متغيّر البيئة.',
    en: "Google Search Console's verification token (a meta tag on the home page). Empty uses the environment variable.",
  },
  'verification.bing': {
    ar: 'رمز التحقق من Bing Webmaster Tools (وسم meta في الرئيسية). فارغ يستخدم متغيّر البيئة.',
    en: "Bing Webmaster Tools' verification token (a meta tag on the home page). Empty uses the environment variable.",
  },
};

/** Users and media. */
export const USER_DESCRIPTIONS: Described = {
  role: {
    ar: 'مدير: يفتح الإعدادات والمستخدمين والمحرّك. محرّر: يغيّر المحتوى فقط. لا يظهر في الموقع.',
    en: 'Admin: opens settings, users and the engine. Editor: changes content only. Not shown on the site.',
  },
  name: {
    ar: 'الاسم كما يظهر في «آخر حفظ» على المستندات وفي قائمة الحساب. لا يظهر في الموقع.',
    en: 'The name as it shows in "Last saved" on documents and in the account menu. Not shown on the site.',
  },
};

export const MEDIA_DESCRIPTIONS: Described = {
  credit: {
    ar: 'مصدر الصورة أو المصوّر، للتوثيق الداخلي. لا يظهر في الموقع.',
    en: "The photo's source or photographer, for the record. Not shown on the site.",
  },
};
