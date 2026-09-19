/**
 * The bookings' words and states (ADR-062), apart from the collection config so the store,
 * the sweep, the dashboard card and the panel's cell read them without the config's imports.
 */
export const BOOKINGS = 'bookings' as const;

export const BOOKING_STATUSES = ['booked', 'rescheduled', 'cancelled', 'completed'] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

/** The status words, the glossary's: the select's options, the pill, the dashboard card. */
export const BOOKING_STATUS_LABELS: Record<BookingStatus, { ar: string; en: string }> = {
  booked: { ar: 'محجوز', en: 'Booked' },
  rescheduled: { ar: 'مُعاد جدولته', en: 'Rescheduled' },
  cancelled: { ar: 'ملغى', en: 'Cancelled' },
  completed: { ar: 'مكتمل', en: 'Completed' },
};

/**
 * The statuses still ahead of their time: the sweep's windows (reminders, completion, the
 * calendar retry), the inbox badge and the dashboard card read these two. The slot itself
 * is held by "not cancelled" (booked, rescheduled and completed alike): the partial unique
 * index on `start` and the store's `activeBetween` for the picker's busy slots say `status <>
 * 'cancelled'`, so a completed booking keeps its past slot and a cancelled one frees it.
 */
export const UPCOMING_STATUSES: readonly BookingStatus[] = ['booked', 'rescheduled'];

export const CALENDAR_STATES = ['synced', 'failed', 'off'] as const;
export type CalendarState = (typeof CALENDAR_STATES)[number];

/** How many times the sweep asks Google again for a failed event before it stays failed. */
export const CALENDAR_RETRIES = 3;
