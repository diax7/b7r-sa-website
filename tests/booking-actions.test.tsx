import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { STATUS_TONES, statusTone } from '@/modules/cms/admin/fields/status-cell';
import { adminStrings, adminStringsAr } from '@/modules/cms/admin/strings';

// The action reads the form and the UI language through Payload's hooks; the test hands it
// each directly, as the read-only line's test does.
let form: Record<string, string> = {};
let documentId: unknown = 12;
let uiLanguage = 'en';
vi.mock('@payloadcms/ui', () => ({
  Link: ({ children, ...props }: { children?: React.ReactNode }) => <a {...props}>{children}</a>,
  useDocumentInfo: () => ({ id: documentId }),
  useFormFields: (pick: (state: [Record<string, { value: string }>]) => string) =>
    pick([Object.fromEntries(Object.entries(form).map(([k, v]) => [k, { value: v }]))]),
  useTranslation: () => ({ i18n: { language: uiLanguage, t: (k: string) => k } }),
}));

const { BookingActions, reminderText } = await import('@/modules/bookings/admin/booking-actions');
const { todayQuery } = await import('@/modules/inbox/admin/inbox-card');

const start = new Date('2026-09-22T07:00:00Z');
const end = new Date('2026-09-22T07:30:00Z');
const row = (locale: string, meetLink = 'https://meet.google.com/abc-defg-hij') => ({
  name: 'Nora',
  locale,
  start,
  end,
  meetLink,
});

describe('the WhatsApp reminder above a booking (ADR-062)', () => {
  it("writes the reminder in the merchant's language, the span on the Riyadh clock, the Meet link when there is one", () => {
    for (const s of [adminStrings.bookings, adminStringsAr.bookings]) {
      expect(reminderText(s, row('ar'))).toBe(
        'مرحباً Nora، معك بحر برنت: نذكّرك بموعد استشارتك الثلاثاء، 22 سبتمبر 2026، 10:00 ص إلى 10:30 ص بتوقيت الرياض. رابط Meet: https://meet.google.com/abc-defg-hij',
      );
      expect(reminderText(s, row('en'))).toBe(
        'Hello Nora, this is B7R Print: a reminder of your consultation on Tuesday, 22 September 2026, 10:00 am to 10:30 am, Riyadh time. Meet link: https://meet.google.com/abc-defg-hij',
      );
      // No Meet link (the calendar failed or is off): the sentence ends at the clock.
      expect(reminderText(s, row('en', ''))).toBe(
        'Hello Nora, this is B7R Print: a reminder of your consultation on Tuesday, 22 September 2026, 10:00 am to 10:30 am, Riyadh time.',
      );
      // An unknown locale reads as Arabic, the site's first language.
      expect(reminderText(s, row('fr', ''))).toMatch(/^مرحباً Nora/);
    }
  });

  it('is a wa.me link to the phone with the text, whatever the panel language; gone once the booking is behind or has no phone', () => {
    form = {
      name: 'Nora',
      phone: '966501234567',
      locale: 'en',
      start: start.toISOString(),
      end: end.toISOString(),
      meetLink: '',
      status: 'booked',
    };
    uiLanguage = 'ar';
    const { container, unmount } = render(<BookingActions />);
    const link = container.querySelector('[data-admin-action="remind-whatsapp"]')!;
    expect(link.getAttribute('href')).toBe(
      `https://wa.me/966501234567?text=${encodeURIComponent(reminderText(adminStrings.bookings, row('en', '')))}`,
    );
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.textContent).toBe('ذكّر على WhatsApp');
    expect(container.querySelector('[data-admin-booking-actions]')).not.toBeNull();
    unmount();
    // An international number loses its plus for wa.me.
    form = { ...form, phone: '+14155551234' };
    uiLanguage = 'en';
    const withPlus = render(<BookingActions />);
    expect(
      withPlus.container
        .querySelector('[data-admin-action="remind-whatsapp"]')!
        .getAttribute('href'),
    ).toMatch(/^https:\/\/wa\.me\/14155551234\?text=/);
    expect(withPlus.container.textContent).toContain('Remind on WhatsApp');
    withPlus.unmount();
    for (const status of ['cancelled', 'completed']) {
      form = { ...form, status };
      const gone = render(<BookingActions />);
      expect(gone.container.innerHTML).toBe('');
      gone.unmount();
    }
    form = { ...form, status: 'rescheduled', phone: '' };
    expect(render(<BookingActions />).container.innerHTML).toBe('');
    form = { ...form, phone: '966501234567', start: 'not a date' };
    expect(render(<BookingActions />).container.innerHTML).toBe('');
    form = { ...form, start: start.toISOString() };
    documentId = undefined;
    expect(render(<BookingActions />).container.innerHTML).toBe('');
  });
});

describe('the booking words on the dashboard and in the list (ADR-062)', () => {
  it('colours the status pill: booked green, rescheduled amber, cancelled red, completed neutral', () => {
    expect(STATUS_TONES['booked']).toBe('success');
    expect(STATUS_TONES['rescheduled']).toBe('warning');
    expect(STATUS_TONES['cancelled']).toBe('error');
    expect(statusTone('completed')).toBe('muted');
  });

  it('narrows the bookings list to the Riyadh day the card counts, soonest first', () => {
    const query = new URLSearchParams(todayQuery(new Date('2026-09-18T07:00:00Z')));
    expect(query.get('where[start][greater_than_equal]')).toBe('2026-09-17T21:00:00.000Z');
    expect(query.get('where[start][less_than]')).toBe('2026-09-18T21:00:00.000Z');
    expect(query.get('sort')).toBe('start');
  });
});
