# Traffic sources: our own counter of where visitors and AI crawlers come from (2026-09-16)

Project 2 of Dhia's 2026-09-15 programme (after the admin reshape, before the visibility score
and the GEO content). Two PRs, one ADR (ADR-048), CTO plan review then a code review per PR.

## Why

Dhia wants to see, inside the admin, where the site's visitors come from: ChatGPT, Gemini,
Claude, Perplexity, Google, the social networks, other sites, nobody (direct); and which AI
crawlers read the site and what they read. GA4 answers part of that only after consent and
only in Google's UI; Umami shows referrers in its own UI. His decision in the interview was
**our own counter**: first-party, cookieless, no identifiers, honest about being a count and not
an audit, on the dashboard and on a page of its own.

## Decisions taken with Dhia (interview, 2026-09-16)

- **What counts.** A landing: a page load whose referrer is another site or empty. Moving
  between our pages sends nothing. No cookie, no storage, no identifier, no IP stored.
- **AI crawlers.** Counted by bot, day and page, `llms.txt` included; nothing blocked,
  `robots.txt` unchanged (C-08 stays).
- **Where.** A dashboard card (the last 7 days by channel) and a Traffic page under Visibility
  (7 / 30 / 90 days, the channels, the sources, the landing pages, the crawlers).
- **Retention.** Daily counts (one row per day, kind, channel, source and page, with a count),
  kept forever. No per-visit rows, no hour.

Earlier (2026-09-15): the counter is ours, not GA's; prompt tracking through Connections comes
with project 3; the Visibility group is admin-only.

## Design

### D1. The rows (both PRs)

One collection `traffic` (Visibility group, admins only, read-only in the panel; the Local API
writes it with `overrideAccess`): `date` (`YYYY-MM-DD`, Riyadh), `kind` (`landing` | `crawl`),
`channel`, `source`, `path`, `hits`. A compound unique index on `(date, kind, channel, source,
path)` (Payload `indexes`), so a count is one `INSERT ... ON CONFLICT DO UPDATE SET hits = hits
+ excluded.hits` through the adapter's drizzle handle: atomic, no read-then-write. For a
landing, `channel` is the classifier's key and `source` the referrer host (or the `utm_source`
that decided it); for a crawl, `channel` is the bot's key and `source` its family
(`openai`, `anthropic`, `google`, `perplexity`, `microsoft`, `apple`, `meta`, `amazon`,
`bytedance`, `commoncrawl`). `path` is the page as requested, locale prefix included, query
string dropped. Nothing else: no IP, no user agent string, no timestamp finer than the day.

### D2. The channel classifier (PR 2a)

`src/modules/traffic/channels.ts`, pure and table-driven: `classify({ referrer, utmSource,
utmMedium }) → { channel, group, source }`.

- `group`: `ai` | `search` | `social` | `referral` | `direct`. `channel`, finer: `chatgpt`,
  `gemini`, `claude`, `perplexity`, `copilot`, `grok`, `deepseek`, `ai-other`; `google`,
  `bing`, `search-other` (duckduckgo, yahoo, yandex, ecosia, brave); `instagram`, `tiktok`,
  `x`, `snapchat`, `facebook`, `linkedin`, `youtube`, `whatsapp`, `telegram`, `pinterest`,
  `reddit`, `social-other`; `referral`; `direct`.
- `utm_source` wins when present: ChatGPT appends `utm_source=chatgpt.com` to the links it
  shows, Perplexity `utm_source=perplexity`, Copilot `utm_source=copilot` (as observed at the
  time of writing; the table is data, one line per entry). `utm_medium=social` with an
  unknown source reads as `social-other`.
- Otherwise the referrer host, with the app-link forms (`android-app://com.google.android.
  googlequicksearchbox` is Google, `l.instagram.com`, `lm.facebook.com`, `t.co`, `out.reddit.
  com`, `away.vk.com`) and the subdomains folded (`www.`, `m.`, `l.`). A host the table does
  not know is `referral` with the host as the source.
- Empty referrer: `direct`, source `direct`. Google AI Overviews and AI Mode arrive with a
  Google referrer and cannot be told from search; the page says so in one line.

### D3. The landing beacon and its endpoint (PR 2a)

