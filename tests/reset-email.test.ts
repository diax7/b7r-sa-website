import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_SOURCES } from '@/modules/brand/defaults';
import {
  generateResetHtml,
  generateResetSubject,
  RESET_SUBJECT,
  resetUrl,
} from '@/modules/cms/auth/reset-email';

/** A request whose Payload answers the Appearance global with `doc`, or fails to. */
function request(doc: unknown) {
  const warn = vi.fn();
  const findGlobal = vi.fn(async () => {
    if (doc instanceof Error) throw doc;
    return doc;
  });
  const req = {
    payload: { config: { serverURL: 'https://b7r.sa/' }, findGlobal, logger: { warn } },
  };
  return { req: req as never, warn, findGlobal };
}

describe('the password-reset e-mail (BRD 9.3, ADR-034)', () => {
  it('is English like the panel, escapes the name, and links to the admin reset route with the token', async () => {
    const html = await generateResetHtml({
      req: request(null).req,
      token: 'abc/def',
      user: { name: 'ضياء <x>' },
    });
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('href="https://b7r.sa/admin/reset/abc%2Fdef"');
    expect(html).toContain('Hello ضياء &lt;x&gt;,');
    expect(html).toContain('works for one hour');
    expect(generateResetSubject()).toBe(RESET_SUBJECT);
    expect(resetUrl('http://localhost:3004', 't')).toBe('http://localhost:3004/admin/reset/t');
  });

  it('is written in the brand’s colours as saved when it is sent (spec 010)', async () => {
    const { req, findGlobal } = request({
      sources: { ...DEFAULT_SOURCES, primary: '#1a5caf' },
      pins: [],
    });
    const html = await generateResetHtml({ req, token: 't' });
    expect(findGlobal).toHaveBeenCalledWith(expect.objectContaining({ slug: 'appearance' }));
    expect(html).toContain('background:#1a5caf');
  });

  it('still goes out, in the shipped colours, when the colours cannot be read, and says so', async () => {
    const { req, warn } = request(new Error('connection refused'));
    const html = await generateResetHtml({ req, token: 't' });
    expect(html).toContain(`background:${DEFAULT_SOURCES.primary}`);
    expect(warn).toHaveBeenCalledOnce();
  });
});
