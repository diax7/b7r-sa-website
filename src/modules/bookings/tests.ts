import type { Payload } from 'payload';
import { riyadhDayWindow } from '@/lib/riyadh';
import { adminStringsFor } from '@/modules/cms/admin/strings';
import { mockAllowed } from '@/modules/connections/kinds';
import type { ServiceTests } from '@/modules/connections/test';
import {
  GOOGLE_CALENDAR_KIND,
  MOCK_CALENDAR_KIND,
  MOCK_FAIL_FLAG,
} from '@/modules/bookings/calendar';
import { BOOKING } from '@/modules/bookings/global';
import { googleCalendarClient, mockCalendarClient } from '@/modules/bookings/google';

/** The calendar owner from the booking settings; the field is not localized, so no locale. */
async function hostEmailOf(payload: Payload): Promise<string> {
  const doc = await payload.findGlobal({ slug: BOOKING, depth: 0, overrideAccess: true });
  return typeof doc.hostEmail === 'string' ? doc.hostEmail.trim() : '';
}

/**
 * The Test of the two calendar kinds (ADR-062), merged into the service tests by the
 * route: Google reads the host's free/busy for today through the delegated key, which
 * proves the key file, the Calendar API and the delegation in one call, and answers the
 * host and the count of busy blocks (never a block's content); a settings global without a
 * calendar owner is refused in the tester's language before any call. The mock calendar
 * answers its own free/busy, and its fail flag (the row's `model` set to `fail`) fails it,
 * so the review server can see the failure path from the panel.
 */
export const CALENDAR_TESTS: ServiceTests = {
  [GOOGLE_CALENDAR_KIND]: async (secret, { payload, language }) => {
    const s = adminStringsFor(language).connections.googleCalendar;
    const host = await hostEmailOf(payload);
    if (!host) throw new Error(s.noHost);
    const [from, to] = riyadhDayWindow(new Date());
    const busy = await googleCalendarClient(secret ?? '', host).freeBusy(from, to);
    return s.today(host, busy.length);
  },
  [MOCK_CALENDAR_KIND]: async (_secret, { model }) => {
    if (!mockAllowed()) throw new Error('mock calendar: not enabled on this server');
    const [from, to] = riyadhDayWindow(new Date());
    await mockCalendarClient({ fail: model === MOCK_FAIL_FLAG }).freeBusy(from, to);
    return 'mock calendar: nobody busy today';
  },
};
