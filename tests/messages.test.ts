import type { Payload } from 'payload';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SendResult } from '@/lib/contact-transport';
import { originOf, originOfReferer, utmFrom, utmOf } from '@/modules/inbox/origin';

/**
 * The inbox's writer (ADR-061): `/api/contact` stores the row before the e-mail is tried,
 * a failed send keeps the row with `emailed: false`, the honeypot stores nothing, and the
 * page and the UTM parameters are captured from the body or the referer.
 */
const sends: SendResult[] = [];
const outbox: unknown[] = [];
const writes: Array<{ op: 'create' | 'update'; args: Record<string, unknown> }> = [];
/** Every key of every entry, as pino would write it: the scrub is proved on the whole line. */
const logged: Array<{ level: string; entry: Record<string, unknown> }> = [];
let storeFails = false;

vi.mock('@/lib/contact-transport', () => ({
  getContactTransport: () => ({
    kind: 'mock',
    async send(message: unknown) {
      outbox.push(message);
      return sends.shift() ?? { ok: true };
    },
  }),
}));

vi.mock('@/lib/cms', () => ({
  getSiteSettings: async () => ({ contact: { email: 'contact@b7r.sa' } }),
}));

vi.mock('@/lib/cms/payload', () => ({
  cms: async () =>
    ({
      create: async (args: Record<string, unknown>) => {
        if (storeFails) {
          // Drizzle's shape (`DrizzleQueryError`): the failed query and its parameters,
          // which are the sender's fields.
          const data = args['data'] as Record<string, unknown>;
          const error = new Error(
            `Failed query: insert into "messages" ("name", "phone", "email", "message") values ($1, $2, $3, $4)\nparams: ${[data['name'], data['phone'], data['email'], data['message']].join(',')}`,
          );
          error.name = 'DrizzleQueryError';
          throw error;
        }
        writes.push({ op: 'create', args });
        return { id: 41 };
      },
      update: async (args: Record<string, unknown>) => {
        writes.push({ op: 'update', args });
        return { id: args['id'] };
      },
      // The Appearance global, never saved: the e-mail goes out in the shipped colours.
      findGlobal: async () => null,
      logger: {
        error: (entry: Record<string, unknown>) => logged.push({ level: 'error', entry }),
        warn: (entry: Record<string, unknown>) => logged.push({ level: 'warn', entry }),
        info: () => {},
      },
    }) as unknown as Payload,
}));

const { POST } = await import('@/app/api/contact/route');

const valid = {
  name: 'ضياء',
  phone: '050 169 9572',
  email: 'merchant@example.com',
  inquiry: 'تاجر',
  message: 'أرغب بربط متجري.',
  locale: 'ar',
};

let ipCounter = 0;

/** A same-origin JSON POST from a fresh address (the limiter is per IP and per process). */
function post(body: unknown, headers: Record<string, string> = {}) {
  ipCounter += 1;
  return POST(
    new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': `203.0.113.${ipCounter}`,
        ...headers,
      },
      body: JSON.stringify(body),
    }),
  );
}

const created = () => writes.filter((w) => w.op === 'create').map((w) => w.args['data']);

/** The five values a log line must never carry, in the forms the route sees them. */
const PERSONAL = [valid.name, valid.phone, '966501699572', valid.email, valid.message];

/** Every log entry serialised whole, an `Error` by its message and stack too, like pino. */
const wholeLog = () =>
  logged.map(({ level, entry }) =>
    JSON.stringify({ level, ...entry }, (_key, value: unknown) =>
      value instanceof Error
        ? { name: value.name, message: value.message, stack: value.stack }
        : value,
    ),
  );

beforeEach(() => {
  sends.length = 0;
  outbox.length = 0;
  writes.length = 0;
  logged.length = 0;
  storeFails = false;
});

