import type { Field, GlobalAfterChangeHook, GlobalConfig, PayloadRequest } from 'payload';
import { CLOCK_TIME } from '@/content/schema';
import { booking as seed } from '@/content/seed/booking';
import { bookingEn } from '@/content/seed/en/booking';
import { hiddenUnlessAdmin, isAdmin } from '@/modules/cms/access';
import { describeFields } from '@/modules/cms/admin/descriptions/describe';
import { globalComponents } from '@/modules/cms/admin/document/config';
import { adminGroup } from '@/modules/cms/admin/icons';
import { inLanguage } from '@/modules/cms/fields/message';
import { savedByField, stampSavedByGlobal } from '@/modules/cms/fields/saved-by';
import { safeRevalidatePath, shouldRevalidate, withEnglish } from '@/modules/cms/hooks/revalidate';
import { applyGlobalTranslations } from '@/modules/cms/hooks/translations';
import { BOOKING_DESCRIPTIONS } from '@/modules/bookings/descriptions';

export const BOOKING = 'booking' as const;

type Validation = { req: PayloadRequest; siblingData: Record<string, unknown> };

/** The two pages the settings render on, both languages, and the sitemap that lists `/book`. */
export const BOOKING_ROUTES = [...withEnglish(['/book', '/contact']), '/sitemap.xml'];

/** A save regenerates the booking page and the contact card at once, nothing else (ADR-062). */
const revalidateBooking: GlobalAfterChangeHook = ({ doc, req }) => {
  if (!shouldRevalidate(req)) return doc;
  for (const path of BOOKING_ROUTES) safeRevalidatePath(path);
  return doc;
};

/** The weekdays as Payload's select offers them, 0 being Sunday. */
export const WEEKDAY_OPTIONS = [
  { value: '0', label: { ar: 'الأحد', en: 'Sunday' } },
  { value: '1', label: { ar: 'الاثنين', en: 'Monday' } },
  { value: '2', label: { ar: 'الثلاثاء', en: 'Tuesday' } },
  { value: '3', label: { ar: 'الأربعاء', en: 'Wednesday' } },
  { value: '4', label: { ar: 'الخميس', en: 'Thursday' } },
  { value: '5', label: { ar: 'الجمعة', en: 'Friday' } },
  { value: '6', label: { ar: 'السبت', en: 'Saturday' } },
] as const;

const NOT_A_TIME = { ar: 'بصيغة 10:00 على مدار 24 ساعة', en: 'As 10:00 on a 24-hour clock' };

const isClockTime = (value: unknown): value is string =>
  typeof value === 'string' && CLOCK_TIME.test(value);

/** A required whole number with its range; the sentence comes from the map. */
function minutes(
  name: string,
  label: { ar: string; en: string },
  defaultValue: number,
  range: { min: number; max: number },
): Field {
  return {
    name,
    type: 'number',
    required: true,
    defaultValue,
    label,
    min: range.min,
    max: range.max,
    admin: { step: 1 },
  };
}

/**
 * The booking settings (BRD 11.2 as rewritten by ADR-062): a place on the site with its own
 * switch and its own revalidation, admin only like the site settings. The slot arithmetic in
 * `slots.ts` reads it through `getBooking()`; the seed's numbers are the defaults, so a
 * database that has never saved it reads the same values. The booker's event pane (ADR-063)
 * reads the host from the author record the `host` relationship names (the one place the
 * name, the role and the photo are kept) and the `blurb` under the consultation's name.
 */
