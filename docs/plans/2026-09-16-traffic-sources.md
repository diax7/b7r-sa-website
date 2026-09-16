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
- **Retention.** Daily counts (one row per day, kind, source and page, with a count; the
  channel derived at read), kept forever. No per-visit rows, no hour.

Earlier (2026-09-15): the counter is ours, not GA's; prompt tracking through Connections comes
with project 3; the Visibility group is admin-only.

## Design

### D1. The rows (both PRs)

One collection `traffic` (Visibility group, admins only): `date` (`YYYY-MM-DD`, Riyadh,
stamped when the count is taken, not when it is written), `kind` (`landing` | `crawl`),
`source`, `path`, `hits`. A compound unique index on `(date, kind, source, path)` (Payload
`indexes`), so a count is one `INSERT ... ON CONFLICT DO UPDATE SET hits = traffic.hits +
excluded.hits` through the adapter's drizzle handle: atomic, no read-then-write. **The channel
is derived at read, never stored** (CTO, option B): the rows keep one vocabulary, `source`,
and the classifier's table can improve next month and re-bucket the history. For a landing,
`source` is the referrer host folded (`www.`, `m.`, `l.` and the app-link forms removed), or
the `utm_source` token when the referrer is empty or unknown, or `direct`. For a crawl,
`source` is the bot's key (`gptbot`, `claudebot`); its family is derived. `path` is the page
as requested, locale prefix included, query string dropped, `/` for the home page. Nothing
else: no IP, no user agent string, no timestamp finer than the day. The panel's access is
`read: isAdmin`, `create/update/delete: () => false`, `hidden: hiddenUnlessAdmin`, no
`stampSavedBy` (nobody saves); the drizzle upsert is the only writer. The collection carries
what `tests/admin-config.test.ts` demands: both labels, the description, `admin.custom.shows`,
`collectionComponents('traffic', { localized: false })`, `useAsTitle: 'path'`,
`defaultColumns` (date, kind, source, path, hits), `listSearchableFields: ['source',
'path']` (the palette will surface rows for "chatgpt": wanted, that is the question an admin
asks), a descriptions map for the five fields, the registry entry and icon, the SQL migration
(`push: false`, ADR-025), the oxlint block for `src/modules/traffic/**`, the strings in
`strings.ts`, `@source` for `src/modules/traffic/admin` in `admin.css`, the import map.

### D2. The channel classifier (PR 2a)

`src/modules/traffic/channels.ts`, pure and table-driven, in two halves: `sourceOf({
referrer, utmSource }) → source` at write time (the folded host, the UTM token, or `direct`)
and `channelOf(source) → { channel, group }` at read time.

- `group`: `ai` | `search` | `social` | `referral` | `direct`. `channel`, finer: `chatgpt`,
  `gemini`, `claude`, `perplexity`, `copilot`, `grok`, `deepseek`, `ai-other`; `google`,
  `bing`, `search-other` (duckduckgo, yahoo, yandex, ecosia, brave); `instagram`, `tiktok`,
  `x`, `snapchat`, `facebook`, `linkedin`, `youtube`, `whatsapp`, `telegram`, `pinterest`,
  `reddit`, `social-other`; `referral`; `direct`.
- Precedence at write time: a referrer host the table knows wins; otherwise a `utm_source`
  token the table knows, folded to its canonical host so the sources table keeps one row per
  origin (ChatGPT appends `utm_source=chatgpt.com` to the links it shows, Perplexity
  `utm_source=perplexity` which is stored as `perplexity.ai`, Copilot `utm_source=copilot`
  as `copilot.microsoft.com`, as observed at the time of writing; the table is data, one line
  per entry); otherwise the referrer host as it is; an
  unknown UTM token never overrides a known host, and with no referrer it is stored as the
  source (it reads as `referral` with the token as its name). `utm_medium` is not stored.
- The app-link forms are folded (`android-app://com.google.android.googlequicksearchbox` is
  `google.com`, `l.instagram.com` is `instagram.com`, `lm.facebook.com` `facebook.com`, `t.co`
  `x.com`, `out.reddit.com` `reddit.com`, `away.vk.com` `vk.com`), the subdomains too (`www.`,
  `m.`, `l.`, `lm.`). A referrer host that is the site's own (any scheme or `www.` variant)
  is dropped server-side: the client's same-origin check can miss those.
- At read time, a source the table does not know is `referral` (group `referral`) with the
  host as its name; `direct` is `direct`.