describe('POST /api/contact stores, then sends (ADR-061)', () => {
  it('writes the row with access overridden before the e-mail, then marks it e-mailed', async () => {
    const res = await post(valid, { referer: 'http://localhost/contact' });
    expect(res.status).toBe(200);
    expect(writes.map((w) => w.op)).toEqual(['create', 'update']);
    expect(writes[0]!.args).toMatchObject({
      collection: 'messages',
      overrideAccess: true,
      data: {
        name: 'ضياء',
        phone: '966501699572',
        email: 'merchant@example.com',
        inquiry: 'تاجر',
        message: 'أرغب بربط متجري.',
        locale: 'ar',
        page: '/contact',
        status: 'new',
        emailed: false,
      },
    });
    expect(writes[1]!.args).toMatchObject({
      collection: 'messages',
      id: 41,
      data: { emailed: true },
      overrideAccess: true,
    });
    expect(outbox).toHaveLength(1);
    expect(outbox[0]).toMatchObject({ phone: '966501699572', locale: 'ar' });
    expect(logged).toEqual([]);
  });

  it('a failed send keeps the row with emailed: false, answers 200, and logs the id alone', async () => {
    sends.push({ ok: false, status: 503 });
    const res = await post(valid);
    expect(res.status).toBe(200);
    expect(writes.map((w) => w.op)).toEqual(['create']);
    expect(created()[0]).toMatchObject({ emailed: false });
    expect(logged).toEqual([
      {
        level: 'warn',
        entry: { msg: 'contact: message 41 stored, the notification e-mail did not go out (503)' },
      },
    ]);
    for (const line of wholeLog()) for (const value of PERSONAL) expect(line).not.toContain(value);
  });

  it("a failed store still tries the e-mail and logs the error's name alone, never the query's parameters; both failing is the transport status", async () => {
    storeFails = true;
    const ok = await post(valid);
    expect(ok.status).toBe(200);
    expect(outbox).toHaveLength(1);
    expect(writes).toEqual([]);
    expect(logged).toEqual([
      {
        level: 'error',
        entry: { msg: 'contact: the message could not be stored (DrizzleQueryError)' },
      },
    ]);
    for (const line of wholeLog()) for (const value of PERSONAL) expect(line).not.toContain(value);
    sends.push({ ok: false, status: 503 });
    const down = await post(valid);
    expect(down.status).toBe(503);
    await expect(down.json()).resolves.toEqual({ ok: false, error: 'not_configured' });
  });

  it('the honeypot answers 200 and stores nothing', async () => {
    const res = await post({ ...valid, website: 'http://spam.example' });
    expect(res.status).toBe(200);
    expect(writes).toEqual([]);
    expect(outbox).toEqual([]);
  });

  it('captures the page and the UTM parameters the form posts', async () => {
    await post({
      ...valid,
      page: '/en/contact',
      utm: { source: 'instagram', medium: 'social', campaign: 'ramadan' },
    });
    expect(created()[0]).toMatchObject({
      page: '/en/contact',
      utm: { source: 'instagram', medium: 'social', campaign: 'ramadan' },
    });
  });

  it('falls back to the referer for the page and its query, and drops a page that is not a site path', async () => {
    await post(
      { ...valid, page: '/contact?x=1' },
      { referer: 'http://localhost/products/hoodie?utm_source=google&utm_medium=cpc' },
    );
    expect(created()[0]).toMatchObject({
      page: '/products/hoodie',
      utm: { source: 'google', medium: 'cpc', campaign: null },
    });
    await post(valid);
    expect(created()[1]).toMatchObject({
      page: null,
      utm: { source: null, medium: null, campaign: null },
    });
  });

  it('refuses a UTM value over the bound and a page over the bound as invalid input', async () => {
    const long = await post({ ...valid, utm: { source: 'x'.repeat(101) } });
    expect(long.status).toBe(400);
    const path = await post({ ...valid, page: `/${'a'.repeat(200)}` });
    expect(path.status).toBe(400);
    expect(writes).toEqual([]);
  });
});

describe('where a submission came from (pure)', () => {
  it('reads the three parameters of a query, bounded, the empty ones left out', () => {
    expect(
      utmOf(new URLSearchParams('utm_source=x&utm_medium=&utm_campaign=%20spring%20')),
    ).toEqual({ source: 'x', campaign: 'spring' });
    expect(utmOf(new URLSearchParams('a=1'))).toBeUndefined();
    expect(utmFrom({ source: 'a'.repeat(120) })?.source).toHaveLength(100);
    expect(utmFrom({ source: undefined, medium: '' })).toBeUndefined();
  });

  it('takes the page and the query from a referer of the site, nothing from a bad one', () => {
    expect(originOfReferer('http://localhost/en/contact?utm_source=x')).toEqual({
      page: '/en/contact',
      utm: { source: 'x' },
    });
    expect(originOfReferer('http://localhost/robots.txt?x=1')).toEqual({});
    expect(originOfReferer('not a url')).toEqual({});
    expect(originOfReferer(null)).toEqual({});
  });

  it('prefers what the form posted, then the referer, each folded by the same rule', () => {
    expect(
      originOf({ page: '/contact', utm: { source: 'ig' } }, 'http://x/y?utm_source=r'),
    ).toEqual({
      page: '/contact',
      utm: { source: 'ig' },
    });
    expect(originOf({ page: '/bad.path' }, 'http://localhost/contact')).toEqual({
      page: '/contact',
    });
    expect(originOf({ utm: { source: '' } }, 'http://localhost/contact?utm_medium=cpc')).toEqual({
      page: '/contact',
      utm: { medium: 'cpc' },
    });
  });
});
