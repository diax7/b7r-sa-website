# The visibility score: how compliant the site is with SEO and GEO, and what to do next (2026-09-16)

Project 3 of Dhia's 2026-09-15 programme (after the admin reshape and the traffic sources,
before the GEO content). Three PRs, one ADR (ADR-049), CTO plan review then a code review per
PR. Reuses project 2's custom views (`ADMIN_VIEWS`, `adminView()`), Connections (ADR-047) and
the traffic count (ADR-048).

## Why

Dhia asked for "a percentage score for each section showing how compliant we are: what we
have done right, what we should do next, what is missing; dynamic based on the changes we
make; if some photos or elements are missing, that page should guide me, highlight the
problem and update our score; connected to Google Search Console, Google Analytics or any
free service; the goal is always 100%". His SEO + GEO prompt (the Citation Trinity: identity,
extractability, corroboration; crawl access; the citation ledger; freshness) is the rubric,
minus the parts he ruled out (more languages, country routing).

## Decisions taken with Dhia (interview, 2026-09-16)

- **Outside services:** Google Search Console, Bing Webmaster Tools and PageSpeed Insights,
  each a Connection kind with a Test; Google through a service account whose JSON key is the
  connection's secret (he creates it in Google Cloud and adds it as a user of the property).
- **The ledger asks with web search on:** ChatGPT through the Responses API's web search,
  Gemini with Google grounding, Claude with its web search tool, Perplexity natively (an
  OpenAI-compatible connection at `https://api.perplexity.ai`); DeepSeek has no search and is
  asked plain, which the ledger says.
- **Cadence:** weekly (Monday 07:00 Riyadh), every enabled AI connection, every prompt; a
  connection over its monthly limit is skipped and the page says so; a "Run now" button.
- **The percentage counts outside signals too:** PageSpeed, the verifications and the
  cited-rate carry points, so 100% means "the site, the engines and the assistants all
  agree". A service that is not connected scores its points as missing with the guide
  "connect it"; the page also shows the site-only percentage, so Dhia sees what he alone
  controls.

Earlier (2026-09-15): prompt tracking through Connections; the API keys are his; no more
languages than Arabic and English.

Two BRD lines this project changes (CTO plan review, M8), for Dhia to veto if he wants:
`FAQPage` JSON-LD returns (BRD §7.10 said "not done" when Google dropped the rich result;
the answer engines read it as the extractable Q&A his prompt asks for, so project 4 ships it
and its ADR amends §7.10); Google Business Profile stays not done (no premises) and is not on
the checklist; §7.7's "quarterly manual check of 20 prompts" is replaced by the ledger.

## Design

### D1. The rules engine (PR 3a)

`src/modules/visibility/rules/`: one pure function per check, `check(input) → Finding`, over
one snapshot the page builds per open (`snapshot.ts`: the site settings, the search defaults,
the home, every published product, page, post, hub, author and FAQ entry in both languages
with the media rows they reference, the checklist global, the connections' kinds and last
tests, the latest `metrics` and `citations` rows, the traffic count of the last 30 days, and
`isProductionSite`). The snapshot is read with the page's user (`overrideAccess: false`) and,
by the nightly job, as the server. `src/modules/visibility` imports `server-only`.

**Points versus facts (CTO M1).** A thing the site guarantees by construction (a required
field, a publish rule: a product's photo, price and sizes; a post's three takeaways, cover and
two internal links; the Arabic alt text and tagline; the socials' presence; the sitemap,
`llms.txt`, canonicals and hreflang) can never be missing, so it earns no points: each section
lists them in one "The site guarantees" line, as facts. Points go to what can move. Two
environment facts keep points because production can break them: the site URL (robots allow
and pages index only on `https://b7r.sa`) and the IndexNow key.

**A finding** is `{ key, section, weight, status, earned, title, guide, href?, items? }`:
`done` earns the weight, `missing` none, and for a finding over documents the status is
pro-rata (`earned = weight × done / total`: "4 of 5 products" is 80%, `next` while partial)
with the documents behind it listed (up to ten, "and 12 more"), each linking to the field in
the locale that is missing (`?locale=en`). A finding without documents is done, next or
missing by its own rule. The weights and thresholds are one table, `rules/weights.ts`, that
ADR-049 quotes; a change is one reviewed line.

