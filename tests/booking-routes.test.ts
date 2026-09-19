import { beforeEach, describe, expect, it } from 'vitest';
import { copyFor } from '@/content/copy';
import {
  EMAIL_MAX as CONTACT_EMAIL_MAX,
  NAME_MAX as CONTACT_NAME_MAX,
  NAME_MIN as CONTACT_NAME_MIN,
} from '@/modules/contact/validate';
import { EMAIL_MAX, NAME_MAX, NAME_MIN, validatePicker } from '@/modules/bookings/picker/validate';
import { bookingBodySchema, manageBodySchema, slotsQuerySchema } from '@/modules/bookings/schema';
import {
  book,
  cancel,
  cancelledByStaff,
  icsFor,
  linkExpired,
  readManage,
  reschedule,
  resetBusyCache,
  slotsFor,
  stateOf,
} from '@/modules/bookings/service';
import { minuteOf, riyadhInstant } from '@/modules/bookings/slots';
import { signManageToken, verifyManageToken } from '@/modules/bookings/token';
import { recordedCalendar, SECRET, testPorts } from './helpers/booking-store';

/** Tuesday 2026-09-22 in Riyadh; `now` is Sunday the 20th at 09:00 Riyadh. */
const DAY = '2026-09-22';
const at = (clock: string, day = DAY) => riyadhInstant(day, minuteOf(clock));

const input = (start: Date, extra: Record<string, unknown> = {}) => ({
  name: 'ضياء',
  email: 'merchant@example.com',
  phone: '966501699572',
  note: '',
  start,
  locale: 'ar' as const,
  page: '/book',
  utm: {},
  ...extra,
});

beforeEach(() => resetBusyCache());

describe('the bodies (ADR-062)', () => {
  it("the picker keeps the contact form's limits, and its rules answer the BRD messages", () => {
    expect([NAME_MIN, NAME_MAX, EMAIL_MAX]).toEqual([
      CONTACT_NAME_MIN,
      CONTACT_NAME_MAX,
      CONTACT_EMAIL_MAX,
    ]);
    const copy = {
      booking: copyFor('ar').booking,
      labels: copyFor('ar').contactForm.labels,
      placeholders: copyFor('ar').contactForm.placeholders,
      validation: copyFor('ar').contactForm.validation,
      whatsapp: copyFor('ar').contactForm.successWhatsapp,
      loading: copyFor('ar').a11y.loading,
      dateLocale: copyFor('ar').dateLocale,
    };
    expect(validatePicker({ name: 'x', phone: '123', email: 'nope', note: '' }, copy)).toEqual({
      name: copy.validation.name,
      phone: copy.validation.phone,
      email: copy.validation.email,
    });
    expect(
      validatePicker({ name: 'ضياء', phone: '050 169 9572', email: 'm@x.co', note: '' }, copy),
    ).toEqual({});
  });

  it('the booking body canonicalises the phone, reads the start as an instant, caps the note, refuses the rest', () => {
    const parsed = bookingBodySchema.safeParse({
      name: 'ضياء',
      phone: '050 169 9572',
      email: 'merchant@example.com',
      start: '2026-09-22T10:00:00+03:00',
      locale: 'en',
      page: '/en/contact',
      utm: { source: 'x', medium: 'social' },
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.phone).toBe('966501699572');
      expect(parsed.data.start.toISOString()).toBe('2026-09-22T07:00:00.000Z');
      expect(parsed.data.note).toBe('');
      expect(parsed.data.utm).toEqual({ source: 'x', medium: 'social' });
    }
    const bad = [
      { start: 'tomorrow' },
      { start: '2026-09-22' },
      { page: 'https://evil.example' },
      { page: '/Book' },
      { note: 'م'.repeat(1001) },
      { name: 'x' },
      { email: 'nope' },
      { phone: '12' },
      { locale: 'fr' },
    ];
    for (const patch of bad) {
      const body = {
        name: 'ضياء',
        phone: '0501699572',
        email: 'm@example.com',
        start: '2026-09-22T07:00:00Z',
        ...patch,
      };
      expect(bookingBodySchema.safeParse(body).success, JSON.stringify(patch)).toBe(false);
    }
  });

  it('the manage body is a move with a start or a cancel; the slots query is a day key', () => {
    expect(manageBodySchema.safeParse({ action: 'cancel', token: '1.x' }).success).toBe(true);
    expect(
      manageBodySchema.safeParse({
        action: 'reschedule',
        token: '1.x',
        start: '2026-09-22T07:00:00Z',
      }).success,
    ).toBe(true);
    expect(manageBodySchema.safeParse({ action: 'reschedule', token: '1.x' }).success).toBe(false);
    expect(manageBodySchema.safeParse({ action: 'delete', token: '1.x' }).success).toBe(false);
    expect(slotsQuerySchema.safeParse({ date: '2026-09-22' }).success).toBe(true);
    expect(slotsQuerySchema.safeParse({ date: '22/09/2026' }).success).toBe(false);
    expect(slotsQuerySchema.safeParse({ date: null }).success).toBe(false);
  });
});

