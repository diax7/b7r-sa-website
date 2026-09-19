import type {
  CollectionAfterChangeHook,
  CollectionBeforeChangeHook,
  CollectionConfig,
  Field,
} from 'payload';
import { adminField, isAdmin, isEditorOrAdmin } from '@/modules/cms/access';
import { describeFields } from '@/modules/cms/admin/descriptions/describe';
import { collectionComponents } from '@/modules/cms/admin/document/config';
import { adminGroup } from '@/modules/cms/admin/icons';
import { inLanguage } from '@/modules/cms/fields/message';
import { STATUS_CELL } from '@/modules/cms/fields/status';
import { Refused } from '@/modules/cms/refused';
import { BOOKINGS_DESCRIPTIONS } from '@/modules/bookings/descriptions';
import { BOOKING_STATUS_LABELS, BOOKING_STATUSES, BOOKINGS } from '@/modules/bookings/status';

/** The reminder action above a booking (ADR-062), after the form's sentinel. */
const BOOKING_ACTIONS = '@/modules/bookings/admin/booking-actions#BookingActions';

const never = () => false;

/**
 * A cancelled booking stays cancelled (ADR-062): its event is gone from the calendar and
 * its slot is free again (the index no longer holds it), so a status put back to booked
 * would stand on nothing. The merchant books again from the site.
 */
export const staysCancelled: CollectionBeforeChangeHook = ({ data, originalDoc, req }) => {
  const next = data['status'];
  if (originalDoc?.['status'] === 'cancelled' && next !== undefined && next !== 'cancelled') {
    throw new Refused(
      inLanguage(req, {
        ar: 'الحجز الملغى يبقى ملغى؛ يحجز التاجر موعداً جديداً من الموقع',
        en: 'A cancelled booking stays cancelled; the merchant books a new time on the site',
      }),
    );
  }
  return data;
};

/**
 * A status set to cancelled by a person in the panel (a request with a user; the routes and
 * the sweep write with none) tells the merchant and deletes the event, as the merchant's own
 * cancel does. The mailer and the calendar are loaded on demand: the config must not pull
 * them (the CLI loads it under plain Node, where `server-only` throws).
 */
const cancelledByStaff: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  const cancelled = doc?.['status'] === 'cancelled' && previousDoc?.['status'] !== 'cancelled';
  if (operation !== 'update' || !cancelled || !req.user) return doc;
  const { cancelledInPanel } = await import('@/modules/bookings/panel-cancel');
  await cancelledInPanel(req.payload, doc['id'] as number);
  return doc;
};

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
    components: collectionComponents(BOOKINGS, { beforeDocumentControls: [BOOKING_ACTIONS] }),
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
  hooks: { beforeChange: [staysCancelled], afterChange: [cancelledByStaff] },
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
        // The badge and the dashboard card read today's and the next ones on every render.
        index: true,
        defaultValue: 'booked',
        options: BOOKING_STATUSES.map((value) => ({ value, label: BOOKING_STATUS_LABELS[value] })),
        label: { ar: 'الحالة', en: 'Status' },
        admin: { position: 'sidebar', components: { Cell: STATUS_CELL } },
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
      // Minted before the first Google insert and reused by a retry, so Google deduplicates
      // an insert that timed out on our side but reached it; the tests read it, nobody else.
      {
        name: 'meetRequestId',
        type: 'text',
        access: { update: never },
        admin: { hidden: true },
      },
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