| Section (weight) | Item | Weight | Rule |
|---|---|---|---|
| Identity (15) | I1 English tagline | 4 | `site-settings.tagline` has an English value (the Arabic is required). |
| | I2 Profiles are links | 4 | X, Instagram, TikTok are `https://` URLs (pro-rata over three). |
| | I3 About in both languages | 3 | The About page is published with an English title. |
| | I4 Authors | 4 | Every author of a published post has a bio, a photo and one `sameAs` (pro-rata over authors). |
| | facts | | The tagline is the footer's, `llms.txt`'s, the manifest's and the store node's `slogan` (added in 3a, m2); the node is `OnlineStore`. |
| Crawl access (20) | C1 Production URL | 5 | `isProductionSite`: else "the site URL is not https://b7r.sa: robots disallow and every page is noindex". |
| | C2 IndexNow | 3 | The IndexNow key is configured. |
| | C3 Search Console | 4 | A `google-search-console` connection exists and its last test passed; a connection whose test failed or never ran is `next`; a verification tag alone proves nothing and counts for nothing. |
| | C4 Bing | 3 | The same for `bing-webmaster`. |
| | C5 English versions | 5 | While the site is in English, every published page, product, post, hub and author has an English title (pro-rata over documents). |
| | facts | | Robots names the AI bots (C-08); sitemap; `llms.txt` and `en/llms.txt`; canonicals and reciprocal hreflang. |
| Extractability (30) | E1 Titles and descriptions | 6 | On every published page, product, post and hub, in each language it exists in, the title and description the page emits (the `metadata.ts` derivation, template included) are within 70 and 155 characters and not empty (pro-rata over document-languages). |
| | E2 English alt text | 4 | Every photo a published document uses has an English alt (the Arabic is required; pro-rata over media rows). |
| | E3 Answer-first posts | 6 | The first paragraph node of every published post, `plainText` split on whitespace, is 40 to 80 words, per document-language as E1 (pro-rata). |
| | E4 A question heading | 4 | Every published post, per document-language, has an h2 (`headings()`) that ends in «؟» or `?` or starts with an interrogative (كيف، ما، ماذا، هل، لماذا، متى، أين، كم؛ how, what, why, when, where, which, can, does) (pro-rata). |
| | E5 The FAQ | 3 | At least five published FAQ entries per language (pro-rata over the two languages; no ceiling: the seed's sixteen are the BRD's own). |
| | E6 `FAQPage` JSON-LD | 4 | Emitted on the FAQ page (a code fact once project 4 ships it; `missing` until then with the guide naming project 4). |
| | E7 A compare page | 3 | A published page whose slug starts with `compare` or `vs` (project 4; `missing` until then). |
| | facts | | Takeaways, covers, internal links (the publish rules); product photos, prices, sizes; the delivery days and the price prefix on every product page. |
| Corroboration (10) | R1 The checklist | 10 | The `visibility-checklist` global's five boxes (LinkedIn company page, LinkedIn founder profile, YouTube channel with one walkthrough, X profile with a pinned demo, a first third-party mention), pro-rata; each box carries its guide. The socials count once, in I2. |
| Measurement (10) | M1 Landings | 3 | A landing row in the last 30 days (else "the site is not live yet or the beacon is blocked"). |
| | M2 Prompts | 3 | At least five enabled prompts per language (pro-rata over the two). |
| | M3 A ledger run | 4 | A `citation` run in the last 14 days. |
| | facts | | GA4 configured (`NEXT_PUBLIC_GA_ID`). |
| Outside signals (15) | P1 PageSpeed | 6 | The median of the last three snapshots' mobile performance on the five URLs: ≥ 90 on all done, ≥ 80 next, below or no snapshot missing ("connect PageSpeed"). |
| | P2 Impressions | 3 | Search Console impressions > 0 in the window. |
| | P3 A category query | 2 | At least one non-brand category term (`rules/terms.ts`, from BRD §7.9 and Appendix E) among the top ten queries by impressions. |
| | P4 Cited-rate | 4 | Over four weeks, on non-brand prompts: ≥ 50% of runs name B7R done, ≥ 10% next, below or no run missing. |

The overall percentage is the sum of `earned` over 100. **Site-only** is `earned / possible`
over the items minus C3, C4, M3 and P1 to P4 (those need a service or an assistant), as a
percentage. A filled production site with no service connected scores about 70, and until
project 4 ships E6 and E7 the ceiling is 93; that floor, that ceiling and the two percentages
are what the page explains in one line.

### D2. The Score page and the card (PR 3a)

