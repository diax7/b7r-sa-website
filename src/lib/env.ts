/**
 * Environment contract (BRD 8.5, ADR-052): the origins and the one public key. Everything a
 * person at B7R changes (the WhatsApp number, the contact address, the analytics ids, the
 * verification tokens, the booking link) lives in the admin, never here. Validated once at
 * import; fails fast with a readable message naming the variable. Only `NEXT_PUBLIC_*`
 * values reach the browser.
 *
 * Hand-rolled on purpose: this module is imported by client components, and pulling zod into
 * the home bundle would cost ~50 kB against the BRD 7.8 budget.
 */
export const PRODUCTION_SITE_URL = 'https://b7r.sa';
/** The merchant app: every "start your brand" link, with its UTM parameters (BRD 6.3). */
export const APP_URL = 'https://b7r.app';

export type Env = {
  siteUrl: string | undefined;
  appUrl: string;
  /** True only when the canonical production origin is configured (BRD 7.2 noindex guard). */
  isProductionSite: boolean;
  /** Cloudflare Turnstile site key; the contact form renders the widget only when set. */
  turnstileSiteKey: string | undefined;
};

function isUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

export function parseEnv(raw: Record<string, string | undefined>): Env {
  const problems: string[] = [];
  const siteRaw = raw['NEXT_PUBLIC_SITE_URL'] ?? '';
  const appUrl = raw['NEXT_PUBLIC_APP_URL'] || APP_URL;

  if (siteRaw !== '' && !isUrl(siteRaw))
    problems.push('NEXT_PUBLIC_SITE_URL: must be a URL or empty');
  if (!isUrl(appUrl)) problems.push('NEXT_PUBLIC_APP_URL: must be a URL, e.g. https://b7r.app');
  if (problems.length > 0) {
    throw new Error(`Invalid environment (see .env.example):\n  ${problems.join('\n  ')}`);
  }
  const siteUrl = siteRaw || undefined;
  return {
    siteUrl,
    appUrl,
    isProductionSite: siteUrl === PRODUCTION_SITE_URL,
    turnstileSiteKey: raw['NEXT_PUBLIC_TURNSTILE_SITE_KEY'] || undefined,
  };
}

/** Absolute origin for canonical URLs, JSON-LD and the sitemap: the configured site or production. */
export function siteBase(): string {
  return env.siteUrl ?? PRODUCTION_SITE_URL;
}

// Next.js inlines NEXT_PUBLIC_* only when accessed as literal `process.env.X` expressions,
// so the object below must spell each one out.
export const env: Env = parseEnv({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env['NEXT_PUBLIC_TURNSTILE_SITE_KEY'],
});
