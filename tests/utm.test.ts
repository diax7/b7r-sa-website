import { describe, expect, it } from 'vitest';
import { loginUrl, registerUrl, whatsappUrl } from '@/lib/utm';

describe('utm', () => {
  it('builds the header register URL exactly as §4.3', () => {
    expect(registerUrl('https://b7r.app', { campaign: 'header' })).toBe(
      'https://b7r.app/register?utm_source=b7r.sa&utm_medium=website&utm_campaign=header',
    );
  });
  it('adds product for the designer CTA and content for the ribbon', () => {
    expect(registerUrl('https://b7r.app', { campaign: 'designer', product: 'hoodie' })).toContain(
      'utm_campaign=designer&product=hoodie',
    );
    expect(registerUrl('https://b7r.app', { campaign: 'ribbon', content: 'home' })).toContain(
      'utm_campaign=ribbon&utm_content=home',
    );
  });
  it('builds login and WhatsApp links', () => {
    expect(loginUrl('https://b7r.app')).toBe('https://b7r.app/login');
    expect(whatsappUrl('966501699572', 'مرحباً')).toBe(
      'https://wa.me/966501699572?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B',
    );
  });
});