- Three honesty lines on the page: our own count, not an audit; Google AI Overviews and AI
  Mode arrive with a Google referrer and read as Google; the native apps (ChatGPT's, the
  in-app browsers) send no referrer and inflate `direct`.

### D3. The landing beacon and its endpoint (PR 2a)

- **Client.** `LandingBeacon` (`src/modules/core/analytics/landing-beacon.tsx`, `'use
  client'`, mounted once in `PageExtras` next to the analytics bridge; never in the admin;
  `global-not-found` renders `PageExtras` too, so a visitor landing on a dead link is counted
  with its 404 path, which is the broken inbound link an admin wants to see): on mount, only
  when the navigation is a fresh one (`performance.getEntriesByType('navigation')[0].type ===
  'navigate'`: a reload or back/forward keeps `document.referrer` and would count twice) and
  `document.referrer` is not same-origin, `fetch('/api/traffic/landing', { method: 'POST',
  keepalive: true })` with `{ path, referrer, utmSource }`. No storage, no retry, no await;
  runs after hydration (a bot that does not run scripts sends nothing; one that does is
  dropped by the server, next bullet). About 40 lines.
- **Server.** `POST /api/traffic/landing`, in this order: JSON with an `Origin` header
  present and matching the site (stricter than `acceptsJsonFrom`: a browser always sends
  `Origin` on a POST, so a bare script call is refused, a foreign origin too), a user agent
  that is not a known bot and not `bot|crawler|spider` (the crawler counter already counted
  it; 204 and nothing stored), a body that parses (`parseLanding()`, pure: the path a site
  path of zero to four segments, `/` and `/en` included, at most 200 characters, no dot, no
  query; the referrer empty or an `http(s)` URL whose host has a dot, no userinfo, at most 100
  characters; `utmSource` at most 100 characters of `[A-Za-z0-9._-]`; anything else 400), a
  rate limit of 60 a minute per client address through `createRateLimiter` (the address is a
  key in memory, never stored). Then `count({ kind: 'landing', source, path })` (D5). Answers
  204.
- Honesty: a public counter can be fed false landings, and referrer spam (a stranger posting
  a host to appear in the sources) is the realistic flood: bounded to 60 a minute per address
  but not in distinct hosts. The parse bounds the host's shape; the Traffic page says "our
  own count, not an audit"; the RUNBOOK says how to read a spike of `referral` from one host
  (ignore it, nothing to block). The e2e lands like a visitor, so the review server's direct
  count includes the suite's page loads (RUNBOOK).

### D4. The crawler counter (PR 2a)

- `src/modules/traffic/bots.ts`, pure: `botOf(userAgent) → { key, family } | null` from a
  table of the bots that matter, user-agent tokens only (OAI-SearchBot, ChatGPT-User, GPTBot;
  ClaudeBot, Claude-User, Claude-SearchBot; Googlebot; PerplexityBot, Perplexity-User;
  Bingbot, BingPreview; Applebot; Meta-ExternalAgent, FacebookBot; Amazonbot; Bytespider;
  CCBot; DuckAssistBot; YandexBot; `Google-Extended` and `Applebot-Extended` are robots.txt
  tokens, never a user agent, and are not listed), longest token first so `Claude-SearchBot`
  is not `ClaudeBot`. A unit test holds that every `ANSWER_ENGINE_BOTS` entry of
  `modules/core/seo/robots.ts` (C-08) is known to `botOf()`, so the two lists cannot drift.
- `src/proxy.ts` runs on every page request: the matcher becomes one pattern
  (`PROXY_MATCHER`, exported from `lib/site-routes.ts` in place of `SLUG_MATCHER`, which is
  deleted: everything but `api/`, `admin/`, `_next/`, `media/`, `images/`, `fonts/`, `og/`,
  `video/`); the retired-URL and unknown-slug logic keeps its own conditions (`isGone`,
  `localeSlug` null for anything that is not a top-level candidate), so no existing 404 or
  410 answer changes; `tests/site-routes.test.ts` and `tests/redirects.test.ts` follow the
  one constant, and ADR-032's "the matcher lists the code-owned segments as literals" gets an
  amendment line. A request is counted only when it is a **document GET**: method `GET`, no
  `rsc` and no `next-router-prefetch` header, no `_rsc` query (a crawler that renders JS
  fires one RSC request per link in view, each with its user agent), not a retired URL (a
  410 is not "what they read"), on a page path (no dot) or one of the machine files
  (`llms.txt`, `en/llms.txt`, `robots.txt`, `sitemap.xml`, `feed.xml`, `en/feed.xml`), with
  a user agent `botOf()` knows: then `event.waitUntil(fetch(loopback '/api/traffic/crawl'))`,
  the same loopback the proxy already uses for the slug allowlist. Fire-and-forget: a
  failure is logged once a minute at most with the status, never a header, never surfaces to
  the visitor. The proxy imports `bots.ts` and `internal-token.ts` directly, never a module
  index that would pull Payload into its bundle. A unit test feeds the proxy a prefetch
  request and a HEAD and expects no count.
