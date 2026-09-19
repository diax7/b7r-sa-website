import { HERO_CHIPS_MAX } from '@/content/schema';
import type { Described } from '@/modules/cms/admin/descriptions/describe';

/** What a section's switch removes from the home page (ADR-039); one sentence per switch. */
const sectionSwitch = (section: { ar: string; en: string }) => ({
  ar: `يختفي قسم «${section.ar}» من الصفحة الرئيسية عند الإيقاف.`,
  en: `Off hides the “${section.en}” section from the home page.`,
});

/** A section's three header lines, the same way on every section. */
const eyebrow = (section: { ar: string; en: string }) => ({
  ar: `كلمة أو كلمتان فوق عنوان ${section.ar}.`,
  en: `One or two words above the ${section.en} title.`,
});

/** The home page, section by section (ADR-046). */
export const HOME_DESCRIPTIONS: Described = {
  'hero.slides': {
    ar: 'تتبدّل أعلى الصفحة الرئيسية، والأولى ما يراه الزائر أولاً. لكل شريحة عنوان وسطر وصورتان لكل لغة.',
    en: 'Rotate at the top of the home page, the first seen first; each has a headline, a subline and two photos per language.',
  },
  'hero.slides.headline': {
    ar: 'النص الكبير على الشريحة، وH1 الصفحة في الأولى. حتى 6 كلمات: سطران على الحاسوب.',
    en: "The big text on the slide, and the page's H1 on the first one. Up to 6 words: two rows on a desktop.",
  },
  'hero.slides.subline': {
    ar: 'يظهر تحت العنوان على الشريحة، سطراً واحداً على الحاسوب: حتى 10 كلمات.',
    en: 'Under the headline on the slide, one row on a desktop: up to 10 words.',
  },
  'hero.slides.imageDesktop': {
    ar: 'تظهر خلف الشريحة على الحاسوب. الموقع الإنجليزي يعكس التخطيط: اختر له صورة معكوسة مساحتها الهادئة تحت النص.',
    en: 'Behind the slide on a desktop. The English site mirrors the layout: give it a mirrored photo with its calm area under the text.',
  },
  'hero.slides.imageMobile': {
    ar: 'تظهر خلف الشريحة على الجوال بنسبة 4:5؛ والموقع الإنجليزي يحتاج صورته المعكوسة.',
    en: 'Behind the slide on a phone, portrait 4:5; the English site needs its own, mirrored.',
  },
  'hero.overlay': {
    ar: 'طبقة من لون واحد تبدأ من جهة النص وتتلاشى فوق الصورة، لتُقرأ العناوين على أي صورة.',
    en: 'A one-colour fade from the text side over the photo, so the headline reads on any photo.',
  },
  'hero.overlay.enabled': {
    ar: 'تظهر الصورة كما هي خلف النص عند الإيقاف، بلا تدرّج.',
    en: 'Off shows the photo as it is behind the text, with no fade.',
  },
  'hero.overlay.color': {
    ar: 'يأخذه التدرّج؛ الأبيض هو الأصل. يُكتب بصيغة #rrggbb.',
    en: 'The fade takes this colour; white is the default. Written as #rrggbb.',
  },
  'hero.primaryCta': {
    ar: 'يظهر أزرق تحت الشرائح ويفتح تسجيل حساب في التطبيق. لامع أو كلاسيكي: إعدادات الموقع، العلامة، أزرار لامعة.',
    en: "The blue button under the slides; opens the app's sign-up. Shiny or classic: Site settings, Brand, Shiny buttons.",
  },
  'hero.secondaryCta': {
    ar: 'يفتح صفحة المنتجات من الشرائح.',
    en: 'Opens the products page from the slides.',
  },
  'hero.microcopy': {
    ar: 'يظهر في شريط الحقائق بصفحة «من نحن»، الذي يُبنى من الرئيسية.',
    en: 'Shows in the facts band of the About page, which is built from the home page.',
  },
  'hero.chips': {
    ar: `من صفر إلى ${HERO_CHIPS_MAX}؛ بلا شارات يختفي الصف. شارة بلا نص إنجليزي لا تظهر في الموقع الإنجليزي.`,
    en: `Zero to ${HERO_CHIPS_MAX}; none hides the row. A chip without English text is left off the English site.`,
  },
  'hero.chips.text': {
    ar: 'شارة صغيرة تحت الزرين: «توصيل لكل المملكة خلال 5 أيام». كلمتان إلى خمس.',
    en: 'One small chip under the buttons: "Kingdom-wide delivery in 5 days". Two to five words.',
  },
  'productStrip.eyebrow': eyebrow({ ar: 'شريط المنتجات', en: 'product strip' }),
  'productStrip.title': {
    ar: 'يعلو شريط المنتجات في الرئيسية (H2).',
    en: "The product strip's heading (H2) on the home page.",
  },
  'productStrip.lead': {
    ar: 'يظهر تحت عنوان الشريط؛ جملة واحدة.',
    en: "Under the strip's heading; one sentence.",
  },
  'productStrip.pricePrefix': {
    ar: 'الكلمة قبل كل سعر: الشريط، وصفحة المنتجات، وصفحة المنتج وشريطها الثابت. عادةً «من».',
    en: 'The word before every price: the strip, the products page, the product page and its sticky bar. Usually "from".',
  },
  'productStrip.button': {
    ar: 'يظهر تحت الشريط ويفتح صفحة المنتجات؛ عادةً «كل المنتجات».',
    en: 'Under the strip; opens the products page. Usually "all products".',
  },
  'productStrip.products': {
    ar: 'المنشورة فقط؛ ما يُلغى نشره لاحقاً يسقط من الشريط حتى يُنشر من جديد.',
    en: 'Published products only; one unpublished later drops out of the strip until it is published again.',
  },
  'designer.eyebrow': eyebrow({ ar: 'قسم المصمّم', en: 'designer section' }),
  'designer.title': {
    ar: 'يعلو قسم المصمّم والحاسبة (H2).',
    en: "The designer section's heading (H2).",
  },
  'designer.lead': {
    ar: 'يظهر تحت عنوان المصمّم: ما يفعله الزائر هنا.',
    en: "Under the designer's heading: what a visitor does here.",
  },
  'designer.cta': {
    ar: 'يظهر في نهاية المصمّم ويفتح تسجيل حساب في التطبيق. لامع أو كلاسيكي: إعدادات الموقع، العلامة، أزرار لامعة.',
    en: "At the end of the designer; opens the app's sign-up. Shiny or classic: Site settings, Brand, Shiny buttons.",
  },
  'steps.enabled': sectionSwitch({ ar: 'الخطوات الثلاث', en: 'Three steps' }),
  'steps.eyebrow': eyebrow({ ar: 'الخطوات الثلاث', en: "three steps'" }),
  'steps.title': {
    ar: 'يعلو الخطوات الثلاث (H2).',
    en: "The three steps' heading (H2).",
  },
  'steps.link': {
    ar: 'يظهر تحت الخطوات ويفتح صفحة «كيف تعمل».',
    en: 'Under the steps; opens the how-it-works page.',
  },
  'steps.items': {
    ar: 'بترتيبها، لكل خطوة أيقونة مجسّمة وعنوان ونص.',
    en: 'In order, each with a 3D icon, a title and a text.',
  },
  'steps.items.title': {
    ar: 'يظهر بجانب رقم الخطوة؛ كلمتان إلى أربع.',
    en: "Beside the step's number; two to four words.",
  },
  'steps.items.text': {
    ar: 'يظهر تحت العنوان: جملة واحدة.',
    en: 'Under the title: one sentence.',
  },
  'steps.items.icon': {
    ar: 'من مكتبة الصور (icons-3d-*).',
    en: 'From the image library (icons-3d-*).',
  },
  'video.enabled': sectionSwitch({ ar: 'الفيديو', en: 'Video' }),
  'video.title': {
    ar: 'يعلو الفيديو؛ المقطع نفسه ملف ثابت في الموقع.',
    en: 'Above the video; the loop itself ships with the site.',
  },
  'video.lead': {
    ar: 'يظهر تحت عنوان الفيديو مباشرة.',
    en: "Under the video's heading.",
  },
  'whyUs.enabled': sectionSwitch({ ar: 'لماذا بحر', en: 'Why us' }),
  'whyUs.eyebrow': eyebrow({ ar: '«لماذا بحر»', en: '"why us"' }),
  'whyUs.title': {
    ar: 'يعلو قسم «لماذا بحر» (H2).',
    en: 'The "why us" heading (H2).',
  },
  'whyUs.items': {
    ar: 'بترتيبها، لكل بطاقة أيقونة وعنوان ونص؛ تظهر أيضاً في شريط حقائق «من نحن».',
    en: 'In order, each with an icon, a title and a text; also the facts band of the About page.',
  },
  'whyUs.items.icon': {
    ar: 'واحدة من ثلاث أيقونات ثابتة.',
    en: 'One of three fixed icons.',
  },
  'whyUs.items.title': {
    ar: 'يظهر على البطاقة؛ كلمتان إلى أربع.',
    en: 'On the card; two to four words.',
  },
  'whyUs.items.text': {
    ar: 'جملة واحدة برقم أو وعد يمكن الوفاء به.',
    en: 'One sentence with a number or a promise that can be kept.',
  },
  'testimonials.enabled': sectionSwitch({ ar: 'آراء التجار', en: 'Testimonials' }),
  'testimonials.eyebrow': eyebrow({ ar: 'آراء التجار', en: "testimonials'" }),
  'testimonials.title': {
    ar: 'يعلو قسم آراء التجار (H2)؛ الآراء نفسها من «آراء التجار».',
    en: 'The testimonials heading (H2); the quotes come from Testimonials.',
  },
  'integrations.enabled': sectionSwitch({ ar: 'المتاجر المتصلة', en: 'Connected stores' }),
  'integrations.title': {
    ar: 'يعلو قسم المتاجر المتصلة (H2)؛ الشعارات من «المتاجر المتصلة».',
    en: 'The connected-stores heading (H2); the logos come from Connected stores.',
  },
  'integrations.lead': {
    ar: 'يظهر تحت عنوان المتاجر المتصلة.',
    en: 'Under the connected-stores heading.',
  },
  'faq.enabled': sectionSwitch({ ar: 'الأسئلة الشائعة', en: 'FAQ' }),
  'faq.title': {
    ar: 'يعلو قسم الأسئلة في الرئيسية (H2)؛ الأسئلة من المعلَّمة «يظهر في الرئيسية».',
    en: 'The home FAQ heading (H2); the entries come from the FAQ flagged "show on the home page".',
  },
  'faq.link': {
    ar: 'يظهر تحت القسم ويفتح صفحة الأسئلة الشائعة.',
    en: 'Under the section; opens the FAQ page.',
  },
  'ribbon.title': {
    ar: 'أسفل كل صفحة، فوق التذييل (H2).',
    en: 'At the bottom of every page, above the footer (H2).',
  },
  'ribbon.lead': {
    ar: 'يظهر تحت عنوان شريط الدعوة.',
    en: "Under the banner's heading.",
  },
  'ribbon.button': {
    ar: 'يفتح تسجيل حساب في التطبيق. لامع أو كلاسيكي: إعدادات الموقع، العلامة، أزرار لامعة.',
    en: "Opens the app's sign-up. Shiny or classic: Site settings, Brand, Shiny buttons.",
  },
};

