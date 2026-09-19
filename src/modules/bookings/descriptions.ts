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
