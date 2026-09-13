/**
 * Analytics consent (BRD 6.16): a first-party cookie `b7r_consent` = granted | denied for
 * 180 days. GA4 loads only when granted; Umami never needs it.
 */
export const CONSENT_COOKIE = 'b7r_consent';
export const CONSENT_MAX_AGE_DAYS = 180;

export type Consent = 'granted' | 'denied';

export function parseConsent(cookieHeader: string): Consent | null {
  for (const part of cookieHeader.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === CONSENT_COOKIE) {
      const value = rest.join('=').trim();
      if (value === 'granted' || value === 'denied') return value;
    }
  }
  return null;
}

export function serializeConsent(value: Consent, secure: boolean): string {
  const maxAge = CONSENT_MAX_AGE_DAYS * 24 * 60 * 60;
  return `${CONSENT_COOKIE}=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure ? '; Secure' : ''}`;
}

export function readConsent(): Consent | null {
  if (typeof document === 'undefined') return null;
  return parseConsent(document.cookie);
}

export function writeConsent(value: Consent): void {
  document.cookie = serializeConsent(value, window.location.protocol === 'https:');
}
