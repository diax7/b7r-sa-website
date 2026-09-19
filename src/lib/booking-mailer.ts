import 'server-only';
import { Resend } from 'resend';
import type { BookingMailer, OutgoingMail } from '@/lib/booking-mail';
import { contactEnv } from '@/lib/env-server';

/**
 * The transport of the booking e-mails (ADR-062): Resend when the key is set, a console
 * line otherwise (the subject and a masked address, never a body), the in-memory outbox
 * for the tests. No personal field is ever logged.
 */
const mockOutbox: OutgoingMail[] = [];

/** Test-only: the mails the mock mailer received, in order. */
export function mockBookingOutbox(): readonly OutgoingMail[] {
  return mockOutbox;
}

export function clearBookingOutbox(): void {
  mockOutbox.length = 0;
}

/** `m***@example.com`: enough to follow a log, never the address. */
export function maskAddress(email: string): string {
  const [user = '', domain = ''] = email.split('@');
  return `${user.slice(0, 1)}***@${domain}`;
}

let cachedClient: { key: string; client: Resend } | null = null;

function resendClient(apiKey: string): Resend {
  if (cachedClient?.key !== apiKey) cachedClient = { key: apiKey, client: new Resend(apiKey) };
  return cachedClient.client;
}

function liveMailer(apiKey: string, from: string): BookingMailer {
  const resend = resendClient(apiKey);
  return {
    kind: 'live',
    async send(mail) {
      const { error } = await resend.emails.send({
        from,
        to: mail.to,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        ...(mail.replyTo ? { replyTo: mail.replyTo } : {}),
        ...(mail.attachments ? { attachments: mail.attachments } : {}),
      });
      return error ? { ok: false, status: 500 } : { ok: true };
    },
  };
}

/**
 * Picks the booking mailer: live with a Resend key; the in-memory outbox when
 * `CONTACT_TRANSPORT=mock` and no key exists (the tests and CI); otherwise the console, one
 * line per mail with the subject and the masked address, never the body, so a booking on a
 * server without the keys goes through and the log says what would have left.
 */
export function getBookingMailer(logger: Pick<Console, 'info'> = console): BookingMailer {
  const env = contactEnv();
  if (env.resendApiKey) return liveMailer(env.resendApiKey, env.resendFrom);
  if (env.transportOverride === 'mock') {
    return {
      kind: 'mock',
      async send(mail) {
        mockOutbox.push(mail);
        return { ok: true };
      },
    };
  }
  return {
    kind: 'console',
    async send(mail) {
      logger.info(
        `booking mail (not sent, no RESEND_API_KEY): "${mail.subject}" to ${maskAddress(mail.to)}`,
      );
      return { ok: true };
    },
  };
}
