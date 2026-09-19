import { describe, expect, it } from 'vitest';
import { copyFor } from '@/content/copy';
import { CALENDAR_RETRIES } from '@/modules/bookings/status';
import { SWEEP_CRON } from '@/modules/bookings/schedule';
import { book } from '@/modules/bookings/service';
import { minuteOf, riyadhInstant } from '@/modules/bookings/slots';
import type { BookingRow } from '@/modules/bookings/store';
import {
  BOOKINGS_QUEUE,
  bookingsSweepTask,
  due1h,
  due24h,
  dueCompletion,
  dueRetry,
  sweep,
  sweepWindows,
} from '@/modules/bookings/sweep';
import { nextOccurrence, riyadhSlot, SCHEDULES } from '@/modules/cms/admin/dashboard/schedule';
import { recordedCalendar, testPorts } from './helpers/booking-store';

const HOUR = 3_600_000;
const DAY = '2026-09-22';
const at = (clock: string, day = DAY) => riyadhInstant(day, minuteOf(clock));
const START = at('10:00');

const row = (extra: Partial<BookingRow> = {}): BookingRow => ({
  id: 1,
  name: 'ضياء',
  email: 'merchant@example.com',
  phone: '966501699572',
  locale: 'ar',
  start: START,
  end: at('10:30'),
  status: 'booked',
  meetLink: 'https://meet.google.com/x',
  googleEventId: 'evt-1',
  meetRequestId: 'req-row',
  calendar: 'synced',
  calendarAttempts: 0,
  calendarAttemptAt: null,
  reminded24h: false,
  reminded1h: false,
  page: '/book',
  notes: '',
  createdAt: new Date('2026-09-20T06:00:00Z'),
  ...extra,
});

const before = (ms: number) => new Date(START.getTime() - ms);

describe('the sweep windows (ADR-062): open-ended, so a late runner sends late rather than never', () => {
  it('the 24-hour reminder: start within a day and beyond an hour, not yet sent, on an active booking', () => {
    expect(due24h(row(), before(24 * HOUR + 1))).toBe(false);
    expect(due24h(row(), before(24 * HOUR))).toBe(true);
    expect(due24h(row(), before(5 * HOUR))).toBe(true);
    expect(due24h(row(), before(HOUR))).toBe(false);
    expect(due24h(row({ reminded24h: true }), before(5 * HOUR))).toBe(false);
    expect(due24h(row({ status: 'cancelled' }), before(5 * HOUR))).toBe(false);
    expect(due24h(row({ status: 'completed' }), before(5 * HOUR))).toBe(false);
    expect(due24h(row({ status: 'rescheduled' }), before(5 * HOUR))).toBe(true);
  });

  it('the 1-hour reminder: start within an hour and still ahead, not yet sent', () => {
    expect(due1h(row(), before(HOUR + 1))).toBe(false);
    expect(due1h(row(), before(HOUR))).toBe(true);
    expect(due1h(row(), before(10 * 60_000))).toBe(true);
    expect(due1h(row(), START)).toBe(false);
    expect(due1h(row({ reminded1h: true }), before(HOUR))).toBe(false);
    expect(due1h(row({ status: 'cancelled' }), before(HOUR))).toBe(false);
  });

  it('completion: the end has passed on an active booking', () => {
    expect(dueCompletion(row(), at('10:30'))).toBe(false);
    expect(dueCompletion(row(), new Date(at('10:30').getTime() + 1))).toBe(true);
    expect(dueCompletion(row({ status: 'cancelled' }), at('12:00'))).toBe(false);
    expect(dueCompletion(row({ status: 'completed' }), at('12:00'))).toBe(false);
  });

  it('the calendar retry: failed, under three tries, an hour past the last, the start still ahead', () => {
    const failed = row({ calendar: 'failed', calendarAttemptAt: before(10 * HOUR) });
    expect(dueRetry(failed, before(9 * HOUR))).toBe(true);
    expect(dueRetry(failed, before(9 * HOUR + 1))).toBe(false);
    expect(dueRetry({ ...failed, calendarAttemptAt: null }, before(9 * HOUR))).toBe(true);
    expect(dueRetry({ ...failed, calendarAttempts: CALENDAR_RETRIES }, before(9 * HOUR))).toBe(
      false,
    );
    expect(dueRetry({ ...failed, calendar: 'off' }, before(9 * HOUR))).toBe(false);
    expect(dueRetry({ ...failed, calendar: 'synced' }, before(9 * HOUR))).toBe(false);
    expect(dueRetry(failed, START)).toBe(false);
    expect(dueRetry({ ...failed, status: 'cancelled' }, before(9 * HOUR))).toBe(false);
  });

  it('the where clauses say the same windows to the database', () => {
    const now = new Date('2026-09-21T07:00:00Z');
    const windows = sweepWindows(now);
    expect(windows.reminder24h).toEqual({
      and: [
        { status: { in: ['booked', 'rescheduled'] } },
        { reminded24h: { not_equals: true } },
        { start: { less_than_equal: '2026-09-22T07:00:00.000Z' } },
        { start: { greater_than: '2026-09-21T08:00:00.000Z' } },
      ],
    });
    expect(windows.reminder1h).toEqual({
      and: [
        { status: { in: ['booked', 'rescheduled'] } },
        { reminded1h: { not_equals: true } },
        { start: { less_than_equal: '2026-09-21T08:00:00.000Z' } },
        { start: { greater_than: '2026-09-21T07:00:00.000Z' } },
      ],
    });
    expect(windows.complete).toEqual({
      and: [
        { status: { in: ['booked', 'rescheduled'] } },
        { end: { less_than: '2026-09-21T07:00:00.000Z' } },
      ],
    });
    expect(windows.retry).toEqual({
      and: [
        { status: { in: ['booked', 'rescheduled'] } },
        { calendar: { equals: 'failed' } },
        { calendarAttempts: { less_than: 3 } },
        { start: { greater_than: '2026-09-21T07:00:00.000Z' } },
      ],
    });
  });
});

