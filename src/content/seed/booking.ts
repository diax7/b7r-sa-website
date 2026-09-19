import type { BookingSettings } from '@/content/schema';

/**
 * The `booking` global's seed (BRD 11.2, ADR-062): off until Dhia connects the calendar and
 * switches it on; the consultation the BRD names, 30 minutes with 10 between two, a day's
 * notice, a month ahead, four a day, Sunday to Thursday 10:00 to 18:00 Riyadh. The host
 * address is his to set (the Workspace user whose calendar takes the events).
 */
export const booking: BookingSettings = {
  enabled: false,
  title: 'استشارة مجانية، 30 دقيقة',
  durationMinutes: 30,
  bufferMinutes: 10,
  noticeHours: 24,
  horizonDays: 30,
  maxPerDay: 4,
  hours: [0, 1, 2, 3, 4].map((day) => ({ day, from: '10:00', to: '18:00' })),
  closedDates: [],
  hostEmail: '',
};
