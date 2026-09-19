import type { Described } from '@/modules/cms/admin/descriptions/describe';

/** A rate: the label says input or output, the sentence says where it comes from. */
const RATE = {
  ar: 'من صفحة أسعار الخدمة؛ منه تُقدَّر تكلفة كل جولة. فارغ عند الحفظ: السعر المنشور.',
  en: "From the service's pricing page; every run's cost estimate follows from it. Empty on save: the published price.",
};

/** Connections: what each field does (ADR-046, ADR-047). */
export const CONNECTION_DESCRIPTIONS: Described = {
  label: {
    ar: 'كما تعرفه في القائمة وإعدادات المحرّك: «OpenAI، الإنتاج». لا يظهر للزائر.',
    en: 'As you recognise it in the list and the engine settings: "OpenAI, production". Never shown to a visitor.',
  },
  kind: {
    ar: 'ما يخصّه المفتاح. Search Console وBing وPageSpeed تقرؤها درجة الظهور لا المحرّك: اتصال واحد مفعّل لكل منها.',
    en: 'Which service the key belongs to. Search Console, Bing and PageSpeed are read by the visibility score, not the engine: one enabled each.',
  },
  apiKey: {
    ar: 'من لوحة الخدمة؛ ولـ Search Console ملف حساب الخدمة (JSON). لا يُعرض ثانية؛ اترك القناع للإبقاء عليه.',
    en: "From the service's console; for Search Console, the service account's JSON file. Never shown again; leave the mask to keep it.",
  },
  model: {
    ar: 'كما تكتبه وثائق الخدمة حرفياً: gpt-4.1-mini، claude-haiku-4-5، gemini-3-flash-preview. فارغ عند الحفظ: النموذج المعتاد الرخيص.',
    en: 'Exactly as the service docs write it: gpt-4.1-mini, claude-haiku-4-5, gemini-3-flash-preview. Empty on save: the usual cheap model.',
  },
  baseUrl: {
    ar: 'للخدمة المتوافقة، يبدأ بـ https:// وبلا مسار الدردشة: https://api.example.com/v1.',
    en: "The compatible service's address, https:// and without the chat path: https://api.example.com/v1.",
  },
  inputPerMillionUsd: RATE,
  outputPerMillionUsd: RATE,
  monthlyLimitUsd: {
    ar: 'تقديري من الأسعار؛ بعده لا تعمل جولة على هذا الاتصال حتى الشهر التالي. فارغ: بلا حد.',
    en: 'Estimated from the rates; past it nothing runs on this connection until next month. Empty: no limit.',
  },
  enabled: {
    ar: 'يرفض المحرّك عند الإيقاف كل جولة على هذا الاتصال ويقول ذلك في لوحة التحكم؛ الاختبار يبقى ممكناً.',
    en: 'Off refuses every engine run on this connection and says so on the dashboard; Test still works.',
  },
  spentThisMonthUsd: {
    ar: 'تقديري، من الجولات منذ أول الشهر (الرياض). الاختبار لا يُحسب.',
    en: 'Estimated, from the runs since the 1st (Riyadh). A Test never counts.',
  },
  callsThisMonth: {
    ar: 'كم جولة خدمها هذا الاتصال منذ أول الشهر (الرياض).',
    en: 'How many engine runs this connection served since the 1st (Riyadh).',
  },
  lastTestMessage: {
    ar: 'ما قالته الخدمة: معرّف النموذج عند النجاح، ورسالة الخطأ عند الفشل.',
    en: 'What the service said: the model id on success, its error on failure.',
  },
};
