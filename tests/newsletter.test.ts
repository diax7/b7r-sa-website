import { afterEach, describe, expect, it, vi } from 'vitest';
import { getNewsletterTransport } from '@/lib/newsletter-transport';
import { newsletterBodySchema } from '@/modules/forms/newsletter/schema';

const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock('resend', () => ({
  Resend: class {
    contacts = { create };
  },
}));

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

describe('newsletter transport (BRD 6.14)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    create.mockReset();
  });

  it('is off without the key and the segment, and never answers ok', async () => {
    const transport = getNewsletterTransport();
    expect(transport.kind).toBe('off');
    expect(await transport.subscribe('a@b.co')).toEqual({ ok: false, status: 503 });
  });

  it('honours the mock only without a key, so a stray flag never fakes success', () => {
    vi.stubEnv('NEWSLETTER_TRANSPORT', 'mock');
    expect(getNewsletterTransport().kind).toBe('mock');
    vi.stubEnv('RESEND_API_KEY', 're_test');
    expect(getNewsletterTransport().kind).toBe('off');
  });

  it('adds the address to the segment as subscribed, a repeat alike', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test');
    vi.stubEnv('RESEND_SEGMENT_ID', 'seg_1');
    create.mockResolvedValue({ data: { object: 'contact', id: 'c_1' }, error: null });
    const transport = getNewsletterTransport();
    expect(transport.kind).toBe('live');
    expect(await transport.subscribe('a@b.co')).toEqual({ ok: true });
    expect(await transport.subscribe('a@b.co')).toEqual({ ok: true });
    expect(create).toHaveBeenCalledWith({
      email: 'a@b.co',
      unsubscribed: false,
      segments: [{ id: 'seg_1' }],
    });
  });

  it('answers 500 when Resend refuses', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test');
    vi.stubEnv('RESEND_SEGMENT_ID', 'seg_1');
    create.mockResolvedValue({
      data: null,
      error: { name: 'restricted_api_key', statusCode: 401, message: 'sending access only' },
    });
    expect(await getNewsletterTransport().subscribe('a@b.co')).toEqual({
      ok: false,
      status: 500,
    });
  });
});
