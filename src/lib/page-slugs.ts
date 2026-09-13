/**
 * The proxy's view of which top-level slugs the site answers (B0, ADR-032): the published
 * pages, read from the loopback allowlist endpoint and cached in-process. Pure enough to unit
 * test: the fetch and the clock are injected.
 */
export interface SlugCacheOptions {
  fetchSlugs: () => Promise<string[]>;
  /** How long a fetched list is fresh; after that it is served stale while a refresh runs. */
  ttlMs: number;
  /**
   * A miss re-reads the list at most this often, so a page published a moment ago answers
   * on its first request while a flood of unknown URLs costs one loopback read per window.
   */
  missRefreshMs?: number;
  now?: () => number;
}

export interface SlugCache {
  /** `true`/`false` when the list is known; `null` when it could not be read (fail open). */
  knows: (slug: string) => Promise<boolean | null>;
}

/** Top-level slugs the proxy accepts without a lookup: `^[a-z0-9-]{1,64}$`. */
export const SLUG_SHAPE = /^[a-z0-9-]{1,64}$/;

export function createSlugCache({
  fetchSlugs,
  ttlMs,
  missRefreshMs = 2_000,
  now = Date.now,
}: SlugCacheOptions): SlugCache {
  let slugs: Set<string> | null = null;
  let fetchedAt = 0;
  let inflight: Promise<void> | null = null;

  const refresh = () => {
    inflight ??= fetchSlugs()
      .then((list) => {
        slugs = new Set(list);
        fetchedAt = now();
      })
      .catch(() => {
        // Keep whatever was known; the caller fails open on `null`.
      })
      .finally(() => {
        inflight = null;
      });
    return inflight;
  };

  return {
    async knows(slug) {
      const age = now() - fetchedAt;
      if (slugs === null) await refresh();
      else if (age > ttlMs) void refresh();
      if (slugs === null) return null;
      if (slugs.has(slug)) return true;
      // A miss: the page may have been published since the last read.
      if (age > missRefreshMs) await refresh();
      return slugs.has(slug);
    },
  };
}
