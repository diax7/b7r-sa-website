import { afterEach, describe, expect, it } from 'vitest';
import { accessToken, forgetTokens, signJwt } from '@/lib/google-jwt';
import { parseServiceAccount, type ServiceAccountKey } from '@/lib/service-account';
import {
  CALENDAR_SCOPES,
  googleCalendarClient,
  MEET_POLL_TRIES,
  mockCalendarClient,
  mockCalendarEvents,
  parseEvent,
  parseFreeBusy,
  resetMockCalendar,
} from '@/modules/bookings/google';

const HOST = 'dhia@b7r.sa';

/** A PKCS#8 PEM of a fresh RSA key, so the flow signs with a key nobody holds. */
async function freshKey(): Promise<string> {
  const pair = await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify'],
  );
  const der = await crypto.subtle.exportKey('pkcs8', pair.privateKey);
  const b64 = btoa(String.fromCharCode(...new Uint8Array(der)));
  const lines = b64.match(/.{1,64}/g)!.join('\n');
  return `-----BEGIN PRIVATE KEY-----\n${lines}\n-----END PRIVATE KEY-----\n`;
}

const keyFile = (privateKey: string) =>
  JSON.stringify({
    type: 'service_account',
    client_email: 'seo@b7r-site.iam.gserviceaccount.com',
    private_key: privateKey,
    private_key_id: 'kid-1',
    token_uri: 'https://oauth2.googleapis.com/token',
  });

const fromBase64url = (s: string) =>
  Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const claimsOf = (jwt: string) =>
  JSON.parse(new TextDecoder().decode(fromBase64url(jwt.split('.')[1]!))) as Record<
    string,
    unknown
  >;

type Answer = [method: string, part: string, body: unknown, status?: number];

/** A fetch that answers by method and URL substring, in order for repeats, and records the calls. */
function fakeFetch(answers: Answer[]) {
  const calls: Array<{ method: string; url: string; body: unknown }> = [];
  const queue = [...answers];
  const fetcher = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    const raw = init?.body;
    const body =
      typeof raw === 'string' && raw.startsWith('{')
        ? (JSON.parse(raw) as unknown)
        : raw instanceof URLSearchParams
          ? Object.fromEntries(raw)
          : raw;
    calls.push({ method, url, body });
    const index = queue.findIndex(([m, part]) => m === method && url.includes(part));
    if (index === -1) return new Response('not found', { status: 404 });
    const [, , answer, status] = queue.splice(index, 1)[0]!;
    if (status === 204) return new Response(null, { status: 204 });
    return Response.json(answer, { status: status ?? 200 });
  }) as typeof fetch;
  return { fetcher, calls };
}

const TOKEN: Answer = [
  'POST',
  'oauth2.googleapis.com/token',
  { access_token: 'ya29.cal', expires_in: 3600 },
];

/** A recorded `events.insert` body with the Meet ready. */
const EVENT_READY = {
  kind: 'calendar#event',
  id: 'evt-1',
  status: 'confirmed',
  hangoutLink: 'https://meet.google.com/abc-defg-hij',
  conferenceData: {
    createRequest: {
      requestId: 'req-1',
      conferenceSolutionKey: { type: 'hangoutsMeet' },
      status: { statusCode: 'success' },
    },
    entryPoints: [
      {
        entryPointType: 'video',
        uri: 'https://meet.google.com/abc-defg-hij',
        label: 'meet.google.com/abc-defg-hij',
      },
      { entryPointType: 'more', uri: 'https://tel.meet/abc-defg-hij?pin=1', pin: '1' },
    ],
    conferenceId: 'abc-defg-hij',
  },
};

/** The same event while Google is still creating the Meet. */
const EVENT_PENDING = {
  kind: 'calendar#event',
  id: 'evt-1',
  status: 'confirmed',
  conferenceData: {
    createRequest: {
      requestId: 'req-1',
      conferenceSolutionKey: { type: 'hangoutsMeet' },
      status: { statusCode: 'pending' },
    },
  },
};

const FREE_BUSY = {
  kind: 'calendar#freeBusy',
  timeMin: '2026-09-22T06:00:00.000Z',
  timeMax: '2026-09-22T16:00:00.000Z',
  calendars: {
    [HOST]: {
      busy: [
        { start: '2026-09-22T10:00:00Z', end: '2026-09-22T11:00:00Z' },
        { start: '2026-09-22T13:30:00+03:00', end: '2026-09-22T14:00:00+03:00' },
      ],
    },
  },
};

