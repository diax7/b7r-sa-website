import { pagePath, UTM_MAX } from '@/lib/traffic/landing';

/** The three campaign parameters a link may carry (`utm_source`, `utm_medium`, `utm_campaign`). */
export interface Utm {
  source?: string;
  medium?: string;
  campaign?: string;
}

const UTM_KEYS: ReadonlyArray<keyof Utm> = ['source', 'medium', 'campaign'];

/** The three parameters bounded (trimmed, at most `UTM_MAX` characters, empty as absent); `undefined` when none survives. */
function collect(read: (key: keyof Utm) => string | null | undefined): Utm | undefined {
  const utm: Utm = {};
  for (const key of UTM_KEYS) {
    const value = read(key)?.trim() ?? '';
    if (value !== '') utm[key] = value.slice(0, UTM_MAX);
  }
  return Object.keys(utm).length > 0 ? utm : undefined;
}

/** The UTM parameters of a page's query. */
export const utmOf = (search: URLSearchParams): Utm | undefined =>
  collect((key) => search.get(`utm_${key}`));

/** A UTM object as the form posts it. */
export const utmFrom = (input: Partial<Record<keyof Utm, string | undefined>>): Utm | undefined =>
  collect((key) => input[key]);

/**
 * Where a submission came from when the body does not say: the `Referer` header's page and
 * its query (a browser sends the form's page as the referer on a same-origin fetch). The
 * page is a site path by `pagePath`'s rule (no query, no dot), else nothing.
 */
export function originOfReferer(referer: string | null): { page?: string; utm?: Utm } {
  if (!referer) return {};
  let url: URL;
  try {
    url = new URL(referer);
  } catch {
    return {};
  }
  const page = pagePath(url.pathname);
  const utm = utmOf(url.searchParams);
  return { ...(page ? { page } : {}), ...(utm ? { utm } : {}) };
}
