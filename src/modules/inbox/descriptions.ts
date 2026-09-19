import type { Described } from '@/modules/cms/admin/descriptions/describe';

/**
 * A message of the inbox: what each field is (ADR-061). The sender's fields are read-only
 * (the record is what the form sent), so those explain; the status and the notes guide.
 */
export const MESSAGE_DESCRIPTIONS: Described = {
  name: {
    ar: 'كما كتبه المرسل في النموذج؛ عنوان الصف في القائمة.',
    en: "As the sender typed it in the form; the row's title in the list.",
  },
  phone: {
    ar: 'يُقرأ الجوال السعودي بصيغة 9665…؛ يفتحه زر الرد على WhatsApp.',
    en: 'A Saudi mobile reads as 9665…; the "Reply on WhatsApp" button opens it.',
  },
  email: {
    ar: 'يذهب إليه الرد بالبريد؛ ويحمله بريد التنبيه عنواناً للرد.',
    en: 'Where "Reply by e-mail" writes to; the notification e-mail carries it as its reply address.',
  },
  inquiry: {
    ar: 'ما اختاره المرسل في النموذج: تاجر، شراكة، استثمار أو أخرى.',
    en: 'What the sender picked on the form: merchant, partnership, investment or other.',
  },
  locale: {
    ar: 'العربية أو الإنجليزية بحسب صفحة الإرسال؛ تتبعها تحية الرد على WhatsApp.',
    en: 'Arabic or English, by the page the sender wrote on; the WhatsApp greeting follows it.',
  },
  message: {
    ar: 'النص كما أُرسل، حتى 4000 حرف؛ لا يعدّله أحد.',
    en: 'The text as it was sent, up to 4000 characters; nobody rewrites it.',
  },
  status: {
    ar: 'جديد حتى يفتحه أحد، قيد المتابعة ما دام الرد معلقاً، معالَج عند الانتهاء؛ يعدّ الشريط الجانبي الجديد منها.',
    en: 'New until someone opens it, Following while a reply is pending, Handled when done; the sidebar counts the new ones.',
  },
  notes: {
    ar: 'للفريق فقط؛ لا يراها المرسل.',
    en: 'For the team only; the sender never sees them.',
  },
  emailed: {
    ar: 'نعم عندما خرج بريد التنبيه؛ لا تعني أن الرسالة هنا فقط: ردّ من الوارد.',
    en: 'Yes when the notification e-mail went out; No means the message is only here: reply from the inbox.',
  },
  page: {
    ar: 'مسار الصفحة التي أُرسل منها النموذج: /contact أو /en/contact.',
    en: 'The path the form was on: /contact or /en/contact.',
  },
  utm: {
    ar: 'تأتي من الرابط الذي وصل به المرسل، عندما يحمل العنوان معاملات UTM.',
    en: 'From the link the sender arrived by, when its address carried the UTM parameters.',
  },
  'utm.source': {
    ar: 'ما قاله utm_source في الرابط: instagram أو google أو نشرة.',
    en: 'What utm_source said on the link: instagram, google, a newsletter.',
  },
  'utm.medium': {
    ar: 'ما قاله utm_medium في الرابط: social أو cpc أو email.',
    en: 'What utm_medium said on the link: social, cpc, email.',
  },
  'utm.campaign': {
    ar: 'ما قاله utm_campaign في الرابط: اسم الحملة.',
    en: "What utm_campaign said on the link: the campaign's name.",
  },
};
