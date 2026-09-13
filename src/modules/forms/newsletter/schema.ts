import { z } from 'zod';

/** Newsletter subscription body (BRD 6.14). `website` is the honeypot: humans never fill it. */
export const newsletterBodySchema = z.object({
  email: z.email().max(254),
  website: z.string().max(200).optional(),
});

export type NewsletterBody = z.infer<typeof newsletterBodySchema>;

/** BRD 6.14: five requests per IP per ten minutes. */
export const NEWSLETTER_RATE_LIMIT = 5;
export const NEWSLETTER_WINDOW_MS = 10 * 60_000;