- `/admin/visibility` (`ADMIN_VIEWS.visibility`: Visibility group, icon `Gauge`, label
  {ar «درجة الظهور», en "Visibility score"}), behind `adminView()`. The Visibility group's
  order: Score (0), its children Snapshots, Prompts, Citations (1 to 3, PRs 3b and 3c),
  Search defaults (4), Traffic (5), Counts (6), Redirects (7). The header: the overall
  percentage in a ring (SVG, the Visibility pink on the surface track, identity), the
  site-only percentage in words ("What you control: 84%"), the reading's time and "up 6
  points since last week" from the `score` snapshots when there are two. One card per
  section: its bar, three lists in the order *next, missing, done* (`done` collapsed after
  five), each finding a sentence with its guide, its link and its documents; the status
  colours by meaning (green done, amber next, red missing). Below: the outside signals as
  facts (the last Search Console, Bing and PageSpeed snapshots with their dates; the ledger's
  rates) with "Connect" links to Connections when absent, and the "Pull now" and "Run now"
  actions (PRs 3b and 3c) as `ApiAction`s with their outcome in words.
- The `visibility-checklist` global (PR 3a): five checkboxes with `EnabledSwitch`-style
  consequence sentences, admin-only, a child of the Score page; the outside work itself stays
  project 4.
- The dashboard card "Visibility score" for admins: the ring small, the two numbers, the
  three findings with the most weight among `next` and `missing`, a link to the page.
- The reading is computed on open and cached in memory for 60 seconds per process; a
  "Recompute" link bypasses the cache. No stored score: the score is a function of the
  content; history is the nightly `score` snapshot (PR 3b).
- One line of site code in 3a: `slogan: site.tagline` on the `OnlineStore` node (m2), so I1's
  sentence is true.

### D3. Connection kinds for the services (PR 3b)

- `KINDS` gains `google-search-console`, `bing-webmaster`, `pagespeed`, and a `speaks:
  'ai' | 'service'` column: the engine's picker (`ai-settings.connection`, `filterOptions`)
  and the ledger both take `speaks === 'ai'`, the pull takes `service`. A `beforeValidate`
  allows one enabled connection per service kind, so the pull never chooses.
- The secret: `secretField(name, label, { mask })` learns a per-kind mask from
  `siblingData.kind`: for Google the `client_email`'s tail (`••••@project.iam.gserviceaccount.com`),
  for the others the last four characters as today. The Google paste is validated at save
  (`type: 'service_account'`, `client_email`, `private_key`), so a bad paste fails in the
  form, not at 04:00. `model`, the rates and the limit hide for service kinds (`admin.condition`).
- Google's token: the JWT-bearer flow (RS256 through Web Crypto, forty lines, no
  `google-auth-library`), the access token held in memory per connection until expiry, never
  written to a row; the unit test signs with a throwaway RSA key generated at test time.
  Bing's key travels in the query string: `safeMessage` strips URLs, and no request URL is
  ever logged, for that reason.
- The Test per kind, each with its own timeout (`test.ts` dispatches by `speaks`): Search
  Console lists the account's sites and checks the property (`sc-domain:b7r.sa` or the URL
  prefix from the site URL) is among them (20 s); Bing calls `GetUserSites` (20 s); PageSpeed
  runs one mobile audit of the home page (90 s). "Verified" in C3/C4 means this test passed.
  The in-memory Google token is keyed by the key's `private_key_id`, so a re-pasted key never
  reuses the old key's token.

### D4. The pulls and the `metrics` snapshots (PR 3b)

