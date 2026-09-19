'use client';

import { useDocumentInfo, useForm, useFormFields } from '@payloadcms/ui';
import { CheckCheck, Mail, MessageCircle } from 'lucide-react';
import { Icon } from '@/components/shared/icon';
import { whatsappUrl } from '@/lib/utm';
import { ApiAction } from '@/modules/cms/admin/api-action';
import { useAdminStrings } from '@/modules/cms/admin/use-admin-strings';

/** A bordered secondary action beside the primary one (the content card's button, ADR-059). */
const link =
  'inline-flex h-10 items-center gap-2 rounded-base border border-border bg-surface px-4 text-small font-medium text-text transition-colors duration-(--duration-fast) hover:border-text-muted/60 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40';

const fieldValue = (fields: Record<string, { value?: unknown } | undefined>, name: string) =>
  typeof fields[name]?.value === 'string' ? (fields[name]?.value as string) : '';

/** The digits wa.me wants: the canonical `9665…` as it is, an international `+…` without the plus. */
const waDigits = (phone: string) => phone.replace(/^\+/, '');

/**
 * The three actions above a message (ADR-061): "Reply on WhatsApp" (a `wa.me` link with a
 * greeting in the sender's language, only when the row has a phone), "Reply by e-mail" (a
 * `mailto:` with a subject in that language) and "Mark handled" (`ApiAction` on the inbox
 * route, which writes with the person's own access). The two links open the sender's
 * channel outside the panel; the third says what happened beside the button and turns the
 * form's status select to Handled without marking the form dirty (an `UPDATE` with its
 * `initialValue`, never a user edit). Absent on a create form, which the collection has none of.
 */
export function MessageActions() {
  const s = useAdminStrings().inbox;
  const { id } = useDocumentInfo();
  const { dispatchFields } = useForm();
  const name = useFormFields(([fields]) => fieldValue(fields, 'name'));
  const phone = useFormFields(([fields]) => fieldValue(fields, 'phone'));
  const email = useFormFields(([fields]) => fieldValue(fields, 'email'));
  const locale = useFormFields(([fields]) => fieldValue(fields, 'locale')) || 'ar';
  const status = useFormFields(([fields]) => fieldValue(fields, 'status'));
  if (typeof id !== 'number') return null;
  const greeting = (s.reply.greeting[locale] ?? s.reply.greeting['ar'] ?? '').replace(
    '{name}',
    name,
  );
  const subject = s.reply.subject[locale] ?? s.reply.subject['ar'] ?? '';
  return (
    <div
      className="mb-6 flex flex-wrap items-center gap-3"
      data-admin-ui=""
      data-admin-message-actions=""
    >
      {phone && (
        <a
          href={whatsappUrl(waDigits(phone), greeting)}
          target="_blank"
          rel="noopener"
          className={link}
          data-admin-action="reply-whatsapp"
        >
          <Icon icon={MessageCircle} size={16} />
          {s.replyWhatsApp}
        </a>
      )}
      {email && (
        <a
          href={`mailto:${email}?subject=${encodeURIComponent(subject)}`}
          className={link}
          data-admin-action="reply-email"
        >
          <Icon icon={Mail} size={16} />
          {s.replyEmail}
        </a>
      )}
      <ApiAction
        label={s.markHandled}
        busyLabel={s.marking}
        doneLabel={s.handled}
        onDone={() =>
          dispatchFields({
            type: 'UPDATE',
            path: 'status',
            value: 'handled',
            initialValue: 'handled',
          })
        }
        icon={CheckCheck}
        endpoint={`/api/inbox/messages/${id}/handle`}
        body={{}}
        testId="mark-handled"
        {...(status === 'handled' ? { disabled: s.alreadyHandled } : {})}
      />
    </div>
  );
}
