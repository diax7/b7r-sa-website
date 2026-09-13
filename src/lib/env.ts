/**
 * Environment contract (BRD 8.5). Validated once at import; fails fast with a readable
 * message naming the variable. Only `NEXT_PUBLIC_*` values reach the browser.
 *
 * Hand-rolled on purpose: this module is imported by client components, and pulling zod into
 * the home bundle would cost ~50 kB against the BRD 7.8 budget. Phase 1a reads three
 * variables; later phases extend `parseEnv` as they start reading more.
 */
export const PRODUCTION_SITE_URL = 'https://b7r.sa';

export type Env = {
  siteUrl: string | undefined;
  appUrl: string;
  whatsapp: string;
  /** GA4 measurement id; the consent bar and GA load only when set (BRD 6.16). */
  gaId: string | undefined;
  /** Umami script URL and website id; the script loads only when both are set. */
  umami: { src: string; id: string } | undefined;
  /** True only when the canonical production origin is configured (BRD 7.2 noindex guard). */
  isProductionSite: boolean;
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
  const appUrl = raw['NEXT_PUBLIC_APP_URL'] ?? '';
  const whatsapp = raw['NEXT_PUBLIC_WHATSAPP'] ?? '';

  if (siteRaw !== '' && !isUrl(siteRaw))
    problems.push('NEXT_PUBLIC_SITE_URL: must be a URL or empty');
  if (!isUrl(appUrl)) problems.push('NEXT_PUBLIC_APP_URL: must be a URL, e.g. https://b7r.app');
  if (!/^\d{9,15}$/.test(whatsapp)) {
    problems.push('NEXT_PUBLIC_WHATSAPP: must be digits only, e.g. 966501699572');
  }
  if (problems.length > 0) {
    throw new Error(`Invalid environment (see .env.example):\n  ${problems.join('\n  ')}`);
  }
  const siteUrl = siteRaw || undefined;
  const gaId = raw['NEXT_PUBLIC_GA_ID'] || undefined;
  const umamiSrc = raw['NEXT_PUBLIC_UMAMI_SRC'] || '';
  const umamiId = raw['NEXT_PUBLIC_UMAMI_ID'] || '';
  if (umamiSrc && !isUrl(umamiSrc))
    throw new Error('Invalid environment: NEXT_PUBLIC_UMAMI_SRC must be a URL');
  return {
    siteUrl,
    appUrl,
    whatsapp,
    gaId,
    umami: umamiSrc && umamiId ? { src: umamiSrc, id: umamiId } : undefined,
    isProductionSite: siteUrl === PRODUCTION_SITE_URL,
  };
}

// Next.js inlines NEXT_PUBLIC_* only when accessed as literal `process.env.X` expressions,
// so the object below must spell each one out.
export const env: Env = parseEnv({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_WHATSAPP: process.env.NEXT_PUBLIC_WHATSAPP,
  NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
  NEXT_PUBLIC_UMAMI_SRC: process.env.NEXT_PUBLIC_UMAMI_SRC,
  NEXT_PUBLIC_UMAMI_ID: process.env.NEXT_PUBLIC_UMAMI_ID,
});
