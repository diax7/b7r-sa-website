import 'server-only';
import { Resend } from 'resend';
import { copyFor } from '@/content/copy';
import { htmlDir, type Locale } from '@/lib/i18n';
import type { MailPalette } from '@/lib/mail-palette';
import { contactEnv } from '@/lib/env-server';
import { formatSaudiPhone, isSaudiMobile } from '@/lib/phone';
import { whatsappUrl } from '@/lib/utm';

export interface ContactMessage {
  name: string;
  /** `9665XXXXXXXX` for Saudi mobiles, otherwise the international digits (`+…`). */
  phone: string;
  email: string;
  inquiry: string;
  message: string;
  /** The language of the form the sender used (default Arabic). */
  locale?: Locale;
}

export type SendResult = { ok: true } | { ok: false; status: 500 | 503 };

export interface ContactTransport {
  kind: 'live' | 'mock' | 'off';
  /** `palette`: the brand's colours at send time (spec 010), which the live mail is written in. */
  send(message: ContactMessage, palette: MailPalette): Promise<SendResult>;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** Subject and bodies per BRD 4.17: every field, LTR-safe phone and email, a WhatsApp reply link when the phone is Saudi. */
export function buildContactEmail(
  message: ContactMessage,
  palette: MailPalette,
): {
  subject: string;
  html: string;
  text: string;
} {
  const locale: Locale = message.locale ?? 'ar';
  const { contactForm, contactEmail } = copyFor(locale);
  const { labels } = contactForm;
  const subject = contactEmail.subject.replace('{inquiryType}', message.inquiry);
  const phone = formatSaudiPhone(message.phone);
  const wa = isSaudiMobile(message.phone) ? whatsappUrl(message.phone) : null;
  const rows: Array<[string, string, boolean]> = [
    [labels.name, message.name, false],
    [labels.phone, phone, true],
    [labels.email, message.email, true],
    [labels.inquiry, message.inquiry, false],
  ];
  const html = `<!doctype html><html lang="${locale}" dir="${htmlDir(locale)}"><body style="font-family:system-ui,sans-serif;line-height:1.7;color:${palette.text}">
<h2 style="margin:0 0 16px">${escapeHtml(subject)}</h2>
<table cellpadding="6" style="border-collapse:collapse">
${rows
  .map(
    ([label, value, ltr]) =>
      `<tr><th align="${locale === 'ar' ? 'right' : 'left'}" style="color:${palette.muted};font-weight:500">${escapeHtml(label)}</th><td>${
        ltr ? `<bdi dir="ltr">${escapeHtml(value)}</bdi>` : escapeHtml(value)
      }</td></tr>`,
  )
  .join('\n')}
</table>
<p style="white-space:pre-wrap;margin:16px 0"><strong>${escapeHtml(labels.message)}</strong><br>${escapeHtml(message.message)}</p>
${wa ? `<p><a href="${wa}" style="color:${palette.primary}">${escapeHtml(contactEmail.replyOnWhatsapp)}</a></p>` : ''}
</body></html>`;
  const text = [
    ...rows.map(([label, value]) => `${label}: ${value}`),
    `${labels.message}:`,
    message.message,
    ...(wa ? ['', `${contactEmail.replyOnWhatsapp}: ${wa}`] : []),
  ].join('\n');
  return { subject, html, text };
}

const mockOutbox: ContactMessage[] = [];

/** Test-only: messages the mock transport received. */
export function mockContactOutbox(): readonly ContactMessage[] {
  return mockOutbox;
}

function mockTransport(): ContactTransport {
  return {
    kind: 'mock',
    async send(message) {
      mockOutbox.push(message);
      return { ok: true };
    },
  };
}

let cachedClient: { key: string; client: Resend } | null = null;

function resendClient(apiKey: string): Resend {
  if (cachedClient?.key !== apiKey) cachedClient = { key: apiKey, client: new Resend(apiKey) };
  return cachedClient.client;
}

function liveTransport(apiKey: string, from: string, to: string): ContactTransport {
  const resend = resendClient(apiKey);
  return {
    kind: 'live',
    async send(message, palette) {
      const { subject, html, text } = buildContactEmail(message, palette);
      // `replyTo` is the sender's address so Dhia answers from the inbox.
      const { error } = await resend.emails.send({
        from,
        to,
        subject,
        html,
        text,
        replyTo: message.email,
      });
      return error ? { ok: false, status: 500 } : { ok: true };
    },
  };
}

/**
 * Picks the contact transport (BRD 6.9, ADR-015 rule): live with a Resend key and the
 * recipient from the site settings (the contact e-mail, ADR-052); mock only when
 * `CONTACT_TRANSPORT=mock` AND no key exists; otherwise off (503).
 */
export function getContactTransport(to: string | undefined): ContactTransport {
  const env = contactEnv();
  if (env.resendApiKey && to) {
    return liveTransport(env.resendApiKey, env.resendFrom, to);
  }
  if (env.transportOverride === 'mock' && !env.resendApiKey) return mockTransport();
  return {
    kind: 'off',
    async send() {
      return { ok: false, status: 503 };
    },
  };
}
