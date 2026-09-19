import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyFor } from '@/content/copy';
import {
  bookingIcs,
  type BookingMailInput,
  buildMerchantMail,
  buildOwnerMail,
  clearBookingOutbox,
  getBookingMailer,
  ICS_FILENAME,
  maskAddress,
  mockBookingOutbox,
  whenLabel,
} from '@/lib/booking-mail';
import { buildIcs, icsStamp, icsText } from '@/lib/ics';
import type { Locale } from '@/lib/i18n';

const input = (locale: Locale, extra: Partial<BookingMailInput> = {}): BookingMailInput => ({
  locale,
  title: locale === 'ar' ? 'استشارة مجانية، 30 دقيقة' : 'Free consultation, 30 minutes',
  name: locale === 'ar' ? 'ضياء' : 'Dhia',
  email: 'merchant@example.com',
  phone: '966501699572',
  note: '',
  start: new Date('2026-09-22T07:00:00Z'),
  end: new Date('2026-09-22T07:30:00Z'),
  meetLink: 'https://meet.google.com/abc-defg-hij',
  manageUrl: 'https://b7r.sa/book/manage?token=1.abc',
  adminUrl: 'https://b7r.sa/admin/collections/bookings/1',
  page: '/book',
  id: 1,
  revision: 0,
  calendarFailed: false,
  ...extra,
});

const ARABIC_DIGITS = /[٠-٩]/;
const EM_DASH = String.fromCharCode(0x2014);

describe('the time as the e-mails say it (ADR-062)', () => {
  it('reads Riyadh with Western digits in both languages', () => {
    expect(
      whenLabel('ar', new Date('2026-09-22T07:00:00Z'), new Date('2026-09-22T07:30:00Z')),
    ).toBe('الثلاثاء، 22 سبتمبر 2026، 10:00 ص إلى 10:30 ص بتوقيت الرياض');
    expect(
      whenLabel('en', new Date('2026-09-22T14:40:00Z'), new Date('2026-09-22T15:10:00Z')),
    ).toBe('Tuesday, 22 September 2026, 5:40 pm to 6:10 pm Riyadh time');
  });
});

describe('the calendar file', () => {
  it('stamps, escapes and folds as RFC 5545 asks, with a stable UID and a sequence', () => {
    expect(icsStamp(new Date('2026-09-22T07:00:00.000Z'))).toBe('20260922T070000Z');
    expect(icsText('a, b; c\\d\nline')).toBe('a\\, b\\; c\\\\d\\nline');
    const ics = buildIcs({
      uid: 'booking-1@b7r.sa',
      start: new Date('2026-09-22T07:00:00Z'),
      end: new Date('2026-09-22T07:30:00Z'),
      summary: 'استشارة مجانية، 30 دقيقة: ضياء',
      description: 'x'.repeat(120),
      url: 'https://meet.google.com/abc-defg-hij',
      stamp: new Date('2026-09-20T06:00:00Z'),
      sequence: 2,
    });
    const lines = ics.split('\r\n');
    expect(lines[0]).toBe('BEGIN:VCALENDAR');
    expect(lines).toContain('UID:booking-1@b7r.sa');
    expect(lines).toContain('DTSTART:20260922T070000Z');
    expect(lines).toContain('DTEND:20260922T073000Z');
    expect(lines).toContain('DTSTAMP:20260920T060000Z');
    expect(lines).toContain('SEQUENCE:2');
    expect(lines).toContain('STATUS:CONFIRMED');
    expect(lines).toContain('URL:https://meet.google.com/abc-defg-hij');
    expect(lines).toContain('SUMMARY:استشارة مجانية، 30 دقيقة: ضياء');
    // The long description is folded: a continuation line starts with a space, none over 75 octets.
    const description = lines.findIndex((l) => l.startsWith('DESCRIPTION:'));
    expect(lines[description + 1]!.startsWith(' ')).toBe(true);
    for (const line of lines) expect(Buffer.byteLength(line), line).toBeLessThanOrEqual(75);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(
      buildIcs({
        uid: 'u',
        start: new Date(),
        end: new Date(),
        summary: 's',
        description: '',
        cancelled: true,
      }),
    ).toContain('STATUS:CANCELLED');
  });

  it('a booking file names the consultation and the merchant, carries the Meet link and the revision', () => {
    const ics = bookingIcs(input('en', { revision: 1 }));
    expect(ics).toContain('UID:booking-1@b7r.sa');
    expect(ics).toContain('SUMMARY:Free consultation\\, 30 minutes: Dhia');
    expect(ics).toContain('SEQUENCE:1');
    expect(ics).toContain('LOCATION:https://meet.google.com/abc-defg-hij');
    expect(bookingIcs(input('ar', { meetLink: null }))).not.toContain('URL:');
  });
});

