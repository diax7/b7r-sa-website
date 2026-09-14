/**
 * The site's locales (ADR-043): Arabic at the root, English under `/en/`. A leaf module:
 * the route groups, the data layer, the copy banks and the metadata all read it, it reads
 * nothing.
 */
export const LOCALES = ['ar', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'ar';

/** Each language's own name, for the switch (never translated). */
export const LANGUAGE_NAMES: Record<Locale, string> = { ar: 'العربية', en: 'English' };

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/** The locale of a CMS request (`req.locale`, a preview's `locale`): a known code, else Arabic. */
export function requestLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** `/products` → `/products` (ar) or `/en/products` (en); `/` → `/en`. */
export function localePath(locale: Locale, path: string): string {
  if (locale === DEFAULT_LOCALE) return path;
  return path === '/' ? '/en' : `/en${path}`;
}

/** The locale-free path of a URL: `/en/products` → `/products`, `/en` → `/`. */
export function stripLocale(pathname: string): { locale: Locale; path: string } {
  if (pathname === '/en') return { locale: 'en', path: '/' };
  if (pathname.startsWith('/en/')) return { locale: 'en', path: pathname.slice(3) };
  return { locale: 'ar', path: pathname };
}

/**
 * Where the switch sends a reader whose page has no twin in the other language (ADR-044): the
 * section's listing in that language (`/blog/<slug>` → `/blog`, `/products/<slug>` →
 * `/products`, `/author/<slug>` → `/blog`), else that language's home.
 */
export function fallbackPath(target: Locale, path: string): string {
  const section = path.split('/')[1] ?? '';
  if (section === 'blog' || section === 'author') return localePath(target, '/blog');
  if (section === 'products') return localePath(target, '/products');
  return localePath(target, '/');
}

export function otherLocale(locale: Locale): Locale {
  return locale === 'ar' ? 'en' : 'ar';
}

export function htmlDir(locale: Locale): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

/** Open Graph locale tags. */
export function ogLocale(locale: Locale): string {
  return locale === 'ar' ? 'ar_SA' : 'en_US';
}

/** BCP 47 tags for `hreflang`, `inLanguage` and `Intl`. */
export function languageTag(locale: Locale): string {
  return locale === 'ar' ? 'ar' : 'en';
}