describe('the manage token', () => {
  it('round-trips, and refuses a tampered, foreign or malformed one', async () => {
    const token = await signManageToken(42, SECRET);
    expect(token).toMatch(/^42\.[A-Za-z0-9_-]{43}$/);
    expect(await verifyManageToken(token, SECRET)).toBe(42);
    expect(await verifyManageToken(token.replace(/^42/, '43'), SECRET)).toBeNull();
    expect(await verifyManageToken(`${token.slice(0, -1)}x`, SECRET)).toBeNull();
    expect(await verifyManageToken(token, 'another-secret-of-the-same-length-for-sure')).toBeNull();
    expect(await verifyManageToken('42', SECRET)).toBeNull();
    expect(await verifyManageToken('', SECRET)).toBeNull();
    expect(await verifyManageToken(null, SECRET)).toBeNull();
    // The same id signs the same way: one link for the booking's life.
    expect(await signManageToken(42, SECRET)).toBe(token);
  });
});

describe('the slots route', () => {
  it('answers the free starts, refuses the switch off and a day outside the horizon', async () => {
    const ports = testPorts();
    const free = await slotsFor(ports, DAY, 'ar');
    expect(free.ok && free.slots).toHaveLength(12);
    expect(await slotsFor(ports, '2026-10-21', 'ar')).toEqual({
      ok: false,
      reason: 'out_of_range',
    });
    expect(await slotsFor(ports, '2026-09-19', 'ar')).toEqual({
      ok: false,
      reason: 'out_of_range',
    });
    const off = testPorts({ settings: { enabled: false } });
    expect(await slotsFor(off, DAY, 'ar')).toEqual({ ok: false, reason: 'disabled' });
  });

  it("subtracts the calendar's busy blocks and asks the calendar once a minute per day", async () => {
    const calendar = recordedCalendar({ busy: [{ start: at('12:00'), end: at('13:00') }] });
    const ports = testPorts({ calendar });
    const first = await slotsFor(ports, DAY, 'ar');
    expect(first.ok && first.slots.map((s) => s.toISOString())).not.toContain(
      at('12:00').toISOString(),
    );
    await slotsFor(ports, DAY, 'ar');
    expect(calendar.calls.filter((c) => c.method === 'freeBusy')).toHaveLength(1);
    ports.clock.now = new Date(ports.clock.now.getTime() + 61_000);
    await slotsFor(ports, DAY, 'ar');
    expect(calendar.calls.filter((c) => c.method === 'freeBusy')).toHaveLength(2);
  });

  it('reads a calendar that fails as free, and says so in the log', async () => {
    const ports = testPorts({ calendar: recordedCalendar({ fail: true }) });
    const free = await slotsFor(ports, DAY, 'ar');
    expect(free.ok && free.slots).toHaveLength(12);
    expect(
      ports.logger.lines.some((l) => l.includes('free/busy') && l.includes('read as free')),
    ).toBe(true);
  });
});