/** Site settings. */
export const SITE_SETTINGS_DESCRIPTIONS: Described = {
  brandName: {
    ar: 'يظهر في بطاقات المشاركة، والسطر الأول من llms.txt، وفي بيانات البحث.',
    en: 'The site name on share cards, the first line of llms.txt and the name search engines read.',
  },
  brandNameLatin: {
    ar: 'يظهر اسماً بديلاً في بيانات البحث وورقة الحقائق: B7R Print.',
    en: 'The alternate name in the search data and the facts sheet: B7R Print.',
  },
  tagline: {
    ar: 'تُقرأ كما هي في كل مكان: تحت الشعار في التذييل، وأول llms.txt، وبيان التطبيق، وورقة الحقائق. جملة واحدة.',
    en: 'One sentence, the same everywhere: under the logo in the footer, the first line of llms.txt, the app manifest, the facts sheet.',
  },
  ctaShiny: {
    ar: 'مفعّل: تكتسب الأزرار الرئيسية في كل الصفحات لمعة متحركة بلوني العلامة. معطّل: الأزرار الزرقاء الكلاسيكية.',
    en: "On: the main buttons on every page get a moving sheen in the brand's two blues. Off: the classic blue buttons.",
  },
  contact: {
    ar: 'التذييل، وصفحة التواصل، وأداة WhatsApp، وبيانات البحث.',
    en: 'The footer, the contact page, the WhatsApp widget and the search data.',
  },
  'contact.phone': {
    ar: 'كما يراه زائر الموقع العربي في التذييل وصفحة التواصل: 0501699572؛ الموقع الإنجليزي يعرض الرقم الدولي.',
    en: 'As the Arabic site shows it in the footer and on the contact page: 0501699572. The English site shows the international one.',
  },
  'contact.phoneIntl': {
    ar: 'ما يطلبه الهاتف عند النقر، وبيانات البحث: +966501699572.',
    en: 'What the phone dials on a tap, and the search data: +966501699572.',
  },
  'contact.whatsapp': {
    ar: 'بلا + ولا مسافات، لرابط wa.me في الأداة وكل أزرار WhatsApp: 966501699572.',
    en: 'No + and no spaces, for the wa.me link in the widget and every WhatsApp button: 966501699572.',
  },
  'contact.email': {
    ar: 'يظهر في التذييل وصفحة التواصل، ويُفتح رابط mailto عند النقر: contact@b7r.sa.',
    en: 'In the footer and on the contact page; the mailto link on a tap: contact@b7r.sa.',
  },
  social: {
    ar: 'أيقونات التذييل وقائمة الجوال، وروابط sameAs في بيانات البحث. الروابط الحقيقية فقط.',
    en: 'The footer and phone-menu icons, and the sameAs links in the search data. Real links only.',
  },
  'social.x': {
    ar: 'رابط الحساب الكامل: https://x.com/b7rprint',
    en: 'The full profile link: https://x.com/b7rprint',
  },
  'social.instagram': {
    ar: 'رابط الحساب الكامل: https://instagram.com/b7rprint',
    en: 'The full profile link: https://instagram.com/b7rprint',
  },
  'social.tiktok': {
    ar: 'رابط الحساب الكامل: https://tiktok.com/@b7rprint',
    en: 'The full profile link: https://tiktok.com/@b7rprint',
  },
  'menu.primary': {
    ar: 'بترتيبها: الترويسة، وقائمة الجوال، وقائمة «روابط» في التذييل.',
    en: 'In order: the header, the phone menu and the "Links" list of the footer.',
  },
  'menu.primary.label': {
    ar: 'كما يقرؤه الزائر في الترويسة وقائمة الجوال وقائمة «روابط» في التذييل.',
    en: 'The link text in the header, the phone menu and the "Links" list of the footer.',
  },
  'menu.primary.href': {
    ar: 'المسار الذي يفتحه الرابط، يبدأ بـ /: /products. الموقع الإنجليزي يضيف /en وحده.',
    en: 'The path the link opens, starting with /: /products. The English site adds /en by itself.',
  },
  'menu.primary.matchPrefix': {
    ar: 'الرابط يبقى مُعلَّماً في كل صفحة يبدأ مسارها بهذا: /products.',
    en: 'Keeps the link marked as current on every page whose path starts with this: /products.',
  },
  'menu.policies': {
    ar: 'قائمة «السياسات» في التذييل: الشروط، الشحن، الخصوصية، الأسئلة الشائعة.',
    en: 'The "Policies" list of the footer: terms, shipping, privacy, FAQ.',
  },
  'menu.policies.label': {
    ar: 'كما يقرؤه الزائر في قائمة «السياسات» بالتذييل.',
    en: 'The link text in the "Policies" list of the footer.',
  },
  'menu.policies.href': {
    ar: 'المسار الذي يفتحه الرابط، يبدأ بـ /: /privacy.',
    en: 'The path the link opens, starting with /: /privacy.',
  },
  'menu.policies.matchPrefix': {
    ar: 'لا يُقرأ لروابط التذييل؛ اتركه فارغاً.',
    en: 'Not read for footer links; leave it empty.',
  },
  'menu.ctaLabel': {
    ar: 'أزرق، في الترويسة وفي قائمة الجوال.',
    en: 'The blue button in the header and in the phone menu.',
  },
  'menu.skipLinkLabel': {
    ar: 'ما يراه مستخدم لوحة المفاتيح عند أول Tab: قفزة من الترويسة إلى المحتوى.',
    en: 'What a keyboard user sees on the first Tab: a jump past the header to the content.',
  },
  'menu.menuOpenLabel': {
    ar: 'ما يقرؤه قارئ الشاشة لزر القائمة في الجوال وهي مغلقة.',
    en: "What a screen reader calls the phone menu's button while the menu is closed.",
  },
  'menu.menuCloseLabel': {
    ar: 'ما يقرؤه قارئ الشاشة لزر القائمة في الجوال وهي مفتوحة.',
    en: "What a screen reader calls the phone menu's button while the menu is open.",
  },
  welcomeCredit: {
    ar: 'بالريال: سطر الرصيد في شريط حقائق «من نحن» وملف llms.txt. يساوي رصيد التطبيق؛ لا مزامنة بينهما.',
    en: 'In SAR: the credit line in the About facts band and in llms.txt. Must equal the app; nothing syncs them.',
  },
  deliveryMaxDays: {
    ar: 'يظهر وعد «خلال N أيام» داخل المملكة في llms.txt، وبيانات الشحن لمحركات البحث، وورقة الحقائق؛ يساوي التطبيق.',
    en: 'Inside the Kingdom: the "within N days" promise in llms.txt, the shipping data for search engines, the facts sheet. Must equal the app.',
  },
  deliveryOrigin: {
    ar: 'شارة الموقع في شريط حقائق «من نحن»، وسطر الشحن في llms.txt، والعنوان في بيانات البحث، وورقة الحقائق: جدة.',
    en: 'The map-pin chip in the About facts band, the shipping line of llms.txt, the address in the search data, the facts sheet: Jeddah.',
  },
  deliveryRegion: {
    ar: 'تظهر في بيانات البحث (addressRegion) لا للزائر: منطقة مكة المكرمة.',
    en: 'The origin region in the search data (addressRegion): Makkah Region. Not shown to a visitor.',
  },
  legalEntity: {
    ar: 'لا يقرؤه الموقع اليوم: سطر الحقوق والصفحات القانونية نصّها ثابت. محفوظ لليوم الذي يُقرأ فيه.',
    en: 'Read by nothing on the site today: the copyright line and the legal pages carry fixed text. Kept for the day they read it.',
  },
  analytics: {
    ar: 'GA4 (بعد موافقة الزائر) وUmami (بلا موافقة). فارغ يعني لا تتبّع.',
    en: 'GA4 (after the visitor consents) and Umami (no consent needed). Empty means no tracking.',
  },
  'analytics.gaId': {
    ar: 'يبدأ بـ G-. عند تعبئته يظهر شريط الموافقة ويُحمَّل GA4 بعد الموافقة؛ فارغ يعني لا تتبّع ولا شريط.',
    en: 'Starts with G-. Set, the consent bar shows and GA4 loads after consent; empty, no tracking and no bar.',
  },
  'analytics.umamiSrc': {
    ar: 'يُحمَّل في كل صفحة مع معرّف الموقع، بلا موافقة؛ على cloud.umami.is أو umami.b7r.app فقط، فلا يقبل الموقع غيرهما.',
    en: 'On cloud.umami.is or umami.b7r.app, the only two the site allows. Loads on every page when set with the website id; no consent needed.',
  },
  'analytics.umamiId': {
    ar: 'بصيغة UUID؛ يعمل فقط مع رابط السكربت.',
    en: 'A UUID; works only together with the script URL.',
  },
};

