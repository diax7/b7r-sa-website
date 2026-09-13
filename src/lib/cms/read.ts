/**
 * Options every public read passes to the Local API (BRD 9.6): the Arabic locale and, with
 * `overrideAccess`, an explicit `_status` filter, because `draft: false` alone still returns
 * a document that has only ever been saved as a draft. No `server-only` here: `pnpm og`
 * reads the catalogue with the same options.
 */
export const PUBLIC_READ = { locale: 'ar', draft: false, overrideAccess: true } as const;

/** `where` clause for versioned collections: published documents only. */
export const PUBLISHED = { _status: { equals: 'published' } } as const;