describe('the delegated assertion (ADR-062)', () => {
  afterEach(() => forgetTokens());

  it('carries sub when a subject is given, the two narrow scopes, and caches per subject', async () => {
    const key = parseServiceAccount(keyFile(await freshKey())) as ServiceAccountKey;
    const now = new Date('2026-09-20T10:00:00Z');
    const plain = claimsOf(await signJwt(key, CALENDAR_SCOPES, now));
    expect(plain['sub']).toBeUndefined();
    const delegated = claimsOf(await signJwt(key, CALENDAR_SCOPES, now, HOST));
    expect(delegated).toMatchObject({ iss: key.clientEmail, sub: HOST, scope: CALENDAR_SCOPES });
    expect(CALENDAR_SCOPES.split(' ')).toEqual([
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.freebusy',
    ]);
    expect(CALENDAR_SCOPES).not.toMatch(/auth\/calendar( |$)/);
    // One token per subject: the account's own and the host's are different tokens.
    const { fetcher, calls } = fakeFetch([
      ['POST', 'token', { access_token: 'ya29.own', expires_in: 3600 }],
      ['POST', 'token', { access_token: 'ya29.host', expires_in: 3600 }],
    ]);
    expect(await accessToken(key, CALENDAR_SCOPES, fetcher, now)).toBe('ya29.own');
    expect(await accessToken(key, CALENDAR_SCOPES, fetcher, now, HOST)).toBe('ya29.host');
    expect(await accessToken(key, CALENDAR_SCOPES, fetcher, now, HOST)).toBe('ya29.host');
    expect(calls).toHaveLength(2);
    const assertion = (calls[1]!.body as Record<string, string>)['assertion']!;
    expect(claimsOf(assertion)['sub']).toBe(HOST);
  });
});

describe('the parsers over recorded bodies', () => {
  it('reads the busy blocks of the host calendar, in either offset, and throws on an error or a missing calendar', () => {
    const busy = parseFreeBusy(FREE_BUSY, HOST);
    expect(busy.map((b) => [b.start.toISOString(), b.end.toISOString()])).toEqual([
      ['2026-09-22T10:00:00.000Z', '2026-09-22T11:00:00.000Z'],
      ['2026-09-22T10:30:00.000Z', '2026-09-22T11:00:00.000Z'],
    ]);
    expect(parseFreeBusy({ calendars: { [HOST]: {} } }, HOST)).toEqual([]);
    expect(() => parseFreeBusy({ calendars: {} }, HOST)).toThrow(/without the calendar/);
    expect(() =>
      parseFreeBusy(
        { calendars: { [HOST]: { errors: [{ domain: 'global', reason: 'notFound' }] } } },
        HOST,
      ),
    ).toThrow(/refused the free\/busy read \(notFound\)/);
    expect(parseFreeBusy({ calendars: { [HOST]: { busy: [{ start: 'x' }] } } }, HOST)).toEqual([]);
  });

  it('reads the Meet link from the video entry point, else hangoutLink, and knows a pending one', () => {
    expect(parseEvent(EVENT_READY)).toEqual({
      eventId: 'evt-1',
      meetLink: 'https://meet.google.com/abc-defg-hij',
      pending: false,
    });
    expect(parseEvent(EVENT_PENDING)).toEqual({ eventId: 'evt-1', meetLink: null, pending: true });
    expect(parseEvent({ id: 'evt-2', hangoutLink: 'https://meet.google.com/xyz' })).toEqual({
      eventId: 'evt-2',
      meetLink: 'https://meet.google.com/xyz',
      pending: false,
    });
    // No conference at all (a calendar without Meet): the event stands, the link is null, nothing pends.
    expect(parseEvent({ id: 'evt-3' })).toEqual({
      eventId: 'evt-3',
      meetLink: null,
      pending: false,
    });
    expect(() => parseEvent({})).toThrow(/without an id/);
  });
});

