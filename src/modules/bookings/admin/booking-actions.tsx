'use client';

import { useDocumentInfo, useFormFields } from '@payloadcms/ui';
import { MessageCircle } from 'lucide-react';
import { Icon } from '@/components/shared/icon';
import { type DateLocaleKey, riyadhSpanLabel } from '@/lib/riyadh';
import { whatsappUrl } from '@/lib/utm';
import { useAdminStrings } from '@/modules/cms/admin/use-admin-strings';
import { UPCOMING_STATUSES } from '@/modules/bookings/status';

/** A bordered secondary action above the form (the message's own, ADR-061). */
const link =
  'inline-flex h-10 items-center gap-2 rounded-base border border-border bg-surface px-4 text-small font-medium text-text transition-colors duration-(--duration-fast) hover:border-text-muted/60 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40';

const fieldValue = (fields: Record<string, { value?: unknown } | undefined>, name: string) =>
  typeof fields[name]?.value === 'string' ? (fields[name]?.value as string) : '';

/** The digits wa.me wants: the canonical `9665…` as it is, an international `+…` without the plus. */
const waDigits = (phone: string) => phone.replace(/^\+/, '');

const fill = (template: string, values: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? '');

/**
 * The reminder text in the merchant's language: the greeting with the span on the Riyadh
 * clock, then the Meet sentence when the row has a link. Exported for the test; the
 * component reads the form.
 */
export function reminderText(
  s: { reminder: Record<string, string>; reminderLink: Record<string, string> },
  row: { name: string; locale: string; start: Date; end: Date; meetLink: string },
): string {
  const locale: DateLocaleKey = row.locale === 'en' ? 'en' : 'ar';
  const when = riyadhSpanLabel(row.start, row.end, locale);
  const head = fill(s.reminder[locale] ?? '', { name: row.name, when });
  const tail = row.meetLink ? ` ${fill(s.reminderLink[locale] ?? '', { link: row.meetLink })}` : '';
  return `${head}${tail}`;
}

/**
 * The action above a booking (ADR-062): "Remind on WhatsApp", a `wa.me` link to the
 * merchant's phone with the reminder prefilled in the merchant's language (the booking's
 * `locale`), whatever the panel's; nothing automatic (the Business API is a later block).
 * Shown while the booking is still ahead (booked or rescheduled): a cancelled or completed
 * one has nothing to remind. Absent on a create form, which the collection has none of.
 */
export function BookingActions() {
  const s = useAdminStrings().bookings;
  const { id } = useDocumentInfo();
  const name = useFormFields(([fields]) => fieldValue(fields, 'name'));
  const phone = useFormFields(([fields]) => fieldValue(fields, 'phone'));
  const locale = useFormFields(([fields]) => fieldValue(fields, 'locale')) || 'ar';
  const start = useFormFields(([fields]) => fieldValue(fields, 'start'));
  const end = useFormFields(([fields]) => fieldValue(fields, 'end'));
  const meetLink = useFormFields(([fields]) => fieldValue(fields, 'meetLink'));
  const status = useFormFields(([fields]) => fieldValue(fields, 'status'));
  const ahead = (UPCOMING_STATUSES as readonly string[]).includes(status);
  if (typeof id !== 'number' || !phone || !ahead) return null;
  const startAt = new Date(start);
  const endAt = new Date(end);
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) return null;
  const text = reminderText(s, { name, locale, start: startAt, end: endAt, meetLink });
  return (
    <div
      className="mb-6 flex flex-wrap items-center gap-3"
      data-admin-ui=""
      data-admin-booking-actions=""
    >
      <a
        href={whatsappUrl(waDigits(phone), text)}
        target="_blank"
        rel="noopener"
        className={link}
        data-admin-action="remind-whatsapp"
      >
        <Icon icon={MessageCircle} size={16} />
        {s.remindWhatsApp}
      </a>
    </div>
  );
}
