import type { CollectionConfig, Field } from 'payload';
import { adminField, isAdmin, isEditorOrAdmin } from '@/modules/cms/access';
import { describeFields } from '@/modules/cms/admin/descriptions/describe';
import { collectionComponents } from '@/modules/cms/admin/document/config';
import { adminGroup } from '@/modules/cms/admin/icons';
import { BOOKINGS_DESCRIPTIONS } from '@/modules/bookings/descriptions';

export const BOOKINGS = 'bookings' as const;

export const BOOKING_STATUSES = ['booked', 'rescheduled', 'cancelled', 'completed'] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

/** The statuses that hold their slot: everything but a cancellation. */
export const ACTIVE_STATUSES: readonly BookingStatus[] = ['booked', 'rescheduled', 'completed'];

export const CALENDAR_STATES = ['synced', 'failed', 'off'] as const;
export type CalendarState = (typeof CALENDAR_STATES)[number];

/** How many times the sweep asks Google again for a failed event before it stays failed. */
export const CALENDAR_RETRIES = 3;

const never = () => false;

/** A fact the routes and the sweep write, shown as a line, never edited in the panel. */
function fact(field: Field & { name: string }, sidebar = false): Field {
  return {
    ...field,
    access: { update: never },
    admin: { ...field.admin, readOnly: true, ...(sidebar ? { position: 'sidebar' } : {}) },
  } as Field;
}

/**
 * The consultations merchants booked (ADR-062): one row per booking, written by the booking
 * routes and the sweep through the local API (the API creates nothing), read and followed by
 * admins and editors. The merchant's own fields are an admin's to correct; an editor changes
 * the status and the notes only (the field rule refuses the rest). Nothing is deleted by a
 * job: an admin deletes. The slot itself is guarded twice, by the grid rule in the route and
 * by the partial unique index on `start` where the status is not cancelled (a raw-SQL
 * migration), so a double booking is a database refusal, never a race.
 */
