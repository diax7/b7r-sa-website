import { APIError, type Payload, type TypedUser } from 'payload';
import type { Locale } from '@/lib/i18n';
import { adminStringsFor } from '@/modules/cms/admin/strings';
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
  args: { id: number; status: MessageStatus; user: TypedUser },
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

/**
 * What "Mark handled" says when Payload refuses the write (ADR-061): the panel's own
 * sentence in the caller's language, by the status alone, never Payload's English
 * message under an Arabic button. A refusal that is not Payload's is rethrown.
 */
export function refusalOf(error: unknown, language: string): { status: number; error?: string } {
  if (!(error instanceof APIError)) throw error;
  const s = adminStringsFor(language).inbox;
  if (error.status === 404) return { status: 404, error: s.gone };
  if (error.status === 403) return { status: 403, error: s.refused };
  return { status: error.status };
}
