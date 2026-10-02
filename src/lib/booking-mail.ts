import { copyFor } from '@/content/copy';
import { buildIcs } from '@/lib/ics';
import { htmlDir, type Locale } from '@/lib/i18n';
import type { MailPalette } from '@/lib/mail-palette';
import { formatSaudiPhone } from '@/lib/phone';
import { riyadhSpanLabel } from '@/lib/riyadh';

/**
 * The booking e-mails (ADR-062, BRD 4.19), beside the contact transport: to the merchant in
 * their language (the time in Riyadh with Western digits, the Meet link or "the link
 * follows", the manage link, the calendar file attached to the confirmation) and to Dhia at
 * the contact address, in the same language. Six kinds, each a merchant mail and an owner
 * mail: the confirmation, a move, a cancel, the two reminders, and the link that follows a
 * calendar failure. Pure builders, so the sweep's task (in the Payload config's graph,
 * which the CLI loads under plain Node) can import them; the transport that sends them is
 * `booking-mailer.ts`, server-only.
 */
export type BookingMailKind =
  | 'confirmation'
  | 'rescheduled'
  | 'cancelled'
  | 'reminder24h'
  | 'reminder1h'
  | 'link';

export interface BookingMailInput {
  locale: Locale;
  /** The consultation's name from the settings, in the merchant's language. */
  title: string;
  name: string;
  email: string;
  /** Canonical: `9665…` or `+…`. */
  phone: string;
  note: string;
  start: Date;
  end: Date;
  meetLink: string | null;
  /** The signed manage link, absolute. */
  manageUrl: string;
  /** The row in the panel, absolute. */
  adminUrl: string;
  /** Where the booking was made, for the owner's mail. */
  page: string;
  /** The booking's id, for the calendar file's stable UID. */
  id: number;
  /** How many times the slot moved, for the calendar file's sequence. */
  revision: number;
  /** The owner's mail says the calendar refused when true. */
  calendarFailed: boolean;
  /** The brand's colours at send time (spec 010), which the mail is written in. */
  palette: MailPalette;
}

export interface OutgoingMail {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  attachments?: Array<{ filename: string; content: string; contentType: string }>;
}

export type MailResult = { ok: true } | { ok: false; status: 500 | 503 };