describe("POST /api/bookings: the service after the route's gates", () => {
  it('refuses in order: the switch off, an off-grid start, a day beyond the horizon, a taken slot', async () => {
    const off = testPorts({ settings: { enabled: false } });
    expect(await book(off, input(at('10:00')))).toEqual({ status: 400, error: 'disabled' });
    const ports = testPorts();
    expect(await book(ports, input(at('10:30')))).toEqual({ status: 400, error: 'off_grid' });
    expect(await book(ports, input(at('10:00', '2026-10-25')))).toEqual({
      status: 400,
      error: 'out_of_range',
    });
    // Inside the notice: on the grid, in the horizon, not free.
    expect(await book(ports, input(at('10:00', '2026-09-20')))).toEqual({
      status: 409,
      error: 'taken',
    });
    expect(ports.store.rows.size).toBe(0);
    expect(ports.mailer.outbox).toHaveLength(0);
  });

  it('books: the row, the event with its Meet link, the two e-mails, a public view with the token', async () => {
    const ports = testPorts();
    const result = await book(ports, input(at('10:00'), { note: 'أرغب بربط متجري' }));
    expect(result.status).toBe(201);
    if (result.status !== 201) return;
    expect(result.booking).toMatchObject({
      id: 1,
      name: 'ضياء',
      locale: 'ar',
      start: at('10:00').toISOString(),
      end: at('10:30').toISOString(),
      status: 'booked',
      state: 'active',
      meetLink: 'https://meet.google.com/test-1',
      canReschedule: true,
      canCancel: true,
      noticeHours: 24,
    });
    expect(await verifyManageToken(result.booking.token, SECRET)).toBe(1);
    const row = ports.store.rows.get(1)!;
    expect(row).toMatchObject({
      calendar: 'synced',
      googleEventId: 'evt-1',
      notes: 'أرغب بربط متجري',
    });
    const created = ports.calendar!.calls.find((c) => c.method === 'createEvent')!.args[0] as {
      summary: string;
      attendeeEmail: string;
      description: string;
    };
    expect(created.summary).toBe('استشارة مجانية، 30 دقيقة: ضياء');
    expect(created.attendeeEmail).toBe('merchant@example.com');
    expect(created.description).toContain('أرغب بربط متجري');
    const [merchant, owner] = ports.mailer.outbox;
    expect(merchant!.to).toBe('merchant@example.com');
    expect(merchant!.text).toContain('https://meet.google.com/test-1');
    expect(merchant!.text).toContain(`https://b7r.sa/book/manage?token=${result.booking.token}`);
    expect(owner!.to).toBe('contact@b7r.sa');
    expect(owner!.text).toContain('https://b7r.sa/admin/collections/bookings/1');
    expect(owner!.text).toContain('أرغب بربط متجري');
    expect(owner!.text).not.toContain(copyFor('ar').bookingEmail.calendarFailed);
    // No personal field in the log.
    for (const line of ports.logger.lines) {
      expect(line).not.toContain('ضياء');
      expect(line).not.toContain('merchant@example.com');
      expect(line).not.toContain('966501699572');
    }
    expect(ports.logger.lines).toContain(`info: booking 1: created for ${DAY}`);
  });

  it('answers 409 to the second of two concurrent bookings of one slot (the index, not the re-check)', async () => {
    const ports = testPorts();
    const [a, b] = await Promise.all([
      book(ports, input(at('10:00'))),
      book(ports, input(at('10:00'))),
    ]);
    expect([a.status, b.status].toSorted()).toEqual([201, 409]);
    expect(ports.store.rows.size).toBe(1);
    // And a later one the re-check catches; the neighbour inside the gap is taken too.
    expect(await book(ports, input(at('10:00')))).toEqual({ status: 409, error: 'taken' });
    expect((await book(ports, input(at('10:40')))).status).toBe(201);
  });

  it('a Google refusal leaves the booking standing as failed: the merchant hears the link follows, Dhia hears why', async () => {
    const ports = testPorts({ calendar: recordedCalendar({ fail: true }) });
    const result = await book(ports, input(at('10:00'), { locale: 'en' }));
    expect(result.status).toBe(201);
    if (result.status !== 201) return;
    expect(result.booking.meetLink).toBeNull();
    const row = ports.store.rows.get(1)!;
    expect(row.calendar).toBe('failed');
    expect(row.calendarAttempts).toBe(0);
    expect(row.calendarAttemptAt).toEqual(ports.clock.now);
    const [merchant, owner] = ports.mailer.outbox;
    expect(merchant!.text).toContain(copyFor('en').bookingEmail.linkFollows);
    expect(owner!.text).toContain(copyFor('en').bookingEmail.calendarFailed);
    expect(
      ports.logger.lines.some((l) => l.includes('booking 1: the calendar refused (attempt 0)')),
    ).toBe(true);
  });

  it('without a calendar connection the booking stands as off, and the link follows by hand', async () => {
    const ports = testPorts({ calendar: null });
    const result = await book(ports, input(at('10:00')));
    expect(result.status).toBe(201);
    expect(ports.store.rows.get(1)!.calendar).toBe('off');
    const [merchant, owner] = ports.mailer.outbox;
    expect(merchant!.text).toContain(copyFor('ar').bookingEmail.linkFollows);
    expect(owner!.text).not.toContain(copyFor('ar').bookingEmail.calendarFailed);
  });

  it('a mail that fails is a log line, never a failed booking', async () => {
    const ports = testPorts();
    ports.mailer.fail = true;
    expect((await book(ports, input(at('10:00')))).status).toBe(201);
    expect(ports.logger.lines).toContain(
      'warn: booking 1: the confirmation mail to the merchant failed',
    );
    expect(ports.logger.lines).toContain(
      'warn: booking 1: the confirmation mail to the owner failed',
    );
  });
});