/** Search defaults. */
export const SEO_DEFAULTS_DESCRIPTIONS: Described = {
  titleTemplate: {
    ar: 'تبويب المتصفح ونتيجة Google لكل صفحة: يحلّ %s محلّ عنوان الصفحة. ما بعد الشرطة العمودية أقل من 15 حرفاً.',
    en: 'The browser tab and the Google result of every page: %s becomes the page title. Keep the part after the bar under 15 characters.',
  },
  routes: {
    ar: 'صف لكل صفحة ثابتة: عنوان البحث ووصفه وتاريخ آخر تغيير في المحتوى.',
    en: 'One row per fixed page: its search title, its description and the date its content last changed.',
  },
  'routes.route': {
    ar: 'الصفحة الثابتة التي ينطبق عليها الصف: / أو /products أو /blog.',
    en: 'The fixed page this row is for: /, /products or /blog.',
  },
  'routes.updatedAt': {
    ar: 'تاريخ آخر تغيير حقيقي في المحتوى: تاريخ التعديل في خريطة الموقع لهذا المسار، وعنده تعيد محركات البحث الزحف.',
    en: 'The date the content last really changed: the sitemap lastmod for this path, which search engines recrawl on.',
  },
  'routes.title': {
    ar: 'يظهر في نتيجة البحث وتبويب المتصفح لهذا المسار؛ يُضاف إليه اسم الموقع من القالب. حتى 70 حرفاً.',
    en: "The search result's title and the browser tab for this path; the site name from the template is appended. Up to 70 characters.",
  },
  'routes.description': {
    ar: 'يظهر تحت العنوان في نتيجة Google لهذا المسار؛ جملة أو جملتان، حتى 155 حرفاً.',
    en: 'Under the title in the Google result for this path. One or two sentences, up to 155 characters.',
  },
  'routes.ogImage': {
    ar: 'تظهر عند مشاركة الرابط: /og/products.png. فارغة تستخدم /og/default.png.',
    en: 'Shown when the link is shared: /og/products.png. Empty uses /og/default.png.',
  },
  verification: {
    ar: 'تثبت الملكية لـ Google Search Console وBing Webmaster Tools (وسما meta في الرئيسية). فارغة تُبقي ما ضُبط مع الاستضافة.',
    en: 'Prove ownership to Google Search Console and Bing Webmaster Tools (meta tags on the home page). Empty keeps the ones set with the hosting.',
  },
  'verification.google': {
    ar: 'رمز التحقق (وسم meta في الرئيسية). فارغ يُبقي ما ضُبط مع الاستضافة.',
    en: 'The verification token (a meta tag on the home page). Empty keeps the one set with the hosting.',
  },
  'verification.bing': {
    ar: 'رمز التحقق (وسم meta في الرئيسية). فارغ يُبقي ما ضُبط مع الاستضافة.',
    en: 'The verification token (a meta tag on the home page). Empty keeps the one set with the hosting.',
  },
};