- `metrics` collection (Visibility group, read-only, a child of the Score page as
  "Snapshots"): `date` (the Riyadh `dateKey` at write time), `source` (`search-console` |
  `bing` | `pagespeed` | `score`), `data` (JSON), a compound unique index on `(date,
  source)`; every write is an upsert by that pair, so a second pull the same day replaces the
  row rather than failing or doubling. Search Console: a 28-day window ending three days back
  (the API's lag), totals (clicks, impressions, CTR, position), the top 25 queries and pages,
  by country when available; Bing: the same shape from `GetRankAndTrafficStats` and
  `GetQueryStats`; PageSpeed: mobile and desktop performance, accessibility, best practices
  and SEO plus LCP, CLS and INP for `/`, `/products`, the first product by `sortOrder`,
  `/blog` and the newest published post, one URL at a time with a 90 s timeout each, a
  partial row (four URLs and one error) rather than none; `score`: the day's overall,
  site-only and per-section numbers.
- One nightly job (`visibility-pull`, 04:00 Riyadh, the `ai` queue, serial by ADR-033):
  pulls each connected service, upserts the day's rows, then computes and stores the score
  row. A service whose pull fails writes no row and logs once; the page shows the last good
  snapshot with its date. The top Search Console queries feed the engine's backlog: rows of
  `ai-topics` with `source: 'searchConsole'` for non-brand queries with ≥ 50 impressions,
  ≤ 100 characters, Arabic or Latin script, no topic with that keyword yet, `hub` the one with
  the most keyword overlap else the first, `priority` by impressions (BRD 11.4).
- "Pull now" on the page: `POST /api/visibility/pull`, `adminOnly`, one per ten minutes
  (`createRateLimiter(1, 10 * 60_000)`), queues the job.

### D5. The citation ledger (PR 3c)

- `prompts` collection (Visibility group, a child of the Score page): `text`, `language`,
  `intent` (category, compare, how-to), `namesBrand` (the prompt itself names B7R, as a
  compare prompt does: excluded from the cited-rate's denominator, read for `linked` only),
  `enabled` (with its consequence), `order`; seeded with ten Arabic and five English buyer
  questions from the BRD's category terms, editable.
- `citations` collection (read-only, a child of the page): `date`, `connection`
  (relationship) plus `provider` and `model` as text (a deleted connection nulls the link,
  as `ai-runs` does), `prompt` (relationship), `mode` (`search` | `plain`), `mentioned`,
  `linked`, `urls` (ours and others, rendered as text or `https?://` links only),
  `competitors` (from `COMPETITOR_HOSTS` in `fields/editorial.ts`), `excerpt` (the first 400
  characters), `run` (the batch's `ai-runs` row).
- The reader, `ledger/read-answer.ts`, pure and table-tested with a recorded shape per
  engine: `readAnswer({ text, sources, raw })`. `mentioned`: after `fold()`, the pattern
  `(^|[^\p{L}])(?:و|ف|ل|ب|ك)?بحر\s*برنت` or `\bb7r\b` (case-insensitive) or `b7r.sa` /
  `b7r.app`; never bare «بحر» (the sea). `linked` and `urls`: from `result.sources` for OpenAI
  and Anthropic; for Google from `sources[].title` (the host; the URLs are grounding
  redirects); for Perplexity from the raw body's `citations` / `search_results` (the chat
  provider drops them); text URLs as a fallback for the plain mode.
- The ask, `ledger/ask.ts`: the model from the connection (`languageModel()`), the engine's
  search tool by kind (`openai.tools.webSearch()` and `anthropic.tools.webSearch_20260209()`
  with `userLocation: { type: 'approximate', country: 'SA', city: 'Riyadh' }`, keyed
  `web_search`; `google.tools.googleSearch()` keyed `google_search`; the compatible kind and
  DeepSeek plain), the prompt as a buyer would type it (no system prompt naming B7R), 1,500
  output tokens (Claude's tool blocks count against output), a 60 s abort per call.
- The spend (CTO M4): one `ai-runs` row of kind `citation` per connection per batch (the
  tokens and cost summed, the prompt count and the cited count in the label; the per-prompt
  detail in `citations`), so the runs list gains five rows a week, not seventy-five. The cost
  adds a `searchFeeUsd` per AI kind (`KINDS`) per call with the tool on, since the vendors
  charge per search beyond tokens. The connection's monthly limit guards the ledger; the
  engine's `dailyCostCapUsd` excludes `citation` runs (the cap guards the writing engine),
  which changes `counts()` and `capDecision`'s inputs by one filter. Expected: 15 prompts ×
  5 engines ≈ $2 to 4 a week; the RUNBOOK says "estimate".
- The weekly job (`citation-ledger`, Monday 07:00 Riyadh, the `ai` queue): every enabled AI
  connection, every enabled prompt; a connection over its limit or with a `citation` run in
  the last hour is skipped with a `skipped` run that says so; a 20-minute batch budget, the
  prompts past it recorded as "not run" and the label saying how many. "Run now" on the page:
  `POST /api/visibility/ledger`, `adminOnly`, one per ten minutes, queues the job.
- The page's ledger section: the cited-rate and linked-rate per engine over four weeks (on
  the non-brand prompts), the per-prompt table (an engine per column, a check or a cross
  icon with an `aria-label`, or "not run"), the excerpt in a collapsible row, the competitors
  named most, an empty state before the first run; a prompt uncited on every engine carries
  the guide "improve the answer block of the page that should answer it" with a link to the
  post or page whose title overlaps it most (a word overlap after `fold()`; no model call).

### D6. Strings, docs, rules, the compliance list

- The panel is English (`strings.ts`); the collections' labels and descriptions in both
  languages; a finding's sentence and guide live in the rule's file beside its logic.
- Every new entity (the `metrics`, `prompts` and `citations` collections, the checklist
  global) carries what `tests/admin-config.test.ts` demands: `adminGroup('visibility')`, a
  place in `ADMIN_NAV` under the Score view, an icon, both labels, `admin.custom.shows`,
  `collectionComponents` / `globalComponents`, `useAsTitle`, `defaultColumns`,
  `listSearchableFields`, a descriptions map, `EnabledSwitch` with a consequence on
  `prompts.enabled`; the migrations (the `connections.kind` and `ai-runs.kind` enums grow,
  precedent `20260914_032706`; the new tables; the job slugs); the oxlint block for
  `src/modules/visibility/**`; `@source` for `src/modules/visibility/admin`; the import map;
  axe on the view.
- ADR-049; BRD: a new §10.4 "The visibility score" with the weights table; §7.7 amended (the
  ledger replaces the quarterly manual check); §7.10 amended by project 4 for `FAQPage`;
  §11.4 amended (the score, the snapshots, the ledger; the service account moves from an env
  variable to a Connection, per `admin-ui.md` rule 9). RUNBOOK: the three connections step
  by step (the service account and the property user, the Bing key, the PageSpeed key),
  reading the score, the ledger's cost as an estimate, why a service reads "verified" only
  after its Test. ADMIN-DESIGN-SYSTEM: the page, the card, the ring, the status colours.
  `admin-ui.md`: a finding's guide always links to the field that fixes it.
- Tests: every rule table-tested (present, partial, absent); the weights sum to 100 and the
  site-only set is what the ADR says; the reader per engine and the brand matcher (the
  attached prefixes, the false positive «بحر من الخيارات», a brand-naming prompt); the JWT
  flow with a generated key; the pulls' parsers on recorded responses; the e2e: the page for
  the three roles with axe; the score moving on a change that can happen (null an author's
  photo through the API, recompute, I4 lists the author and the percentage drops by the
  pro-rata share; restore, recompute); the non-production C1 finding on the review server; a mock AI
  connection's ledger run writing `citations` rows and one `citation` run; "Pull now"
  refused without a service and rate-limited; the dashboard card.

### Out of scope

More languages; country routing; GA4 pulls (a fact only); the GEO content itself (project 4:
`FAQPage` JSON-LD, answer-first rewrites, compare pages, the checklist's outside work); charts
beyond the ring and bars; Umami pulls; Google Business Profile (BRD §7.10 stands).

## PRs, evidence, acceptance

- **PR 3a `visibility/score`**: D1, D2 (the page, the card, the checklist global, the
  `slogan` line), ADR-049, BRD §10.4 and §7.7, the rules' tests, the page and card e2e.
  Score ≥ 90 from the CTO; both CI lines; `scripts/merge-pr.sh`.
- **PR 3b `visibility/services`**: D3, D4, the RUNBOOK's connection steps, the JWT and parser
  tests, the migration, the e2e with a PageSpeed connection tested against a recorded
  response (no live call in CI; a live Test is Dhia's, as with the AI keys).
- **PR 3c `visibility/ledger`**: D5, the prompts seed, the reader's tests, the ledger e2e on
  the mock connection, the cap exclusion's unit test.

## CTO plan review

Round 1 (2026-09-16): 82, approve with revisions; M1 to M8 and m1 to m14 folded into the
text above (facts versus points with a per-item table and pro-rata items; the reader over
text, sources and raw; the brand matcher and the brand-naming prompts; one `citation` run
per connection per batch and the daily cap's exclusion; rate limits and the hour's refusal;
the upsert by `(date, source)` with the lag window; the Saudi user location and 1,500 tokens;
the two BRD decisions; the production flag, `slogan`, "verified" only through a passed Test (a tag alone counts for nothing, PR 3a review m4),
per-kind Test timeouts and partial PSI rows, the PSI median, the per-kind mask and the save
validation, the search fee, the topic bounds, the checklist in 3a, the three definitions,
the reuse list, the batch budget, the compliance list; the group order, the status colours,
the icons with labels, the tool keys, `server-only`, the locale in the link, the thresholds,
the links as text). Round 2: 93, GO (m1 the e2e scenario on an author's photo, m2 E5 without
a ceiling, n1 the token keyed by `private_key_id`, n2 E3/E4 per document-language: taken).