export const Booking: GlobalConfig = {
  slug: BOOKING,
  label: { ar: 'الحجز', en: 'Booking' },
  admin: {
    hideAPIURL: true,
    components: globalComponents(BOOKING),
    group: adminGroup('site'),
    custom: {
      shows: {
        ar: 'صفحة الحجز /book وبطاقة الحجز في صفحة التواصل',
        en: 'the booking page /book and the booking card on the contact page',
      },
    },
    hidden: hiddenUnlessAdmin,
    description: {
      ar: 'حجز الاستشارة المجانية: المدة، الساعات، الأيام المغلقة، وتقويم Google الذي تُسجَّل فيه المواعيد.',
      en: 'The free consultation booking: its length, the hours, the closed days, and the Google calendar the appointments land in.',
    },
  },
  access: { read: isAdmin, update: isAdmin },
  hooks: {
    beforeChange: [stampSavedByGlobal],
    afterChange: [revalidateBooking, applyGlobalTranslations],
  },
  fields: describeFields(
    [
      {
        name: 'title',
        type: 'text',
        required: true,
        localized: true,
        defaultValue: ({ locale }) => (locale === 'en' ? bookingEn.title : seed.title),
        label: { ar: 'اسم الاستشارة', en: 'Consultation name' },
      },
      {
        name: 'blurb',
        type: 'text',
        localized: true,
        maxLength: 80,
        defaultValue: ({ locale }) => (locale === 'en' ? bookingEn.blurb : seed.blurb),
        label: { ar: 'سطر تعريفي', en: 'Blurb' },
      },
      {
        name: 'host',
        type: 'relationship',
        relationTo: 'authors',
        label: { ar: 'مقدّم الاستشارة', en: 'Host' },
      },
      {
        type: 'row',
        fields: [
          minutes(
            'durationMinutes',
            { ar: 'المدة (دقائق)', en: 'Length (minutes)' },
            seed.durationMinutes,
            { min: 10, max: 240 },
          ),
          minutes(
            'bufferMinutes',
            { ar: 'الفاصل بين موعدين (دقائق)', en: 'Gap between two (minutes)' },
            seed.bufferMinutes,
            { min: 0, max: 120 },
          ),
          minutes(
            'noticeHours',
            { ar: 'أقل مهلة قبل الموعد (ساعات)', en: 'Minimum notice (hours)' },
            seed.noticeHours,
            { min: 0, max: 336 },
          ),
        ],
      },
      {
        type: 'row',
        fields: [
          minutes(
            'horizonDays',
            { ar: 'المدى المتاح للحجز (أيام)', en: 'Booking window (days)' },
            seed.horizonDays,
            { min: 1, max: 90 },
          ),
          minutes(
            'maxPerDay',
            { ar: 'الحد اليومي للمواعيد', en: 'Appointments per day' },
            seed.maxPerDay,
            { min: 1, max: 24 },
          ),
        ],
      },
      {
        name: 'hours',
        type: 'array',
        label: { ar: 'ساعات العمل الأسبوعية', en: 'Weekly hours' },
        labels: {
          singular: { ar: 'يوم', en: 'Day' },
          plural: { ar: 'الأيام', en: 'Days' },
        },
        defaultValue: seed.hours.map((row) => ({ ...row, day: String(row.day) })),
        fields: [
          {
            type: 'row',
            fields: [
              {
                name: 'day',
                type: 'select',
                required: true,
                options: [...WEEKDAY_OPTIONS],
                label: { ar: 'اليوم', en: 'Day' },
              },
              {
                name: 'from',
                type: 'text',
                required: true,
                label: { ar: 'من', en: 'From' },
                validate: (value: unknown, { req }: Validation) =>
                  isClockTime(value) ? true : inLanguage(req, NOT_A_TIME),
              },
              {
                name: 'to',
                type: 'text',
                required: true,
                label: { ar: 'إلى', en: 'To' },
                validate: (value: unknown, { req, siblingData }: Validation) => {
                  if (!isClockTime(value)) return inLanguage(req, NOT_A_TIME);
                  const from = siblingData['from'];
                  return !isClockTime(from) || value > from
                    ? true
                    : inLanguage(req, { ar: 'بعد وقت البداية', en: 'After the start time' });
                },
              },
            ],
          },
        ],
      },
      {
        name: 'closedDates',
        type: 'array',
        label: { ar: 'الأيام المغلقة', en: 'Closed dates' },
        labels: {
          singular: { ar: 'يوم مغلق', en: 'Closed date' },
          plural: { ar: 'الأيام المغلقة', en: 'Closed dates' },
        },
        fields: [
          {
            type: 'row',
            fields: [
              {
                name: 'date',
                type: 'date',
                required: true,
                label: { ar: 'التاريخ', en: 'Date' },
                admin: { date: { pickerAppearance: 'dayOnly' } },
                hooks: {
                  // The admin's day picker stores noon UTC; a REST write may not. Pinned to
                  // noon so the day that closes is the day that was picked in any zone.
                  beforeChange: [
                    ({ value }) =>
                      typeof value === 'string' ? `${value.slice(0, 10)}T12:00:00.000Z` : value,
                  ],
                },
              },
              {
                name: 'reason',
                type: 'text',
                required: true,
                localized: true,
                label: { ar: 'السبب', en: 'Reason' },
              },
            ],
          },
        ],
      },
      {
        name: 'hostEmail',
        type: 'email',
        label: { ar: 'بريد صاحب التقويم', en: 'Calendar owner e-mail' },
      },
      {
        name: 'enabled',
        type: 'checkbox',
        defaultValue: false,
        label: { ar: 'الحجز مفتوح', en: 'Booking open' },
        admin: {
          position: 'sidebar',
          components: { Field: '@/modules/cms/admin/fields/enabled-switch#EnabledSwitch' },
        },
      },
      savedByField,
    ],
    BOOKING_DESCRIPTIONS,
  ),
};
