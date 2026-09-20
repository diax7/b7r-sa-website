import { z } from 'zod';
import { LOCALES } from '@/lib/i18n';
import { normalisePhone } from '@/lib/phone';
import { MONTH_KEY } from '@/modules/bookings/days-of-month';
import { DAY_KEY } from '@/modules/bookings/slots';
import { EMAIL_MAX, NAME_MAX, NAME_MIN, NOTE_MAX } from '@/modules/bookings/picker/validate';
/** The page the booking was made from: a site path (`/book`, `/en/contact`). */
const sitePath = z
  .string()
  .max(200)
  .regex(/^\/[a-z0-9/-]*$/);
const utmValue = z.string().trim().max(100);

const phone = z
  .string()
  .trim()
  .transform((value, ctx) => {
    const canonical = normalisePhone(value);
    if (!canonical) {
      ctx.addIssue({ code: 'custom', message: 'phone' });
      return z.NEVER;
    }
    return canonical;
  });

/** An ISO instant; the route reads it as the slot's start. */
const instant = z.iso.datetime({ offset: true }).transform((value) => new Date(value));

/**
 * The body of `POST /api/bookings` (ADR-062): the contact form's limits for the person,
 * the slot as an instant, the language of the page, where it was booked from and the
 * campaign that brought them, the honeypot and the Turnstile token. Server only: zod stays
 * out of the picker's chunk, whose rules read the copy they are given.
 */
export const bookingBodySchema = z.object({
  name: z.string().trim().min(NAME_MIN).max(NAME_MAX),
  phone,
  email: z.email().max(EMAIL_MAX),
  note: z.string().trim().max(NOTE_MAX).default(''),
  start: instant,
  locale: z.enum(LOCALES).default('ar'),
  page: sitePath.optional(),
  utm: z
    .object({
      source: utmValue.optional(),
      medium: utmValue.optional(),
      campaign: utmValue.optional(),
    })
    .optional(),
  website: z.string().max(200).optional(),
  turnstileToken: z.string().max(4096).optional(),
});

export type BookingBody = z.infer<typeof bookingBodySchema>;

/** The body of `POST /api/bookings/manage`: a move to a new slot, or a cancel. */
export const manageBodySchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('reschedule'), token: z.string().max(80), start: instant }),
  z.object({ action: z.literal('cancel'), token: z.string().max(80) }),
]);

export type ManageBody = z.infer<typeof manageBodySchema>;

/** `?date=YYYY-MM-DD` of the slots route. */
export const slotsQuerySchema = z.object({ date: z.string().regex(DAY_KEY) });

/** `?month=YYYY-MM` of the days route (ADR-063). */
export const daysQuerySchema = z.object({ month: z.string().regex(MONTH_KEY) });

/** `POST /api/bookings`: five per IP per ten minutes, the contact form's budget. */
export const BOOKING_RATE_LIMIT = 5;
export const BOOKING_WINDOW_MS = 10 * 60_000;
/** `GET /api/bookings/slots` and `/days`: a person paging through a month; a scraper is cut short. */
export const SLOTS_RATE_LIMIT = 60;
export const SLOTS_WINDOW_MS = 60_000;
/** The manage routes: a handful of reads and one or two actions per visit. */
export const MANAGE_RATE_LIMIT = 20;
export const MANAGE_WINDOW_MS = 10 * 60_000;
