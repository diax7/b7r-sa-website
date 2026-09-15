import type { Payload } from 'payload';
import { publicRead } from '@/lib/cms/read';
import type { Locale } from '@/lib/i18n';

/**
 * Whether the site as a whole exists in a locale (ADR-043): Arabic always; English once the
 * site settings carry their required English values, judged on the brand name and the menu's
 * CTA label (the menus live in the settings since ADR-046), so a half-seeded environment
 * answers 404 for `/en` rather than a shell with empty labels. `SITE_ENGLISH=off` forces the not-in-English state (CI builds once with it,
 * proving a deploy before the English seed survives); refused in production. No
 * `server-only` here: the publish hooks ask with the request's own Payload.
 */
export async function localeEnabledWith(payload: Payload, locale: Locale): Promise<boolean> {
  if (locale === 'ar') return true;
  if (process.env['SITE_ENGLISH'] === 'off') return false;
  const site = await payload.findGlobal({ slug: 'site-settings', ...publicRead(locale), depth: 0 });
  return Boolean(site.brandName) && Boolean(site.menu?.ctaLabel);
}

/** The locales the site is in, for a hook that holds the request's Payload. */
export async function enabledLocales(payload: Payload): Promise<Locale[]> {
  return (await localeEnabledWith(payload, 'en')) ? ['ar', 'en'] : ['ar'];
}
