import type { BookingSettings } from '@/content/schema';
import {
  type BookingMailer,
  type BookingMailInput,
  type BookingMailKind,
  bookingIcs,
  buildMerchantMail,
  buildOwnerMail,
} from '@/lib/booking-mail';
import { type Locale, localePath } from '@/lib/i18n';
import { riyadh } from '@/lib/riyadh';
import type { BookingStatus } from '@/modules/bookings/status';
import { daysOfMonth, monthDays, withinMonths } from '@/modules/bookings/days-of-month';
import type { CalendarClient } from '@/modules/bookings/google';
import {
  daySlots,
  type Interval,
  isOnGrid,
  riyadhInstant,
  rulesOf,
  slotEnd,
  withinHorizon,
} from '@/modules/bookings/slots';
import {
  type BookingRow,
  type BookingStore,
  intervalOf,
  type NewBooking,
  SlotTaken,
} from '@/modules/bookings/store';
import { signManageToken, verifyManageToken } from '@/modules/bookings/token';

/**
 * The booking flows (ADR-062), over ports so the routes stay thin and the tests run them
 * against a map: the day's free slots, a booking, the merchant's manage link (a move, a
 * cancel, the calendar file), and the pieces the sweep reuses (the calendar retry and the
 * e-mail pairs). Every log line names the row's id and never a personal field.
 */
export interface BookingLogger {
  info(msg: string): void;
  warn(msg: string): void;
}

