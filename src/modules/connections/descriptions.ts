import type { Described } from '@/modules/cms/admin/descriptions/describe';

/** Connections: what each field does (ADR-046, ADR-047). */
export const CONNECTION_DESCRIPTIONS: Described = {
  label: {
    ar: 'اسم تعرفه أنت في القائمة وفي إعدادات المحرّك: «OpenAI، الإنتاج». لا يظهر للزائر.',
    en: 'A name you recognise in the list and in the engine settings: "OpenAI, production". Never shown to a visitor.',
  },
  kind: {
    ar: 'الخدمة التي يُرسل إليها المفتاح. «خدمة متوافقة مع OpenAI» لأي خدمة أخرى تقدّم واجهة OpenAI على عنوانها؛ «تجريبي» للاختبارات فقط.',
    en: 'The service the key is sent to. "OpenAI-compatible endpoint" fits any other AI that serves the OpenAI API at its own address; "Mock" is for tests only.',
  },
  model: {
    ar: 'معرّف النموذج كما تكتبه وثائق الخدمة حرفياً: gpt-4.1، claude-sonnet-4-5، gemini-2.5-pro، deepseek-chat. فارغ عند الحفظ: النموذج المعتاد للخدمة.',
    en: 'The model id exactly as the service docs write it: gpt-4.1, claude-sonnet-4-5, gemini-2.5-pro, deepseek-chat. Empty on save: the usual model of the service.',
  },
  baseUrl: {
    ar: 'عنوان الخدمة المتوافقة، بـ https:// وبلا مسار الدردشة: https://api.example.com/v1.',
    en: 'The compatible service’s address, https:// and without the chat path: https://api.example.com/v1.',
  },
  inputPerMillionUsd: {
    ar: 'سعر مليون رمز إدخال بالدولار من صفحة أسعار الخدمة؛ منه تُقدَّر تكلفة كل تشغيل والحدّ الشهري. فارغ عند الحفظ: السعر المنشور للخدمة.',
    en: "The service's price per million input tokens in USD, from its pricing page; each run's cost estimate and the monthly limit follow from it. Empty on save: the service's published price.",
  },
  outputPerMillionUsd: {
    ar: 'سعر مليون رمز إخراج بالدولار من صفحة أسعار الخدمة؛ منه تُقدَّر تكلفة كل تشغيل والحدّ الشهري. فارغ عند الحفظ: السعر المنشور للخدمة.',
    en: "The service's price per million output tokens in USD, from its pricing page; each run's cost estimate and the monthly limit follow from it. Empty on save: the service's published price.",
  },
  monthlyLimitUsd: {
    ar: 'أقصى إنفاق تقديري بالدولار في الشهر (من أول الشهر بتوقيت الرياض) على هذا الاتصال؛ بعده يرفض المحرّك التشغيل حتى الشهر التالي. فارغ: بلا حدّ. سقف اليوم في إعدادات المحرّك.',
    en: 'The most this connection may cost in a month (from the 1st, Riyadh time), estimated; past it the engine refuses to run on it until next month. Empty: no limit. The daily cap lives in the engine settings.',
  },
  enabled: {
    ar: 'عند الإيقاف يرفض المحرّك كل تشغيل على هذا الاتصال ويقول ذلك في لوحة التحكم؛ الاختبار يبقى ممكناً.',
    en: 'Off refuses every engine run on this connection and says so on the dashboard; Test still works.',
  },
  spentThisMonthUsd: {
    ar: 'مجموع التكلفة التقديرية لتشغيلات هذا الاتصال منذ أول الشهر (الرياض)، من سجل التشغيلات. الاختبار لا يُحسب.',
    en: "The estimated cost of this connection's runs since the 1st (Riyadh), from the runs log. A Test never counts.",
  },
  callsThisMonth: {
    ar: 'عدد تشغيلات المحرّك على هذا الاتصال منذ أول الشهر (الرياض)، من سجل التشغيلات.',
    en: 'How many engine runs this connection served since the 1st (Riyadh), from the runs log.',
  },
  lastTestMessage: {
    ar: 'ما قالته الخدمة في آخر اختبار: معرّف النموذج عند النجاح، ورسالة الخطأ عند الفشل.',
    en: 'What the service said at the last test: the model id on success, its error on failure.',
  },
};
