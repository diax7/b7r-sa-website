import type { Described } from '@/modules/cms/admin/descriptions/describe';

/** Pages and their blocks: what each field does on the site (ADR-046). */
export const PAGE_DESCRIPTIONS: Described = {
  slug: {
    ar: 'الجزء الأخير من رابط الصفحة: b7r.sa/about. حروف لاتينية صغيرة وشرطات؛ تغييره بعد النشر يكسر الروابط القديمة.',
    en: 'The last part of the page address: b7r.sa/about. Lowercase letters and hyphens; changing it after publishing breaks old links.',
  },
  title: {
    ar: 'عنوان الصفحة: H1 أعلى الصفحة، واسمها في التبويب إن لم يُملأ عنوان البحث.',
    en: "The page's title: the H1 at the top, and the tab name when no search title is set.",
  },
  lead: {
    ar: 'سطر واحد تحت العنوان، بخط أخف. فارغ يخفي السطر.',
    en: 'One line under the title, in a lighter weight. Empty hides the line.',
  },
  blocks: {
    ar: 'أقسام الصفحة بترتيبها من أعلى إلى أسفل؛ اسحب لإعادة الترتيب. كل نوع له حقوله.',
    en: "The page's sections, top to bottom; drag to reorder. Each type has its own fields.",
  },
  'blocks.richText.title': {
    ar: 'عنوان القسم (H2) فوق النص. فارغ يعرض النص وحده.',
    en: "The section's heading (H2) above the text. Empty shows the text alone.",
  },
  'blocks.richText.content': {
    ar: 'النص المنسّق نفسه: فقرات، عناوين فرعية، قوائم، روابط.',
    en: 'The formatted text itself: paragraphs, subheadings, lists, links.',
  },
  'blocks.story.heading': {
    ar: 'عنوان قسم القصة في صفحة «من نحن»، فوق الصورة والنص.',
    en: 'The heading of the story section on the About page, above the photo and the text.',
  },
  'blocks.story.text': {
    ar: 'نص القصة بجانب الصورة: فقرة أو فقرتان.',
    en: 'The story beside the photo: one or two paragraphs.',
  },
  'blocks.story.line': {
    ar: 'سطر الموقع تحت النص: «جدة، السعودية».',
    en: 'The location line under the text: "Jeddah, Saudi Arabia".',
  },
  'blocks.story.photo': {
    ar: 'صورة القصة بجانب النص، عمودية 4:5.',
    en: 'The story photo beside the text, portrait 4:5.',
  },
  'blocks.cards.title': {
    ar: 'عنوان فوق شبكة البطاقات. فارغ يعرض البطاقات وحدها.',
    en: 'A heading above the card grid. Empty shows the cards alone.',
  },
  'blocks.cards.items': {
    ar: 'البطاقات بترتيبها في الشبكة: أيقونة، عنوان، نص. ثلاث في الصف على الحاسوب.',
    en: 'The cards in grid order: an icon, a title, a text. Three per row on a desktop.',
  },
  'blocks.cards.items.icon': {
    ar: 'الأيقونة أعلى البطاقة، من المجموعة الثابتة.',
    en: "The icon at the card's top, from the fixed set.",
  },
  'blocks.cards.items.title': {
    ar: 'عنوان البطاقة تحت الأيقونة؛ كلمتان إلى أربع.',
    en: "The card's title under the icon; two to four words.",
  },
  'blocks.cards.items.text': {
    ar: 'نص البطاقة تحت العنوان: جملة أو جملتان.',
    en: "The card's text under the title: one or two sentences.",
  },
  'blocks.cards.items.art': {
    ar: 'صورة تحل محل الأيقونة أعلى البطاقة. فارغة تعرض الأيقونة.',
    en: 'A picture in place of the icon at the top of the card. Empty shows the icon.',
  },
  'blocks.steps.items': {
    ar: 'الخطوات بترتيبها المرقّم في صفحة «كيف تعمل»: أيقونة مجسّمة، عنوان، نص.',
    en: 'The numbered steps on the how-it-works page, in order: a 3D icon, a title, a text.',
  },
  'blocks.steps.items.title': {
    ar: 'عنوان الخطوة بجانب رقمها.',
    en: "The step's title beside its number.",
  },
  'blocks.steps.items.text': {
    ar: 'شرح الخطوة تحت عنوانها: جملة أو جملتان.',
    en: "The step's explanation under its title: one or two sentences.",
  },
  'blocks.steps.items.icon': {
    ar: 'الأيقونة المجسّمة للخطوة، من المكتبة (icons-3d-*).',
    en: "The step's 3D icon, from the library (icons-3d-*).",
  },
  'blocks.profitEquation.title': {
    ar: 'عنوان شريط معادلة الربح في صفحة «كيف تعمل».',
    en: 'The heading of the profit-equation band on the how-it-works page.',
  },
  'blocks.profitEquation.sell': {
    ar: 'اسم الحد الأول في المعادلة: «سعر البيع».',
    en: 'The name of the first term of the equation: "Sell price".',
  },
  'blocks.profitEquation.base': {
    ar: 'اسم الحد الثاني في المعادلة: «التكلفة الأساسية».',
    en: 'The name of the second term: "Base cost".',
  },
  'blocks.profitEquation.profit': {
    ar: 'اسم ناتج المعادلة كما يظهر بعد علامة يساوي: «ربحك».',
    en: 'The name of the result, after the equals sign: "Your profit".',
  },
  'blocks.profitEquation.exampleLine': {
    ar: 'سطر المثال تحت المعادلة بأرقام حقيقية من الكتالوج: «تيشيرت بـ 89 ريالاً…».',
    en: 'The worked example under the equation, with real catalogue numbers: "A tee at 89 SAR…".',
  },
  'blocks.faqList.selection': {
    ar: 'أي الأسئلة تُعرض: كل الأسئلة مجمّعة (صفحة الأسئلة)، أو أسئلة الرئيسية فقط.',
    en: 'Which entries show: all of them, grouped (the FAQ page), or the home entries only.',
  },
  'blocks.faqList.offset': {
    ar: 'كم سؤالاً يُتخطّى من البداية. فارغ أو 0: لا شيء.',
    en: 'How many entries to skip from the start. Empty or 0: none.',
  },
  'blocks.faqList.limit': {
    ar: 'أقصى عدد للأسئلة المعروضة. فارغ: الكل.',
    en: 'The most entries shown. Empty: all of them.',
  },
  'blocks.faqList.title': {
    ar: 'عنوان فوق القائمة. فارغ يعرض القائمة وحدها.',
    en: 'A heading above the list. Empty shows the list alone.',
  },
  'blocks.faqList.linkLabel': {
    ar: 'نص رابط تحت القائمة، مثل «كل الأسئلة». فارغ يخفي الرابط.',
    en: 'The text of a link under the list, such as "All questions". Empty hides the link.',
  },
  'blocks.faqList.linkHref': {
    ar: 'وجهة الرابط الذي تحت القائمة: /faq.',
    en: 'Where the link under the list goes: /faq.',
  },
  'blocks.faqList.bottomLine': {
    ar: 'جملة ختامية تحت القائمة تحوي كلمة واحدة تحمل رابطاً. فارغة تخفي الجملة.',
    en: 'A closing sentence under the list with one word carrying a link. Empty hides the sentence.',
  },
  'blocks.faqList.bottomLinkWord': {
    ar: 'الكلمة من الجملة الختامية التي تصبح رابطاً؛ يجب أن تظهر في الجملة حرفياً.',
    en: 'The word of the closing sentence that becomes the link; it must appear in the sentence exactly.',
  },
  'blocks.miskCredential.title': {
    ar: 'عنوان بطاقة مسك لونش باد في «من نحن».',
    en: 'The title of the Misk Launchpad card on the About page.',
  },
  'blocks.miskCredential.text': {
    ar: 'نص البطاقة تحت العنوان: ما البرنامج وما الذي يعنيه لبحر.',
    en: "The card's text under the title: what the programme is and what it means for B7R.",
  },
  'blocks.contact.whatsappTitle': {
    ar: 'عنوان بطاقة واتساب في صفحة التواصل.',
    en: 'The title of the WhatsApp card on the contact page.',
  },
  'blocks.contact.whatsappText': {
    ar: 'سطر تحت عنوان بطاقة واتساب: متى نرد.',
    en: "The line under the WhatsApp card's title: when we answer.",
  },
  'blocks.contact.emailTitle': {
    ar: 'عنوان بطاقة البريد في صفحة التواصل؛ العنوان نفسه من إعدادات الموقع.',
    en: 'The title of the e-mail card on the contact page; the address itself comes from Site settings.',
  },
  'blocks.contact.phoneTitle': {
    ar: 'عنوان بطاقة الهاتف؛ الرقم نفسه من إعدادات الموقع.',
    en: 'The title of the phone card; the number itself comes from Site settings.',
  },
  'blocks.contact.followTitle': {
    ar: 'عنوان بطاقة الحسابات الاجتماعية؛ الروابط من إعدادات الموقع.',
    en: 'The title of the social card; the links come from Site settings.',
  },
  'blocks.contact.booking': {
    ar: 'بطاقة حجز الاستشارة: تفتح رابط الحجز من إعدادات الموقع، أو واتساب برسالة جاهزة إن كان فارغاً.',
    en: 'The consultation card: opens the booking link from Site settings, or WhatsApp with a prefilled message when it is empty.',
  },
  'blocks.contact.booking.title': {
    ar: 'عنوان بطاقة الحجز في صفحة التواصل.',
    en: "The booking card's title on the contact page.",
  },
  'blocks.contact.booking.text': {
    ar: 'سطر تحت عنوان بطاقة الحجز: المدة والمجانية.',
    en: "The line under the booking card's title: the length and that it is free.",
  },
  'blocks.contact.booking.button': {
    ar: 'نص زر الحجز في البطاقة.',
    en: "The booking button's text on the card.",
  },
  'blocks.contact.booking.whatsappMessage': {
    ar: 'الرسالة الجاهزة التي تُفتح في واتساب عندما لا يوجد رابط حجز.',
    en: 'The prefilled message WhatsApp opens with when there is no booking link.',
  },
  'blocks.legalBody.updatedAt': {
    ar: 'تاريخ «آخر تحديث» أعلى الصفحة القانونية، وتاريخ التعديل في بيانات البحث.',
    en: 'The "last updated" date at the top of the legal page, and the modified date search engines read.',
  },
  'blocks.mediaBanner.media': {
    ar: 'الصورة العريضة للقسم، بعرض الصفحة.',
    en: "The section's wide image, the full width of the page.",
  },
  'blocks.mediaBanner.caption': {
    ar: 'سطر تحت الصورة. فارغ يخفيه.',
    en: 'A line under the image. Empty hides it.',
  },
  seo: {
    ar: 'ما تراه محركات البحث والمشاركات: العنوان والوصف في نتيجة Google، والصورة عند مشاركة الرابط.',
    en: 'What search engines and shares see: the title and description in the Google result, the image when the link is shared.',
  },
  'seo.title': {
    ar: 'عنوان نتيجة البحث وتبويب المتصفح؛ يُضاف إليه اسم الموقع من إعدادات البحث. حتى 70 حرفاً.',
    en: "The search result's title and the browser tab; the site name from Search defaults is appended. Up to 70 characters.",
  },
  'seo.description': {
    ar: 'الوصف تحت العنوان في نتيجة البحث. جملة أو جملتان، حتى 160 حرفاً.',
    en: 'The description under the title in the search result. One or two sentences, up to 160 characters.',
  },
  'seo.ogImage': {
    ar: 'الصورة التي تظهر عند مشاركة الرابط في واتساب وX. فارغة تستخدم صورة الموقع الافتراضية.',
    en: "The image shown when the link is shared on WhatsApp and X. Empty uses the site's default.",
  },
};