describe('the Google Calendar client', () => {
  afterEach(() => forgetTokens());

  it('refuses a bad key or a missing host before any call', async () => {
    expect(() => googleCalendarClient('nope', HOST)).toThrow(/Google Calendar: not JSON/);
    expect(() => googleCalendarClient(keyFile('x'), HOST)).toThrow(/private_key/);
    expect(() => googleCalendarClient(keyFile('-----BEGIN PRIVATE KEY-----'), '')).toThrow(
      /no calendar owner/,
    );
  });

  it('asks free/busy for the host over the window with the token of the host', async () => {
    const secret = keyFile(await freshKey());
    const { fetcher, calls } = fakeFetch([TOKEN, ['POST', '/calendar/v3/freeBusy', FREE_BUSY]]);
    const client = googleCalendarClient(secret, HOST, { fetcher });
    const from = new Date('2026-09-22T06:00:00Z');
    const to = new Date('2026-09-22T16:00:00Z');
    expect(await client.freeBusy(from, to)).toHaveLength(2);
    expect(calls[1]).toMatchObject({
      method: 'POST',
      body: {
        timeMin: from.toISOString(),
        timeMax: to.toISOString(),
        timeZone: 'Asia/Riyadh',
        items: [{ id: HOST }],
      },
    });
    const assertion = (calls[0]!.body as Record<string, string>)['assertion']!;
    expect(claimsOf(assertion)['sub']).toBe(HOST);
  });

  it('creates the event on the host calendar with a Meet request, the attendee and no Google e-mail', async () => {
    const secret = keyFile(await freshKey());
    const { fetcher, calls } = fakeFetch([
      TOKEN,
      ['POST', `/calendars/${encodeURIComponent(HOST)}/events`, EVENT_READY],
    ]);
    const client = googleCalendarClient(secret, HOST, { fetcher, requestId: () => 'req-1' });
    const start = new Date('2026-09-22T07:00:00Z');
    const end = new Date('2026-09-22T07:30:00Z');
    const created = await client.createEvent({
      start,
      end,
      summary: 'استشارة مجانية، 30 دقيقة: ضياء',
      description: 'Phone: 0501699572',
      attendeeEmail: 'merchant@example.com',
    });
    expect(created).toEqual({ eventId: 'evt-1', meetLink: 'https://meet.google.com/abc-defg-hij' });
    const call = calls[1]!;
    expect(call.url).toContain('conferenceDataVersion=1');
    expect(call.url).toContain('sendUpdates=none');
    expect(call.body).toEqual({
      summary: 'استشارة مجانية، 30 دقيقة: ضياء',
      description: 'Phone: 0501699572',
      start: { dateTime: start.toISOString(), timeZone: 'Asia/Riyadh' },
      end: { dateTime: end.toISOString(), timeZone: 'Asia/Riyadh' },
      attendees: [{ email: 'merchant@example.com' }],
      conferenceData: {
        createRequest: { requestId: 'req-1', conferenceSolutionKey: { type: 'hangoutsMeet' } },
      },
    });
  });

  it('polls a pending Meet up to three times a second apart, and gives up with a null link', async () => {
    const secret = keyFile(await freshKey());
    const events = `/calendars/${encodeURIComponent(HOST)}/events`;
    const slept: number[] = [];
    const sleep = async (ms: number) => {
      slept.push(ms);
    };
    const input = {
      start: new Date('2026-09-22T07:00:00Z'),
      end: new Date('2026-09-22T07:30:00Z'),
      summary: 's',
      description: 'd',
      attendeeEmail: 'm@example.com',
    };
    const ready = fakeFetch([
      TOKEN,
      ['POST', events, EVENT_PENDING],
      ['GET', `${events}/evt-1`, EVENT_PENDING],
      ['GET', `${events}/evt-1`, EVENT_READY],
    ]);
    const client = googleCalendarClient(secret, HOST, { fetcher: ready.fetcher, sleep });
    expect(await client.createEvent(input)).toEqual({
      eventId: 'evt-1',
      meetLink: 'https://meet.google.com/abc-defg-hij',
    });
    expect(slept).toEqual([1000, 1000]);
    expect(ready.calls.filter((c) => c.method === 'GET')).toHaveLength(2);
    forgetTokens();
    const never = fakeFetch([
      TOKEN,
      ['POST', events, EVENT_PENDING],
      ...Array.from({ length: MEET_POLL_TRIES + 1 }, (): Answer => [
        'GET',
        `${events}/evt-1`,
        EVENT_PENDING,
      ]),
    ]);
    const stuck = googleCalendarClient(secret, HOST, { fetcher: never.fetcher, sleep });
    expect(await stuck.createEvent(input)).toEqual({ eventId: 'evt-1', meetLink: null });
    expect(never.calls.filter((c) => c.method === 'GET')).toHaveLength(MEET_POLL_TRIES);
    // The sweep's later read of the same event.
    expect(await stuck.meetLinkOf('evt-1')).toBeNull();
  });

  it('moves with a PATCH of the two times, deletes with a DELETE, and treats a gone event as deleted', async () => {
    const secret = keyFile(await freshKey());
    const events = `/calendars/${encodeURIComponent(HOST)}/events`;
    const { fetcher, calls } = fakeFetch([
      TOKEN,
      ['PATCH', `${events}/evt-1`, EVENT_READY],
      ['DELETE', `${events}/evt-1`, null, 204],
      ['DELETE', `${events}/evt-9`, { error: { code: 410 } }, 410],
      ['DELETE', `${events}/evt-8`, { error: { code: 403 } }, 403],
    ]);
    const client = googleCalendarClient(secret, HOST, { fetcher });
    const start = new Date('2026-09-23T07:00:00Z');
    const end = new Date('2026-09-23T07:30:00Z');
    await client.moveEvent('evt-1', start, end);
    expect(calls[1]).toMatchObject({
      method: 'PATCH',
      body: {
        start: { dateTime: start.toISOString(), timeZone: 'Asia/Riyadh' },
        end: { dateTime: end.toISOString(), timeZone: 'Asia/Riyadh' },
      },
    });
    expect(calls[1]!.url).toContain('sendUpdates=none');
    await expect(client.deleteEvent('evt-1')).resolves.toBeUndefined();
    await expect(client.deleteEvent('evt-9')).resolves.toBeUndefined();
    await expect(client.deleteEvent('evt-8')).rejects.toThrow(/answered 403/);
  });

  it('surfaces a refusal as an error with the status and never a key', async () => {
    const secret = keyFile(await freshKey());
    const { fetcher } = fakeFetch([TOKEN, ['POST', '/freeBusy', { error: { code: 403 } }, 403]]);
    const client = googleCalendarClient(secret, HOST, { fetcher });
    await expect(client.freeBusy(new Date(), new Date())).rejects.toThrow(/answered 403/);
  });
});

