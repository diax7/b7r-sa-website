import { type NextFetchEvent, NextResponse } from 'next/server';
import { hasDraftCookie } from '@/lib/cookies';
import { goneHtml } from '@/lib/gone-page';
import { CRAWL_TOKEN_PURPOSE, INTERNAL_HEADER, internalToken } from '@/lib/internal-token';
import { createSlugCache, SLUG_SHAPE } from '@/lib/page-slugs';
import { isGone } from '@/lib/redirects';
import { ADMIN_PREFIX, isEnglishPath, localeSlug, NOT_FOUND_PREFIX } from '@/lib/site-routes';
import { crawlOf } from '@/lib/traffic/crawl';

/**
 * Four jobs (BRD 5.2, ADR-017, ADR-032, ADR-048, ADR-057). Retired WordPress URLs answer
 * 410 Gone (`next.config` redirects cannot emit 410). Unknown top-level URLs are rewritten
 * to a path no route matches, so Next renders `global-not-found` server-side with status 404
 * and the URL unchanged, without this the `/[slug]` route would answer them from a bare
 * document (ADR-024). The allowlist is the published pages, read from the loopback address
 * (never the public origin) and cached in-process for 20 s with stale-while-revalidate; when
 * it cannot be read the request passes through (fail open). A request carrying Next's draft
 * cookie passes through too: an editor previewing an unpublished page (ADR-039) is not on
 * the allowlist yet. A known crawler's document GET of a page or a machine file is reported
 * to the traffic counter over the same loopback, fire-and-forget, once the proxy has let the
 * request through (a retired URL and a slug the proxy itself turns away are not "what they
 * read"). And an admin URL carrying `?locale=` is redirected to the same URL without it
 * before Payload sees it (`stripAdminLocale`): the panel edits both languages in one form
 * and has no locale switch (ADR-057, PR C), while Payload's own page would write the query's
 * locale into the person's persistent `locale` preference (`getRequestLocale` in
 * `@payloadcms/next`) and read it back on every admin request after, so an old English link
 * would leave them in the English view with no way back. The REST API, outside the matcher,
 * keeps `?locale=`. The matcher is one pattern (`PROXY_MATCHER`): every page request and
 * every admin request passes here.
 */
const SLUGS_TTL_MS = 20_000;
const CRAWL_LOG_EVERY_MS = 60_000;
let lastCrawlLog = 0;

/** One POST to the counter; a failure is logged with its status once a minute at most. */
async function reportCrawl(crawl: { bot: string; path: string }): Promise<void> {
  try {
    const port = process.env['PORT'] ?? '3004';
    const res = await fetch(`http://127.0.0.1:${port}/api/traffic/crawl`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [INTERNAL_HEADER]: await internalToken(CRAWL_TOKEN_PURPOSE),
      },
      body: JSON.stringify(crawl),
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`answered ${res.status}`);
  } catch (error) {
    const now = Date.now();
    if (now - lastCrawlLog < CRAWL_LOG_EVERY_MS) return;
    lastCrawlLog = now;
    console.error(
      `traffic: crawl report failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/** `enabled` marks whether the site is in English at all (the English list is empty then). */
const ENGLISH_OFF = '__english_off__';

function allowlist(path: string) {
  return createSlugCache({
    ttlMs: SLUGS_TTL_MS,
    fetchSlugs: async () => {
      const port = process.env['PORT'] ?? '3004';
      const res = await fetch(`http://127.0.0.1:${port}${path}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`${path} answered ${res.status}`);
      const body = (await res.json()) as { slugs?: unknown; enabled?: unknown };
      if (!Array.isArray(body.slugs)) throw new Error(`${path}: malformed body`);
      const list = body.slugs.filter((s): s is string => typeof s === 'string');
      return body.enabled === false ? [ENGLISH_OFF, ...list] : list;
    },
  });
}

/** The Arabic pages, and the English ones with the "is the site in English" flag (ADR-043). */
const slugs = { ar: allowlist('/api/pages/slugs'), en: allowlist('/api/pages/slugs/en') };

/**
 * An admin URL with `?locale=`: a 307 to the same URL without it; any other admin URL
 * passes. The `Location` is absolute on purpose: Next's proxy adapter parses it with no
 * base (`new NextURL(location)` in `server/web/adapter.js`) and answers a relative one with
 * a 500 (`ERR_INVALID_URL`); it then relativises an absolute one whose host is the request's
 * own, which holds by construction here (`clean` is `request.url` minus one parameter), so
 * the browser receives `/admin/...` whatever host the request carried (the container's
 * bind address included).
 */
function stripAdminLocale(url: URL): Response | undefined {
  if (!url.searchParams.has('locale')) return undefined;
  const clean = new URL(url);
  clean.searchParams.delete('locale');
  return NextResponse.redirect(clean, 307);
}

export async function proxy(request: Request, event?: NextFetchEvent) {
  const url = new URL(request.url);
  if (url.pathname === ADMIN_PREFIX || url.pathname.startsWith(`${ADMIN_PREFIX}/`)) {
    return stripAdminLocale(url);
  }
  if (isGone(url.pathname)) {
    return new Response(goneHtml(), {
      status: 410,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  }
  const notFound = () =>
    NextResponse.rewrite(new URL(`${NOT_FOUND_PREFIX}${url.pathname.slice(1)}`, url));
  const through = () => {
    const crawl = crawlOf(request);
    if (crawl) {
      const report = reportCrawl(crawl);
      if (event) event.waitUntil(report);
    }
    return undefined;
  };
  // Every `/en` URL answers 404 while the site is not in English (a half-seeded environment).
  if (isEnglishPath(url.pathname) && (await slugs.en.knows(ENGLISH_OFF)) === true) {
    return notFound();
  }
  const candidate = localeSlug(url.pathname);
  if (candidate === null) return through();
  if (hasDraftCookie(request.headers.get('cookie'))) return through();
  if (!SLUG_SHAPE.test(candidate.slug)) return notFound();
  const known = await slugs[candidate.locale].knows(candidate.slug);
  if (known === false) return notFound();
  return through();
}

export const config = {
  // A literal: Next reads `config` statically. `tests/site-routes.test.ts` keeps it equal to
  // `PROXY_MATCHER` in `lib/site-routes.ts`.
  matcher: ['/((?!(?:api|_next|media|images|fonts|og|video)(?:/|$)).*)'],
};
