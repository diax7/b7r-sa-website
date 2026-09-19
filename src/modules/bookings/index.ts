/**
 * Bookings of our own (ADR-062), for the app layer and the other feature modules: the site
 * reads the settings through `getBooking`. The Payload config imports `global.ts` and
 * `collection.ts` directly, as it does for every module (a config-side import of this index
 * would be a cycle through the CMS client).
 */
export { getBooking } from '@/modules/bookings/read';
export { toBookingSettings } from '@/modules/bookings/settings';
