/** A redirect row as the site reads it: a single-segment source and a resolved target. */
export interface SiteRedirect {
  /** `/showcase` */
  from: string;
  /** A site path or an absolute https URL. */
  to: string;
  permanent: boolean;
}

/** What `/[slug]` should do with a slug (ADR-032): redirect, render the page, or 404. */
export type SlugResolution =
  | { kind: 'redirect'; to: string; permanent: boolean }
  | { kind: 'page' }
  | null;

/**
 * Pure precedence: a redirect wins over a page of the same slug (an admin who adds one
 * means it), then a published page, else nothing. Unit-tested.
 */
export function resolveSlug(
  slug: string,
  redirects: readonly SiteRedirect[],
  pageSlugs: ReadonlySet<string>,
): SlugResolution {
  const hit = redirects.find((r) => r.from === `/${slug}`);
  if (hit) return { kind: 'redirect', to: hit.to, permanent: hit.permanent };
  return pageSlugs.has(slug) ? { kind: 'page' } : null;
}
