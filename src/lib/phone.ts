import type { Locale } from '@/lib/i18n';

/**
 * Phone numbers for the contact form (BRD 4.11, 4.17). The page invites merchants, partners
 * and investors, so any international number is accepted; Saudi mobiles are canonicalised
 * because they drive the «رد عبر واتساب» link.
 */
function digitsOf(input: string): string {
  return input.replace(/[\s\-().]/g, '');
}

/**
 * Saudi mobile numbers in the forms people actually type, `05XXXXXXXX`, `5XXXXXXXX`,
 * `+9665XXXXXXXX`, `009665XXXXXXXX`, `9665XXXXXXXX`, with spaces or dashes, as the canonical
 * `9665XXXXXXXX` used by wa.me, or null when the input is not a Saudi mobile.
 */
export function normaliseSaudiPhone(input: string): string | null {
  const digits = digitsOf(input).replace(/^\+/, '');
  const match = /^(?:00966|966|0)?(5\d{8})$/.exec(digits);
  return match?.[1] ? `966${match[1]}` : null;
}

export function isSaudiMobile(canonical: string): boolean {
  return /^9665\d{8}$/.test(canonical);
}

/**
 * Any phone number: Saudi mobiles become `9665…`; other numbers keep their digits with an
 * optional leading `+` (`00` is rewritten to `+`), 8–15 digits (E.164 range). Null otherwise.
 */
export function normalisePhone(input: string): string | null {
  const saudi = normaliseSaudiPhone(input);
  if (saudi) return saudi;
  const raw = digitsOf(input).replace(/^00/, '+');
  const match = /^(\+?)(\d{8,15})$/.exec(raw);
  return match ? `${match[1]}${match[2]}` : null;
}

/** `9665XXXXXXXX` → `05X XXX XXXX` for display; other inputs are returned untouched. */
export function formatSaudiPhone(canonical: string): string {
  const match = /^966(5\d)(\d{3})(\d{4})$/.exec(canonical);
  return match ? `0${match[1]} ${match[2]} ${match[3]}` : canonical;
}

/** `+9665XXXXXXXX` → `+966 5X XXX XXXX`, the form an English reader expects; other inputs untouched. */
export function formatIntlPhone(e164: string): string {
  const match = /^\+966(5\d)(\d{3})(\d{4})$/.exec(e164);
  return match ? `+966 ${match[1]} ${match[2]} ${match[3]}` : e164;
}

/**
 * The contact number as the site shows it (site audit 2026-09-18, item 14): the local form
 * on the Arabic site, the international form on the English one; both dial `phoneIntl`.
 */
export function displayPhone(
  locale: Locale,
  contact: { phone: string; phoneIntl: string },
): string {
  return locale === 'en' ? formatIntlPhone(contact.phoneIntl) : contact.phone;
}
