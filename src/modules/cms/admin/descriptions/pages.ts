import type { Described } from '@/modules/cms/admin/descriptions/describe';

/** Pages and their blocks: what each field does on the site (ADR-046). */
export const PAGE_DESCRIPTIONS: Described = {
  title: {
    ar: 'H1 أعلى الصفحة، واسمها في التبويب إن لم يُملأ عنوان البحث.',
    en: 'The H1 at the top, and the tab name when no search title is set.',
  },
  slug: {
    ar: 'آخر رابط الصفحة: b7r.sa/about. حروف لاتينية صغيرة وشرطات؛ تغييره بعد النشر يكسر الروابط القديمة.',
    en: 'The end of the page address: b7r.sa/about. Lowercase letters and hyphens; a change after publishing breaks old links.',
  },
  lead: {
    ar: 'تحت العنوان بخط أخف. فارغ يخفيه.',
    en: 'One line under the title, in a lighter weight. Empty hides it.',
  },
  blocks: {
    ar: 'من أعلى إلى أسفل؛ اسحب لإعادة الترتيب. لكل نوع حقوله.',
    en: 'Top to bottom; drag to reorder. Each type has its own fields.',
  },
  'blocks.richText.title': {
    ar: 'يعلو النص (H2). فارغ يعرض النص وحده.',
    en: 'The heading (H2) above the text. Empty shows the text alone.',
  },
  'blocks.richText.content': {
    ar: 'النص المنسّق: فقرات وعناوين فرعية وقوائم وروابط.',
    en: 'The formatted text: paragraphs, subheadings, lists, links.',
  },
  'blocks.story.heading': {
    ar: 'فوق الصورة والنص في قسم الحكاية بصفحة «من نحن».',
    en: 'Above the photo and the text of the story section on the About page.',
  },
  'blocks.story.text': {
    ar: 'بجانب الصورة: فقرة أو فقرتان.',
    en: 'Beside the photo: one or two paragraphs.',
  },
  'blocks.story.line': {
    ar: 'تحت النص: «جدة، السعودية».',
    en: 'Under the text: "Jeddah, Saudi Arabia".',
  },
  'blocks.story.photo': {
    ar: 'بجانب النص، بنسبة 4:5.',
    en: 'Beside the text, portrait 4:5.',
  },
  'blocks.story.withFacts': {
    ar: 'مفعّل: الرصيد الترحيبي وبطاقات «لماذا بحر» من الرئيسية تتبع الحكاية.',
    en: 'On: the welcome credit and the why-us cards from the home page follow the story.',
  },
  'blocks.cards.title': {
    ar: 'فوق شبكة البطاقات. فارغ يعرض البطاقات وحدها.',
    en: 'Above the card grid. Empty shows the cards alone.',
  },
  'blocks.cards.items': {
    ar: 'بترتيب الشبكة، لكل بطاقة أيقونة وعنوان ونص. ثلاث في الصف على الحاسوب.',
    en: 'In grid order, each an icon, a title and a text. Three per row on a desktop.',
  },
  'blocks.cards.items.icon': {
    ar: 'أعلى البطاقة، من المجموعة الثابتة.',
    en: "At the card's top, from the fixed set.",
  },
  'blocks.cards.items.title': {
    ar: 'تحت الأيقونة؛ كلمتان إلى أربع.',
    en: 'Under the icon; two to four words.',
  },
  'blocks.cards.items.text': {
    ar: 'تحت العنوان: جملة أو جملتان.',
    en: 'Under the title: one or two sentences.',
  },
  'blocks.cards.items.art': {
    ar: 'مكان الأيقونة أعلى البطاقة. فارغة تعرض الأيقونة.',
    en: 'In place of the icon at the top of the card. Empty shows the icon.',
  },
  'blocks.steps.items': {
    ar: 'مرقّمة بترتيبها في صفحة «كيف تعمل»: أيقونة مجسّمة وعنوان ونص.',
    en: 'Numbered, in order, on the how-it-works page: a 3D icon, a title, a text.',
  },
  'blocks.steps.items.title': {
    ar: 'بجانب رقم الخطوة؛ كلمتان إلى أربع.',
    en: "Beside the step's number; two to four words.",
  },
  'blocks.steps.items.text': {
    ar: 'تحت عنوانها: جملة أو جملتان.',
    en: 'Under the title: one or two sentences.',
  },
  'blocks.steps.items.icon': {
    ar: 'من مكتبة الصور (icons-3d-*).',
    en: 'From the image library (icons-3d-*).',
  },
  'blocks.profitEquation.title': {
    ar: 'فوق شريط معادلة الربح في صفحة «كيف تعمل».',
    en: 'Above the profit-equation band on the how-it-works page.',
  },
  'blocks.profitEquation.sell': {
    ar: 'الحد الأول في المعادلة: «سعر البيع».',
    en: 'The first term of the equation: "Sell price".',
  },
  'blocks.profitEquation.base': {
    ar: 'الحد الثاني في المعادلة: «التكلفة الأساسية».',
    en: 'The second term: "Base cost".',
  },
  'blocks.profitEquation.profit': {
    ar: 'ناتج المعادلة بعد علامة يساوي: «ربحك».',
    en: 'The result, after the equals sign: "Your profit".',
  },
  'blocks.profitEquation.exampleLine': {
    ar: 'تحت المعادلة بأرقام حقيقية من الكتالوج: «تيشيرت بـ 89 ريالاً…».',
    en: 'Under the equation, with real catalogue numbers: "A tee at 89 SAR…".',
  },
  'blocks.compare.title': {
    ar: 'يعلو القسم؛ وفي الصفحة التي يفتحها هو عنوان الصفحة نفسه.',
    en: 'The section heading; on the page it opens, the page title itself.',
  },
  'blocks.compare.intro': {
    ar: 'قبل المقارنة: لمن هي ومتى قُرئت صفحات الطرف الآخر.',
    en: "Before the comparison: who it is for and when the other side's pages were read.",
  },
  'blocks.compare.ours': {
    ar: 'يعلو جانبنا من المقارنة: «بحر برنت».',
    en: 'Heads our side of the comparison: "B7R Print".',
  },
  'blocks.compare.theirs': {
    ar: 'اسم الطرف الآخر كما يعرفه القارئ: «Printful». بلا رابط: الموقع لا يربط إلى المنافسين.',
    en: 'The other side\'s name as a reader knows it: "Printful". No link: the site never links to a competitor.',
  },
  'blocks.compare.asOf': {
    ar: 'اليوم الذي قُرئت فيه صفحات الطرف الآخر؛ يظهر تحت المقارنة. بعد 180 يوماً تطلب الدرجة قراءة جديدة.',
    en: "The day the other side's pages were read; shown under the comparison. After 180 days the score asks for a fresh read.",
  },
  'blocks.compare.rows': {
    ar: 'بترتيبها: المعيار ثم ما عندنا وما عندهم. ثلاثة على الأقل؛ وكل ادعاء عن الطرف الآخر يمكن التحقق منه على صفحاته.',
    en: 'In order: the criterion, then ours and theirs. Three at least; every claim about the other side is one a reader can check on its pages.',
  },
  'blocks.compare.rows.criterion': {
    ar: 'ما تُقارَن عليه: «من أين يُشحن»، «الحد الأدنى للطلب».',
    en: 'What is compared: "ships from", "minimum order".',
  },
  'blocks.compare.rows.ours': {
    ar: 'لهذا المعيار، بالأرقام حيث أمكن: «جدة، حتى 5 أيام».',
    en: 'For this criterion, in numbers where possible: "Jeddah, up to 5 days".',
  },
  'blocks.compare.rows.theirs': {
    ar: 'لهذا المعيار، كما تقوله صفحاتهم بتاريخ القراءة.',
    en: 'For this criterion, as their pages say at the read date.',
  },
  'blocks.compare.bestFor': {
    ar: 'من يناسبه بحر برنت أكثر: بند لكل حالة، بالإيجاب.',
    en: 'Who B7R suits best: one item per case, in the affirmative.',
  },
  'blocks.compare.bestFor.text': {
    ar: 'حالة واحدة: «تاجر على سلة أو زد يريد التوصيل خلال أيام».',
    en: 'One case: "a Salla or Zid merchant who wants delivery in days".',
  },
  'blocks.compare.notBestFor': {
    ar: 'من لا يناسبه بحر برنت: ما يجعل الصفحة صادقة، والمساعدون يستشهدون بالصادق.',
    en: 'Who B7R does not suit: what makes the page honest, and the assistants cite the honest.',
  },
  'blocks.compare.notBestFor.text': {
    ar: 'حالة واحدة: «طلبيات كبيرة بمئات القطع».',
    en: 'One case: "large runs of hundreds of pieces".',
  },
  'blocks.compare.closing': {
    ar: 'قبل شريط الدعوة: الخلاصة في جملتين.',
    en: 'Before the bottom banner: the verdict in two sentences.',
  },
  'blocks.faqList.selection': {
    ar: 'أي الأسئلة تُعرض: كلها مجمّعة (صفحة الأسئلة)، أو أسئلة الرئيسية فقط.',
    en: 'Which questions show: all of them, grouped (the FAQ page), or the home ones only.',
  },
  'blocks.faqList.offset': {
    ar: 'كم سؤالاً يُتخطّى من البداية. فارغ أو 0: لا شيء.',
    en: 'How many questions to skip from the start. Empty or 0: none.',
  },
  'blocks.faqList.limit': {
    ar: 'أقصى عدد للأسئلة المعروضة. فارغ: الكل.',
    en: 'The most questions shown. Empty: all of them.',
  },
  'blocks.faqList.title': {
    ar: 'فوق القائمة. فارغ يعرض القائمة وحدها.',
    en: 'Above the list. Empty shows the list alone.',
  },
  'blocks.faqList.linkLabel': {
    ar: 'تحت القائمة، مثل «كل الأسئلة». فارغ يخفي الرابط.',
    en: 'Under the list, such as "All questions". Empty hides the link.',
  },
  'blocks.faqList.linkHref': {
    ar: 'ما يفتحه الرابط الذي تحت القائمة: /faq.',
    en: 'Where the link under the list goes: /faq.',
  },
  'blocks.faqList.bottomLine': {
    ar: 'تحت القائمة، وفيه كلمة واحدة تحمل رابطاً. فارغ يخفي الجملة.',
    en: 'Under the list, with one word carrying a link. Empty hides the sentence.',
  },
  'blocks.faqList.bottomLinkWord': {
    ar: 'تصبح الرابط في السطر الختامي؛ ويجب أن تظهر فيه حرفياً.',
    en: 'Becomes the link in the closing line; it must appear there exactly.',
  },
  'blocks.miskCredential.title': {
    ar: 'على بطاقة مسك في صفحة «من نحن».',
    en: 'On the Misk Launchpad card on the About page.',
  },
  'blocks.miskCredential.text': {
    ar: 'تحت العنوان: ما البرنامج وما يعنيه لبحر.',
    en: 'Under the title: what the programme is and what it means for B7R.',
  },
  'blocks.contact.whatsappTitle': {
    ar: 'أعلى البطاقة في صفحة التواصل.',
    en: 'At the top of the card on the contact page.',
  },
  'blocks.contact.whatsappText': {
    ar: 'تحت العنوان: متى نرد.',
    en: 'Under the title: when we answer.',
  },
  'blocks.contact.emailTitle': {
    ar: 'في صفحة التواصل؛ العنوان نفسه من إعدادات الموقع.',
    en: 'On the contact page; the address itself comes from Site settings.',
  },
  'blocks.contact.phoneTitle': {
    ar: 'في صفحة التواصل؛ الرقم نفسه من إعدادات الموقع.',
    en: 'On the contact page; the number itself comes from Site settings.',
  },
  'blocks.contact.followTitle': {
    ar: 'في صفحة التواصل؛ الروابط من إعدادات الموقع.',
    en: 'On the contact page; the links come from Site settings.',
  },
  'blocks.contact.booking': {
    ar: 'تفتح رابط الحجز من إعدادات الموقع، أو WhatsApp برسالة جاهزة إن كان فارغاً.',
    en: 'Opens the booking link from Site settings, or WhatsApp with a prefilled message when it is empty.',
  },
  'blocks.contact.booking.title': {
    ar: 'أعلى بطاقة الحجز في صفحة التواصل.',
    en: 'At the top of the booking card on the contact page.',
  },
  'blocks.contact.booking.text': {
    ar: 'تحت العنوان: المدة والمجانية.',
    en: 'Under the title: the length and that it is free.',
  },
  'blocks.contact.booking.button': {
    ar: 'في أسفل بطاقة الحجز.',
    en: 'At the bottom of the booking card.',
  },
  'blocks.contact.booking.whatsappMessage': {
    ar: 'ما يُفتح به WhatsApp عندما لا يوجد رابط حجز.',
    en: 'What WhatsApp opens with when there is no booking link.',
  },
  'blocks.legalBody.updatedAt': {
    ar: 'أعلى الصفحة القانونية، وتاريخ التعديل في بيانات البحث.',
    en: 'At the top of the legal page, and the modified date search engines read.',
  },
  'blocks.legalBody.body': {
    ar: 'عناوين ## تصبح فهرس الصفحة؛ لا HTML.',
    en: '## headings become the on-this-page list; no HTML.',
  },
  'blocks.mediaBanner.media': {
    ar: 'عريضة، بعرض الصفحة كلّه.',
    en: 'Wide, the full width of the page.',
  },
  'blocks.mediaBanner.caption': {
    ar: 'تحت الصورة. فارغ يخفيه.',
    en: 'Under the image. Empty hides it.',
  },
  seo: {
    ar: 'العنوان والوصف في نتيجة Google، والصورة عند مشاركة الرابط.',
    en: 'The title and description in the Google result, and the image when the link is shared.',
  },
  'seo.title': {
    ar: 'في نتيجة البحث وتبويب المتصفح؛ يُضاف إليه اسم الموقع من إعدادات البحث.',
    en: 'In the search result and the browser tab; the site name from Search defaults is appended.',
  },
  'seo.description': {
    ar: 'تحت العنوان في نتيجة البحث. جملة أو جملتان.',
    en: 'Under the title in the search result. One or two sentences.',
  },
  'seo.ogImage': {
    ar: 'تظهر عند مشاركة الرابط في WhatsApp وX. فارغة تستخدم صورة الموقع الافتراضية.',
    en: "Shown when the link is shared on WhatsApp and X. Empty uses the site's default.",
  },
};