describe('the manage link', () => {
  async function booked(options: Parameters<typeof testPorts>[0] = {}) {
    const ports = testPorts(options);
    const result = await book(ports, input(at('10:00')));
    if (result.status !== 201) throw new Error('not booked');
    ports.mailer.outbox.length = 0;
    return { ports, token: result.booking.token, id: result.booking.id };
  }

  it('reads the booking for the page, and 404s a wrong signature', async () => {
    const { ports, token } = await booked();
    const read = await readManage(ports, token);
    expect(read.status).toBe(200);
    if (read.status === 200) expect(read.booking).toMatchObject({ id: 1, state: 'active', token });
    expect(await readManage(ports, `${token.slice(0, -2)}zz`)).toEqual({ status: 404 });
    expect(await readManage(ports, null)).toEqual({ status: 404 });
    expect(await readManage(ports, '999.' + token.split('.')[1])).toEqual({ status: 404 });
  });

  it('moves the booking under the notice rule: the event patched, both e-mails, the old slot free again', async () => {
    const { ports, token } = await booked();
    const moved = await reschedule(ports, token, at('14:00'));
    expect(moved.status).toBe(200);
    if (moved.status !== 200) return;
    expect(moved.booking).toMatchObject({
      status: 'rescheduled',
      start: at('14:00').toISOString(),
      state: 'active',
    });
    const row = ports.store.rows.get(1)!;
    expect(row.calendar).toBe('synced');
    expect(ports.calendar!.calls.at(-1)).toMatchObject({
      method: 'moveEvent',
      args: ['evt-1', at('14:00'), at('14:30')],
    });
    expect(ports.mailer.outbox.map((m) => m.to)).toEqual([
      'merchant@example.com',
      'contact@b7r.sa',
    ]);
    expect(ports.mailer.outbox[0]!.subject).toBe(
      copyFor('ar').bookingEmail.rescheduledSubject.replace('{title}', 'استشارة مجانية، 30 دقيقة'),
    );
    expect((await book(ports, input(at('10:00'), { email: 'other@example.com' }))).status).toBe(
      201,
    );
  });

  it('refuses a move to an off-grid or taken slot, or beyond the horizon, and inside the notice', async () => {
    const { ports, token } = await booked();
    expect(await reschedule(ports, token, at('14:10'))).toEqual({ status: 400, error: 'off_grid' });
    expect(await reschedule(ports, token, at('10:00', '2026-10-25'))).toEqual({
      status: 400,
      error: 'out_of_range',
    });
    await book(ports, input(at('14:00'), { email: 'other@example.com' }));
    expect(await reschedule(ports, token, at('14:00'))).toEqual({ status: 409, error: 'taken' });
    // Moving onto itself is a no-op slot the re-check allows (the row is excluded) and the index allows.
    expect((await reschedule(ports, token, at('10:00'))).status).toBe(200);
    // Now the booking is within the notice: no move at all.
    ports.clock.now = new Date(at('10:00').getTime() - 2 * 3_600_000);
    expect(await reschedule(ports, token, at('16:00'))).toEqual({ status: 403, error: 'notice' });
  });

  it('cancels until the start: the row cancelled, the event deleted, both e-mails; then nothing more', async () => {
    const { ports, token } = await booked();
    ports.clock.now = new Date(at('10:00').getTime() - 60_000);
    const cancelled = await cancel(ports, token);
    expect(cancelled.status).toBe(200);
    if (cancelled.status === 200)
      expect(cancelled.booking).toMatchObject({
        status: 'cancelled',
        state: 'cancelled',
        canCancel: false,
        canReschedule: false,
      });
    expect(ports.calendar!.calls.at(-1)).toMatchObject({ method: 'deleteEvent', args: ['evt-1'] });
    expect(ports.mailer.outbox[0]!.subject).toBe(
      copyFor('ar').bookingEmail.cancelledSubject.replace('{title}', 'استشارة مجانية، 30 دقيقة'),
    );
    expect(await cancel(ports, token)).toEqual({ status: 410, error: 'cancelled' });
    expect(await reschedule(ports, token, at('14:00'))).toEqual({
      status: 410,
      error: 'cancelled',
    });
    expect(await icsFor(ports, token)).toBeNull();
    const read = await readManage(ports, token);
    expect(read.status === 200 && read.booking.state).toBe('cancelled');
    // The slot is free again.
    ports.clock.now = new Date('2026-09-20T06:00:00Z');
    expect((await book(ports, input(at('10:00'), { email: 'other@example.com' }))).status).toBe(
      201,
    );
  });

  it('a past booking refuses every action; the link itself lives a day past the end', async () => {
    const { ports, token } = await booked();
    ports.clock.now = new Date(at('10:00').getTime() + 1);
    expect(await cancel(ports, token)).toEqual({ status: 410, error: 'past' });
    expect(await reschedule(ports, token, at('14:00'))).toEqual({ status: 410, error: 'past' });
    ports.clock.now = new Date(at('10:30').getTime() + 3_600_000);
    const read = await readManage(ports, token);
    expect(read.status === 200 && read.booking.state).toBe('past');
    expect(await icsFor(ports, token)).toContain('BEGIN:VCALENDAR');
    ports.clock.now = new Date(at('10:30').getTime() + 25 * 3_600_000);
    expect(await readManage(ports, token)).toEqual({ status: 410, error: 'past' });
    expect(await icsFor(ports, token)).toBeNull();
    const row = ports.store.rows.get(1)!;
    expect(stateOf(row, at('10:00'))).toBe('active');
    expect(stateOf(row, new Date(at('10:30').getTime() + 1))).toBe('past');
    expect(linkExpired(row, new Date(at('10:30').getTime() + 24 * 3_600_000))).toBe(false);
    expect(linkExpired(row, new Date(at('10:30').getTime() + 24 * 3_600_000 + 1))).toBe(true);
  });

  it('a calendar refusal on the move leaves the row failed with its event id, for the sweep', async () => {
    const { ports, token } = await booked();
    ports.calendar!.fail = true;
    const moved = await reschedule(ports, token, at('14:00'));
    expect(moved.status).toBe(200);
    const row = ports.store.rows.get(1)!;
    expect(row).toMatchObject({ calendar: 'failed', googleEventId: 'evt-1', start: at('14:00') });
    expect(ports.mailer.outbox[1]!.text).toContain(copyFor('ar').bookingEmail.calendarFailed);
    // A cancel then keeps going: the event stays, the log says so, the merchant hears.
    ports.calendar!.fail = true;
    expect((await cancel(ports, token)).status).toBe(200);
    expect(ports.logger.lines.some((l) => l.includes('the calendar kept the event'))).toBe(true);
  });

  it('a cancel made in the panel tells the merchant and deletes the event; any other status change does nothing', async () => {
    const { ports, id } = await booked();
    await ports.store.update(id, { status: 'cancelled' });
    await cancelledByStaff(ports, id);
    expect(ports.calendar!.calls.at(-1)).toMatchObject({ method: 'deleteEvent', args: ['evt-1'] });
    expect(ports.mailer.outbox.map((m) => m.to)).toEqual([
      'merchant@example.com',
      'contact@b7r.sa',
    ]);
    expect(ports.logger.lines).toContain(`info: booking ${id}: cancelled in the panel`);
    // Not cancelled, or no such row: nothing.
    const other = await booked();
    await other.ports.store.update(other.id, { status: 'completed' });
    await cancelledByStaff(other.ports, other.id);
    await cancelledByStaff(other.ports, 999);
    expect(other.ports.mailer.outbox).toHaveLength(0);
  });

  it('serves the calendar file of an active booking', async () => {
    const { ports, token } = await booked();
    const ics = await icsFor(ports, token);
    expect(ics).toContain('UID:booking-1@b7r.sa');
    expect(ics).toContain('SUMMARY:استشارة مجانية، 30 دقيقة: ضياء');
    expect(ics).toContain('URL:https://meet.google.com/test-1');
    expect(await icsFor(ports, 'nope')).toBeNull();
  });
});
