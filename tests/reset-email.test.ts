import { describe, expect, it } from 'vitest';
import {
  generateResetHtml,
  generateResetSubject,
  RESET_SUBJECT,
  resetUrl,
} from '@/modules/cms/auth/reset-email';

describe('the password-reset e-mail (BRD 9.3, ADR-034)', () => {
  it('is Arabic, right-to-left, and links to the admin reset route with the token', () => {
    const html = generateResetHtml({
      req: { payload: { config: { serverURL: 'https://b7r.sa/' } } } as never,
      token: 'abc/def',
      user: { name: 'ضياء <x>' },
    });
    expect(html).toContain('<html lang="ar" dir="rtl">');
    expect(html).toContain('href="https://b7r.sa/admin/reset/abc%2Fdef"');
    expect(html).toContain('مرحباً ضياء &lt;x&gt;،');
    expect(html).toContain('صالح لساعة واحدة');
    expect(generateResetSubject()).toBe(RESET_SUBJECT);
    expect(resetUrl('http://localhost:3004', 't')).toBe('http://localhost:3004/admin/reset/t');
  });
});
