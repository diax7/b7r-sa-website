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

## Design

### D1. The rules engine (PR 3a)

`src/modules/visibility/rules/`: one pure function per check, `check(input) → Finding`,
where `input` is a snapshot the page builds once per open (`snapshot.ts`: the site settings,
the search defaults, the home, every product, page, post, hub, author and FAQ entry in both
languages, the connections' kinds and last tests, the latest `metrics` and `citations` rows)
and `Finding` is `{ key, section, weight, status: 'done' | 'next' | 'missing', title, guide,
href?, items? }`. `done` earns the weight, `next` half of it (the thing exists but is partial:
three of five products photographed), `missing` none. A finding may list the documents
behind it (`items`: the five products without photos, each with a link to its edit view) so
the page guides to the field, not just the rule. Sections and their weights (sum 100):

- **Identity (15).** One tagline everywhere (site-settings `tagline` present, both languages;
  the footer, `llms.txt`, the manifest and the Organization node read it: code-guaranteed once
  present). Organization JSON-LD with `sameAs` pointing at filled profiles (X, Instagram,
  TikTok present and `https://`). The About page published in both languages with the facts
  band. A named author with a bio and a photo on every published post; the author's `sameAs`
  filled.
- **Crawl access (20).** `robots.txt` allows the AI bots (C-08: code-guaranteed, listed as
  done with the bots named). `sitemap.xml`, `llms.txt` and `en/llms.txt` answering
  (code-guaranteed). Canonicals and reciprocal hreflang on every page (code-guaranteed).
  IndexNow key configured (env). Search Console verified (the connection exists and its last
  test passed, or the verification token in the search defaults is set). Bing verified (the
  same). No published page, product or post whose English version is empty while the site is
  in English (per-document items).
- **Extractability (30).** A search title and description on every published page, product,
  post and hub in every language it exists in, within the lengths (`seo.title` ≤ 60,
  `seo.description` 70 to 160). Alt text on every photo in use (the media rows referenced by a
  published document). Every product with at least one photo, a short description, sizes and
  a price. Every post with three takeaways, an answer-first opening (the first paragraph 40 to
  80 words), at least one H2 phrased as a question, two internal links, a cover with alt text.
  The FAQ page with 5 to 12 published entries per language and `FAQPage` JSON-LD (missing
  until project 4 ships it; the guide says so). A compare page (missing until project 4).
  Concrete facts on the product pages (the delivery days and the price prefix from the
  settings: code-guaranteed).
- **Corroboration (10).** The three social profiles filled. The founder checklist (project 4)
  with its items ticked: a `visibility-checklist` global of checkboxes (LinkedIn company and
  founder, YouTube, X, Google Business Profile, a first third-party mention), each with its
  guide; `next` while some are ticked, `done` when all are.
- **Measurement (10).** The traffic count receiving landings in the last 30 days (a row
  exists: done; none: next with "the site is not live yet or the beacon is blocked"). The
  citation ledger with at least five prompts per language and a run in the last 14 days. GA4
  configured (`NEXT_PUBLIC_GA_ID`): a fact, not points.
- **Performance and outside signals (15).** PageSpeed mobile performance ≥ 90 on the five
  audited URLs from the latest snapshot (done ≥ 90 on all, next ≥ 80, missing below or no
  snapshot: "connect PageSpeed"). Search Console: the site has impressions in the last 28
  days (done), the top query is an intended category term (next when not). The cited-rate
  over four weeks: done ≥ 50% of prompt runs name B7R, next ≥ 20%, missing below or no runs.

The score per section is the weighted sum over its findings, the overall the sum of sections;
`siteOnly` is the same over the sections that need no service (Identity, Crawl access minus
the two verifications, Extractability, Corroboration minus the checklist's outside items,
Measurement's traffic item). Every rule is a small pure function with a table-driven test
(a snapshot with the thing present, partial and absent); the snapshot builder is exercised
by the e2e. The weights and thresholds live in one table (`rules/weights.ts`) the ADR
quotes; changing one is a one-line, reviewed change.

### D2. The Score page and the card (PR 3a)

- `/admin/visibility` (`ADMIN_VIEWS.visibility`, Visibility group, order 0, icon `Gauge`,
  label {ar «درجة الظهور», en "Visibility score"}), behind `adminView()`. The header: the
  overall percentage in a ring (SVG, the Visibility pink on the surface track, the number in
  the middle), the site-only percentage beside it in words ("What you control: 84%"), the
  date of the reading. Then one card per section: its percentage bar, three lists in the
  order *next, missing, done* (what to do first, then what is absent, then what is right;
  done is collapsed after five), each finding a sentence with its guide and a link to the
  admin field or page (`href`), and the documents behind it (up to ten, "and 12 more").
  Below the sections: the outside signals as facts (the last snapshot of Search Console,
  Bing and PageSpeed with their dates; the ledger's rates) with links to their pages
  (PR 3b/3c) and "Connect" links to Connections when absent.
- The dashboard card "Visibility score" for admins: the ring small, the overall and the
  site-only numbers, the three findings with the most weight among `next` and `missing`, a
  link to the page. Empty state: none (the rules always answer).
- The reading is computed on open and cached in memory for 60 seconds per process (the
  snapshot reads every document); a "Recompute" link bypasses the cache. No stored score:
  the score is a function of the content, and history is the `metrics` snapshots (PR 3b),
  which record the overall and site-only numbers nightly, so the page can say "up 6 points
  since last week".

### D3. Connection kinds for the services (PR 3b)

`src/modules/connections/kinds.ts` gains `google-search-console` (the secret is the service
account's JSON key, pasted whole; the connection's `model` field is hidden for these kinds;
`baseUrl` unused), `bing-webmaster` (the API key), `pagespeed` (the API key, optional but
counted). The engine's picker (`ai-settings.connection`) gains `filterOptions` to the AI
kinds, which the round-2 plan of the Connections PR deferred to this project. The Test per
kind: Search Console lists the sites the account may read and checks the property (`sc-domain:
b7r.sa` or the URL prefix, from the site URL) is among them; Bing calls `GetUserSites`;
PageSpeed runs one mobile audit of the home page. Google's token: the JWT-bearer flow with
the service account's private key through Web Crypto (RS256), no `google-auth-library` (one
dependency avoided; forty lines; unit-tested against a known key). The rate and limit fields
hide for these kinds (no tokens to price). The secret's mask shows the key's `client_email`
tail for Google so Dhia knows which account it is.

### D4. The pulls and the `metrics` snapshots (PR 3b)

- `metrics` collection (Visibility group, read-only, under the Score page as "Snapshots"):
  `date`, `source` (`search-console` | `bing` | `pagespeed` | `score`), `data` (JSON), one row
  per source per day (compound unique). Search Console: the last 28 days' totals (clicks,
  impressions, CTR, position), the top 25 queries and the top 25 pages, per country when
  available; Bing: the same shape from `GetRankAndTrafficStats` and `GetQueryStats`;
  PageSpeed: the mobile and desktop performance, accessibility, best-practices and SEO scores
  plus LCP, CLS and INP for five URLs (`/`, `/products`, one product, `/blog`, one post);
  `score`: the day's overall and site-only percentages and the per-section numbers.
- One nightly job (`visibility-pull`, 04:00 Riyadh, on the `ai` queue, ADR-033): pulls every
  connected service, writes the day's rows, then computes and stores the score row. A
  service whose pull fails writes no row and logs once; the page shows the last good snapshot
  with its date. The top Search Console queries feed the engine's topic suggestions: rows of
  `ai-topics` with `source: 'searchConsole'` for queries with ≥ 50 impressions and no topic
  yet (BRD 11.4 asked for this).
- "Pull now" on the page (`POST /api/visibility/pull`, `adminOnly`, queues the job).

### D5. The citation ledger (PR 3c)

- `prompts` collection (Visibility group, under the Score page): `text`, `language`, `intent`
  (category, compare, how-to), `enabled`, `order`; seeded with ten Arabic and five English
  buyer questions from the BRD's category terms ("أفضل موقع طباعة على الطلب في السعودية", "كيف
  أبدأ براند ملابس بدون مخزون", "B7R vs Printful للسعودية"...), editable.
- `citations` collection (read-only, under the page): `date`, `connection` (relationship),
  `prompt` (relationship), `mode` (`search` | `plain`), `mentioned` (B7R or بحر named),
  `linked` (a `b7r.sa` URL present), `urls` (the cited URLs, ours and others), `competitors`
  (the names found from a list in the settings: Printful, Printify, Teespring...), `excerpt`
  (the first 400 characters of the answer), `runId`. The rules that read the answer are pure
  (`ledger/read-answer.ts`, table-tested with real-shaped answers).
- The run: `ledger/ask.ts` builds the model from the connection (`languageModel()`) with the
  engine's search tool by kind (`openai.tools.webSearch()`, `google.tools.googleSearch()`,
  `anthropic.tools.webSearch_20260209()`; the compatible kind and DeepSeek plain), asks the
  prompt as a buyer would (the prompt text alone, no system prompt naming B7R), 600 output
  tokens, one call, and records an `ai-runs` row of kind `citation` with the tokens and cost,
  so the connection's monthly limit (ADR-047) guards the spend and the runs list shows it.
