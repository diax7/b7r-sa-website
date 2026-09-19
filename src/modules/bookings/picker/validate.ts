import type { SiteCopy } from '@/content/copy';
import { normalisePhone } from '@/lib/phone';

/** The strings the picker reads: its own bank section, and the contact form's field labels and rules. */
export interface PickerCopy {
  booking: SiteCopy['booking'];
  labels: SiteCopy['contactForm']['labels'];
  placeholders: SiteCopy['contactForm']['placeholders'];
  validation: SiteCopy['contactForm']['validation'];
  whatsapp: SiteCopy['contactForm']['successWhatsapp'];
  loading: SiteCopy['a11y']['loading'];
  /** The bank's `Intl` tag, so the island formats Riyadh times without a bank of its own. */
  dateLocale: SiteCopy['dateLocale'];
}

/** The contact form's limits (BRD 4.11), the same numbers: `tests/booking-routes.test.ts` pins them. */
export const NAME_MIN = 2;
export const NAME_MAX = 120;
export const EMAIL_MAX = 254;
/** The merchant's note to the consultation: short, optional. */
export const NOTE_MAX = 1000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type PickerField = 'name' | 'phone' | 'email';
export type PickerValues = Record<PickerField | 'note', string>;
export type PickerErrors = Partial<Record<PickerField, string>>;

/**
 * Client-side rules for the picker's form (ADR-062): the contact form's messages under the
 * name, the phone and the e-mail; the note is capped by its box. Free of zod, so the
 * island's chunk stays small; the API re-validates with `bookingBodySchema`.
 */
export function validatePicker(values: PickerValues, copy: PickerCopy): PickerErrors {
  const errors: PickerErrors = {};
  const name = values.name.trim();
  if (name.length < NAME_MIN || name.length > NAME_MAX) errors.name = copy.validation.name;
  if (!normalisePhone(values.phone)) errors.phone = copy.validation.phone;
  const email = values.email.trim();
  if (!EMAIL.test(email) || email.length > EMAIL_MAX) errors.email = copy.validation.email;
  return errors;
}
