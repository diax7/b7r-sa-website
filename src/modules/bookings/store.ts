import { type Payload, ValidationError, type Where } from 'payload';
import type { BookingSettings } from '@/content/schema';
import type { Locale } from '@/lib/i18n';
import { publicRead } from '@/lib/cms/read';
import { BOOKINGS, type BookingStatus, type CalendarState } from '@/modules/bookings/status';
import { BOOKING } from '@/modules/bookings/global';
import { toBookingSettings } from '@/modules/bookings/settings';
import type { Interval } from '@/modules/bookings/slots';
import type { Booking as BookingDoc } from '@/payload-types';

/** A booking as the service reads it: the row with its dates as instants. */
export interface BookingRow {
  id: number;
  name: string;
  email: string;
  phone: string;
  locale: Locale;
  start: Date;
  end: Date;
  status: BookingStatus;
  meetLink: string | null;
  googleEventId: string | null;
  /** The Meet `createRequest` id, minted before the first insert and reused by a retry. */
  meetRequestId: string | null;
  calendar: CalendarState;
  calendarAttempts: number;
  calendarAttemptAt: Date | null;
  reminded24h: boolean;
  reminded1h: boolean;
  page: string;
  notes: string;
  createdAt: Date;
}

export interface NewBooking {
  name: string;
  email: string;
  phone: string;
  locale: Locale;
  start: Date;
  end: Date;
  calendar: CalendarState;
  meetRequestId: string;
  page: string;
  utm: { source?: string; medium?: string; campaign?: string };
  notes: string;
}

export type BookingPatch = Partial<{
  start: Date;
  end: Date;
  status: BookingStatus;
  meetLink: string | null;
  googleEventId: string | null;
  meetRequestId: string;
  calendar: CalendarState;
  calendarAttempts: number;
  calendarAttemptAt: Date | null;
  reminded24h: boolean;
  reminded1h: boolean;
}>;

/** Thrown by a write the partial unique index refused: another booking holds the start. */
export class SlotTaken extends Error {
  override name = 'SlotTaken';
}

/**
 * What the service asks of the rows and the settings (ADR-062): the port the Payload store
 * implements and the tests replace with a map. Every read and write runs with access
 * overridden: the routes are the only writers and have checked what they must.
 */
export interface BookingStore {
  settings(locale: Locale): Promise<BookingSettings>;
  /** The active bookings (any status but cancelled) that start in `[from, to)`. */
  activeBetween(from: Date, to: Date): Promise<BookingRow[]>;
  byId(id: number): Promise<BookingRow | null>;
  create(data: NewBooking): Promise<BookingRow>;
  update(id: number, patch: BookingPatch): Promise<BookingRow>;
  /** The rows a sweep window names, oldest start first. */
  find(where: Where, limit?: number): Promise<BookingRow[]>;
}

/** The interval a row occupies, for the slot arithmetic. */
export const intervalOf = (row: BookingRow): Interval => ({ start: row.start, end: row.end });

export function toBookingRow(doc: BookingDoc): BookingRow {
  return {
    id: doc.id,
    name: doc.name,
    email: doc.email,
    phone: doc.phone,
    locale: doc.locale === 'en' ? 'en' : 'ar',
    start: new Date(doc.start),
    end: new Date(doc.end),
    status: doc.status,
    meetLink: doc.meetLink ?? null,
    googleEventId: doc.googleEventId ?? null,
    meetRequestId: doc.meetRequestId ?? null,
    calendar: doc.calendar,
    calendarAttempts: doc.calendarAttempts ?? 0,
    calendarAttemptAt: doc.calendarAttemptAt ? new Date(doc.calendarAttemptAt) : null,
    reminded24h: doc.reminded24h === true,
    reminded1h: doc.reminded1h === true,
    page: doc.page ?? '',
    notes: doc.notes ?? '',
    createdAt: new Date(doc.createdAt),
  };
}

/**
 * The words Payload's adapter puts on the validation error it makes of a Postgres unique
 * violation (`handleUpsertError`: the translated `error:valueMustBeUnique`, "Value must be
 * unique" in English, «يجب أن تكون القيمة فريدة» in Arabic), and the driver's own detail
 * (`already exists`) should the wrapping ever change. A `validate` of our own on `start`
 * would say something else and stays a 400.
 */
const UNIQUE_WORDS = /must be unique|already exists|فريد/i;

/** The Postgres unique violation Payload wraps as a validation error on `start` (the partial index). */
export function isSlotTaken(error: unknown): boolean {
  if (!(error instanceof ValidationError)) return false;
  const errors =
    (error.data as { errors?: Array<{ path?: string; message?: string }> } | undefined)?.errors ??
    [];
  return errors.some((e) => e.path === 'start' && UNIQUE_WORDS.test(e.message ?? ''));
}

const toIso = (date: Date | null | undefined) => (date ? date.toISOString() : date);

/** The patch as Payload's local API takes it: instants as ISO strings, nulls kept. */
function patchData(patch: BookingPatch): Record<string, unknown> {
  const data: Record<string, unknown> = { ...patch };
  if ('start' in patch) data['start'] = toIso(patch.start);
  if ('end' in patch) data['end'] = toIso(patch.end);
  if ('calendarAttemptAt' in patch) data['calendarAttemptAt'] = toIso(patch.calendarAttemptAt);
  return data;
}

export function payloadBookingStore(payload: Payload): BookingStore {
  const read = { depth: 0, overrideAccess: true } as const;
  return {
    async settings(locale) {
      return toBookingSettings(await payload.findGlobal({ slug: BOOKING, ...publicRead(locale) }));
    },
    async activeBetween(from, to) {
      const { docs } = await payload.find({
        collection: BOOKINGS,
        where: {
          and: [
            { status: { not_equals: 'cancelled' } },
            { start: { greater_than_equal: from.toISOString() } },
            { start: { less_than: to.toISOString() } },
          ],
        },
        sort: 'start',
        limit: 200,
        ...read,
      });
      return docs.map(toBookingRow);
    },
    async byId(id) {
      const { docs } = await payload.find({
        collection: BOOKINGS,
        where: { id: { equals: id } },
        limit: 1,
        ...read,
      });
      return docs[0] ? toBookingRow(docs[0]) : null;
    },
    async create(data) {
      try {
        const doc = await payload.create({
          collection: BOOKINGS,
          data: {
            ...data,
            start: data.start.toISOString(),
            end: data.end.toISOString(),
            status: 'booked',
            calendarAttempts: 0,
          },
          ...read,
        });
        return toBookingRow(doc);
      } catch (error) {
        if (isSlotTaken(error)) throw new SlotTaken('the slot is taken');
        throw error;
      }
    },
    async update(id, patch) {
      try {
        const doc = await payload.update({
          collection: BOOKINGS,
          id,
          data: patchData(patch),
          ...read,
        });
        return toBookingRow(doc);
      } catch (error) {
        if (isSlotTaken(error)) throw new SlotTaken('the slot is taken');
        throw error;
      }
    },
    async find(where, limit = 100) {
      const { docs } = await payload.find({
        collection: BOOKINGS,
        where,
        sort: 'start',
        limit,
        ...read,
      });
      return docs.map(toBookingRow);
    },
  };
}
