import type { Payload } from 'payload';
import type { BookingSettings } from '@/content/schema';
import { isConnectionKind, mockAllowed } from '@/modules/connections/kinds';
import { readConnection } from '@/modules/connections/read';
import {
  type CalendarClient,
  googleCalendarClient,
  mockCalendarClient,
} from '@/modules/bookings/google';

/** The connection kinds the calendar reads (`connections/kinds.ts` lists them). */
export const GOOGLE_CALENDAR_KIND = 'google-calendar';
export const MOCK_CALENDAR_KIND = 'mock-calendar';
/** The mock row's `model` field set to this makes every call fail (ADR-062). */
export const MOCK_FAIL_FLAG = 'fail';

/**
 * The one enabled connection of a kind, its secret revealed, or null. A kind the table does
 * not list yet is never asked for: `kind` is a Postgres enum, and a value outside it is a
 * query error, not an empty answer.
 */
async function enabledConnection(payload: Payload, kind: string) {
  if (!isConnectionKind(kind)) return null;
  const found = await payload.find({
    collection: 'connections',
    where: { and: [{ kind: { equals: kind } }, { enabled: { equals: true } }] },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  });
  const id = found.docs[0]?.id;
  return id === undefined ? null : readConnection(payload, id);
}

export interface Calendar {
  kind: 'google' | 'mock';
  client: CalendarClient;
}

/**
 * The calendar the bookings write to (ADR-062): the enabled Google Calendar connection with
 * the settings' host as the delegated user; the mock where the server allows it (the tests
 * and the review server); null when neither exists, and the booking then stands with
 * `calendar: off`. A Google row without a host address is a configuration gap named once
 * in the log, not a crash.
 */
export async function calendarFor(
  payload: Payload,
  settings: Pick<BookingSettings, 'hostEmail'>,
): Promise<Calendar | null> {
  const google = await enabledConnection(payload, GOOGLE_CALENDAR_KIND);
  if (google?.apiKey) {
    if (!settings.hostEmail) {
      payload.logger.warn({
        msg: 'bookings: the Google Calendar connection is on but the booking settings name no calendar owner',
      });
      return null;
    }
    return { kind: 'google', client: googleCalendarClient(google.apiKey, settings.hostEmail) };
  }
  if (mockAllowed()) {
    const mock = await enabledConnection(payload, MOCK_CALENDAR_KIND);
    if (mock)
      return { kind: 'mock', client: mockCalendarClient({ fail: mock.model === MOCK_FAIL_FLAG }) };
  }
  return null;
}
