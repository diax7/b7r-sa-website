import { accessToken } from '@/lib/google-jwt';
import { parseServiceAccount, type ServiceAccountKey } from '@/lib/service-account';
import type { Interval } from '@/modules/bookings/slots';

/**
 * Google Calendar through the service account by domain-wide delegation (ADR-062): the
 * assertion carries `sub: hostEmail`, the Workspace user whose calendar is read and written,
 * for the two narrow scopes the feature uses (never the whole `calendar` scope). Free/busy for
 * the picker, an event with a Meet link per booking, a move and a delete. Pure parsers over
 * the API's shapes, so the tests feed recorded bodies. Google e-mails nobody
 * (`sendUpdates=none`): our own e-mails carry the link.
 */
export const CALENDAR_SCOPES =
  'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.freebusy';
const API = 'https://www.googleapis.com/calendar/v3';
export const EVENT_TIME_ZONE = 'Asia/Riyadh';
/** A fresh event's Meet link may still be `pending`: the event is read again, this often, this far apart. */
export const MEET_POLL_TRIES = 3;
export const MEET_POLL_MS = 1000;
const TIMEOUT_MS = 20_000;

export interface EventInput {
  start: Date;
  end: Date;
  summary: string;
  description: string;
  attendeeEmail: string;
  /** The Meet `createRequest` id; the same id on a retry makes Google deduplicate the insert. */
  requestId: string;
}

export interface CreatedEvent {
  eventId: string;
  /** Null when Google answered without one after the polls: the sweep asks again. */
  meetLink: string | null;
}

export interface CalendarClient {
  /** The busy blocks of the host between two instants (the picker's subtraction; the Test). */
  freeBusy(from: Date, to: Date): Promise<Interval[]>;
  createEvent(input: EventInput): Promise<CreatedEvent>;
  moveEvent(eventId: string, start: Date, end: Date): Promise<void>;
  deleteEvent(eventId: string): Promise<void>;
  /** The link of an event whose Meet was pending at creation (the sweep's retry). */
  meetLinkOf(eventId: string): Promise<string | null>;
}

/** The busy blocks of one calendar out of a `freeBusy.query` body; an error on the calendar throws. */
export function parseFreeBusy(body: unknown, calendarId: string): Interval[] {
  const calendars = (body as { calendars?: Record<string, unknown> } | null)?.calendars;
  const calendar = calendars?.[calendarId] as
    | { busy?: unknown[]; errors?: Array<{ reason?: string; domain?: string }> }
    | undefined;
  if (!calendar) throw new Error(`Google Calendar answered without the calendar ${calendarId}`);
  if (calendar.errors?.length) {
    const reason = calendar.errors.map((e) => e.reason ?? e.domain ?? 'error').join(', ');
    throw new Error(`Google Calendar refused the free/busy read (${reason})`);
  }
  return (calendar.busy ?? []).flatMap((b) => {
    const block = b as { start?: unknown; end?: unknown };
    if (typeof block.start !== 'string' || typeof block.end !== 'string') return [];
    const start = new Date(block.start);
    const end = new Date(block.end);
    return Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) ? [] : [{ start, end }];
  });
}

export interface ParsedEvent {
  eventId: string;
  meetLink: string | null;
  /** Google is still creating the Meet: read the event again in a moment. */
  pending: boolean;
}

/** The id and the Meet link of an event body; the link comes from the video entry point, else `hangoutLink`. */
export function parseEvent(body: unknown): ParsedEvent {
  const event = body as {
    id?: unknown;
    hangoutLink?: unknown;
    conferenceData?: {
      createRequest?: { status?: { statusCode?: unknown } };
      entryPoints?: Array<{ entryPointType?: unknown; uri?: unknown }>;
    };
  } | null;
  if (typeof event?.id !== 'string' || !event.id) {
    throw new Error('Google Calendar answered an event without an id');
  }
  const video = event.conferenceData?.entryPoints?.find((p) => p.entryPointType === 'video');
  const uri = typeof video?.uri === 'string' ? video.uri : null;
  const hangout = typeof event.hangoutLink === 'string' ? event.hangoutLink : null;
  const meetLink = uri ?? hangout;
  const status = event.conferenceData?.createRequest?.status?.statusCode;
  return { eventId: event.id, meetLink, pending: meetLink === null && status === 'pending' };
}