describe('the merchant mails, in both languages', () => {
  for (const locale of ['ar', 'en'] as const) {
    const copy = copyFor(locale).bookingEmail;

    it(`${locale}: the confirmation carries the time, the Meet link, the manage link and the calendar file`, () => {
      const mail = buildMerchantMail('confirmation', input(locale));
      expect(mail.to).toBe('merchant@example.com');
      expect(mail.subject).toBe(copy.confirmSubject.replace('{title}', input(locale).title));
      expect(mail.text).toContain(copy.confirmIntro.replace('{name}', input(locale).name));
      expect(mail.text).toContain(whenLabel(locale, input(locale).start, input(locale).end));
      expect(mail.text).toContain('https://meet.google.com/abc-defg-hij');
      expect(mail.text).toContain('https://b7r.sa/book/manage?token=1.abc');
      expect(mail.text).toContain(copy.calendarFile);
      expect(mail.text).not.toContain(copy.linkFollows);
      expect(mail.html).toContain(
        `<html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}">`,
      );
      expect(mail.html).toContain('<bdi dir="ltr">https://meet.google.com/abc-defg-hij</bdi>');
      expect(mail.attachments).toHaveLength(1);
      expect(mail.attachments![0]).toMatchObject({
        filename: ICS_FILENAME,
        contentType: 'text/calendar',
      });
      const ics = Buffer.from(mail.attachments![0]!.content, 'base64').toString('utf8');
      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('DTSTART:20260922T070000Z');
      expect(mail.text).not.toMatch(ARABIC_DIGITS);
      expect(mail.text).not.toContain(EM_DASH);
    });

    it(`${locale}: without a Meet link the confirmation says the link follows`, () => {
      const mail = buildMerchantMail('confirmation', input(locale, { meetLink: null }));
      expect(mail.text).toContain(copy.linkFollows);
      expect(mail.text).not.toContain('meet.google.com');
      expect(mail.attachments).toHaveLength(1);
    });

    it(`${locale}: the link mail carries the Meet link and no attachment`, () => {
      const mail = buildMerchantMail('link', input(locale));
      expect(mail.subject).toBe(copy.linkSubject.replace('{title}', input(locale).title));
      expect(mail.text).toContain('https://meet.google.com/abc-defg-hij');
      expect(mail.text).not.toContain(copy.linkFollows);
      expect(mail.attachments).toBeUndefined();
    });

    it(`${locale}: the reschedule carries the new time and a fresh calendar file; the cancel offers to book again`, () => {
      const moved = buildMerchantMail('rescheduled', input(locale, { revision: 1 }));
      expect(moved.subject).toBe(copy.rescheduledSubject.replace('{title}', input(locale).title));
      expect(moved.text).toContain(copy.rescheduledIntro.replace('{name}', input(locale).name));
      expect(moved.attachments).toHaveLength(1);
      expect(Buffer.from(moved.attachments![0]!.content, 'base64').toString('utf8')).toContain(
        'SEQUENCE:1',
      );
      const cancelled = buildMerchantMail('cancelled', input(locale));
      expect(cancelled.subject).toBe(copy.cancelledSubject.replace('{title}', input(locale).title));
      expect(cancelled.text).toContain(copy.cancelledIntro.replace('{name}', input(locale).name));
      expect(cancelled.text).not.toContain('meet.google.com');
      expect(cancelled.text).not.toContain('/book/manage');
      expect(cancelled.text).toContain(`${copy.bookAgain}: https://b7r.sa/book`);
      expect(cancelled.attachments).toBeUndefined();
    });

    it(`${locale}: the two reminders name the time and the link`, () => {
      const day = buildMerchantMail('reminder24h', input(locale));
      expect(day.subject).toBe(copy.reminder24Subject);
      expect(day.text).toContain(copy.reminderIntro.replace('{name}', input(locale).name));
      expect(day.text).toContain('https://meet.google.com/abc-defg-hij');
      const hour = buildMerchantMail('reminder1h', input(locale));
      expect(hour.subject).toBe(copy.reminder1Subject);
      expect(hour.text).toContain('https://b7r.sa/book/manage?token=1.abc');
    });
  }
});

