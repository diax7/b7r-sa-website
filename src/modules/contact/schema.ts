import { z } from 'zod';
import { normalisePhone } from '@/lib/phone';
import {
  EMAIL_MAX,
  INQUIRY_OPTIONS,
  MESSAGE_MAX,
  NAME_MAX,
  NAME_MIN,
} from '@/modules/contact/validate';

export { INQUIRY_OPTIONS };
export type Inquiry = (typeof INQUIRY_OPTIONS)[number];

/**
 * Contact form body for `POST /api/contact` (BRD 6.9): the same limits as the client rules
 * in `validate.ts` (server only, so zod never reaches the browser). The API answers a
 * generic `invalid`; `website` is the honeypot.
 */
export const contactBodySchema = z.object({
  name: z.string().trim().min(NAME_MIN).max(NAME_MAX),
  phone: z
    .string()
    .trim()
    .transform((value, ctx) => {
      const canonical = normalisePhone(value);
      if (!canonical) {
        ctx.addIssue({ code: 'custom', message: 'phone' });
        return z.NEVER;
      }
      return canonical;
    }),
  email: z.email().max(EMAIL_MAX),
  inquiry: z.enum(INQUIRY_OPTIONS as unknown as [string, ...string[]]),
  message: z.string().trim().min(1).max(MESSAGE_MAX),
  website: z.string().max(200).optional(),
  turnstileToken: z.string().max(4096).optional(),
});

export type ContactBody = z.infer<typeof contactBodySchema>;
export type ContactInput = z.input<typeof contactBodySchema>;

/** BRD 6.9: five requests per IP per ten minutes. */
export const CONTACT_RATE_LIMIT = 5;
export const CONTACT_WINDOW_MS = 10 * 60_000;
