import { describe, expect, it, vi } from 'vitest';
import { contactForm } from '@/content/pages';
import { buildContactEmail, getContactTransport } from '@/lib/contact-transport';
import { verifyTurnstile } from '@/lib/turnstile';
import { contactBodySchema, INQUIRY_OPTIONS } from '@/modules/contact/schema';
import { validateContact } from '@/modules/contact/validate';

const valid = {
  name: 'ضياء',
  phone: '050 169 9572',
  email: 'merchant@example.com',
  inquiry: 'تاجر',
  message: 'أرغب بربط متجري.',
};

describe('contact schema (BRD 4.11, 6.9)', () => {
  it('accepts a valid body and canonicalises the phone', () => {
    const parsed = contactBodySchema.safeParse(valid);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.phone).toBe('966501699572');
  });

  it('the client rules answer every field with the BRD 4.11 message', () => {
    const errors = validateContact({
      name: '',
      phone: '12345',
      email: 'nope',
      inquiry: 'غير موجود',
      message: '   ',
    });
    expect(errors.name).toBe(contactForm.validation.name);
    expect(errors.phone).toBe(contactForm.validation.phone);
    expect(errors.email).toBe(contactForm.validation.email);
    expect(errors.message).toBe(contactForm.validation.message);
    expect(errors.inquiry).toBeDefined();
    expect(validateContact(valid)).toEqual({});
  });

  it('the client rules and the API schema agree', () => {
    const cases = [
      valid,
      { ...valid, name: 'x' },
      { ...valid, name: 'a'.repeat(121) },
      { ...valid, phone: '+971501699572' },
      { ...valid, phone: '00966 50 169 9572' },
      { ...valid, phone: '1234567' },
      { ...valid, phone: '+44 20 7946 0958' },
      { ...valid, email: 'no-at-sign' },
      { ...valid, email: `${'a'.repeat(250)}@x.co` },
      { ...valid, inquiry: 'شراكة' },
      { ...valid, inquiry: '' },
      { ...valid, message: '' },
      { ...valid, message: 'م'.repeat(4001) },
    ];
    for (const values of cases) {
      const client = Object.keys(validateContact(values)).length === 0;
      const api = contactBodySchema.safeParse(values).success;
      expect(api, JSON.stringify(values).slice(0, 80)).toBe(client);
    }
  });

  it('limits inquiries to the four BRD options', () => {
    expect([...INQUIRY_OPTIONS]).toEqual(['تاجر', 'شراكة', 'استثمار', 'أخرى']);
  });
});

describe('contact email (BRD 4.17)', () => {
  const mail = buildContactEmail({ ...valid, phone: '966501699572' });

  it('carries the inquiry in the subject and every field in both bodies', () => {
    expect(mail.subject).toBe('رسالة جديدة من الموقع: تاجر');
    for (const value of ['ضياء', '050 169 9572', 'merchant@example.com', 'أرغب بربط متجري.']) {
      expect(mail.html).toContain(value);
      expect(mail.text).toContain(value);
    }
  });

  it('keeps phone and email LTR and links a WhatsApp reply for a Saudi number', () => {
    expect(mail.html).toContain('<bdi dir="ltr">050 169 9572</bdi>');
    expect(mail.html).toContain('<bdi dir="ltr">merchant@example.com</bdi>');
    expect(mail.html).toContain('href="https://wa.me/966501699572"');
    expect(mail.text).toContain('https://wa.me/966501699572');
  });

  it('omits the WhatsApp reply link for a non-Saudi number', () => {
    const intl = buildContactEmail({ ...valid, phone: '+971501234567' });
    expect(intl.html).not.toContain('wa.me');
    expect(intl.text).not.toContain('wa.me');
    expect(intl.html).toContain('<bdi dir="ltr">+971501234567</bdi>');
  });

  it('escapes HTML in user content', () => {
    const hostile = buildContactEmail({ ...valid, phone: '966501699572', message: '<img src=x>' });
    expect(hostile.html).not.toContain('<img');
    expect(hostile.html).toContain('&lt;img src=x&gt;');
  });
});

describe('contact transport selection', () => {
  it('is off without configuration', async () => {
    const t = getContactTransport();
    expect(t.kind).toBe('off');
    await expect(t.send({ ...valid, phone: '966501699572' })).resolves.toEqual({
      ok: false,
      status: 503,
    });
  });
});

describe('verifyTurnstile', () => {
  it('posts the token and secret and trusts only success: true', async () => {
    const fetchImpl = vi.fn(async () => Response.json({ success: true }));
    await expect(
      verifyTurnstile('tok', 'secret', '203.0.113.9', fetchImpl as unknown as typeof fetch),
    ).resolves.toBe(true);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain('challenges.cloudflare.com/turnstile/v0/siteverify');
    const body = init.body as URLSearchParams;
    expect(body.get('response')).toBe('tok');
    expect(body.get('secret')).toBe('secret');
    expect(body.get('remoteip')).toBe('203.0.113.9');
  });

  it('fails closed on a refusal, a non-2xx, or a network error', async () => {
    const refused = vi.fn(async () => Response.json({ success: false }));
    const down = vi.fn(async () => new Response(null, { status: 502 }));
    const thrown = vi.fn(async () => {
      throw new Error('offline');
    });
    for (const impl of [refused, down, thrown]) {
      await expect(
        verifyTurnstile('tok', 'secret', undefined, impl as unknown as typeof fetch),
      ).resolves.toBe(false);
    }
  });
});
