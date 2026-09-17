import { ANSWER_ENGINE_BOTS } from '@/modules/core/seo/robots';
import type { Fact, Finding, Snapshot } from '@/modules/visibility/types';
import { editHref, finding, has, loc, prorata } from '@/modules/visibility/rules/shared';

/** A service connection that exists, is on and passed its last test: that is "verified". */
function serviceStatus(s: Snapshot, kind: string): 'done' | 'next' | 'missing' {
  const rows = s.connections.filter((c) => c.kind === kind);
  if (rows.length === 0) return 'missing';
  return rows.some((c) => c.enabled && c.lastTestOk === true) ? 'done' : 'next';
}

/** Crawl access (ADR-049 C1 to C5): the engines can reach and index every page. */
export function crawl(s: Snapshot): Finding[] {
  const connections = `${s.adminRoute}/collections/connections`;
  const english = s.englishOn
    ? [
        ...s.pages.map((d) => ({ d, collection: 'pages' })),
        ...s.products.map((d) => ({ d, collection: 'products' })),
        ...s.posts.map((d) => ({ d, collection: 'posts' })),
        ...s.hubs.map((d) => ({ d, collection: 'categories' })),
        ...s.authors.map((a) => ({
          d: { id: a.id, slug: `author ${a.id}`, title: a.name },
          collection: 'authors',
        })),
      ].map(({ d, collection }) => ({
        ok: has(loc(d.title, 'en')),
        label: `${loc(d.title, 'ar') || d.slug} (${collection})`,
        href: editHref(s.adminRoute, collection, d.id, 'en'),
      }))
    : [];
  return [
    finding({
      key: 'C1',
      section: 'crawl',
      status: s.isProductionSite ? 'done' : 'missing',
      title: 'The site runs at its production address',
      guide:
        'robots.txt allows everything and every page is indexable only when NEXT_PUBLIC_SITE_URL is https://b7r.sa; anywhere else every page says noindex, on purpose (previews never rank).',
    }),
    finding({
      key: 'C2',
      section: 'crawl',
      status: s.indexNow ? 'done' : 'missing',
      title: 'IndexNow is configured',
      guide:
        'On the production runtime (B7R_RUNTIME) every publish is pinged to Bing and the engines that read IndexNow within the minute (ChatGPT Search leans on Bing); the key is derived from the server secret and served at /indexnow/{key}.txt. A review or preview server never pings.',
    }),
    finding({
      key: 'C3',
      section: 'crawl',
      status: serviceStatus(s, 'google-search-console'),
      title: 'Search Console is connected and verified',
      guide:
        'A Search Console connection whose Test passed proves Google sees the property; a verification tag alone proves nothing. Add it under Admin → Connections (a service account added as a user of the property), then press Test.',
      href: connections,
    }),
    finding({
      key: 'C4',
      section: 'crawl',
      status: serviceStatus(s, 'bing-webmaster'),
      title: 'Bing Webmaster Tools is connected and verified',
      guide:
        'ChatGPT Search and Copilot read the Bing index. Add a Bing Webmaster connection with its API key under Admin → Connections, then press Test.',
      href: connections,
    }),
    prorata({
      key: 'C5',
      section: 'crawl',
      checks: english,
      title: 'Every published document exists in English',
      guide:
        'While the site is in English, a document without an English title (an author without an English name) has no English page and no hreflang pair. Open its English tab and fill the title (and the rest).',
    }),
  ];
}

export function crawlFacts(s: Snapshot): Fact[] {
  return [
    {
      section: 'crawl',
      text: `robots.txt names the answer-engine bots (${ANSWER_ENGINE_BOTS.join(', ')}) and allows them; the traffic count sees every one of them read a page.`,
    },
    {
      section: 'crawl',
      text: `sitemap.xml, llms.txt${s.englishOn ? ' and en/llms.txt' : ''} are generated from the content on every publish; every page carries its canonical and, where the twin exists, reciprocal hreflang with x-default on the Arabic.`,
    },
  ];
}
