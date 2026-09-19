/**
 * A calendar file for one consultation (ADR-062): the `.ics` attached to the confirmation
 * and served by `/api/bookings/ics`. One `VEVENT` in UTC, a stable `UID` per booking so a
 * re-import updates rather than duplicates, `METHOD:PUBLISH` (no reply expected). Pure.
 */
export interface IcsEvent {
  /** Stable per booking: `booking-<id>@b7r.sa`. */
  uid: string;
  start: Date;
  end: Date;
  summary: string;
  description: string;
  /** The Meet link, when there is one. */
  url?: string | null;
  /** When the file was produced. */
  stamp?: Date;
  /** The booking's revision, so a moved event replaces the first import. */
  sequence?: number;
  cancelled?: boolean;
}

/** `2026-09-22T07:00:00.000Z` → `20260922T070000Z`. */
export function icsStamp(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
}

/** Commas, semicolons, backslashes and newlines are escaped in text values (RFC 5545 §3.3.11). */
export function icsText(value: string): string {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll(';', '\\;')
    .replaceAll(',', '\\,')
    .replaceAll(/\r?\n/g, '\\n');
}

/** Lines longer than 75 octets are folded with a leading space (RFC 5545 §3.1). */
function fold(line: string): string {
  const out: string[] = [];
  let rest = line;
  while (Buffer.byteLength(rest) > 75) {
    let cut = 75;
    while (cut > 0 && Buffer.byteLength(rest.slice(0, cut)) > 75) cut -= 1;
    // Never split a surrogate pair.
    if (cut > 0 && /[\uD800-\uDBFF]$/.test(rest.slice(0, cut))) cut -= 1;
    out.push(rest.slice(0, cut));
    rest = ` ${rest.slice(cut)}`;
  }
  out.push(rest);
  return out.join('\r\n');
}

export function buildIcs(event: IcsEvent): string {
  const stamp = event.stamp ?? new Date();
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//B7R Print//Booking//AR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${icsStamp(stamp)}`,
    `DTSTART:${icsStamp(event.start)}`,
    `DTEND:${icsStamp(event.end)}`,
    `SEQUENCE:${event.sequence ?? 0}`,
    `STATUS:${event.cancelled ? 'CANCELLED' : 'CONFIRMED'}`,
    `SUMMARY:${icsText(event.summary)}`,
    `DESCRIPTION:${icsText(event.description)}`,
    ...(event.url ? [`URL:${event.url}`, `LOCATION:${icsText(event.url)}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return `${lines.map(fold).join('\r\n')}\r\n`;
}
