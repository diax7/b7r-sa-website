import 'server-only';
import { cache } from 'react';
import type { BookingSettings } from '@/content/schema';
import { cms, publicRead } from '@/lib/cms/payload';
import type { Locale } from '@/lib/i18n';
import { BOOKING } from '@/modules/bookings/global';
import { toBookingSettings } from '@/modules/bookings/settings';

/**
 * The booking settings as the site reads them (ADR-062), once per render: the contact card
 * and the booking page ask for the switch and the consultation's name; the routes ask for
 * the numbers and the hours.
 */
export const getBooking = cache(async (locale: Locale): Promise<BookingSettings> => {
  const payload = await cms();
  return toBookingSettings(await payload.findGlobal({ slug: BOOKING, ...publicRead(locale) }));
});