- The weekly job (`citation-ledger`, Monday 07:00 Riyadh, the `ai` queue): every enabled AI
  connection, every enabled prompt, skipping a connection over its limit with a `skipped`
  run that says so; "Run now" on the page (`POST /api/visibility/ledger`, `adminOnly`).
- The page's ledger section: the cited-rate and linked-rate per engine over four weeks, the
  per-prompt table (engine columns, ✓ / ✗ / not run), the competitors named most, the last
  excerpt on hover; a prompt uncited on every engine carries the guide "improve the answer
  block of the page that should answer it" with a link to the post or page whose title is
  closest (a word overlap; no model call).

### D6. Strings, docs, rules

- The panel is English (`strings.ts`); the collections' labels and descriptions in both
  languages; the findings' sentences are English (they are panel copy), one per rule, in the
  rule's file beside its logic so a rule and its words are reviewed together.
- ADR-049; BRD: 11.4 amended again (the score, the snapshots, the ledger), a new 10.4 "The
  visibility score" table of sections and weights; RUNBOOK: connecting the three services
  (the service account steps, the Bing key, the PageSpeed key), reading the score, the
  ledger's cost; ADMIN-DESIGN-SYSTEM: the page, the card, the ring; `admin-ui.md`: a
  finding's guide always links to the field that fixes it.
