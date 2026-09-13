import { describe, expect, it } from 'vitest';
import { isDuplicateError } from '@/lib/newsletter-transport';
import { newsletterBodySchema } from '@/modules/forms/newsletter/schema';

describe('newsletter body schema (BRD 6.14)', () => {
  it('accepts an email with an optional honeypot', () => {
    expect(newsletterBodySchema.safeParse({ email: 'a@b.co' }).success).toBe(true);
    expect(newsletterBodySchema.safeParse({ email: 'a@b.co', website: '' }).success).toBe(true);
  });
  it('rejects malformed and oversized input', () => {
    expect(newsletterBodySchema.safeParse({ email: 'nope' }).success).toBe(false);
    expect(newsletterBodySchema.safeParse({}).success).toBe(false);
    expect(newsletterBodySchema.safeParse({ email: `${'a'.repeat(250)}@b.co` }).success).toBe(
      false,
    );
  });
});

describe('Resend duplicate detection', () => {
  it('treats a 4xx validation error mentioning an existing contact as a duplicate', () => {
    expect(
      isDuplicateError({
        name: 'validation_error',
        statusCode: 409,
        message: 'Contact already exists',
      }),
    ).toBe(true);
    expect(
      isDuplicateError({
        name: 'validation_error',
        statusCode: 400,
        message: 'The contact exists',
      }),
    ).toBe(true);
  });
  it('never treats server errors or unrelated 4xx as duplicates', () => {
    expect(
      isDuplicateError({
        name: 'internal_server_error',
        statusCode: 500,
        message: 'already exists',
      }),
    ).toBe(false);
    expect(
      isDuplicateError({ name: 'validation_error', statusCode: 422, message: 'Invalid email' }),
    ).toBe(false);
    expect(
      isDuplicateError({ name: 'validation_error', statusCode: null, message: 'already exists' }),
    ).toBe(false);
    expect(isDuplicateError(null)).toBe(false);
  });
});