describe("Dhia's mails, at the contact address", () => {
  for (const locale of ['ar', 'en'] as const) {
    const copy = copyFor(locale).bookingEmail;
    const labels = copyFor(locale).contactForm.labels;

    it(`${locale}: the new-booking mail lists the merchant, the time, the note and the page, replies to the merchant`, () => {
      const mail = buildOwnerMail(
        'confirmation',
        input(locale, { note: 'ربط متجري' }),
        'contact@b7r.sa',
      );
      const when = whenLabel(locale, input(locale).start, input(locale).end);
      expect(mail.to).toBe('contact@b7r.sa');
      expect(mail.replyTo).toBe('merchant@example.com');
      expect(mail.subject).toBe(
        `${copy.newSubject.replace('{name}', input(locale).name).replace('{when}', when)}`,
      );
      expect(mail.text).toContain(copy.newIntro);
      expect(mail.text).toContain(`${labels.name}: ${input(locale).name}`);
      expect(mail.text).toContain(`${labels.phone}: 050 169 9572`);
      expect(mail.text).toContain(`${labels.email}: merchant@example.com`);
      expect(mail.text).toContain(`${copy.noteLabel}: ربط متجري`);
      expect(mail.text).toContain(`${copy.pageLabel}: /book`);
      expect(mail.text).toContain(
        `${copy.openInPanel}: https://b7r.sa/admin/collections/bookings/1`,
      );
      expect(mail.text).not.toContain(copy.calendarFailed);
      expect(mail.attachments).toBeUndefined();
    });

    it(`${locale}: a calendar failure is said in the new-booking mail and the reminders, never in a cancel`, () => {
      const failed = input(locale, { meetLink: null, calendarFailed: true });
      expect(buildOwnerMail('confirmation', failed, 'c@b7r.sa').text).toContain(
        copy.calendarFailed,
      );
      expect(buildOwnerMail('reminder24h', failed, 'c@b7r.sa').text).toContain(copy.calendarFailed);
      expect(buildOwnerMail('cancelled', failed, 'c@b7r.sa').text).not.toContain(
        copy.calendarFailed,
      );
    });

    it(`${locale}: the move, the cancel, the reminders and the link carry their subjects with the name and the time`, () => {
      const when = whenLabel(locale, input(locale).start, input(locale).end);
      const subject = (kind: Parameters<typeof buildOwnerMail>[0]) =>
        buildOwnerMail(kind, input(locale), 'c@b7r.sa').subject;
      expect(subject('rescheduled')).toBe(
        copy.ownerRescheduledSubject.replace('{name}', input(locale).name).replace('{when}', when),
      );
      expect(subject('cancelled')).toBe(
        copy.ownerCancelledSubject.replace('{name}', input(locale).name).replace('{when}', when),
      );
      expect(subject('reminder24h')).toBe(
        copy.ownerReminder24Subject.replace('{name}', input(locale).name).replace('{when}', when),
      );
      expect(subject('reminder1h')).toBe(
        copy.ownerReminder1Subject.replace('{name}', input(locale).name),
      );
      expect(subject('link')).toBe(
        copy.ownerLinkSubject.replace('{name}', input(locale).name).replace('{when}', when),
      );
      expect(buildOwnerMail('cancelled', input(locale), 'c@b7r.sa').text).not.toContain(
        'meet.google.com',
      );
    });
  }
});

describe('the mailer', () => {
  afterEach(() => {
    clearBookingOutbox();
    vi.unstubAllEnvs();
  });

  it('is the console without a key: one line with the subject and a masked address, never the body', async () => {
    const info = vi.fn();
    const mailer = getBookingMailer({ info });
    expect(mailer.kind).toBe('console');
    const mail = buildMerchantMail('confirmation', input('en'));
    expect(await mailer.send(mail)).toEqual({ ok: true });
    expect(info).toHaveBeenCalledTimes(1);
    const line = String(info.mock.calls[0]![0]);
    expect(line).toContain(mail.subject);
    expect(line).toContain('m***@example.com');
    expect(line).not.toContain('merchant@example.com');
    expect(line).not.toContain('meet.google.com');
    expect(maskAddress('dhia@b7r.sa')).toBe('d***@b7r.sa');
  });

  it('keeps the mails in the outbox under CONTACT_TRANSPORT=mock without a key', async () => {
    vi.stubEnv('CONTACT_TRANSPORT', 'mock');
    const mailer = getBookingMailer();
    expect(mailer.kind).toBe('mock');
    await mailer.send(buildMerchantMail('confirmation', input('ar')));
    expect(mockBookingOutbox()).toHaveLength(1);
    expect(mockBookingOutbox()[0]!.to).toBe('merchant@example.com');
  });

  it('is live with a Resend key, whatever the override says', () => {
    vi.stubEnv('RESEND_API_KEY', 're_test');
    vi.stubEnv('CONTACT_TRANSPORT', 'mock');
    expect(getBookingMailer().kind).toBe('live');
  });
});