- Tests: every rule table-tested (present, partial, absent); the weights sum to 100; the
  answer reader; the JWT flow; the pulls' parsers on recorded responses; the e2e: the page
  for the three roles, the score moving when a product loses its photo (edit through the
  API, recompute, the finding lists the product, the percentage drops, restore, recompute),
  a mock AI connection's ledger run writing a `citations` row and a `citation` run, "Pull
  now" refused without a service, the dashboard card.

### Out of scope

More languages; country routing; GA4 pulls (a fact only); the GEO content itself (project 4:
FAQPage JSON-LD, answer-first rewrites, compare pages, the founder checklist's outside work);
charts beyond the ring and bars; Umami pulls.

## PRs, evidence, acceptance

- **PR 3a `visibility/score`**: D1, D2, ADR-049, the BRD table, the rules' tests, the page
  and card e2e. Score ≥ 90 from the CTO; both CI lines; `scripts/merge-pr.sh`.
- **PR 3b `visibility/services`**: D3, D4, the RUNBOOK's connection steps, the JWT and parser
  tests, the migration, the e2e with a PageSpeed connection tested against a recorded
  response (no live call in CI; a live Test is Dhia's, as with the AI keys).
- **PR 3c `visibility/ledger`**: D5, the prompts seed, the answer reader's tests, the ledger
  e2e on the mock connection.
