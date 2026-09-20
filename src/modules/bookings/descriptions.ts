import type { Described } from '@/modules/cms/admin/descriptions/describe';

/** The booking settings, field by field (ADR-046, ADR-062): what each does on the site. */
export const BOOKING_DESCRIPTIONS: Described = {
  enabled: {
    ar: 'يفتح صفحة الحجز وبطاقة التواصل عند التفعيل؛ عند الإيقاف تفتح البطاقة WhatsApp بالرسالة الجاهزة.',
    en: 'On opens the booking page and the contact card picker; off sends the contact card to WhatsApp with the prefilled message.',
  },
  title: {
    ar: 'يظهر عنواناً في صفحة الحجز وفي بريد التأكيد: «استشارة مجانية، 30 دقيقة».',
    en: 'The heading of the booking page and the subject of the confirmation e-mail: "Free consultation, 30 minutes".',
  },
  blurb: {
    ar: 'يظهر تحت اسم الاستشارة في بطاقة الحجز: «نجاوب على أسئلتك ونساعدك تبدأ». كلمات قليلة.',
    en: 'One line under the consultation name on the booking card: "We answer your questions and help you start". A few words.',
  },
  host: {
    ar: 'من يقابله التاجر: اسمه وصفته وصورته تُقرأ من سجلّه في الكتّاب وتظهر في بطاقة الحجز.',
    en: 'Who the merchant meets: the name, the role and the photo come from their author record and show on the booking card.',
  },
  durationMinutes: {
    ar: 'تحدّد طول كل موعد وموضع المواعيد في اليوم: 30 دقيقة.',
    en: 'How long each appointment lasts and where the slots fall in the day: 30.',
  },
  bufferMinutes: {
    ar: 'يُترك فارغاً بعد كل موعد قبل التالي، ويُحسب في شبكة المواعيد: 10 دقائق.',
    en: 'Left free after each appointment before the next one, and counted in the slot grid: 10.',
  },
  noticeHours: {
    ar: 'يخفي المواعيد الأقرب من هذه المهلة عن الزائر؛ تغيير الموعد يخضع لها أيضاً: 24 ساعة.',
    en: 'Hides the slots closer than this from a visitor; a reschedule obeys it too: 24.',
  },
  horizonDays: {
    ar: 'يعرض الأيام من اليوم حتى هذا العدد، ولا يقبل تاريخاً بعده: 30 يوماً.',
    en: 'Shows the days from today up to this many, and refuses a date beyond them: 30.',
  },
  maxPerDay: {
    ar: 'يوقف حجز اليوم عند بلوغ هذا العدد، ولو بقيت ساعات فارغة: 4.',
    en: 'Closes the day once this many are booked, even with free hours to spare: 4.',
  },
  hours: {
    ar: 'تحدّد الأيام والساعات التي يُعرض فيها موعد، بتوقيت الرياض؛ يوم بلا صف يبقى مغلقاً.',
    en: 'The days and the hours a slot is offered on, in Riyadh time; a day without a row stays closed.',
  },
  'hours.day': {
    ar: 'ينطبق الصف على يوم الأسبوع المختار؛ صفّان لليوم نفسه يُجمعان.',
    en: 'The weekday the row applies to; two rows for one day both count.',
  },
  'hours.from': {
    ar: 'أول موعد في اليوم بتوقيت الرياض، بصيغة 10:00.',
    en: 'The first slot of the day in Riyadh time, as 10:00.',
  },
  'hours.to': {
    ar: 'آخر وقت ينتهي فيه موعد، بتوقيت الرياض، بصيغة 18:00.',
    en: 'The time the last slot must end by, in Riyadh time, as 18:00.',
  },
  closedDates: {
    ar: 'تُغلق أياماً بعينها كعطلة العيد؛ يقرأ الزائر السبب على اليوم المعطّل في صفحة الحجز.',
    en: 'Closes single days, an Eid holiday for one; a visitor reads the reason on the greyed day of the booking page.',
  },
  'closedDates.date': {
    ar: 'اليوم المغلق بتوقيت الرياض.',
    en: 'The day that stays closed, in Riyadh.',
  },
  'closedDates.reason': {
    ar: 'يظهر على اليوم المعطّل في صفحة الحجز: «عطلة عيد الأضحى». كلمتان إلى خمس.',
    en: 'Shown on the greyed day of the booking page: "Eid al-Adha holiday". Two to five words.',
  },
  hostEmail: {
    ar: 'حساب Google Workspace على b7r.sa الذي يُقرأ تقويمه وتُسجَّل فيه المواعيد مع رابط Meet.',
    en: 'The Google Workspace account on b7r.sa whose calendar is read and takes the appointments with their Meet link.',
  },
};