export const Bookings: CollectionConfig = {
  slug: BOOKINGS,
  labels: {
    singular: { ar: 'حجز', en: 'Booking' },
    plural: { ar: 'الحجوزات', en: 'Bookings' },
  },
  admin: {
    hideAPIURL: true,
    useAsTitle: 'name',
    defaultColumns: ['name', 'start', 'status'],
    listSearchableFields: ['name', 'email', 'phone'],
    group: adminGroup('site'),
    components: collectionComponents(BOOKINGS),
    custom: {
      shows: {
        ar: 'لا يظهر في الموقع: الاستشارات التي حجزها التجار',
        en: 'nowhere on the site: the consultations merchants booked',
      },
    },
    description: {
      ar: 'استشارة حُجزت من الموقع: من ومتى ورابط Meet. الحالة والملاحظات لك؛ التغيير والإلغاء يمرّان برابط التاجر.',
      en: "A consultation booked on the site: who, when, the Meet link. The status and the notes are yours; a move or a cancel is the merchant's.",
    },
  },
  defaultSort: '-start',
  access: { read: isEditorOrAdmin, create: never, update: isEditorOrAdmin, delete: isAdmin },
  fields: describeFields(
    [
      {
        name: 'name',
        type: 'text',
        required: true,
        access: { update: adminField },
        label: { ar: 'الاسم', en: 'Name' },
      },
      {
        type: 'row',
        fields: [
          {
            name: 'email',
            type: 'email',
            required: true,
            access: { update: adminField },
            label: { ar: 'البريد الإلكتروني', en: 'E-mail' },
          },
          {
            name: 'phone',
            type: 'text',
            required: true,
            access: { update: adminField },
            label: { ar: 'رقم الجوال', en: 'Phone' },
          },
        ],
      },
      {
        type: 'row',
        fields: [
          fact({
            name: 'start',
            type: 'date',
            required: true,
            index: true,
            label: { ar: 'الموعد', en: 'Starts' },
            admin: { date: { pickerAppearance: 'dayAndTime' } },
          }),
          fact({
            name: 'end',
            type: 'date',
            required: true,
            label: { ar: 'ينتهي', en: 'Ends' },
            admin: { date: { pickerAppearance: 'dayAndTime' } },
          }),
          fact({
            name: 'locale',
            type: 'select',
            required: true,
            defaultValue: 'ar',
            options: [
              { value: 'ar', label: { ar: 'العربية', en: 'Arabic' } },
              { value: 'en', label: { ar: 'الإنجليزية', en: 'English' } },
            ],
            label: { ar: 'لغة التاجر', en: "Merchant's language" },
          }),
        ],
      },
      {
        name: 'status',
        type: 'select',
        required: true,
        defaultValue: 'booked',
        options: [
          { value: 'booked', label: { ar: 'محجوز', en: 'Booked' } },
          { value: 'rescheduled', label: { ar: 'مُعاد جدولته', en: 'Rescheduled' } },
          { value: 'cancelled', label: { ar: 'ملغى', en: 'Cancelled' } },
          { value: 'completed', label: { ar: 'مكتمل', en: 'Completed' } },
        ],
        label: { ar: 'الحالة', en: 'Status' },
      },
      {
        name: 'notes',
        type: 'textarea',
        label: { ar: 'ملاحظات', en: 'Notes' },
      },
      fact(
        {
          name: 'meetLink',
          type: 'text',
          label: { ar: 'رابط Meet', en: 'Meet link' },
        },
        true,
      ),
      fact(
        {
          name: 'calendar',
          type: 'select',
          required: true,
          defaultValue: 'off',
          options: [
            { value: 'synced', label: { ar: 'مُسجَّل', en: 'On the calendar' } },
            { value: 'failed', label: { ar: 'متعثّر', en: 'Failed' } },
            { value: 'off', label: { ar: 'بلا تقويم', en: 'No calendar' } },
          ],
          label: { ar: 'التقويم', en: 'Calendar' },
        },
        true,
      ),
      fact(
        {
          name: 'googleEventId',
          type: 'text',
          label: { ar: 'معرّف الحدث في Google', en: 'Google event id' },
          admin: { condition: (data) => Boolean(data?.['googleEventId']) },
        },
        true,
      ),
      fact(
        {
          name: 'calendarAttempts',
          type: 'number',
          required: true,
          defaultValue: 0,
          label: { ar: 'محاولات التسجيل', en: 'Calendar retries' },
          admin: { condition: (data) => data?.['calendar'] === 'failed' },
        },
        true,
      ),
      fact(
        {
          name: 'calendarAttemptAt',
          type: 'date',
          label: { ar: 'آخر محاولة', en: 'Last retry' },
          admin: {
            date: { pickerAppearance: 'dayAndTime' },
            condition: (data) => data?.['calendar'] === 'failed',
          },
        },
        true,
      ),
      fact(
        {
          name: 'reminded24h',
          type: 'checkbox',
          defaultValue: false,
          label: { ar: 'تذكير 24 ساعة', en: '24-hour reminder' },
        },
        true,
      ),
      fact(
        {
          name: 'reminded1h',
          type: 'checkbox',
          defaultValue: false,
          label: { ar: 'تذكير ساعة', en: '1-hour reminder' },
        },
        true,
      ),
      fact({
        name: 'page',
        type: 'text',
        label: { ar: 'الصفحة', en: 'Page' },
      }),
      {
        name: 'utm',
        type: 'group',
        label: { ar: 'مصدر الزيارة', en: 'Traffic source' },
        admin: { condition: (data) => Boolean(data?.['utm']?.['source']) },
        fields: [
          {
            type: 'row',
            fields: [
              fact({ name: 'source', type: 'text', label: { ar: 'المصدر', en: 'Source' } }),
              fact({ name: 'medium', type: 'text', label: { ar: 'الوسيط', en: 'Medium' } }),
              fact({ name: 'campaign', type: 'text', label: { ar: 'الحملة', en: 'Campaign' } }),
            ],
          },
        ],
      },
    ],
    BOOKINGS_DESCRIPTIONS,
  ),
};