export interface BookingPorts {
  store: BookingStore;
  /** Null: no calendar connection; the booking stands with `calendar: off`. */
  calendar: CalendarClient | null;
  mailer: BookingMailer;
  now: () => Date;
  /** The site's absolute origin, for the links in the e-mails. */
  siteUrl: string;
  /** The panel's absolute route (`https://b7r.sa/admin`), for the row link in Dhia's mail. */
  adminUrl: string;
  /** The contact address Dhia's mails go to. */
  ownerEmail: string;
  logger: BookingLogger;
  /** `PAYLOAD_SECRET` for the manage token; the tests hand one in. */
  secret?: string;
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
/** How long past the end the manage link keeps working (ADR-062): the calendar file, the state. */
export const LINK_GRACE_MS = DAY_MS;
/** How long a day's free/busy answer from the calendar is reused. */
export const BUSY_CACHE_MS = 60_000;

const busyCache = new Map<string, { at: number; busy: Interval[] }>();

/** For the tests. */
export function resetBusyCache(): void {
  busyCache.clear();
}

/**
 * The host calendar's busy blocks over a Riyadh day, cached a minute per day. A calendar
 * that fails to answer counts as free (the log says so): the booking then goes on and its
 * event fails the same way, which Dhia's mail names, rather than the whole page closing
 * while Google is down.
 */
async function busyOn(ports: BookingPorts, day: string): Promise<Interval[]> {
  if (!ports.calendar) return [];
  const cached = busyCache.get(day);
  const now = ports.now().getTime();
  if (cached && now - cached.at < BUSY_CACHE_MS) return cached.busy;
  try {
    const busy = await ports.calendar.freeBusy(riyadhInstant(day), riyadhInstant(day, 24 * 60));
    busyCache.set(day, { at: now, busy });
    return busy;
  } catch (error) {
    ports.logger.warn(`bookings: free/busy for ${day} failed, read as free: ${reason(error)}`);
    return [];
  }
}

const reason = (error: unknown) => (error instanceof Error ? error.message : String(error));

/** The bookings that touch a day, the gap on both sides included, minus one row if asked. */
async function bookingsOn(
  ports: BookingPorts,
  settings: BookingSettings,
  day: string,
  except?: number,
): Promise<Interval[]> {
  const gap = settings.bufferMinutes * MINUTE_MS;
  const rows = await ports.store.activeBetween(
    new Date(riyadhInstant(day).getTime() - gap - settings.durationMinutes * MINUTE_MS),
    new Date(riyadhInstant(day, 24 * 60).getTime() + gap),
  );
  return rows.filter((row) => row.id !== except).map(intervalOf);
}

async function freeOn(
  ports: BookingPorts,
  settings: BookingSettings,
  day: string,
  except?: number,
): Promise<Date[]> {
  const [bookings, busy] = await Promise.all([
    bookingsOn(ports, settings, day, except),
    busyOn(ports, day),
  ]);
  return daySlots({ day, rules: rulesOf(settings), bookings, busy, now: ports.now() });
}

export type SlotsResult =
  | { ok: true; slots: Date[] }
  | { ok: false; reason: 'disabled' | 'out_of_range' };

/** `GET /api/bookings/slots?date=`: the day's free starts, or why there are none to ask for. */
export async function slotsFor(
  ports: BookingPorts,
  day: string,
  locale: Locale,
): Promise<SlotsResult> {
  const settings = await ports.store.settings(locale);
  if (!settings.enabled) return { ok: false, reason: 'disabled' };
  if (!withinHorizon(day, rulesOf(settings), ports.now())) {
    return { ok: false, reason: 'out_of_range' };
  }
  return { ok: true, slots: await freeOn(ports, settings, day) };
}

export type DaysResult =
  | { ok: true; days: Record<string, number> }
  | { ok: false; reason: 'disabled' | 'out_of_range' };

/**
 * `GET /api/bookings/days?month=`: the month's days within the horizon with their free
 * counts from the rules and the month's bookings alone (ADR-063), or why there is nothing
 * to ask for. The calendar is not asked: the day click does that.
 */
export async function daysFor(
  ports: BookingPorts,
  month: string,
  locale: Locale,
): Promise<DaysResult> {
  const settings = await ports.store.settings(locale);
  if (!settings.enabled) return { ok: false, reason: 'disabled' };
  const rules = rulesOf(settings);
  const now = ports.now();
  if (!withinMonths(month, rules, now)) return { ok: false, reason: 'out_of_range' };
  const days = daysOfMonth(month);
  const gap = settings.bufferMinutes * MINUTE_MS;
  const rows = await ports.store.activeBetween(
    new Date(riyadhInstant(days[0]!).getTime() - gap - settings.durationMinutes * MINUTE_MS),
    new Date(riyadhInstant(days.at(-1)!, 24 * 60).getTime() + gap),
  );
  return { ok: true, days: monthDays({ month, rules, bookings: rows.map(intervalOf), now }) };
}

export type BookingState = 'active' | 'cancelled' | 'past';

/** A booking as the picker and the manage page read it: nothing of the other person. */
export interface PublicBooking {
  id: number;
  name: string;
  locale: Locale;
  start: string;
  end: string;
  status: BookingStatus;
  state: BookingState;
  meetLink: string | null;
  /** The manage token; the client builds the manage and the calendar-file links from it. */
  token: string;
  canReschedule: boolean;
  canCancel: boolean;
  noticeHours: number;
}

/** A booking's state at `now`: cancelled, past (the end plus a day), or active. */
export function stateOf(row: BookingRow, now: Date): BookingState {
  if (row.status === 'cancelled') return 'cancelled';
  if (now.getTime() > row.end.getTime()) return 'past';
  return 'active';
}

/** The manage link works until a day after the end (ADR-062): decided from the row, never the token. */
export function linkExpired(row: BookingRow, now: Date): boolean {
  return now.getTime() > row.end.getTime() + LINK_GRACE_MS;
}

async function publicView(
  ports: BookingPorts,
  row: BookingRow,
  settings: Pick<BookingSettings, 'noticeHours'>,
): Promise<PublicBooking> {
  const now = ports.now();
  const state = stateOf(row, now);
  const notice = settings.noticeHours * HOUR_MS;
  return {
    id: row.id,
    name: row.name,
    locale: row.locale,
    start: row.start.toISOString(),
    end: row.end.toISOString(),
    status: row.status,
    state,
    meetLink: row.meetLink,
    token: await signManageToken(row.id, ports.secret),
    canReschedule: state === 'active' && row.start.getTime() > now.getTime() + notice,
    canCancel: state === 'active' && row.start.getTime() > now.getTime(),
    noticeHours: settings.noticeHours,
  };
}

function mailInput(
  ports: BookingPorts,
  row: BookingRow,
  settings: BookingSettings,
  token: string,
  note = '',
): BookingMailInput {
  return {
    locale: row.locale,
    title: settings.title,
    name: row.name,
    email: row.email,
    phone: row.phone,
    note,
    start: row.start,
    end: row.end,
    meetLink: row.meetLink,
    manageUrl: `${ports.siteUrl}${localePath(row.locale, '/book/manage')}?token=${token}`,
    adminUrl: `${ports.adminUrl}/collections/bookings/${row.id}`,
    page: row.page,
    id: row.id,
    revision: row.status === 'rescheduled' ? 1 : 0,
    calendarFailed: row.calendar === 'failed',
  };
}

/** The pair of a kind, best effort: a mail that fails is a log line with the row's id, never a failed request. */
export async function sendPair(
  ports: BookingPorts,
  kind: BookingMailKind,
  row: BookingRow,
  settings: BookingSettings,
  note = '',
): Promise<void> {
  const token = await signManageToken(row.id, ports.secret);
  const input = mailInput(ports, row, settings, token, note);
  const mails: Array<[who: string, mail: ReturnType<typeof buildMerchantMail>]> = [
    ['merchant', buildMerchantMail(kind, input)],
    ['owner', buildOwnerMail(kind, input, ports.ownerEmail)],
  ];
  await Promise.all(
    mails.map(async ([who, mail]) => {
      try {
        const result = await ports.mailer.send(mail);
        if (!result.ok)
          ports.logger.warn(`booking ${row.id}: the ${kind} mail to the ${who} failed`);
      } catch (error) {
        ports.logger.warn(
          `booking ${row.id}: the ${kind} mail to the ${who} threw: ${reason(error)}`,
        );
      }
    }),
  );
}

/**
 * Creates or moves the row's event on the calendar and records the outcome on the row:
 * synced with the link and the id, or failed with the attempt's time. Shared by the booking,
 * the move and the sweep's retry. Never throws.
 */
export async function syncCalendar(
  ports: BookingPorts,
  row: BookingRow,
  settings: BookingSettings,
  note: string,
  attempt: number,
): Promise<BookingRow> {
  if (!ports.calendar) return row;
  const failed = (why: string, googleEventId: string | null) => {
    ports.logger.warn(`booking ${row.id}: the calendar refused (attempt ${attempt}): ${why}`);
    return ports.store.update(row.id, {
      calendar: 'failed',
      calendarAttempts: attempt,
      calendarAttemptAt: ports.now(),
      googleEventId,
    });
  };
  let eventId = row.googleEventId;
  let meetLink = row.meetLink;
  try {
    if (eventId) {
      await ports.calendar.moveEvent(eventId, row.start, row.end);
      meetLink ??= await ports.calendar.meetLinkOf(eventId);
    } else {
      // The request id lives on the row before the insert, so a retry after a timeout that
      // did reach Google makes it deduplicate rather than create a second event.
      const requestId = row.meetRequestId ?? (await mintRequestId(ports, row));
      const created = await ports.calendar.createEvent({
        start: row.start,
        end: row.end,
        summary: `${settings.title}: ${row.name}`,
        description: [row.phone, row.email, note].filter(Boolean).join('\n'),
        attendeeEmail: row.email,
        requestId,
      });
      eventId = created.eventId;
      meetLink = created.meetLink;
    }
  } catch (error) {
    return failed(reason(error), eventId);
  }
  // An event without its Meet link yet (Google still creating it) is not done: the row
  // keeps the id, reads as failed, and the sweep's next try asks for the link again.
  if (!meetLink) return failed('the event has no Meet link yet', eventId);
  return ports.store.update(row.id, { calendar: 'synced', googleEventId: eventId, meetLink });
}

/** A row from before the field existed gets its id now, written before the insert. */
async function mintRequestId(ports: BookingPorts, row: BookingRow): Promise<string> {
  const meetRequestId = crypto.randomUUID();
  await ports.store.update(row.id, { meetRequestId });
  return meetRequestId;
}

export interface BookInput {
  name: string;
  email: string;
  phone: string;
  note: string;
  start: Date;
  locale: Locale;
  page: string;
  utm: { source?: string; medium?: string; campaign?: string };
}

export type BookResult =
  | { status: 201; booking: PublicBooking }
  | { status: 400; error: 'disabled' | 'off_grid' | 'out_of_range' }
  | { status: 409; error: 'taken' };

/**
 * `POST /api/bookings` after the route's own gates: the switch, the grid rule (400), the
 * horizon (400), the day's free slots re-checked (409), the row (a `23505` from the
 * partial index is the same 409), the event on the host's calendar (a refusal leaves
 * `calendar: failed` and the sweep retries), then the two e-mails.
 */
export async function book(ports: BookingPorts, input: BookInput): Promise<BookResult> {
  const settings = await ports.store.settings(input.locale);
  if (!settings.enabled) return { status: 400, error: 'disabled' };
  const rules = rulesOf(settings);
  if (!isOnGrid(input.start, rules)) return { status: 400, error: 'off_grid' };
  const day = riyadh(input.start).dateKey;
  if (!withinHorizon(day, rules, ports.now())) return { status: 400, error: 'out_of_range' };
  const free = await freeOn(ports, settings, day);
  if (!free.some((s) => s.getTime() === input.start.getTime())) {
    return { status: 409, error: 'taken' };
  }
  const data: NewBooking = {
    name: input.name,
    email: input.email,
    phone: input.phone,
    locale: input.locale,
    start: input.start,
    end: slotEnd(input.start, rules),
    calendar: ports.calendar ? 'failed' : 'off',
    meetRequestId: crypto.randomUUID(),
    page: input.page,
    utm: input.utm,
    notes: input.note,
  };
  let row: BookingRow;
  try {
    row = await ports.store.create(data);
  } catch (error) {
    if (error instanceof SlotTaken) return { status: 409, error: 'taken' };
    throw error;
  }
  ports.logger.info(`booking ${row.id}: created for ${day}`);
  row = await syncCalendar(ports, row, settings, input.note, 0);
  await sendPair(ports, 'confirmation', row, settings, input.note);
  return { status: 201, booking: await publicView(ports, row, settings) };
}

export type ManageResult =
  | { status: 200; booking: PublicBooking }
  | { status: 404 }
  | { status: 400; error: 'off_grid' | 'out_of_range' }
  | { status: 403; error: 'notice' }
  | { status: 409; error: 'taken' }
  | { status: 410; error: 'cancelled' | 'past' };

/** The row a token names, when the signature holds and the row exists. */
async function rowFor(ports: BookingPorts, token: string | null): Promise<BookingRow | null> {
  const id = await verifyManageToken(token, ports.secret);
  return id === null ? null : ports.store.byId(id);
}

/** `GET /api/bookings/manage?token=`: the booking for the manage page, its state decided now. */
export async function readManage(ports: BookingPorts, token: string | null): Promise<ManageResult> {
  const row = await rowFor(ports, token);
  if (!row) return { status: 404 };
  if (linkExpired(row, ports.now())) return { status: 410, error: 'past' };
  const settings = await ports.store.settings(row.locale);
  return { status: 200, booking: await publicView(ports, row, settings) };
}

/** What every action shares: the row must be active, and the link alive. */
function refusal(row: BookingRow, now: Date): ManageResult | null {
  if (row.status === 'cancelled') return { status: 410, error: 'cancelled' };
  if (linkExpired(row, now) || now.getTime() >= row.start.getTime()) {
    return { status: 410, error: 'past' };
  }
  return null;
}

/**
 * `reschedule`: the same notice rule as a new booking on both ends (the current start must
 * still be beyond the notice, and the new slot is one of the day's free slots), the row
 * moved (the index refuses a taken start), the event patched, both e-mails.
 */
export async function reschedule(
  ports: BookingPorts,
  token: string | null,
  start: Date,
): Promise<ManageResult> {
  const row = await rowFor(ports, token);
  if (!row) return { status: 404 };
  const now = ports.now();
  const refused = refusal(row, now);
  if (refused) return refused;
  const settings = await ports.store.settings(row.locale);
  if (row.start.getTime() <= now.getTime() + settings.noticeHours * HOUR_MS) {
    return { status: 403, error: 'notice' };
  }
  const rules = rulesOf(settings);
  if (!isOnGrid(start, rules)) return { status: 400, error: 'off_grid' };
  const day = riyadh(start).dateKey;
  if (!withinHorizon(day, rules, now)) return { status: 400, error: 'out_of_range' };
  const free = await freeOn(ports, settings, day, row.id);
  if (!free.some((s) => s.getTime() === start.getTime())) return { status: 409, error: 'taken' };
  let moved: BookingRow;
  try {
    moved = await ports.store.update(row.id, {
      start,
      end: slotEnd(start, rules),
      status: 'rescheduled',
      ...(row.calendar === 'synced' ? { calendar: 'failed' as const } : {}),
    });
  } catch (error) {
    if (error instanceof SlotTaken) return { status: 409, error: 'taken' };
    throw error;
  }
  ports.logger.info(`booking ${row.id}: moved to ${day}`);
  moved = await syncCalendar(ports, moved, settings, row.notes, 0);
  await sendPair(ports, 'rescheduled', moved, settings, row.notes);
  return { status: 200, booking: await publicView(ports, moved, settings) };
}

/** `cancel`: allowed until the start; the row cancelled, the event deleted, both e-mails. */
export async function cancel(ports: BookingPorts, token: string | null): Promise<ManageResult> {
  const row = await rowFor(ports, token);
  if (!row) return { status: 404 };
  const refused = refusal(row, ports.now());
  if (refused) return refused;
  const settings = await ports.store.settings(row.locale);
  const cancelled = await ports.store.update(row.id, { status: 'cancelled' });
  ports.logger.info(`booking ${row.id}: cancelled`);
  if (ports.calendar && row.googleEventId) {
    try {
      await ports.calendar.deleteEvent(row.googleEventId);
    } catch (error) {
      ports.logger.warn(`booking ${row.id}: the calendar kept the event: ${reason(error)}`);
    }
  }
  await sendPair(ports, 'cancelled', cancelled, settings, row.notes);
  return { status: 200, booking: await publicView(ports, cancelled, settings) };
}

/** `GET /api/bookings/ics?token=`: the calendar file of an active booking. */
export async function icsFor(ports: BookingPorts, token: string | null): Promise<string | null> {
  const row = await rowFor(ports, token);
  if (!row || row.status === 'cancelled' || linkExpired(row, ports.now())) return null;
  const settings = await ports.store.settings(row.locale);
  return bookingIcs({
    id: row.id,
    start: row.start,
    end: row.end,
    title: settings.title,
    name: row.name,
    meetLink: row.meetLink,
    revision: row.status === 'rescheduled' ? 1 : 0,
  });
}

/**
 * A cancel made in the panel (the row's status set to cancelled by a person): the merchant
 * hears it and the event leaves the calendar, as a cancel by the merchant's own link does.
 * Best effort throughout: a refusal is a log line with the row's id, never a failed save.
 */
export async function cancelledByStaff(ports: BookingPorts, id: number): Promise<void> {
  const row = await ports.store.byId(id);
  if (!row || row.status !== 'cancelled') return;
  if (ports.calendar && row.googleEventId) {
    try {
      await ports.calendar.deleteEvent(row.googleEventId);
    } catch (error) {
      ports.logger.warn(`booking ${row.id}: the calendar kept the event: ${reason(error)}`);
    }
  }
  const settings = await ports.store.settings(row.locale);
  await sendPair(ports, 'cancelled', row, settings, row.notes);
  ports.logger.info(`booking ${row.id}: cancelled in the panel`);
}
