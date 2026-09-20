/**
 * Bookings of our own (ADR-062), for the app layer and the other feature modules: the site
 * reads the settings through `getBooking`; the routes run the flows over `bookingPorts`.
 * The Payload config imports `global.ts` and `collection.ts` directly, as it does for every
 * module (a config-side import of this index would be a cycle through the CMS client).
 */
export { bookingPorts } from '@/modules/bookings/ports';
export { getBooking } from '@/modules/bookings/read';
export {
  BOOKING_RATE_LIMIT,
  BOOKING_WINDOW_MS,
  bookingBodySchema,
  daysQuerySchema,
  MANAGE_RATE_LIMIT,
  MANAGE_WINDOW_MS,
  manageBodySchema,
  SLOTS_RATE_LIMIT,
  SLOTS_WINDOW_MS,
  slotsQuerySchema,
} from '@/modules/bookings/schema';
export {
  book,
  cancel,
  daysFor,
  icsFor,
  type ManageResult,
  type PublicBooking,
  readManage,
  reschedule,
  slotsFor,
} from '@/modules/bookings/service';
export {
  bookRouteMetadata,
  manageRouteMetadata,
  renderBook,
  renderManage,
} from '@/modules/bookings/routes';
export { routeFailure } from '@/modules/bookings/route-failure';
export { toBookingSettings } from '@/modules/bookings/settings';
export { BookingPicker } from '@/modules/bookings/site';
export { CALENDAR_TESTS } from '@/modules/bookings/tests';