- **Client.** `LandingBeacon` (`src/modules/core/analytics/landing-beacon.tsx`, `'use
  client'`, mounted once in the site layout next to the analytics bridge; never in the admin):
  on mount, if `document.referrer` is same-origin, nothing; else `fetch('/api/traffic/landing',
  { method: 'POST', keepalive: true })` with `{ path, referrer, utm: { source, medium } }`.
  No storage, no retry, no await; runs after hydration (a bot that does not run scripts sends
  nothing; one that does is dropped by the server, next bullet). About 40 lines.
- **Server.** `POST /api/traffic/landing`: JSON from the site's own origin (`acceptsJsonFrom`,
  as the contact form), a user agent that is not a known bot and not `bot|crawler|spider`
  (the crawler counter already counted it), a body that parses (`parseLanding()`, pure: the
  path a site path of one to four segments and at most 200 characters, the referrer a URL or
  empty, the UTM strings at most 100 characters, anything else 400), a rate limit of 60 a
  minute per client address through `createRateLimiter` (the address is a key in memory,
  never stored). Then `count({ kind: 'landing', ...classify(...) })` (D5). Answers 204.
- Honesty: a public counter can be fed false landings. The rate limit and the parse keep it
  proportionate; the Traffic page says "our own count, not an audit". The e2e lands like a
  visitor, so the review server's direct count includes the suite's page loads (RUNBOOK).

### D4. The crawler counter (PR 2a)

- `src/modules/traffic/bots.ts`, pure: `botOf(userAgent) → { channel, source } | null` from a
  table of the bots that matter (OAI-SearchBot, ChatGPT-User, GPTBot; ClaudeBot, Claude-User,
  Claude-SearchBot; Google-Extended, Googlebot; PerplexityBot, Perplexity-User; Bingbot,
  BingPreview; Applebot, Applebot-Extended; Meta-ExternalAgent, FacebookBot; Amazonbot;
  Bytespider; CCBot; DuckAssistBot; YandexBot), longest token first so `Claude-SearchBot` is
  not `ClaudeBot`.
- `src/proxy.ts` runs on every page request: the matcher becomes one pattern (everything but
  `api/`, `admin/`, `_next/`, `media/`, `images/`, `fonts/`, `og/`, `video/`); the retired-URL
  and unknown-slug logic keeps its own conditions (`isGone`, `localeSlug` null for anything
  that is not a top-level candidate), so its behaviour is unchanged and `tests/site-routes.
  test.ts` follows the new matcher. A request whose user agent `botOf()` knows, on a page path
  (no dot) or one of the machine files (`llms.txt`, `robots.txt`, `sitemap.xml`, `feed.xml`,
  `en/feed.xml`), is counted with `event.waitUntil(fetch(loopback '/api/traffic/crawl'))`,
  the same loopback the proxy already uses for the slug allowlist. The count is
  fire-and-forget: a failure is logged once a minute at most, never surfaces to the visitor.
- `POST /api/traffic/crawl` accepts only requests carrying `x-b7r-internal` equal to
  `internalToken()`: HMAC-SHA256 of the string `traffic-crawl` under `PAYLOAD_SECRET` through
  Web Crypto (`src/lib/internal-token.ts`, the same code in the proxy and the route; compared
  in constant time). Body: `{ bot, path }`; `bot` must be a key of the table. Nobody outside
  the container can forge a crawl row; a landing cannot be turned into a crawl.

### D5. The batcher (PR 2a)

`src/modules/traffic/counter.ts`: `count(row)` adds one to an in-memory map keyed by the
five index columns; a flush every 10 seconds (and when the map reaches 500 keys) writes the
map in one transaction of upserts (D1) and clears it. One container (ADR-033), so the map is
the whole truth between flushes; a crash loses at most ten seconds of counts, which the page
says nothing about because it does not need to. The flush is the only writer; the route
handlers never wait for the database. `TRAFFIC_FLUSH_MS` is not an env variable: the interval
is a constant, and the e2e polls up to 20 seconds.

### D6. The dashboard card (PR 2a)

