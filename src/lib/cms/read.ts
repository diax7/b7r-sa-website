import type { Where } from 'payload';
import type { Locale } from '@/lib/i18n';

/**
 * Options every public read passes to the Local API (BRD 9.6, ADR-043): the request locale
 * with no fallback (an English page never shows Arabic prose as a stand-in) and, with
 * `overrideAccess`, an explicit `_status` filter, because `draft: false` alone still returns
 * a document that has only ever been saved as a draft. No `server-only` here: `pnpm og`
 * reads the catalogue with the same options.
 */
export function publicRead(locale: Locale) {
  return { locale, fallbackLocale: false as const, draft: false as const, overrideAccess: true };
}

/** `where` clause for versioned collections: published documents only. */
export const PUBLISHED = { _status: { equals: 'published' } } as const;

/**
 * A document exists in the request locale when its title-like field has a value there
 * (evaluated by Payload in that locale). Gates every collection read in both directions,
 * so an English-only post never reaches the Arabic blog and an Arabic-only page never
 * reaches `/en` (ADR-043).
 */
export function inLocale(field: string): Where {
  return { and: [{ [field]: { exists: true } }, { [field]: { not_equals: '' } }] };
}
