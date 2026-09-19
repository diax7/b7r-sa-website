import type { Payload } from 'payload';
import { getBookingMailer } from '@/lib/booking-mail';
import { siteBase } from '@/lib/env';
import { ADMIN_PREFIX } from '@/lib/site-routes';
import { calendarFor } from '@/modules/bookings/calendar';
import type { BookingPorts } from '@/modules/bookings/service';
import { payloadBookingStore } from '@/modules/bookings/store';

/**
 * The live ports of the booking flows (ADR-062): the Payload store, the calendar the
 * connections name, the mailer the environment picks, the site's origin for the links,
 * the panel's for Dhia's row link, the contact address, Payload's logger. Built per request
 * and per sweep run, since the settings and the connections may have changed.
 */
export async function bookingPorts(payload: Payload): Promise<BookingPorts> {
  const store = payloadBookingStore(payload);
  const [settings, site] = await Promise.all([
    store.settings('ar'),
    payload.findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: true }),
  ]);
  const calendar = await calendarFor(payload, settings);
  return {
    store,
    calendar: calendar?.client ?? null,
    mailer: getBookingMailer(),
    now: () => new Date(),
    siteUrl: siteBase(),
    adminUrl: `${payload.config.serverURL}${ADMIN_PREFIX}`,
    ownerEmail: site.contact.email,
    logger: {
      info: (msg) => payload.logger.info({ msg }),
      warn: (msg) => payload.logger.warn({ msg }),
    },
  };
}
