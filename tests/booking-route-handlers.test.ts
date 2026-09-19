import type { Payload } from 'payload';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { minuteOf, riyadhInstant } from '@/modules/bookings/slots';
import { signManageToken } from '@/modules/bookings/token';
import { SECRET, testPorts, type TestPorts } from './helpers/booking-store';

/**
 * The booking routes catch their own failures (ADR-062, rule 18): a store that throws a
 * `DrizzleQueryError` (its message is the failed query and its parameters, the merchant's
 * fields) answers a 500 with a generic word and one log entry naming the route and the
 * error's name alone. The fake logger keeps every entry whole, as pino would write it, so
 * the scrub is proved on the whole line; Next's own error log never sees the error.
 */
/** Every key of every entry, as pino would write it. */
const logged: Array<{ level: string; entry: Record<string, unknown> }> = [];
let ports: TestPorts;
let storeFails = false;

const MERCHANT = {
  name: 'ضياء',
  phone: '966501699572',
  email: 'merchant@example.com',
  note: 'أرغب بربط متجري في سلة.',
};

/** Drizzle's shape: the failed query and its parameters, which are the merchant's fields. */
function drizzleFailure(fields: Record<string, unknown>): Error {
  const values = Object.values(fields).join(',');
  const error = new Error(
    `Failed query: insert into "bookings" ("name", "email", "phone", "notes") values ($1, $2, $3, $4)\nparams: ${values}`,
  );
  error.name = 'DrizzleQueryError';
  return error;
}

vi.mock('@/lib/cms/payload', () => ({
  cms: async () =>
    ({
      logger: {
        error: (entry: Record<string, unknown>) => logged.push({ level: 'error', entry }),
        warn: (entry: Record<string, unknown>) => logged.push({ level: 'warn', entry }),
        info: (entry: Record<string, unknown>) => logged.push({ level: 'info', entry }),
      },
    }) as unknown as Payload,
}));

vi.mock('@/modules/bookings/ports', () => ({
  bookingPorts: async () => ports,
}));

const { POST: postBooking } = await import('@/app/api/bookings/route');
const { GET: getManage, POST: postManage } = await import('@/app/api/bookings/manage/route');
const { GET: getSlots } = await import('@/app/api/bookings/slots/route');
const { GET: getIcs } = await import('@/app/api/bookings/ics/route');

const DAY = '2026-09-22';
const at = (clock: string) => riyadhInstant(DAY, minuteOf(clock));

let ipCounter = 0;

/** A same-origin JSON request from a fresh address (the limiters are per IP and per process). */
function request(url: string, body?: unknown) {
  ipCounter += 1;
  return new Request(`http://localhost${url}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': `203.0.113.${ipCounter}`,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

/** Every log entry serialised whole, an `Error` by its message and stack too, like pino. */
const wholeLog = () =>
  logged.map(({ level, entry }) =>
    JSON.stringify({ level, ...entry }, (_key, value: unknown) =>
      value instanceof Error
        ? { name: value.name, message: value.message, stack: value.stack }
        : value,
    ),
  );

/** The values a log line must never carry, in the forms the routes see them. */
const PERSONAL = [MERCHANT.name, MERCHANT.phone, MERCHANT.email, MERCHANT.note];

beforeEach(() => {
  logged.length = 0;
  storeFails = false;
  ports = testPorts();
  // The routes' logger is the fake payload's: the ports' own logger stays the test's.
  const store = ports.store;
  const create = store.create.bind(store);
  const byId = store.byId.bind(store);
  store.create = async (data) => {
    if (storeFails) throw drizzleFailure({ ...MERCHANT });
    return create(data);
  };
  store.byId = async (id) => {
    if (storeFails) throw drizzleFailure({ ...MERCHANT, id });
    return byId(id);
  };
});

describe('the booking routes catch their own failures (rule 18)', () => {
  it('POST /api/bookings: a failed insert is a 500 with a generic word and one log entry naming the route and the error, never a field', async () => {
    storeFails = true;
    const res = await postBooking(
      request('/api/bookings', { ...MERCHANT, start: at('10:00').toISOString(), locale: 'ar' }),
    );
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ ok: false, error: 'failed' });
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(logged).toEqual([
      { level: 'error', entry: { msg: 'bookings: POST /api/bookings failed (DrizzleQueryError)' } },
    ]);
    for (const line of wholeLog()) for (const value of PERSONAL) expect(line).not.toContain(value);
    expect(ports.mailer.outbox).toEqual([]);
  });

  it('POST /api/bookings: the flow answers as before when the store holds', async () => {
    const res = await postBooking(
      request('/api/bookings', { ...MERCHANT, start: at('10:00').toISOString(), locale: 'ar' }),
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as { ok: boolean; booking: { id: number; token: string } };
    expect(body.ok).toBe(true);
    expect(body.booking.id).toBe(1);
    expect(logged).toEqual([]);
    expect(ports.mailer.outbox).toHaveLength(2);
    // The route's own gates stand in front of the flow: an off-grid start is a 400.
    const offGrid = await postBooking(
      request('/api/bookings', { ...MERCHANT, start: at('10:05').toISOString(), locale: 'ar' }),
    );
    expect(offGrid.status).toBe(400);
    await expect(offGrid.json()).resolves.toEqual({ ok: false, error: 'off_grid' });
  });

  it('the manage routes: a failed read is a 500 naming the route and the error, never a field', async () => {
    const token = await signManageToken(1, SECRET);
    storeFails = true;
    const read = await getManage(request(`/api/bookings/manage?token=${token}`));
    expect(read.status).toBe(500);
    await expect(read.json()).resolves.toEqual({ ok: false, error: 'failed' });
    const cancel = await postManage(request('/api/bookings/manage', { action: 'cancel', token }));
    expect(cancel.status).toBe(500);
    const move = await postManage(
      request('/api/bookings/manage', {
        action: 'reschedule',
        token,
        start: at('14:00').toISOString(),
      }),
    );
    expect(move.status).toBe(500);
    const ics = await getIcs(request(`/api/bookings/ics?token=${token}`));
    expect(ics.status).toBe(500);
    expect(logged.map((l) => l.entry['msg'])).toEqual([
      'bookings: GET /api/bookings/manage failed (DrizzleQueryError)',
      'bookings: POST /api/bookings/manage failed (DrizzleQueryError)',
      'bookings: POST /api/bookings/manage failed (DrizzleQueryError)',
      'bookings: GET /api/bookings/ics failed (DrizzleQueryError)',
    ]);
    for (const line of wholeLog()) for (const value of PERSONAL) expect(line).not.toContain(value);
  });

  it('the slots route: a failure in the read is a 500 too; a throw that is not an Error is named by its type', async () => {
    ports.store.activeBetween = async () => {
      throw drizzleFailure({ ...MERCHANT });
    };
    const res = await getSlots(request(`/api/bookings/slots?date=${DAY}`));
    expect(res.status).toBe(500);
    expect(logged[0]!.entry).toEqual({
      msg: 'bookings: GET /api/bookings/slots failed (DrizzleQueryError)',
    });
    for (const line of wholeLog()) for (const value of PERSONAL) expect(line).not.toContain(value);
    logged.length = 0;
    ports.store.activeBetween = async () => {
      throw 'down';
    };
    expect((await getSlots(request(`/api/bookings/slots?date=${DAY}`))).status).toBe(500);
    expect(logged[0]!.entry).toEqual({ msg: 'bookings: GET /api/bookings/slots failed (string)' });
  });
});
