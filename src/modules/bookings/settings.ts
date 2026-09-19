import { type BookingSettings, BookingSettingsSchema } from '@/content/schema';
import { booking as seed } from '@/content/seed/booking';
import type { Config } from '@/payload-types';

/** What the mapper reads of the global: the document, or the empty one Payload answers before a first save. */
export type BookingDoc = Partial<Omit<Config['globals']['booking'], 'id'>>;

/**
 * The `booking` global as the site's contract (ADR-062). A global that has never been saved
 * comes back without its defaults, so every number and the hours fall back to the seed;
 * the switch stays off until someone turned it on.
 */
export function toBookingSettings(doc: BookingDoc): BookingSettings {
  return BookingSettingsSchema.parse({
    enabled: doc.enabled === true,
    title: doc.title || seed.title,
    durationMinutes: doc.durationMinutes ?? seed.durationMinutes,
    bufferMinutes: doc.bufferMinutes ?? seed.bufferMinutes,
    noticeHours: doc.noticeHours ?? seed.noticeHours,
    horizonDays: doc.horizonDays ?? seed.horizonDays,
    maxPerDay: doc.maxPerDay ?? seed.maxPerDay,
    hours: (doc.hours ?? seed.hours).map((row) => ({
      day: Number(row.day),
      from: row.from,
      to: row.to,
    })),
    closedDates: (doc.closedDates ?? []).map((row) => ({
      date: row.date.slice(0, 10),
      reason: row.reason ?? '',
    })),
    hostEmail: doc.hostEmail ?? '',
  });
}