/** Users and media. */
export const USER_DESCRIPTIONS: Described = {
  role: {
    ar: 'مدير: يفتح الإعدادات والمستخدمين والمحرّك. محرّر: يغيّر المحتوى فقط. لا يظهر في الموقع.',
    en: 'Admin: opens settings, users and the engine. Editor: changes content only. Not shown on the site.',
  },
  name: {
    ar: 'كما يظهر في «آخر حفظ» على المستندات وفي قائمة الحساب. لا يظهر في الموقع.',
    en: 'As it shows in "Last saved" on documents and in the account menu. Not shown on the site.',
  },
};

export const MEDIA_DESCRIPTIONS: Described = {
  alt: {
    ar: 'ما يقرؤه قارئ الشاشة لهذه الصورة، بلغة الشارة بجانب العنوان. مطلوب.',
    en: 'What a screen reader says for this image, in the language of the pill beside the label. Required.',
  },
  credit: {
    ar: 'المصوّر أو مصدر الصورة، للتوثيق فقط. لا يظهر في الموقع.',
    en: 'The photographer or the source, for the record. Not shown on the site.',
  },
  blur: {
    ar: 'نسخة ضبابية صغيرة تُحسب عند الرفع وتظهر مكان الصورة حتى تصل. لا تُحرَّر يدوياً.',
    en: "A tiny blurred copy computed on upload, shown in the photo's place until it arrives. Not edited by hand.",
  },
};