- `POST /api/traffic/crawl` accepts only requests carrying `x-b7r-internal` equal to
  `internalToken()`: HMAC-SHA256 of the string `traffic-crawl` under `PAYLOAD_SECRET` through
  Web Crypto (`src/lib/internal-token.ts`, the same code in the proxy, which caches the
  derived token in a module promise, and in the route, which compares with
  `node:crypto.timingSafeEqual`). Body: `{ bot, path }`; `bot` must be a key of the table,
  `path` the same shape as a landing's plus the machine files. Nobody outside the container
  can forge a crawl row; a landing cannot be turned into a crawl.

### D5. The batcher (PR 2a)

`src/modules/traffic/counter.ts`: `count({ kind, source, path })` stamps the Riyadh date
at that moment and adds one to an in-memory map keyed by the four index columns. A flush
every 10 seconds (and when the map reaches 500 keys) **swaps** the map for a fresh one, writes
the snapshot as one multi-row `INSERT ... ON CONFLICT (date, kind, source, path) DO UPDATE SET
hits = traffic.hits + excluded.hits, updated_at = now()` (one statement, no transaction
needed), and on failure merges the snapshot back into the live map by addition, so nothing
that arrived during the write is lost and a database that is down loses nothing until the
process dies. A ceiling of 5,000 keys: past it new keys are dropped with one warning (a
database that stays down cannot grow the process). The timer is `unref()`ed and guarded on
`globalThis` (dev HMR would otherwise start a second one); a `SIGTERM` flush races Next's
own close and usually saves a deploy's last seconds; a crash still loses up to ten. One container (ADR-033), so
the map is the whole truth between flushes. The flush is the only writer; the route handlers
never wait for the database. No env variable: the interval is a constant, and the e2e polls
up to 20 seconds.

### D6. The dashboard card (PR 2a)