`TrafficCard` on the dashboard for admins (`traffic` readable): the last 7 days' landings as a
total, one bar per group (AI, search, social, referral, direct) with its share, the top
channel, and the crawler hits of the week; the card links to the Traffic page (PR 2b; in 2a to
the collection's list). Read by `trafficSummary(payload, days)`, one query grouped in memory.

### D7. The Traffic page and custom views in the registry (PR 2b)

- Payload custom view `admin.components.views.traffic` at `/admin/traffic` (`exact`), a
  server component `TrafficView`; the view checks the user is an admin (the same rule as the
  Visibility group) and renders the "Admins only" sentence otherwise. Range `?days=7|30|90`
  (30 default) as three links. Sections, each a table: the channels (landings, share, the
  first and last day seen), the sources (top 20 hosts and UTM sources with their channel),
  the landing pages (top 20 with the channel that brings most), the crawlers (bot, family,
  hits, the top three pages). Tables, not charts: the design system has no chart primitive
  and the numbers are small; a bar in a table cell (`div` widths) says the share.
- The registry gains custom views: `ADMIN_VIEWS` in `icons.ts` (`traffic`: group
  `visibility`, order 1, icon `Radio`, label {ar «مصادر الزيارات», en "Traffic"}, path
  `/traffic`, adminOnly), `EntityType` gains `'views'`, `navGroups` appends the views the
  user may see (admins), the sidebar and the palette render them like a global (icon, hue,
  href), `entityIcon('views', slug)`, and `tests/admin-config.test.ts` checks that every
  key of `admin.components.views` other than `dashboard` and `account` has a registry entry
  and the reverse. The `traffic` collection sits as a secondary entry "Counts" under the view
  (`parent` of type `views`). Project 3's Score page reuses all of it.
- The page carries the two honesty lines: our own count, not an audit; Google's AI answers
  arrive as Google.

### D8. Docs, tests, evidence

- ADR-048 (the counter, the classifier table's home, the token, the batcher, the widened
  proxy, what is not stored, the honesty lines, the BRD 11.4 relation: our counter replaces
  the Umami referrer pull; GA4 stays for consented sessions; Search Console comes with
  project 3). BRD: 6.16 gains the beacon in one sentence; 11.4 amended; 10.2.7 (the
  dashboard) gains the card. RUNBOOK: reading the page, the review server's inflated direct
  count, what a spike of `referral` from one host means. ADMIN-DESIGN-SYSTEM: the registry's
  views, the card and the page rows. `.claude/rules/admin-ui.md`: a custom view is a registry
  entry.
- Unit: the classifier (a table of forty cases: every channel, the app-link forms, UTM
  precedence, unknown hosts, empty), `botOf` (each family, the longest-token rule, a browser
  UA null), `parseLanding` (good, too long, wrong shape, a foreign path), the token (stable,
  differs per secret), the batcher (keys merge, the flush writes once per key and clears, an
  upsert failure keeps the map), `trafficSummary` on rows, the registry test for views.
- e2e (admin suite): a landing posted with a ChatGPT referrer and one with
  `utm_source=chatgpt.com` land on one row with 2 hits within 20 s; the client beacon fires on
  a page opened with a ChatGPT referer (`page.goto` with `referer`, the request intercepted)
  and not on a same-origin move; a `GPTBot` user agent on `/products` and `/llms.txt` makes
  two crawl rows and no landing; an outsider's POST without the site's origin is 403; a crawl
  POST without the token is 403; an editor cannot read `traffic` and gets the "Admins only"
  page; the dashboard card and the Traffic page show the numbers; axe on both.
- Both PRs: CTO code review ≥ 90, both CI lines, merged through `scripts/merge-pr.sh`.

### Out of scope

Blocking crawlers; retention (kept forever, Dhia's call); hourly numbers; GA4 and Umami
pulls (BRD 11.4, if ever); Search Console, Bing and PageSpeed (project 3); prompt tracking
(project 3); the privacy page's copy (the copy bank is Dhia's; one sentence about the
first-party count may want to join it, flagged for him).

## PRs, evidence, acceptance

- **PR 2a `traffic/counter`**: D1 to D6, ADR-048, the BRD and RUNBOOK lines. Evidence: the
  unit tests above, the e2e without the page checks, screenshots of the card.
- **PR 2b `traffic/page`**: D7 and the registry, the design-system and rule lines. Evidence:
  the registry tests, the page e2e, axe, screenshots of the page at 7 and 90 days.
