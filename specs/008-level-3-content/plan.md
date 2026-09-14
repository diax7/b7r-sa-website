# Implementation Plan: Level 3, the blog in the CMS and the automated content engine

**Branches**: `level-3/blog` (3a), `level-3/engine` (3b), `level-3/live` (3c) | **Date**: 2026-09-14 |
**Spec**: `specs/008-level-3-content/spec.md`
**CTO plan review**: 2026-09-14, 87 with revisions, folded below (static pagination and a
search island so `/blog` prerenders; the key mask round trip; admin-only `ai-*` reads and the
route checks; compare-and-set topic pick and runs-based caps; `reviewFirstRuns`; the Level 1
posts migrate as `origin: ai`; absolute URLs in the feed; the constitution table; three cuts:
a dashboard card instead of a monitoring view, `imageMode: generate` deferred behind the
interface, freshness regenerates from the stored outline instead of editing paragraphs).

## Summary

Three phases, each a PR on green CI with a CTO code review. **3a** moves the blog from three
Markdown files into Payload (`posts`, `categories`, `authors`, `tags`), adds the routes the
BRD lists (`/blog` with pagination and search, `/blog/category/{hub}`, `/author/{slug}`,
`/feed.xml`, sitemap entries with a real `lastmod`), upgrades the templates (table of
contents, reading time, updated date, related and previous/next posts) and enforces the
editorial rules on publish. **3b** builds the engine as a server module with its settings,
backlog and audit log, a provider layer on the Vercel AI SDK with a mock provider for tests,
the nine-task `generatePost` workflow on Payload's job queue, every guardrail of §10.2.5, and
the admin screens. **3c** makes it run alone: the hourly tick, the weekly freshness job, the
seeded backlog, the digest and failure e-mails, and ten posts produced end to end with the
mock provider (the live run per provider waits for Dhia's keys).

## Constitution Check

| # | Gate | Pass? |
|---|---|---|
| I | RTL | The templates are the Level 1 ones (logical properties, `check:rtl`); the TOC rail sits on the inline-start side; the admin is unchanged |
| II | Static | `/blog` and every blog route prerender: pagination is `/blog/page/[n]` from `generateStaticParams` (`dynamicParams = true`, canonical of page 1 = `/blog`), search is a client island over an index the page embeds, no route reads `searchParams`; `/blog/[slug]` follows products (ADR-030); `/feed.xml` is a static route handler revalidated on publish and every 60 s. The build output lists them static and the e2e asserts `x-nextjs-cache` on `/blog` |
| III | Copy | Hub descriptions and leads are new Arabic copy (`TODO(copy)`, Appendix G, listed in the PR); post prose is CMS content (ADR-031); interface strings stay in `blogCopy` and `strings.ts` |
| IV | Budgets | No new client JS on `/blog/*` except the search island on `/blog` (≤ 5 KB gzip; the TOC, related, previous/next and the feed are server-rendered); the LHCI post URL keeps its slug through the migration |
| V | Tokens | Blog surfaces use the shared primitives and `Prose`; the admin group follows the design system |
| VI | No fabrication | The engine writes from the facts sheet and is checked against it; D-47 (no AI disclosure) is Dhia's recorded decision and the `ai-runs` log is the audit trail; the three Level 1 posts stay flagged for Dhia's read |
| VII | Modules | `modules/ai-content` is server-only and nothing under `(site)` imports it; the Lexical converters move to `modules/core/rich-text`; `modules/blog` reads `lib` + `core` only |
| VIII | ADRs | ADR-041 (blog in the CMS: Lexical body, template CTA, `like` search without Arabic normalisation, static pagination, `contentUpdatedAt`, the migrated posts' origin); ADR-042 (the engine: Markdown in, Lexical out, schedules, the mock gate, key encryption, the dashboard card, image modes, outline-based freshness, `reviewFirstRuns`); BRD §6.11, §10.1, §10.2.1/4/7, §12.3 amendments through the sections, rebuild, copy |
| IX | Tests | Per phase below; every gate in prek and CI |
| X | No attribution | Yes |

## Technical context (verified against payload 3.89.0 and @payloadcms/richtext-lexical 3.89.0)

- **Lexical both ways**: `convertMarkdownToLexical` (server; needs the sanitised editor
  config from `editorConfigFactory`) turns the engine's Markdown into the same JSON an editor
  produces; `@payloadcms/richtext-lexical/plaintext` gives the text for reading time and the
  checks; `@payloadcms/richtext-lexical/html` gives the feed's `content:encoded`, with every
  link and image made absolute (`absoluteUrl`). The posts editor enables exactly the features
  the Markdown transformers cover (headings h2/h3, paragraphs, bold, italic, lists, links,
  blockquote, uploads; no tables, and the draft prompt forbids them). Heading ids are
  `section-n` by position, computed from the tree at render time, so an editor's post and an
  engine's post get the same ids. The site renders Lexical with the JSX converters that
  already power the pages' rich-text block; those converters move to
  `src/modules/core/rich-text/` so pages and posts share one renderer.
- **Jobs**: tasks and workflows in `payload.config.jobs`; a task or workflow with a `schedule`
  (`cron`, `queue`, `hooks.beforeSchedule`) is enqueued by the in-process autorun (ADR-033), so
  the hourly tick, the weekly freshness job and the digest are schedules, not an external
  caller. The `ai` queue runs one job at a time (`autoRun: [{ cron: '* * * * *', queue: 'ai',
  limit: 1 }]`); a workflow task is retryable (`retries`) and each LLM call carries a 120 s
  timeout (`AbortSignal.timeout`).
- **Provider layer**: Vercel AI SDK, exact pins published 2026-09-11/12 (> 24 h): `ai` 7.0.99,
  `@ai-sdk/openai` 4.0.66, `@ai-sdk/deepseek` 3.0.44, `@ai-sdk/anthropic` 4.0.53,
  `@ai-sdk/google` 4.0.69. `generateText` for prose, structured output for the outline, the
  review and the SEO step (Zod schemas); Pexels through `fetch`; `imageMode: generate` waits
  behind `Provider.image?` for a chosen image provider. Model ids are settings strings. The
  SDK's API is checked against its current docs at implementation (context7), never memory.
- **Secrets**: provider keys live in `ai-settings` as text fields. The round trip
  (`fields/secret.ts`, unit-tested on its four transitions): `afterRead` returns a mask
  (`••••` + the last four characters) unless `req.context.decryptKeys === true`, which only
  the pipeline's Local API reads set, so REST and the admin never see plaintext;
  `beforeChange` keeps the stored ciphertext when the incoming value is the mask (the admin
  form posts the whole global back on every save), clears it when the value is empty, and
  encrypts (`payload.encrypt`) a new value. `payload.encrypt` derives from `PAYLOAD_SECRET`:
  rotating the secret invalidates every stored key (RUNBOOK, next to the sign-out note).
  `AI_CONTENT_ENABLED` (env) overrides the switch; `AI_CONTENT_MOCK=1` allows
  `activeProvider: 'mock'` (tests, CI, the review server), is refused otherwise, and joins
  `assertProductionEnv`'s "must not be set in production" list beside the transport
  overrides, so the mock is impossible on CranL twice over.
- **Time**: the publish hour is Riyadh's; `Intl.DateTimeFormat` with `timeZone:
  'Asia/Riyadh'` gives the hour and the date key; every cap counts runs by that date key.
- **Facts sheet**: a pure function over `site-settings` + `products` + `integrations` returns
  the text the prompts get and the list of numbers with their units (SAR, days, cm, g, the
  product count) the review compares against.
- **Routes**: `author` joins `CODE_TOP_LEVEL` (and the proxy literal); `feed.xml` has a dot
  and passes the matcher already. `/blog/[slug]` and `/blog/page/[n]` are `dynamicParams =
  true` like products (ADR-030); no blog route reads `searchParams`. Search is a client island
  on `/blog` over an index the page embeds (slug, title, excerpt, hub of every published
  post; a few hundred rows stay under a few tens of KB in the RSC payload): it folds the
  query and the index the way the palette does (`fold()` in `palette-rank.ts`, shared), lists
  the matches as links in place of the grid, and reads `location.search` for `q` on mount so
  a search can be linked. No server query, no Arabic normalisation beyond the fold (recorded).
- **`/api/ai/*` routes**: `payload.auth({ headers })` and the `admin` role, `acceptsJsonFrom`
  (JSON body and a same-origin `Origin`) like every JSON route, 403 otherwise. `ai-settings`,
  `ai-topics` and `ai-runs` are `read: isAdmin` on the API and hidden from editors like the
  settings globals (they carry prompts, scores and costs).
- **Two ticks, one slot**: `pickTopic` is a compare-and-set (`update` where `status =
  backlog` and the id; no row updated means another runner took it, the workflow ends
  quietly), and the daily and monthly caps count `ai-runs` started in the period (running or
  done), not published posts, so a second container or a restart mid-run cannot publish
  twice. Tested with two concurrent picks.

## Architecture

```
src/modules/cms/collections/{posts,categories,authors,tags}.ts   # 3a, group «المدونة» / Blog
src/modules/cms/fields/editorial.ts        # post rules: hard (Refused on publish), soft (warnings)
src/modules/cms/hooks/revalidate.ts        # + revalidatePosts (post, hub, author, /blog, feed, sitemap)
src/lib/cms/blog.ts                        # getPosts (page, hub, tag, q), getPost, getCategories,
                                           # getAuthor, related, adjacent; Post/Category/Author view types
src/lib/lexical/{headings,split,plaintext}.ts   # pure: H2 list with ids, split after 2nd H2, text
src/modules/core/rich-text/                # LexicalProse (moved from pages/blocks/rich-text.tsx)
src/modules/blog/{blog-index,hub-page,blog-post,author-page,toc,pagination,search-form}.tsx
src/app/(site)/blog/{page,[slug]/page,category/[hub]/page}.tsx, /author/[slug]/page.tsx,
src/app/feed.xml/route.ts
src/modules/core/seo/json-ld.ts            # blogPosting on the new Post type, profilePage, collectionPage
src/content/seed/blog.ts                   # the six hubs, the author, the three posts (Markdown)
scripts/migrate-content.ts                 # + categories, author, posts (Markdown → Lexical)

src/modules/ai-content/                    # 3b, server only; nothing under (site) imports it
  settings.ts, topics.ts, runs.ts          # ai-settings global, ai-topics, ai-runs (admin only)
  provider/{index,mock,sdk}.ts             # Provider interface; mock (fixtures); SDK registry
  facts.ts                                 # facts sheet + numbers
  prompts/{system,brief,outline,draft,review,seo,image}.ts
  pipeline/{pick-topic,brief,outline,draft,review,image,seo,publish,notify}.ts  # one task each
  pipeline/workflow.ts                     # generatePost: the nine tasks in order, run log
  checks.ts                                # banned phrases/claims, Latin paragraphs, em dashes, numbers
  dedupe.ts, caps.ts, cost.ts, transliterate.ts, markdown.ts (→ Lexical), email.ts
  tick.ts                                  # 3c: hourly schedule; freshness.ts, digest.ts (weekly)
  admin/{monitoring-view,generate-now,import-topics,post-actions}.tsx
src/app/api/ai/{generate,regenerate,topics/import}/route.ts   # admin-only, Payload auth
```

## Phase 3a: the blog in the CMS (branch `level-3/blog`)

**Collections** (group `{ ar: 'المدونة', en: 'Blog' }`, icons `Newspaper`, `FolderTree`,
`UserPen`, `Tag`; hues posts violet, categories blue, authors pink, tags blue):
- `categories`: `name`, `slug` (unique, the six Appendix E slugs), `description` (one
  sentence), `heroLead` (hub page lead), `defaultCover` (media), `order`. Admin only creates.
- `authors`: `name`, `slug`, `role`, `bio`, `photo` (media, optional), `sameAs` (array of
  URLs). One seeded author (ضياء, مؤسس بحر برنت).
- `tags`: `name`, `slug`.
- `posts`: `title` (≤ 70), `slug` (unique, `SLUG_PATTERN`, ≤ 64), `excerpt` (≤ 160), `hub`
  (relationship categories, required), `tags` (hasMany), `cover` (media, required; media
  already requires alt), `takeaways` (array of text), `body` (Lexical, the editor from
  `blocks.ts` with headings, lists, links, uploads, tables), `author` (relationship,
  default the seeded author), `publishedAt` (set on first publish when empty),
  `contentUpdatedAt` (optional; the "updated" date, shown when later than `publishedAt`; the
  freshness job sets it), `readingMinutes` (computed, read-only), `origin` (`manual | ai |
  ai-edited`, default manual, admin-only), `seo` (title, description, image; the pages'
  shape), `warnings` (read-only, computed), `lastSavedBy`. Drafts with autosave and
  `schedulePublish`; `maxPerDoc: 25`; access as pages; preview to `/blog/{slug}`.
- **Editorial rules** (`fields/editorial.ts`, pure, unit-tested): on a publish (not a draft
  save) the hard rules throw `Refused` with the English reason: title ≤ 70, excerpt ≤ 160,
  exactly three takeaways, at least two internal links (Lexical link nodes to a document or
  to a site path), a cover. The soft rules write `warnings`: an external link whose host is
  on the competitor list (printful, printify, gelato, teespring, redbubble), a paragraph whose
  letters are mostly Latin, an em dash anywhere. `readingMinutes` and `warnings` compute in
  `beforeChange`; an editor's save of an `ai` post sets `origin: ai-edited` (3b uses it).
- **Hooks**: `revalidatePosts` regenerates `/blog/{slug}`, `/blog`, `/blog/category/{hub}`,
  `/author/{author}`, `/feed.xml`, `/sitemap.xml` (hub and author slugs looked up by id when
  the hook has ids) and queues IndexNow for the pages, never the feed or the sitemap; a
  category or author change regenerates its page and `/blog`.
- **Site**: `lib/cms/blog.ts` reads with `PUBLIC_READ` + `versionedRead()` (drafts in a
  preview), `depth: 1`, `sort: '-publishedAt'`, pagination 12 per page; `getPost` also
  returns the hub's other posts for related and adjacent. Routes: `/blog` (hub chips link to
  hub pages, featured = the newest post, grid, the search island with an empty state),
  `/blog/page/[n]` (the rest of the grid; `generateStaticParams` from the published count,
  canonical of page 1 = `/blog`, `rel` prev/next), `/blog/category/[hub]` (H1, lead, posts,
  `/blog/category/[hub]/page/[n]`), `/blog/[slug]`
  (template: breadcrumbs, H1, meta with reading time and the updated date, cover, takeaways,
  the table of contents as a side rail from 1024 px and a `<details>` list under it, body split
  after the second H2 with the CTA between, share, author card, related two, previous/next in
  the hub), `/author/[slug]` (photo or initial, role, bio, sameAs links, the author's posts,
  `ProfilePage` JSON-LD), `/feed.xml` (RSS 2.0, latest 20, full HTML, `revalidate = 60`).
  Sitemap: posts (`lastmod` = `contentUpdatedAt` or `publishedAt`), hub pages, the author.
- **Migration**: one schema migration; `scripts/migrate-content.ts` seeds the six hubs (name
  from the BRD; description and lead agent-written under §4.1 and listed for Dhia in the PR),
  the author, and the three posts (Markdown → Lexical, covers uploaded into media, published
  because they are live today, `origin: ai` because they were machine-written (ADR-018) and
  listed in the PR as still owed Dhia's read; the freshness job then keeps their numbers
  honest; `publishedAt` kept and the LHCI post slug unchanged). `src/content/blog/{posts,
  load.ts}` and the `blogPosts` array go; `blogCopy` stays as interface copy. The seed-check
  in CI proves it. `tags` is optional everywhere; related posts fall back to hub then recency.
- **Admin**: quick action "Write a post" (the tile grid becomes four columns from 1280 px),
  palette search on title and slug, `admin-config.test` and `admin-icons.test` extend
  themselves, e2e: create a post through REST, publish, assert the five routes and the feed;
  the editorial refusals; the "no AI mention" grep.
- **Docs**: ADR-041 (blog in the CMS: Lexical body, template-placed CTA, the search island
  and static pagination, `contentUpdatedAt`, the migrated posts' origin); BRD §6.11 and §10.1
  amendments (pagination path, search); design system §6 (the Blog group); RUNBOOK (the seed
  and the feed); Appendix G rows for the hub copy.

## Phase 3b: the engine, mocked (branch `level-3/engine`)

- **`ai-settings`** (global, admin only, group `{ ar: 'المحتوى الآلي', en: 'AI content' }`):
  the groups of §10.2.1 as tabs: providers (`activeProvider` select incl. `mock`, `models`
  per provider, keys encrypted + masked), cadence (`enabled`, `postsPerDay` 1, the Arabic
  help text, `publishHourRiyadh` 9, `maxPostsPerMonth` 31, `dailyCostCapUsd`), language and
  style (`styleGuide` prefilled from §4.1 + Appendix E, `systemPrompt` with a `version`
  number bumped on change, `bannedPhrases`, `bannedClaims` prefilled), facts sheet (a
  read-only UI field rendering `factsSheet()`), images (`imageMode` default `hubDefault`;
  `stock` with the Pexels key; `generate` stays in the select but the pipeline refuses it
  with a clear run error until an image provider is wired behind `Provider.image?`, BRD
  §10.2.1 amendment: the SDK's image APIs differ per provider and none is needed for the
  first ten posts; `imageStyle` kept for that day), quality (`qualityThreshold` 80,
  `maxRevisionPasses` 1, `minWords` 800, `maxWords` 1600), `reviewFirstRuns` (default 3:
  while above zero a live provider's post is created as a draft, the counter decrements and
  the digest says so; at zero the engine publishes as D-44 requires; the mock provider never
  decrements it), cost rates per provider (input and output per million tokens, defaulted to
  the providers' published prices at implementation, labelled "estimate"), notifications
  (`notifyEmail`, `weeklyDigest`, `failureAlerts`), and the research caveat as the global's
  description.
- **`ai-topics`**: the fields of §10.2.2; `status` drives the pipeline; `post` relationship;
  `lastError`; columns title, hub, status, priority, window; a "Generate now" button in the
  edit view (`beforeDocumentControls`, POST `/api/ai/generate` with the topic id) and a
  "Bulk add" panel above the list (`beforeList`; CSV `title,hub,primaryKeyword,
  secondaryKeywords,intent,priority`, POST `/api/ai/topics/import`, returns created/skipped).
- **`ai-runs`**: one row per execution: topic, provider, model, per-step `{ inputHash,
  summary, ms }` (the hash covers the brief and the outline, never the facts sheet's volatile
  values, so the same topic hashes the same across days), the stored outline (the freshness
  job regenerates from it), `score` + `rubric` (five numbers), `tokensIn`, `tokensOut`,
  `costUsd` (an estimate), `durationMs`, `status`, `kind` (`generate | freshness`), `post`,
  `error`. Read-only in the admin; the digest job deletes rows older than 12 months.
- **Provider layer** (`provider/`): `interface Provider { text(req): Promise<{ text, usage }>;
  json<T>(req, schema): Promise<{ value: T, usage }>; image?(req): Promise<{ bytes, mime }> }`.
  `sdk.ts` builds one from the settings through the AI SDK registry (openai, deepseek,
  anthropic, google); `mock.ts` answers from fixtures (an Arabic article of ~900 words built
  from the facts sheet, an outline, a review scoring 88 with a critique, a title and slug,
  a 1×1 PNG) and records every call, so the pipeline tests assert prompts and order.
- **Pipeline** (`pipeline/`, one file per task, each a pure `run(ctx, input)` plus its
  `TaskConfig`; `ctx` = `{ payload, settings, provider, facts, clock, log }`):
  1. `pickTopic`: highest priority `backlog` topic whose window is open (seasonal
     `preferredPublishWindow`), skipping one whose primary keyword a published post carries
     or whose title shares ≥ 60 % of its tokens with one (`dedupe.ts`); sets `generating`.
  2. `brief`: facts + hub description + keywords + intent + three answer-first questions +
     internal link targets (`/products/{slug}`, `/how-it-works`, `/faq`, the hub's posts).
  3. `outline` (structured): H2s as questions with a one-line answer, the first answering the
     primary keyword, three takeaways, the CTA position after the second H2.
  4. `draft`: Markdown, 800 to 1600 words, the §4.1 rules in the system prompt, one example
     with SAR numbers from the facts, no first person outside the facts, no AI mention, no
     Latin paragraphs, no em dashes.
  5. `review`: `checks.ts` first (numbers vs the facts with the ريال/يوم/منتج/سم/غ context
     regex, banned phrases, banned claims list, Latin paragraphs, em dashes, word count), then
     the model's rubric (30/25/20/15/10) merged with the deterministic deductions; below the
     threshold, one revision pass with the critique; still below, topic `failed`, run logged,
     Dhia alerted, stop.
  6. `image`: per `imageMode`: stock (Pexels search by an English keyword the outline step
     returns, attribution stored) or the hub's default cover; `generate` is refused with a
     run error until a provider implements `Provider.image`; Arabic alt text from the model;
     a stock file lands in `media`.
  7. `seo`: title ≤ 60 with the primary keyword, description ≤ 155, Latin slug (the model's,
     validated against `SLUG_PATTERN`, `transliterate.ts` as the fallback, uniqueness checked).
  8. `publish`: Markdown → Lexical (`markdown.ts`), the post created with `origin: ai`, the
     author, hub, tags, takeaways, cover, `publishedAt` = the slot; the editorial rules of 3a
     run as on any publish; revalidate + IndexNow through the same hooks.
  9. `notify`: appends to the digest bucket (a JSON field on the run); e-mails on failure or
     when a cap trips (`email.ts` through `payload.sendEmail`, English subject lines).
  `workflow.ts` runs them in order, writes the run row as it goes (a step's failure is in the
  row), and marks the topic `published` or `failed`.
- **Guardrails** (`caps.ts`, unit-tested with a clock): `enabled` and `AI_CONTENT_ENABLED`;
  posts today < `postsPerDay`; posts this month < `maxPostsPerMonth`; cost today <
  `dailyCostCapUsd`; provider timeouts (120 s) and the task's retries with backoff (three,
  exponential); dedupe; never the same topic within 12 months (a `published` topic is never
  picked again; a new topic with the same primary keyword as a post younger than a year is
  skipped); external links only to `b7r.app`, `b7r.sa` and an allowlist of `.gov.sa` hosts
  (the draft's links are filtered before publish); "Regenerate" and Payload's own
  "Unpublish" on every AI post (`admin/post-actions.tsx` in the sidebar, POST
  `/api/ai/regenerate`); `ai-edited` exempts a post from the freshness job.
- **Admin screens**: the settings global (tabs), topics and runs lists, and a "Content
  engine" card on the existing dashboard for admins (posts this month, average score,
  failures, cost to date, the next slot, the last five runs with links) in place of a
  separate monitoring view (BRD §10.2.7 amendment: no new view, import-map entry or route);
  the health card gains a "Content engine" row (on/off, next slot).
- **Tests**: vitest for facts, dedupe, checks, caps, transliteration, cost, the mock
  pipeline end to end (nine steps, a run row, a post payload), the key mask; cms e2e: with
  `AI_CONTENT_MOCK=1`, set `activeProvider: mock` and `enabled`, create a topic, POST
  `/api/ai/generate`, poll the run until `done`, assert the post is published with three
  takeaways, two internal links, a cover with alt text, a score ≥ 80, no AI mention on the
  page or in the feed, and that the run endpoints refuse an editor and an outsider.
- **Docs**: ADR-042 (the engine: Markdown in, Lexical out; schedules instead of the external
  runner; the mock provider gate; key encryption and the secret rotation caveat; the dashboard
  card; image modes; `reviewFirstRuns`); BRD §10.2 amendments; RUNBOOK (keys, the switch,
  what to do when a run fails, secret rotation); the design system (the AI group, the card).

## Phase 3c: the engine live (branch `level-3/live`)

- `tick.ts`: an hourly schedule (`content-tick`, queue `ai`) that queues `generatePost`
  when every guard passes and the Riyadh hour has reached `publishHourRiyadh` with no post
  yet today; `beforeSchedule` skips when a tick is already queued.
- `freshness.ts`: weekly (Monday 06:00 Riyadh); the ten oldest published `ai` posts
  (`ai-edited` exempt, so human prose is never overwritten); the review checks against the
  current facts; a post whose numbers drifted is regenerated from the outline stored on its
  run with the corrected facts (draft → review → publish over the same slug and cover),
  `contentUpdatedAt` set, revalidated, a run row with `kind: freshness` (BRD §10.2.4
  amendment: no paragraph surgery on the Lexical tree).
- `digest.ts`: weekly (Sunday 08:00 Riyadh) e-mail when `weeklyDigest` is on: posts this
  week with scores and costs, failures, the next slot; the 12-month retention sweep runs here.
- The backlog: `content:migrate` seeds the 30 Appendix E topics with hub, keywords, intent,
  priority and the seasonal windows.
- Ten posts end to end with the mock provider on the review server (ten mock articles built
  from ten topics so the corpus is not one text repeated), each checked by the pipeline; the
  runs and posts are what Dhia reviews. The live run per provider (§10.3 item 2, "one live run
  per provider") is Dhia's: add a key, set the provider, press "Generate now".
- Tests: tick decisions across a day with a clock (before the hour, at the hour, after a post,
  cap reached, switch off, env off), freshness with a changed `delivery.maxDays`, the digest's
  content; e2e: the health row and the monitoring view.
- Docs: ADR-042 amended (schedules), RUNBOOK (the day-to-day of the engine), BRD §12.3 3c
  marked with the live-run caveat, IDEAS (Search Console topics for Level 4).

## Judgement calls

- Categories, author and tags are plain collections rather than selects so hub pages carry
  their own copy and cover and Level 4 can add authors; the six hubs are seeded and an admin
  may edit their copy.
- No `plugin-search`: one `like` query on two fields answers the search box; the plugin's
  table, hooks and migration would serve nothing until there are other collections to
  search across.
- The CTA is placed by the template (the BRD lets the outline choose the position, and it
  is always "after the second H2"); the engine and an editor cannot misplace it.
- The pipeline's tasks are pure functions on a `ctx` so the whole engine is testable without
  a provider or a database; Payload's job runner only wires them.
- Cost is an estimate from tokens and a per-provider rate in the settings (input/output per
  million), not the provider's billing API.