/** A booking row, field by field: what each is for the person following it up. */
export const BOOKINGS_DESCRIPTIONS: Described = {
  name: {
    ar: 'كما كتبه التاجر في صفحة الحجز؛ يظهر في القائمة وفي عنوان الحدث في التقويم.',
    en: "As the merchant typed it on the booking page; the list's title and the calendar event's name.",
  },
  email: {
    ar: 'يستقبل التأكيد والتذكيرين ورابط التغيير أو الإلغاء؛ ويُدعى به إلى حدث Meet.',
    en: 'Receives the confirmation, the two reminders and the change-or-cancel link; invited to the Meet event by it.',
  },
  phone: {
    ar: 'يفتح زر «ذكّر على WhatsApp» محادثة على هذا الرقم برسالة جاهزة بلغة التاجر.',
    en: 'The "Remind on WhatsApp" button opens a chat to this number with a prefilled message in their language.',
  },
  start: {
    ar: 'يُعرض بتوقيت الرياض؛ يغيّره التاجر من رابطه لا من هنا، ليتبعه حدث التقويم.',
    en: 'Shown in Riyadh time; the merchant moves it from their link, never here, so the calendar event follows.',
  },
  end: {
    ar: 'يُحسب من الموعد ومدة الاستشارة في إعدادات الحجز.',
    en: 'Computed from the start and the length in the booking settings.',
  },
  locale: {
    ar: 'تُرسل بها رسائل البريد ورسالة WhatsApp الجاهزة؛ لغة الصفحة التي حجز منها.',
    en: 'The e-mails and the prefilled WhatsApp message go out in it; the language of the page they booked from.',
  },
  status: {
    ar: 'محجوز عند الحجز، مُعاد جدولته بعد تغيير، ملغى بعد إلغاء، مكتمل تلقائياً بعد انتهاء الموعد.',
    en: 'Booked on booking, Rescheduled after a change, Cancelled after a cancel, Completed on its own once the time has passed.',
  },
  notes: {
    ar: 'لك ولزملائك: ما اتُّفق عليه وما يلزم متابعته. لا يقرؤها التاجر.',
    en: 'For you and your colleagues: what was agreed and what to follow up. The merchant never reads them.',
  },
  meetLink: {
    ar: 'يُنشئه Google مع الحدث ويصل التاجر في بريد التأكيد؛ فارغ حين يتعثّر التقويم.',
    en: 'Created by Google with the event and sent to the merchant in the confirmation; empty while the calendar fails.',
  },
  calendar: {
    ar: 'مُسجَّل حين قُيّد الحدث؛ متعثّر حين رفض Google فتُعاد المحاولة ثلاث مرات بفاصل ساعة؛ بلا تقويم حين لا اتصال.',
    en: 'On the calendar once the event exists; Failed when Google refused (three retries, an hour apart); No calendar without a connection.',
  },
  googleEventId: {
    ar: 'يربط الحجز بحدثه في تقويم صاحب التقويم، للتغيير والإلغاء.',
    en: "Ties the booking to its event on the owner's calendar, for a move and a delete.",
  },
  calendarAttempts: {
    ar: 'كم مرة أعاد المسح طلب الحدث من Google بعد رفضه؛ يتوقف عند 3.',
    en: 'How many times the sweep asked Google again after a refusal; it stops at 3.',
  },
  calendarAttemptAt: {
    ar: 'متى أعاد المسح المحاولة آخر مرة؛ التالية بعد ساعة.',
    en: 'When the sweep last tried again; the next is an hour later.',
  },
  reminded24h: {
    ar: 'يُعلَّم بعد خروج بريد التذكير قبل يوم إلى التاجر وإليك، فلا يُرسل مرتين.',
    en: 'Set once the day-before reminder left, to the merchant and to you, so it never goes twice.',
  },
  reminded1h: {
    ar: 'يُعلَّم بعد خروج بريد التذكير قبل ساعة، فلا يُرسل مرتين.',
    en: 'Set once the hour-before reminder left, so it never goes twice.',
  },
  page: {
    ar: 'المسار الذي حُجز منه: /book أو /contact، وبالإنجليزية تحت /en.',
    en: 'The path the booking was made from: /book or /contact, under /en in English.',
  },
  utm: {
    ar: 'تظهر حين وصل التاجر برابط حملة (utm): المصدر والوسيط والحملة كما كُتبت فيه.',
    en: 'Shown when the merchant arrived by a campaign link (utm): the source, the medium and the campaign as written in it.',
  },
};
