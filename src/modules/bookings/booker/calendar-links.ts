/**
 * The add-to-calendar links of the success view and the manage page (ADR-063), pure: the
 * Google Calendar event editor, the Outlook web compose deep link (one link serves
 * outlook.live.com; an Office 365 account lands on its own calendar from it), and Apple
 * through the site's own `.ics` route (on an iPhone or a Mac the file opens Calendar). The
 * times go out as instants (Google) or as Riyadh wall-clock with its offset (Outlook), so
 * every calendar shows 10:00 Riyadh whatever the merchant's device says.
 */
export interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  /** The body of the event: the Meet link, or the sentence that says it follows. */
  details: string;
  /** The Meet link when the booking has one, else the word "Google Meet". */
  location: string;
}

const HOUR_MS = 3_600_000;

/** `2026-09-21T07:00:00.000Z` → `20260921T070000Z`, the compact UTC form Google reads. */
export function compactUtc(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
}

/** The instant on the Riyadh clock with its offset: `2026-09-21T10:00:00+03:00`. */
export function riyadhIso(date: Date): string {
  return `${new Date(date.getTime() + 3 * HOUR_MS).toISOString().slice(0, 19)}+03:00`;
}

export function googleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${compactUtc(event.start)}/${compactUtc(event.end)}`,
    details: event.details,
    location: event.location,
    ctz: 'Asia/Riyadh',
  });
  return `https://calendar.google.com/calendar/r/eventedit?${params}`;
}

export function outlookCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: riyadhIso(event.start),
    enddt: riyadhIso(event.end),
    body: event.details,
    location: event.location,
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params}`;
}

/** The site's own calendar file, by the booking's signed token (ADR-062). */
export function appleCalendarUrl(token: string): string {
  return `/api/bookings/ics?token=${encodeURIComponent(token)}`;
}
