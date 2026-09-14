import type { Payload } from 'payload';
import { publicRead } from '@/lib/cms/read';
import type { Locale } from '@/lib/i18n';

/**
 * Whether the site as a whole exists in a locale (ADR-043): Arabic always; English once the
 * settings and the navigation carry their required English values, judged on one field
 * each, so a half-seeded environment answers 404 for `/en` rather than a shell with empty
 * labels. `SITE_ENGLISH=off` forces the not-in-English state (CI builds once with it,
 * proving a deploy before the English seed survives); refused in production. No
 * `server-only` here: the publish hooks ask with the request's own Payload.
 */
export async function localeEnabledWith(payload: Payload, locale: Locale): Promise<boolean> {
  if (locale === 'ar') return true;
  if (process.env['SITE_ENGLISH'] === 'off') return false;
  const [site, navigation] = await Promise.all([
    payload.findGlobal({ slug: 'site-settings', ...publicRead(locale), depth: 0 }),
    payload.findGlobal({ slug: 'navigation', ...publicRead(locale), depth: 0 }),
  ]);
  return Boolean(site.brandName) && Boolean(navigation.ctaLabel);
}

/** The locales the site is in, for a hook that holds the request's Payload. */
export async function enabledLocales(payload: Payload): Promise<Locale[]> {
  return (await localeEnabledWith(payload, 'en')) ? ['ar', 'en'] : ['ar'];
}
