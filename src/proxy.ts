import { NextResponse } from 'next/server';
import { hasDraftCookie } from '@/lib/cookies';
import { goneHtml } from '@/lib/gone-page';
import { createSlugCache, SLUG_SHAPE } from '@/lib/page-slugs';
import { isGone } from '@/lib/redirects';
import { isEnglishPath, localeSlug, NOT_FOUND_PREFIX } from '@/lib/site-routes';

/**
 * Two jobs (BRD 5.2, ADR-017, ADR-032). Retired WordPress URLs answer 410 Gone (`next.config`
 * redirects cannot emit 410). Unknown top-level URLs are rewritten to a path no route matches,
 * so Next renders `global-not-found` server-side with status 404 and the URL unchanged,
 * without this the `/[slug]` route would answer them from a bare document (ADR-024). The
 * allowlist is the published pages, read from the loopback address (never the public origin)
 * and cached in-process for 20 s with stale-while-revalidate; when it cannot be read the
 * request passes through (fail open). A request carrying Next's draft cookie passes through
 * too: an editor previewing an unpublished page (ADR-039) is not on the allowlist yet. The
 * matcher lists the code-owned segments as literals because Next reads `config` statically;
 * `tests/site-routes.test.ts` keeps them in sync.
 */
const SLUGS_TTL_MS = 20_000;

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

export async function proxy(request: Request) {
  const url = new URL(request.url);
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
  // Every `/en` URL answers 404 while the site is not in English (a half-seeded environment).
  if (isEnglishPath(url.pathname) && (await slugs.en.knows(ENGLISH_OFF)) === true) {
    return notFound();
  }
  const candidate = localeSlug(url.pathname);
  if (candidate === null) return undefined;
  if (hasDraftCookie(request.headers.get('cookie'))) return undefined;
  if (!SLUG_SHAPE.test(candidate.slug)) return notFound();
  const known = await slugs[candidate.locale].knows(candidate.slug);
  if (known === false) return notFound();
  return undefined;
}

export const config = {
  matcher: [
    '/team',
    '/our_services',
    '/under-construction',
    '/demo-design-system',
    '/hello-world',
    '/feed',
    '/wp-login.php',
    '/xmlrpc.php',
    '/post001',
    '/post002',
    '/post003',
    '/post004',
    '/post005',
    '/post006',
    '/post007',
    '/post008',
    '/post009',
    '/post010',
    '/post011',
    '/post012',
    '/specialists/:path*',
    '/project/:path*',
    '/project-category/:path*',
    '/services/:path*',
    '/category/:path*',
    '/wp-content/:path*',
    '/wp-admin/:path*',
    '/wp-json/:path*',
    // The English document and its code-owned routes: gated on the site being in English.
    '/en',
    '/en/:path*',
    // Top-level slug candidates: one segment, none of the code-owned names, no dot (files).
    '/((?!(?:about|how-it-works|contact|faq|terms|shipping|privacy|products|blog|author|admin|api|_next|og|images|fonts|media|video|__404|en)$)(?!.*\\.)[^/]+)',
  ],
};