describe('the mock calendar (tests and the review server)', () => {
  afterEach(() => resetMockCalendar());

  it('creates, moves and deletes events in memory with a Meet-shaped link, and is never busy', async () => {
    const client = mockCalendarClient({ fail: false });
    expect(await client.freeBusy(new Date(), new Date())).toEqual([]);
    const created = await client.createEvent({
      start: new Date('2026-09-22T07:00:00Z'),
      end: new Date('2026-09-22T07:30:00Z'),
      summary: 's',
      description: 'd',
      attendeeEmail: 'm@example.com',
    });
    expect(created.eventId).toBe('mock-event-1');
    expect(created.meetLink).toMatch(/^https:\/\/meet\.google\.com\/mock-/);
    expect(await client.meetLinkOf('mock-event-1')).toBe(created.meetLink);
    await client.moveEvent(
      'mock-event-1',
      new Date('2026-09-23T07:00:00Z'),
      new Date('2026-09-23T07:30:00Z'),
    );
    expect(mockCalendarEvents().get('mock-event-1')?.start.toISOString()).toBe(
      '2026-09-23T07:00:00.000Z',
    );
    await expect(client.moveEvent('nope', new Date(), new Date())).rejects.toThrow(/no event/);
    await client.deleteEvent('mock-event-1');
    expect(mockCalendarEvents().size).toBe(0);
  });

  it('fails every call when the fail flag is set', async () => {
    const client = mockCalendarClient({ fail: true });
    await expect(client.freeBusy(new Date(), new Date())).rejects.toThrow(/fail flag/);
    await expect(
      client.createEvent({
        start: new Date(),
        end: new Date(),
        summary: 's',
        description: 'd',
        attendeeEmail: 'm@example.com',
      }),
    ).rejects.toThrow(/fail flag/);
    await expect(client.deleteEvent('x')).rejects.toThrow(/fail flag/);
    expect(mockCalendarEvents().size).toBe(0);
  });
});