export interface BookingMailer {
  kind: 'live' | 'mock' | 'console';
  send(mail: OutgoingMail): Promise<MailResult>;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

const fill = (template: string, values: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? `{${key}}`);

/** «الثلاثاء، 22 سبتمبر 2026، 10:00 ص إلى 10:30 ص بتوقيت الرياض», the same shape in English. */
export function whenLabel(locale: Locale, start: Date, end: Date): string {
  return `${riyadhSpanLabel(start, end, locale)} ${copyFor(locale).booking.riyadhTime}`;
}

type Row = [label: string, value: string, ltr: boolean];
type Link = { href: string; label: string };

interface Body {
  subject: string;
  intro?: string;
  rows: Row[];
  /** Sentences after the table. */
  lines: string[];
  links: Link[];
}

function render(
  locale: Locale,
  body: Body,
  palette: MailPalette,
): { subject: string; html: string; text: string } {
  const align = locale === 'ar' ? 'right' : 'left';
  const html = `<!doctype html><html lang="${locale}" dir="${htmlDir(locale)}"><body style="font-family:system-ui,sans-serif;line-height:1.7;color:${palette.text}">
<h2 style="margin:0 0 16px">${escapeHtml(body.subject)}</h2>
${body.intro ? `<p>${escapeHtml(body.intro)}</p>` : ''}
<table cellpadding="6" style="border-collapse:collapse">
${body.rows
  .map(
    ([label, value, ltr]) =>
      `<tr><th align="${align}" style="color:${palette.muted};font-weight:500">${escapeHtml(label)}</th><td>${
        ltr ? `<bdi dir="ltr">${escapeHtml(value)}</bdi>` : escapeHtml(value)
      }</td></tr>`,
  )
  .join('\n')}
</table>
${body.lines.map((line) => `<p>${escapeHtml(line)}</p>`).join('\n')}
${body.links.map((link) => `<p><a href="${escapeHtml(link.href)}" style="color:${palette.primary}">${escapeHtml(link.label)}</a></p>`).join('\n')}
</body></html>`;
  const text = [
    ...(body.intro ? [body.intro] : []),
    ...body.rows.map(([label, value]) => `${label}: ${value}`),
    ...body.lines,
    ...body.links.map((link) => `${link.label}: ${link.href}`),
  ].join('\n');
  return { subject: body.subject, html, text };
}

const MERCHANT_SUBJECT: Record<
  BookingMailKind,
  | 'confirmSubject'
  | 'rescheduledSubject'
  | 'cancelledSubject'
  | 'reminder24Subject'
  | 'reminder1Subject'
  | 'linkSubject'
> = {
  confirmation: 'confirmSubject',
  rescheduled: 'rescheduledSubject',
  cancelled: 'cancelledSubject',
  reminder24h: 'reminder24Subject',
  reminder1h: 'reminder1Subject',
  link: 'linkSubject',
};

const MERCHANT_INTRO: Record<
  BookingMailKind,
  'confirmIntro' | 'rescheduledIntro' | 'cancelledIntro' | 'reminderIntro' | 'linkIntro'
> = {
  confirmation: 'confirmIntro',
  rescheduled: 'rescheduledIntro',
  cancelled: 'cancelledIntro',
  reminder24h: 'reminderIntro',
  reminder1h: 'reminderIntro',
  link: 'linkIntro',
};

const OWNER_SUBJECT: Record<
  BookingMailKind,
  | 'newSubject'
  | 'ownerRescheduledSubject'
  | 'ownerCancelledSubject'
  | 'ownerReminder24Subject'
  | 'ownerReminder1Subject'
  | 'ownerLinkSubject'
> = {
  confirmation: 'newSubject',
  rescheduled: 'ownerRescheduledSubject',
  cancelled: 'ownerCancelledSubject',
  reminder24h: 'ownerReminder24Subject',
  reminder1h: 'ownerReminder1Subject',
  link: 'ownerLinkSubject',
};

/** The calendar file's name, ASCII so every mail client keeps it. */
export const ICS_FILENAME = 'b7r-consultation.ics';

/** The calendar file of a booking, as the confirmation attaches it and the route serves it. */
export function bookingIcs(
  input: Pick<
    BookingMailInput,
    'id' | 'start' | 'end' | 'title' | 'name' | 'meetLink' | 'revision'
  >,
  cancelled = false,
): string {
  return buildIcs({
    uid: `booking-${input.id}@b7r.sa`,
    start: input.start,
    end: input.end,
    summary: `${input.title}: ${input.name}`,
    description: input.meetLink ?? '',
    url: input.meetLink,
    sequence: input.revision,
    cancelled,
  });
}

/**
 * The merchant's mail of a kind, in their language. `replyTo` is the contact address, so a
 * merchant who answers the mail reaches B7R rather than the sender's no-reply box.
 */
export function buildMerchantMail(
  kind: BookingMailKind,
  input: BookingMailInput,
  replyTo?: string,
): OutgoingMail {
  const { bookingEmail: e } = copyFor(input.locale);
  const values = { name: input.name, title: input.title };
  const active = kind !== 'cancelled';
  const rows: Row[] = [[e.when, whenLabel(input.locale, input.start, input.end), false]];
  if (active && input.meetLink) rows.push([e.meet, input.meetLink, true]);
  const lines: string[] = [];
  if (active && !input.meetLink && kind !== 'link') lines.push(e.linkFollows);
  if (kind === 'confirmation') lines.push(e.calendarFile);
  const links: Link[] = active
    ? [{ href: input.manageUrl, label: e.manage }]
    : [{ href: input.manageUrl.replace(/\/book\/manage.*$/, '/book'), label: e.bookAgain }];
  const mail = render(
    input.locale,
    {
      subject: fill(e[MERCHANT_SUBJECT[kind]], values),
      intro: fill(e[MERCHANT_INTRO[kind]], values),
      rows,
      lines,
      links,
    },
    input.palette,
  );
  return {
    to: input.email,
    ...mail,
    ...(replyTo ? { replyTo } : {}),
    ...(kind === 'confirmation' || kind === 'rescheduled'
      ? {
          attachments: [
            {
              filename: ICS_FILENAME,
              content: Buffer.from(bookingIcs(input), 'utf8').toString('base64'),
              contentType: 'text/calendar',
            },
          ],
        }
      : {}),
  };
}

/** Dhia's mail of a kind, at the contact address, in the merchant's language. */
export function buildOwnerMail(
  kind: BookingMailKind,
  input: BookingMailInput,
  to: string,
): OutgoingMail {
  const { bookingEmail: e, contactForm } = copyFor(input.locale);
  const when = whenLabel(input.locale, input.start, input.end);
  const values = { name: input.name, when };
  const rows: Row[] = [
    [contactForm.labels.name, input.name, false],
    [contactForm.labels.phone, formatSaudiPhone(input.phone), true],
    [contactForm.labels.email, input.email, true],
    [e.when, when, false],
  ];
  if (input.meetLink && kind !== 'cancelled') rows.push([e.meet, input.meetLink, true]);
  if (input.note) rows.push([e.noteLabel, input.note, false]);
  if (kind === 'confirmation') rows.push([e.pageLabel, input.page, true]);
  const lines = input.calendarFailed && kind !== 'cancelled' ? [e.calendarFailed] : [];
  const mail = render(
    input.locale,
    {
      subject: fill(e[OWNER_SUBJECT[kind]], values),
      ...(kind === 'confirmation' ? { intro: e.newIntro } : {}),
      rows,
      lines,
      links: [{ href: input.adminUrl, label: e.openInPanel }],
    },
    input.palette,
  );
  return { to, ...mail, replyTo: input.email };
}