`TrafficCard` on the dashboard for admins (`traffic` readable): the last 7 days' landings as a
total, one bar per group (AI, search, social, referral, direct) with its share, the top
channel, and the crawler hits of the week; the card links to the Traffic page (PR 2b; in 2a to
the collection's list). Read by `trafficSummary(payload, days)`, one query grouped in memory
through `channelOf()`. The bar is identity, not meaning: the Visibility pink on a
`bg-surface-2` track, never a colour per channel. Empty state (design system §7): the group's
icon, "No landings yet: the count starts with the first visitor", and the link.

### D7. The Traffic page and custom views in the registry (PR 2b)

- Payload custom view `admin.components.views.traffic` at `/admin/traffic` (`exact`), a
  server component `TrafficView`. **Payload 3.89 treats a custom view with a `path` as
  public** (`isCustomAdminView` skips the auth redirect), so the view gates itself through
  one helper the registry's views share (`adminView()`, `modules/cms/admin/views/gate.ts`):
  no user → `redirect()` to the login route with the return path; a user who is not an admin
  → the "Admins only" sentence in the shell; and the rows are read through the Local API with
  `overrideAccess: false` and the user, so a forgotten check can never leak them. Project 3's
  Score page uses the same gate. Range `?days=7|30|90` (30 default) as three links. Sections, each a table: the channels (landings, share, the
  first and last day seen), the sources (top 20 hosts and UTM sources with their channel),
  the landing pages (top 20 with the channel that brings most), the crawlers (bot, family,
  hits, the top three pages). Tables, not charts: the design system has no chart primitive
  and the numbers are small; a bar in a table cell (`div` widths) says the share.
- The registry gains custom views: `ADMIN_VIEWS` in `icons.ts` (`traffic`: group
  `visibility`, order 1, icon `Radio`, label {ar «مصادر الزيارات», en "Traffic"}, path
  `/traffic`, adminOnly), `EntityType` gains `'views'` (so `EntityRef.parent`, `entityHue`,
  `entityIcon` and `navPlacement` accept one; a collection may name a view as its parent),
  `navGroups` appends the views by the registry's own `adminOnly` rule (Payload's
  `groupNavItems` knows nothing of them), the sidebar and the palette render them like a
  global (icon, hue, href), and the data paths that walk entities (`recentActivity`,
  `collectionCounts`, `flattenNav`'s consumers) filter views out explicitly, never by
  accident. `tests/admin-config.test.ts` checks that every key of `admin.components.views`
  other than `dashboard` and `account` has a registry entry and the reverse. The `traffic`
  collection sits as a secondary entry "Counts" under the view. Project 3's Score page reuses
  all of it.
- Tables with an empty state each (the group's icon, one line, the range links); the three
  honesty lines of D2 at the foot.

### D8. Docs, tests, evidence

- ADR-048 (the counter, derived channels over stored ones, the classifier table's home,
  the token, the batcher, the widened proxy and the document-GET rule, what is not stored,
  the honesty lines, the public-view gate, the BRD 11.4 relation: our counter replaces the
  *referrer* part of the Umami pull, visitors and page views stay "if ever"; GA4 stays for
  consented sessions; Search Console comes with project 3); an amendment line on ADR-032 (the
  matcher). BRD: 6.16 gains the beacon in one sentence; 11.4 amended; 10.2.7 (the dashboard)
  gains the card. RUNBOOK: reading the page, the review server's inflated direct count, a
  spike of `referral` from one host. ADMIN-DESIGN-SYSTEM: the registry's views, the card and
  the page rows, the view gate. `.claude/rules/admin-ui.md`: a custom view is a registry
  entry behind `adminView()`.
- Unit: `sourceOf` and `channelOf` (a table of forty cases: every channel, the app-link
  forms, the precedence of a known host over a UTM token and of a known token over an unknown
  host, the site's own host dropped, unknown hosts as referral, empty as direct), `botOf`
  (each family, the longest-token rule, a browser UA null, the C-08 list covered),
  `parseLanding` (good, `/`, `/en`, too long, wrong shape, a foreign path, a query string, a
  host without a dot, userinfo), the proxy's document-GET rule (a prefetch, an RSC request
  and a HEAD count nothing; a GET counts), the token (stable, differs per secret), the batcher
  (keys merge, the date is stamped at count time, the flush swaps and writes once per key, a
  failed flush merges back by addition, the ceiling drops with one warning), `trafficSummary`
  on rows, the registry test for views.
- e2e (admin suite): a landing posted with a ChatGPT referrer and one with
  `utm_source=chatgpt.com` land on one row (`chatgpt.com`) with 2 hits within 20 s; the
  client beacon fires on a page opened with a ChatGPT referer (`page.goto` with `referer`,
  the request intercepted) and not on a same-origin move; a `GPTBot` user agent on
  `/products` and `/llms.txt` makes two crawl rows and no landing; a POST with a foreign
  `Origin` and one with none are 403; a crawl POST without the token is 403; an editor cannot
  read `traffic` and gets the "Admins only" page; an anonymous visitor at `/admin/traffic` is
  redirected to the login; the dashboard card and the Traffic page show the numbers, and
  their empty states show on a range with no rows; axe on both.
- Both PRs: CTO code review ≥ 90, both CI lines, merged through `scripts/merge-pr.sh`.

### Out of scope

Blocking crawlers; retention (kept forever, Dhia's call); hourly numbers; GA4 and Umami
pulls (BRD 11.4, if ever); Search Console, Bing and PageSpeed (project 3); prompt tracking
(project 3); the privacy page's copy (the copy bank is Dhia's; one sentence about the
first-party count may want to join it, flagged for him); charts.

## CTO plan review

Round 1 (2026-09-16): 84, approve with revisions; M1 to M5 and m1 to m7 folded into the text
above (the public custom view gated, document GETs only, `/` accepted, one `source`
vocabulary with the channel derived at read, the swap-then-merge flush with a ceiling; the
`Origin` requirement, `navigate`-only sends, the empty states and the bar colour, the bot
table hygiene and the C-08 test, the `views` ripple, the collection's compliance list, the
referrer bound). Round 2: 94, GO (n1 the SIGTERM wording, n2 the retention line, n3 the
known UTM token folded to its host: all taken).

## PRs, evidence, acceptance

- **PR 2a `traffic/counter`**: D1 to D6, ADR-048, the BRD and RUNBOOK lines. Evidence: the
  unit tests above, the e2e without the page checks, screenshots of the card.
- **PR 2b `traffic/page`**: D7 and the registry, the design-system and rule lines. Evidence:
  the registry tests, the page e2e, axe, screenshots of the page at 7 and 90 days.