export interface GoogleCalendarOptions {
  fetcher?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** An event's start or end as the API wants it: the instant, with the zone the event displays in. */
function eventTime(date: Date): { dateTime: string; timeZone: string } {
  return { dateTime: date.toISOString(), timeZone: EVENT_TIME_ZONE };
}

export function googleCalendarClient(
  secret: string,
  hostEmail: string,
  options: GoogleCalendarOptions = {},
): CalendarClient {
  const parsed = parseServiceAccount(secret);
  if (typeof parsed === 'string') throw new Error(`Google Calendar: ${parsed}`);
  if (!hostEmail.includes('@')) throw new Error('Google Calendar: no calendar owner e-mail set');
  const key: ServiceAccountKey = parsed;
  const fetcher = options.fetcher ?? fetch;
  const sleep = options.sleep ?? wait;
  const calendar = `/calendars/${encodeURIComponent(hostEmail)}`;

  const call = async (path: string, init: RequestInit = {}): Promise<unknown> => {
    const token = await accessToken(key, CALENDAR_SCOPES, fetcher, new Date(), hostEmail);
    const res = await fetcher(`${API}${path}`, {
      ...init,
      headers: {
        ...init.headers,
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.status === 204) return null;
    // An event already deleted on Google's side is deleted: the booking's cancel goes on.
    if (res.status === 410 && init.method === 'DELETE') return null;
    if (!res.ok) throw new Error(`Google Calendar answered ${res.status}`);
    return res.json();
  };

  const meetLinkOf = async (eventId: string): Promise<string | null> =>
    parseEvent(await call(`${calendar}/events/${encodeURIComponent(eventId)}`)).meetLink;

  return {
    async freeBusy(from, to) {
      const body = await call('/freeBusy', {
        method: 'POST',
        body: JSON.stringify({
          timeMin: from.toISOString(),
          timeMax: to.toISOString(),
          timeZone: EVENT_TIME_ZONE,
          items: [{ id: hostEmail }],
        }),
      });
      return parseFreeBusy(body, hostEmail);
    },
    async createEvent(input) {
      const body = await call(`${calendar}/events?conferenceDataVersion=1&sendUpdates=none`, {
        method: 'POST',
        body: JSON.stringify({
          summary: input.summary,
          description: input.description,
          start: eventTime(input.start),
          end: eventTime(input.end),
          attendees: [{ email: input.attendeeEmail }],
          conferenceData: {
            createRequest: {
              requestId: input.requestId,
              conferenceSolutionKey: { type: 'hangoutsMeet' },
            },
          },
        }),
      });
      let event = parseEvent(body);
      // The polls are serial by nature: each waits a second, then reads the same event once.
      for (let i = 0; i < MEET_POLL_TRIES && event.pending; i++) {
        // oxlint-disable-next-line no-await-in-loop
        await sleep(MEET_POLL_MS);
        // oxlint-disable-next-line no-await-in-loop
        event = parseEvent(await call(`${calendar}/events/${encodeURIComponent(event.eventId)}`));
      }
      return { eventId: event.eventId, meetLink: event.meetLink };
    },
    async moveEvent(eventId, start, end) {
      await call(`${calendar}/events/${encodeURIComponent(eventId)}?sendUpdates=none`, {
        method: 'PATCH',
        body: JSON.stringify({ start: eventTime(start), end: eventTime(end) }),
      });
    },
    async deleteEvent(eventId) {
      await call(`${calendar}/events/${encodeURIComponent(eventId)}?sendUpdates=none`, {
        method: 'DELETE',
      });
    },
    meetLinkOf,
  };
}

/** What the mock calendar holds, for the tests and the review server's e2e. */
export interface MockEvent extends EventInput {
  eventId: string;
  meetLink: string;
}

/** The mock's events by request id: a second insert with the same id answers the first event. */
const mockByRequest = new Map<string, string>();

const mockEvents = new Map<string, MockEvent>();
let mockCounter = 0;

/** The mock's events, for the tests. */
export function mockCalendarEvents(): ReadonlyMap<string, MockEvent> {
  return mockEvents;
}

export function resetMockCalendar(): void {
  mockEvents.clear();
  mockByRequest.clear();
  mockCounter = 0;
}

/**
 * The mock calendar (ADR-062): in memory, no network, refused in production like the AI
 * mock; every call fails when the row's `fail` flag is set, which drives the
 * `calendar: failed` path end to end. Nobody is ever busy on it.
 */
export function mockCalendarClient(options: { fail: boolean }): CalendarClient {
  const guard = () => {
    if (options.fail) throw new Error('mock calendar: the fail flag is set');
  };
  return {
    async freeBusy() {
      guard();
      return [];
    },
    async createEvent(input) {
      guard();
      // Google deduplicates on the request id; so does the mock.
      const known = mockByRequest.get(input.requestId);
      const existing = known ? mockEvents.get(known) : undefined;
      if (existing) return { eventId: existing.eventId, meetLink: existing.meetLink };
      mockCounter += 1;
      const eventId = `mock-event-${mockCounter}`;
      const meetLink = `https://meet.google.com/mock-${mockCounter.toString(36).padStart(3, 'a')}`;
      mockEvents.set(eventId, { ...input, eventId, meetLink });
      mockByRequest.set(input.requestId, eventId);
      return { eventId, meetLink };
    },
    async moveEvent(eventId, start, end) {
      guard();
      const event = mockEvents.get(eventId);
      if (!event) throw new Error(`mock calendar: no event ${eventId}`);
      mockEvents.set(eventId, { ...event, start, end });
    },
    async deleteEvent(eventId) {
      guard();
      mockEvents.delete(eventId);
    },
    async meetLinkOf(eventId) {
      guard();
      return mockEvents.get(eventId)?.meetLink ?? null;
    },
  };
}