describe('the sweep pass', () => {
  it('sends the day reminder once, the hour reminder once, then completes: idempotent by the flags', async () => {
    const ports = testPorts();
    expect(
      (
        await book(ports, {
          name: 'ضياء',
          email: 'merchant@example.com',
          phone: '966501699572',
          note: '',
          start: START,
          locale: 'ar',
          page: '/book',
          utm: {},
        })
      ).status,
    ).toBe(201);
    ports.mailer.outbox.length = 0;
    // Too early: nothing.
    ports.clock.now = before(30 * HOUR);
    expect(await sweep(ports)).toEqual({
      reminded24h: [],
      reminded1h: [],
      completed: [],
      recovered: [],
      retried: [],
    });
    // Inside the day window, twice: one pair.
    ports.clock.now = before(20 * HOUR);
    expect((await sweep(ports)).reminded24h).toEqual([1]);
    expect((await sweep(ports)).reminded24h).toEqual([]);
    expect(ports.mailer.outbox.map((m) => m.subject)).toEqual([
      copyFor('ar').bookingEmail.reminder24Subject,
      copyFor('ar')
        .bookingEmail.ownerReminder24Subject.replace('{name}', 'ضياء')
        .replace('{when}', 'الثلاثاء، 22 سبتمبر 2026، 10:00 ص إلى 10:30 ص بتوقيت الرياض'),
    ]);
    expect(ports.store.rows.get(1)!.reminded24h).toBe(true);
    // Inside the hour window, twice: one pair.
    ports.clock.now = before(30 * 60_000);
    expect((await sweep(ports)).reminded1h).toEqual([1]);
    expect((await sweep(ports)).reminded1h).toEqual([]);
    expect(ports.mailer.outbox).toHaveLength(4);
    expect(ports.mailer.outbox[2]!.subject).toBe(copyFor('ar').bookingEmail.reminder1Subject);
    // After the end: completed, once.
    ports.clock.now = new Date(at('10:30').getTime() + 60_000);
    expect((await sweep(ports)).completed).toEqual([1]);
    expect(ports.store.rows.get(1)!.status).toBe('completed');
    expect((await sweep(ports)).completed).toEqual([]);
    expect(ports.mailer.outbox).toHaveLength(4);
  });

  it('a runner too late for the day window sends the hour reminder alone and closes both flags', async () => {
    const ports = testPorts();
    ports.store.rows.set(1, row());
    ports.clock.now = before(40 * 60_000);
    const result = await sweep(ports);
    expect(result.reminded24h).toEqual([]);
    expect(result.reminded1h).toEqual([1]);
    expect(ports.store.rows.get(1)).toMatchObject({ reminded24h: true, reminded1h: true });
    expect(ports.mailer.outbox).toHaveLength(2);
  });

  it('retries a failed event an hour apart, three times, then leaves it failed; a recovery sends the link', async () => {
    const calendar = recordedCalendar({ fail: true });
    const ports = testPorts({ calendar });
    ports.store.rows.set(
      1,
      row({
        calendar: 'failed',
        meetLink: null,
        googleEventId: null,
        calendarAttemptAt: before(50 * HOUR),
      }),
    );
    ports.clock.now = before(48 * HOUR);
    for (let i = 1; i <= CALENDAR_RETRIES; i++) {
      // Not an hour since the last try: nothing.
      ports.clock.now = new Date(
        ports.store.rows.get(1)!.calendarAttemptAt!.getTime() + 59 * 60_000,
      );
      expect((await sweep(ports)).retried).toEqual([]);
      ports.clock.now = new Date(ports.store.rows.get(1)!.calendarAttemptAt!.getTime() + HOUR);
      expect((await sweep(ports)).retried, `try ${i}`).toEqual([1]);
      expect(ports.store.rows.get(1)!.calendarAttempts).toBe(i);
    }
    ports.clock.now = new Date(ports.store.rows.get(1)!.calendarAttemptAt!.getTime() + 2 * HOUR);
    expect(await sweep(ports)).toMatchObject({ retried: [], recovered: [] });
    expect(ports.store.rows.get(1)!.calendar).toBe('failed');
    expect(ports.mailer.outbox).toHaveLength(0);
    // A second row whose calendar answers on the retry: synced, the link mails go out.
    const healthy = recordedCalendar();
    const again = testPorts({ calendar: healthy });
    again.store.rows.set(
      2,
      row({
        id: 2,
        calendar: 'failed',
        meetLink: null,
        googleEventId: null,
        calendarAttemptAt: before(50 * HOUR),
      }),
    );
    again.clock.now = before(48 * HOUR);
    const result = await sweep(again);
    expect(result).toMatchObject({ recovered: [2], retried: [] });
    expect(again.store.rows.get(2)).toMatchObject({
      calendar: 'synced',
      googleEventId: 'evt-1',
      meetLink: 'https://meet.google.com/test-1',
    });
    expect(again.mailer.outbox.map((m) => m.subject)).toEqual([
      copyFor('ar').bookingEmail.linkSubject.replace('{title}', 'استشارة مجانية، 30 دقيقة'),
      copyFor('ar')
        .bookingEmail.ownerLinkSubject.replace('{name}', 'ضياء')
        .replace('{when}', 'الثلاثاء، 22 سبتمبر 2026، 10:00 ص إلى 10:30 ص بتوقيت الرياض'),
    ]);
    expect(again.mailer.outbox[0]!.text).toContain('https://meet.google.com/test-1');
  });

  it('a retry sends the same Meet request id as the first insert, so Google deduplicates a timed-out insert that reached it', async () => {
    const calendar = recordedCalendar({ fail: true });
    const ports = testPorts({ calendar });
    const booked = await book(ports, {
      name: 'ضياء',
      email: 'merchant@example.com',
      phone: '966501699572',
      note: '',
      start: START,
      locale: 'ar',
      page: '/book',
      utm: {},
    });
    expect(booked.status).toBe(201);
    const first = calendar.calls.find((c) => c.method === 'createEvent')!.args[0] as {
      requestId: string;
    };
    expect(first.requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(ports.store.rows.get(1)!.meetRequestId).toBe(first.requestId);
    calendar.fail = false;
    ports.clock.now = new Date(ports.clock.now.getTime() + HOUR);
    expect((await sweep(ports)).recovered).toEqual([1]);
    const inserts = calendar.calls.filter((c) => c.method === 'createEvent');
    expect(inserts).toHaveLength(2);
    expect((inserts[1]!.args[0] as { requestId: string }).requestId).toBe(first.requestId);
    // A row from before the field existed gets its id written before the insert.
    const legacy = testPorts();
    legacy.store.rows.set(
      7,
      row({
        id: 7,
        calendar: 'failed',
        meetLink: null,
        googleEventId: null,
        meetRequestId: null,
        calendarAttemptAt: before(50 * HOUR),
      }),
    );
    legacy.clock.now = before(48 * HOUR);
    expect((await sweep(legacy)).recovered).toEqual([7]);
    const minted = legacy.store.rows.get(7)!.meetRequestId;
    expect(minted).toMatch(/^[0-9a-f-]{36}$/);
    expect(
      (
        legacy.calendar!.calls.find((c) => c.method === 'createEvent')!.args[0] as {
          requestId: string;
        }
      ).requestId,
    ).toBe(minted);
  });

  it('an event created without its Meet link reads as failed with its id, and the retry reads the link, never a second event', async () => {
    const calendar = recordedCalendar();
    calendar.pendingMeet = true;
    const ports = testPorts({ calendar });
    const booked = await book(ports, {
      name: 'ضياء',
      email: 'merchant@example.com',
      phone: '966501699572',
      note: '',
      start: START,
      locale: 'ar',
      page: '/book',
      utm: {},
    });
    expect(booked.status).toBe(201);
    expect(ports.store.rows.get(1)).toMatchObject({
      calendar: 'failed',
      googleEventId: 'evt-1',
      meetLink: null,
    });
    calendar.pendingMeet = false;
    ports.clock.now = new Date(ports.clock.now.getTime() + HOUR);
    expect((await sweep(ports)).recovered).toEqual([1]);
    expect(ports.store.rows.get(1)).toMatchObject({
      calendar: 'synced',
      googleEventId: 'evt-1',
      meetLink: 'https://meet.google.com/late-evt-1',
    });
    expect(calendar.calls.filter((c) => c.method === 'createEvent')).toHaveLength(1);
  });

  it('a row that throws is a log line; the pass goes on to the next', async () => {
    const ports = testPorts();
    ports.store.rows.set(1, row({ id: 1 }));
    ports.store.rows.set(2, row({ id: 2, start: at('12:00'), end: at('12:30') }));
    const update = ports.store.update.bind(ports.store);
    ports.store.update = async (id, patch) => {
      if (id === 1) throw new Error('boom');
      return update(id, patch);
    };
    ports.clock.now = before(5 * HOUR);
    const result = await sweep(ports);
    expect(result.reminded24h).toEqual([2]);
    expect(ports.logger.lines).toContain(
      "warn: booking 1: the sweep's 24-hour reminder failed: boom",
    );
  });
});

describe('the cron and the dashboard', () => {
  it('runs every fifteen minutes on its own queue, and the dashboard reads the next quarter hour', () => {
    expect(SWEEP_CRON).toBe('*/15 * * * *');
    expect(bookingsSweepTask.schedule).toEqual([{ cron: SWEEP_CRON, queue: BOOKINGS_QUEUE }]);
    expect(SCHEDULES.find((s) => s.key === 'bookings')?.cron).toBe(SWEEP_CRON);
    expect(riyadhSlot(SWEEP_CRON)).toEqual({ everyMinutes: 15 });
    expect(
      nextOccurrence({ everyMinutes: 15 }, new Date('2026-09-22T07:07:00Z')).toISOString(),
    ).toBe('2026-09-22T07:15:00.000Z');
    expect(
      nextOccurrence({ everyMinutes: 15 }, new Date('2026-09-22T07:15:00Z')).toISOString(),
    ).toBe('2026-09-22T07:30:00.000Z');
    expect(
      nextOccurrence({ everyMinutes: 15 }, new Date('2026-09-22T23:59:00Z')).toISOString(),
    ).toBe('2026-09-23T00:00:00.000Z');
  });
});
