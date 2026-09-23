import type { Payload } from 'payload';
import type { MailPalette } from '@/lib/mail-palette';
import { APPEARANCE, mailPalette, toAppearance } from '@/modules/brand/appearance';

/**
 * The colours of an e-mail about to be sent (spec 010, phase 1d), read from the Appearance
 * global with the sender's Payload: a booking, a contact message, a password reset. It takes
 * the Payload it is handed and imports no client of its own, so the reset e-mail, which sits
 * inside the Payload config's graph, can call it without a cycle. A read that fails writes
 * the mail in the shipped colours and says so; a mail is never held back for its colours.
 */
export async function readMailPalette(payload: Payload): Promise<MailPalette> {
  try {
    const doc = await payload.findGlobal({ slug: APPEARANCE, depth: 0, overrideAccess: true });
    return mailPalette(toAppearance(doc).appearance);
  } catch (error) {
    payload.logger.warn({
      msg: `appearance: the e-mail colours could not be read (${error instanceof Error ? error.message : String(error)}); the shipped colours apply`,
    });
    return mailPalette(toAppearance(null).appearance);
  }
}
