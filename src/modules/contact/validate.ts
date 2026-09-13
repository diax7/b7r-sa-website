import { contactForm } from '@/content/pages';
import { normalisePhone } from '@/lib/phone';

/** BRD 4.11 inquiry types, in the order the select shows them. */
export const INQUIRY_OPTIONS = contactForm.inquiryOptions;

export const NAME_MIN = 2;
export const NAME_MAX = 120;
export const EMAIL_MAX = 254;
export const MESSAGE_MAX = 4000;
/** Same shape the newsletter form uses; the API re-validates with zod's `z.email()`. */
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ContactField = 'name' | 'phone' | 'email' | 'inquiry' | 'message';
export type ContactValues = Record<ContactField, string>;
export type ContactErrors = Partial<Record<ContactField, string>>;

/**
 * Client-side rules for the contact form (BRD 4.11): the messages are the BRD strings, the
 * phone rule accepts any international number (partners and investors, BRD 4.11 lead) and
 * canonicalises Saudi mobiles. Kept free of zod so the `/contact` chunk stays
 * small; `tests/contact.test.ts` proves the API schema agrees with it.
 */
export function validateContact(values: ContactValues): ContactErrors {
  const errors: ContactErrors = {};
  const name = values.name.trim();
  if (name.length < NAME_MIN || name.length > NAME_MAX) errors.name = contactForm.validation.name;
  if (!normalisePhone(values.phone)) errors.phone = contactForm.validation.phone;
  const email = values.email.trim();
  if (!EMAIL.test(email) || email.length > EMAIL_MAX) errors.email = contactForm.validation.email;
  if (!(INQUIRY_OPTIONS as readonly string[]).includes(values.inquiry)) {
    errors.inquiry = contactForm.labels.inquiry;
  }
  const message = values.message.trim();
  if (message.length === 0 || message.length > MESSAGE_MAX) {
    errors.message = contactForm.validation.message;
  }
  return errors;
}
