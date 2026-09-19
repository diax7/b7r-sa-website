import type { Payload } from 'payload';
import type { Locale } from '@/lib/i18n';
import { MESSAGES, type MessageStatus } from '@/modules/inbox/messages';
import type { Utm } from '@/modules/inbox/origin';

/** What the contact route hands the inbox: the form's fields and where the form was. */
export interface IncomingMessage {
  name: string;
  phone: string;
  email: string;
  inquiry: string;
  message: string;
  locale: Locale;
  page?: string;
  utm?: Utm;
}

/**
 * The one writer of the inbox (ADR-061): the row goes in before the notification e-mail is
 * attempted, with `emailed: false`, through the Local API with access overridden (the
 * collection refuses every create through the API). Nothing personal is logged here or by
 * the caller: a failure names the row's id.
 */
export async function storeMessage(payload: Payload, input: IncomingMessage): Promise<number> {
  const { id } = await payload.create({
    collection: MESSAGES,
    data: {
      name: input.name,
      phone: input.phone,
      email: input.email,
      inquiry: input.inquiry,
      message: input.message,
      locale: input.locale,
      page: input.page ?? null,
      utm: {
        source: input.utm?.source ?? null,
        medium: input.utm?.medium ?? null,
        campaign: input.utm?.campaign ?? null,
      },
      status: 'new',
      emailed: false,
    },
    depth: 0,
    overrideAccess: true,
  });
  return id;
}

/** The notification e-mail went out: the row says so. */
export async function markEmailed(payload: Payload, id: number): Promise<void> {
  await payload.update({
    collection: MESSAGES,
    id,
    data: { emailed: true },
    depth: 0,
    overrideAccess: true,
  });
}

/**
 * The status a person sets from the panel ("Mark handled"), written with that person's
 * access: the collection's rule (admins and editors) decides, never the route.
 */
export async function setMessageStatus(
  payload: Payload,
  args: {
    id: number;
    status: MessageStatus;
    user: NonNullable<Parameters<Payload['update']>[0]['user']>;
  },
): Promise<void> {
  await payload.update({
    collection: MESSAGES,
    id: args.id,
    data: { status: args.status },
    depth: 0,
    user: args.user,
    overrideAccess: false,
  });
}
