import { copyFor } from '@/content/copy';
import type { BookingHost, BookingSettings } from '@/content/schema';
import type { Locale } from '@/lib/i18n';
import type { BookerCopy } from '@/modules/bookings/booker/copy';

/** What the booker knows of the settings without asking the API: enough to draw the card. */
export interface BookerSettings {
  /** The consultation's name, in the page's language. */
  title: string;
  /** The one line under the name, in the page's language; empty hides it. */
  blurb: string;
  /** The author record the event pane shows (ADR-063), or none (the title stands alone). */
  host: BookingHost | null;
  durationMinutes: number;
  horizonDays: number;
  noticeHours: number;
  /** The closed dates with their reason in the page's language, for the day's title. */
  closedDates: Array<{ date: string; reason: string }>;
}

/** The slice of the bank the island reads (server side, so the bank never reaches the chunk). */
export function bookerCopy(locale: Locale): BookerCopy {
  const c = copyFor(locale);
  return {
    booking: c.booking,
    labels: c.contactForm.labels,
    placeholders: c.contactForm.placeholders,
    validation: c.contactForm.validation,
    whatsapp: c.contactForm.successWhatsapp,
    loading: c.a11y.loading,
    dateLocale: c.dateLocale,
  };
}

/** What the island needs of the settings to draw the card before asking the API. */
export function bookerSettings(settings: BookingSettings): BookerSettings {
  return {
    title: settings.title,
    blurb: settings.blurb,
    host: settings.host,
    durationMinutes: settings.durationMinutes,
    horizonDays: settings.horizonDays,
    noticeHours: settings.noticeHours,
    closedDates: settings.closedDates.map((c) => ({ date: c.date, reason: c.reason })),
  };
}
