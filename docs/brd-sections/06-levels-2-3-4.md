## 9. Level 2: admin dashboard (Payload CMS)

### 9.1 Goal

Give Dhia and an editor a WordPress-like, Arabic, right-to-left admin at `https://b7r.sa/admin` to change every piece of site content and configuration without a deploy, while the public site stays static and fast. Since Level 5 (ADR-043) every localised field carries an Arabic and an English value (the panel's locale switch); a document is on the English site once its title has an English value, and the English site exists once the site settings (brand name and the menu's CTA label, ADR-046) have theirs. Payload CMS 3 runs inside the same Next.js app (decision from `docs/research/05`: MIT licence, Arabic RTL admin, built-in drafts, scheduled publishing, jobs queue, custom admin views).

### 9.2 Infrastructure additions

- CranL managed **Postgres** in the same project; connection string in `DATABASE_URL`. Daily automated snapshots (CranL) plus a weekly `pg_dump` to the S3 bucket by a job.
- CranL **S3 bucket** for media through `@payloadcms/storage-s3`; public read for images; served through the CDN zone. Original uploads are kept; Payload generates sizes (thumbnail 400, card 800, hero 1920, og 1200 × 630) with focal-point cropping.
- New env vars: `DATABASE_URL`, `PAYLOAD_SECRET` (≥ 32 random bytes), `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `PAYLOAD_PUBLIC_SERVER_URL` (+ `S3_PUBLIC_URL` when objects are served from a host other than the endpoint). All of them join the production-required set asserted at start (§8.5); `PAYLOAD_PUBLIC_SERVER_URL` must equal the site origin.
- Migrations are SQL files under `src/migrations/` run by the deploy workflow before the image is built and again by Payload at start-up; they are additive so the running image keeps serving during a release. Because every page is prerendered from the database, `next build` needs `DATABASE_URL` and `PAYLOAD_SECRET`: the image is built in GitHub Actions with BuildKit secrets and pushed to GHCR, and CranL pulls it (amended 2026-09-13, ADR-025).
- `/api/health` reports `db` (`ok` when `select 1` answers within 2 s) and `media` (`s3` | `local`) as fields; `ok` stays the liveness signal so a database blip never restarts the container.

### 9.3 Payload setup

- Routes: admin UI at `/admin`, REST at `/api/payload/*` (rename from the default `/api` to avoid clashing with the site's API routes), GraphQL disabled.
- Admin locale: `ar` from `@payloadcms/translations`, `rtl: true`; the admin's document title "لوحة بحر برنت"; the logo and favicon replaced with the brand icon. Amended 2026-09-13 (ADR-039, `specs/007-admin-ui/`): the panel is dark only on Payload's greys with the brand font, radii and accent; the sidebar, header, account menu, login and dashboard are rebuilt on shadcn/ui primitives with an icon for every collection and global; every collection and global carries an Arabic description; the rules live in `docs/ADMIN-DESIGN-SYSTEM.md` and `.claude/rules/admin-ui.md`. Amended again 2026-09-13 (Dhia's review, ADR-039): the panel's UI language is English for everyone (`i18n.supportedLanguages: { en }`, title "B7R Print Admin"); the content locale stays Arabic-first, and every text control follows the direction of its own text (`unicode-bidi: plaintext`), so Arabic content reads right-to-left inside the left-to-right panel. Collapsed on a desktop the sidebar is an icon rail, the header carries a search box and a "View website" link, and colour has one meaning each (blue action, green publish, red delete, amber careful).
- Users collection with roles `admin` and `editor`:
  - **admin**: everything, including users, settings, redirects, deleting.
  - **editor**: create/edit/publish content collections (pages, products, FAQ, testimonials, blog); no users, no site settings, no redirects, no deletes of published items.
- Auth hardening: email + password (min 12 chars, checked against a breached-password list where feasible), login lockout after 5 failures for 15 minutes, Turnstile on the login form, session cookie `SameSite=Lax; Secure; HttpOnly`, admin routes `noindex` and excluded from the sitemap, `X-Robots-Tag: noindex` header on `/admin*`. 2FA is a later block (§12.6). Delivered in Phase 2a (ADR-027, ADR-028): the 12-character minimum and the Have I Been Pwned range check on every password write (fail-open with a warning when the service is down), the lockout, 8-hour sessions, and an admin header set on `/admin*` and `/api/payload/*` (`X-Robots-Tag: noindex, nofollow`, `Cache-Control: private, no-store`, a CSP without analytics origins). The Gravatar avatar is off. The login Turnstile ships in Phase 2b (delivered 2026-09-13 as a verified gate cookie, ADR-034; the password-reset e-mail goes through Resend when configured).
- Localisation: field-level `localized: true` on all text fields with locales `['ar', 'en']`, default `ar`, English left empty until the English phase.
- Drafts and versions on Pages, Products, Posts; autosave; scheduled publish via Payload's jobs queue; live preview for Pages and Posts pointing at the public route. Phase 2a delivers drafts, versions (25 per document) and autosave on Products; scheduled publish and live preview come with Pages in 2b. Amended 2026-09-13 (ADR-031): 2b phase 2 delivers drafts, versions and autosave on Pages and the `home` global; scheduled publish lands with the jobs in 2b phase 3; live preview is deferred (docs/IDEAS.md) because it needs draft rendering on the public routes, which the ISR + `revalidatePath` pipeline does not offer.

### 9.4 Collections and Globals (1:1 with the content contract in §8.4)

| Payload | Kind | Fields (summary) | Replaces |
|---|---|---|---|
| `site-settings` | Global | brand, contact, social, offer.welcomeCredit, delivery.maxDays, delivery.origin, bookingUrl, badges (media[]), consent text | `content/site.ts` |
| `navigation` | Global | header items[], footer columns[], ctaLabel | `content/navigation.ts` |
| | | Amended 2026-09-15 (ADR-046): folded into `site-settings` as its `menu` group (primary[6], policies[4], ctaLabel, skipLinkLabel, menuOpenLabel, menuCloseLabel); the `Navigation` contract in `content/schema.ts` is read from there; the `navigation` global and its tables are gone (migration `20260915_143152`). | |
| `home` | Global | heroSlides[] (media desktop/mobile, headline, subline), productStripOrder[], designerDefaults, steps[], video (media, poster, heading, lead), whyUs[], integrationsIntro, faqSelection (5 relationship), ribbon | `content/home.ts` |
| | | Amended 2026-09-13 (ADR-031, as shipped): groups `hero` (4 slides: headline, subline, desktop and mobile media; CTAs, microcopy, 3 chips), `productStrip` (copy + 5 product relationships), `designer` (eyebrow, title, lead, sample, cta), `steps` (copy, link, 3 items with media icons), `video` (copy; the file ships with the site), `whyUs` (3 items, icon select), `testimonials`, `integrations`, `faq` (copy + link; the entries are the `faqs` rows flagged `showOnHome`), `ribbon`; `enabled` on every group but hero, productStrip, designer and ribbon; drafts + autosave; interface strings (aria, hints, input labels, validation) stay in `src/messages/ar.json`. | `content/seed/home.ts` (seed) |
| `seo-defaults` | Global | titleTemplate, the routes' titles and descriptions, verification tokens (admin-only); the default Open Graph image is the rendered file per language (`pnpm og`, ADR-043) | `content/seo.ts` |
| `products` | Collection | slug, name, shortDescription, description (rich text), baseCost, suggestedPrice, colors[] (name, hex, front media, back media), sizes[], material, weightGrams, printArea (fixed 28×38 + canvas fractions), printMethodLabel, sortOrder, seo (plugin) | `content/products.ts` |
| `pages` | Collection | slug (how-it-works, about, contact, faq, terms, shipping, privacy), title, lead, blocks[] (richText, steps, cards, miskCredential, contactCards, bookingCard, legalBody with updatedAt), seo | `content/pages/*`, `content/legal/*` |
| | | Amended 2026-09-13 (ADR-031, as shipped): blocks `richText`, `story` (heading, text, line, photo, facts-band switch), `cards` (icon, title, text, art), `steps`, `profitEquation`, `faqList` (all groups or a slice of the home entries, link, closing line), `miskCredential`, `contact` (the cards' titles and the booking card; the form is interface copy in code), `legalBody` (Markdown + date), `mediaBanner`; `seo` group (title ≤ 70, description ≤ 160, share image) instead of `plugin-seo`; the seven slugs are reserved (route folders in code, no rename, no delete) and other published pages are served by `/[slug]`; unknown top-level URLs get the global 404 through the proxy (ADR-032). | `content/seed/pages.ts`, `content/seed/legal/*.md` (seed) |
| `faqs` | Collection | group, question, answer, order, showOnHome, homeOrder (1–5; a sixth `showOnHome` is refused, ADR-031) | `content/seed/faq.ts` (seed) |
| `testimonials` | Collection | quote, name, store, avatar, placeholder (default false), order | `content/testimonials.ts` |
| `integrations` | Collection | platform (salla \| zid \| shopify, selects the brand SVG that ships with the code, ADR-031), name, nameLatin, order | `content/seed/integrations.ts` (seed) |
| `media` | Collection | upload with alt (required, Arabic), focal point, credit | `public/images/*` |
| `redirects` | Collection (plugin) | from, to, type 301/308/410 | `lib/redirects.ts` |
| `users` | Collection | email, role, name | |
| `posts`, `categories`, `authors` | Collections | Level 3 (§10) | `content/blog/*` |

Official plugins: `@payloadcms/plugin-seo` (title/description/OG fields with Arabic length hints and a preview), `@payloadcms/plugin-redirects`, `@payloadcms/plugin-form-builder` (Level 4), `@payloadcms/plugin-search` (Level 3), `@payloadcms/storage-s3`. Amended 2026-09-13 (ADR-031): `plugin-seo` is not used; each page carries a `seo` group with the same limits.

Field rules: every text field shows its §4 default as the initial value after migration; numeric fields for money are integers in SAR; `suggestedPrice` must be ≥ `baseCost` (validation); `delivery.maxDays` is an integer; `offer.welcomeCredit` is an integer displayed everywhere from this single value.

### 9.5 Editing experience

- The home page is a Global with fixed sections (order not editable; Dhia wanted a designed page, not a page builder). Each section's fields are editable; each section has an `enabled` toggle except hero, product strip, designer, and ribbon.
- Other pages use a small block set (rich text, cards, steps, media banner) so new pages can be assembled in Level 2 without code (for example a future `/creators` landing).
- Rich text is Lexical with headings H2/H3, lists, links, images, and a "CTA block" custom node; RTL editing verified. Amended 2026-09-13 (ADR-031): shipped without the CTA node, no seeded page needs one; docs/IDEAS.md holds it.
- Product prices, the welcome credit, and the delivery days each carry a help text reminding the editor that they must match the app (no API sync, decision D-41).
- Media library requires Arabic alt text on upload.

### 9.6 Publish pipeline

On publish or update of any content: Payload `afterChange` hook → `revalidateTag('content')` and `revalidatePath` for affected routes → regenerate `sitemap.xml` (dynamic route reading from Payload with a 1-hour cache) → enqueue an IndexNow ping for the changed URLs (job) → clear the CDN zone for those paths if CranL exposes a purge API. Static pages stay static: the site reads content at build and via ISR (`revalidate` tags), never per-request from the database.

Amended 2026-09-13 (Phase 2a, ADR-030): tag-based revalidation is not used. Every public page and the metadata routes carry `revalidate = 60` (ISR), the data layer reads Payload directly with per-render deduplication (published documents only), and the `afterChange` / `afterDelete` hooks call `revalidatePath` on the product's page and the routes that list it (home, listing, sitemap), and on every static route for a global. `/products/[slug]` accepts unknown params so a product published in the admin gets its page on first request. A publish is live at once; draft autosaves change nothing. The IndexNow ping and the CDN purge stay planned for 2b.

Amended 2026-09-13 (Phase 2b, ADR-033): the jobs queue runs in-process on a one-minute cron (never during the build; the run endpoint answers nobody); scheduled publish is on for the home page, pages, products and testimonials, and a publish from a job falls back to the 60 s timer for regeneration; the IndexNow ping is a queued job with three retries, sent only on the production runtime (`B7R_RUNTIME=production`) with a key; admin-added redirects resolve in the `/[slug]` route (308/307) and join the proxy allowlist (ADR-032).

### 9.7 Migration from Level 1 content files

`scripts/migrate-content.ts`: reads `content/*` (already schema-validated), uploads referenced images to the media collection with their alt text, and creates documents. Idempotent (upserts by slug). After migration, the content files are deleted and `content/schema.ts` becomes the typed client for Payload's generated types. Level 1 pages are refactored to read from Payload through a thin data layer (`modules/*/data.ts`) with `unstable_cache` tags; components do not change.

Amended 2026-09-13 (Phase 2a, ADR-026, ADR-029): the migrated files move to `src/content/seed/*` and stay as fixtures (schema-validated, BRD-verbatim tested, the static fallback for the error page and the 410 body). The script is create-only: it refuses a non-empty database without `--force` and never overwrites a document the CMS holds; media files are named `{product}-{colour}-{side}.jpg` and matched by filename. The data layer is `src/lib/cms/*` (Local API, published Arabic documents, zod-parsed into the §8.4 contract, deduplicated per render). Media is served through Next's image optimizer, never from the storage URL directly, so the site CSP keeps `img-src 'self'` and the designer canvas stays untainted.

### 9.8 Acceptance (Level 2)

1. Dhia logs in at `/admin` (English UI, Arabic content in its fields, ADR-039 amendment), edits the hero headline, publishes, and sees the change on b7r.sa within 60 seconds without a deploy.
2. Editor role cannot see users or settings and cannot delete published items.
3. All Level 1 acceptance criteria (§6.18) still pass; Lighthouse scores unchanged (content is still static at request time).
4. Migration script runs clean on an empty database and is idempotent on a second run.
5. IndexNow and revalidation hooks fire on publish (visible in job logs).
6. Backups exist and a restore has been rehearsed once (documented in `RUNBOOK.md`).

Amended 2026-09-13 (Phase 2b, ADR-034): (1) proven by `e2e/admin.spec.ts` (a home publish is on `/` at once); (2) proven for users, settings, redirects, published products/pages/testimonials and live FAQ entries; (4) `scripts/ci/seed-check.sh` every CI run; (5) IndexNow is a queued job on the production runtime, revalidation runs from every publish hook; (6) the weekly `Backup` workflow writes to a private bucket and CI rehearses a restore on every run (`scripts/ci/restore-check.sh`), the once-off rehearsal from a CranL snapshot remains a launch step. The login Turnstile is a verified gate cookie rather than a token per attempt (ADR-034).

---

## 10. Level 3: blog and automated content engine

### 10.1 Blog (CMS-backed)

**Data model:** `posts` (title, slug, excerpt, hub relationship, tags[], cover media, takeaways[3], body rich text with the CTA block, author relationship, publishedAt, updatedAt (meaningful only), readingMinutes computed, status, `origin: manual | ai`, seo), `categories` (the six hubs with slug, name, description, hero copy for the hub page, defaultCover), `authors` (name ضياء, role مؤسس بحر برنت, bio, photo, sameAs[]), `tags`.

**Routes:** `/blog` (hubs strip, featured post, latest grid, pagination `?page=`), `/blog/category/{hub}` (hub page: H1, description, posts), `/blog/{slug}` (template from §6.11), `/author/dhia` (ProfilePage schema), `/feed.xml` (RSS 2.0, full text of the latest 20), sitemap entries with real `lastmod`. Search via `plugin-search` on `/blog?q=`.

**Templates:** unchanged from Level 1 plus: table of contents from H2s (desktop side rail), estimated reading time, "updated" date when `updatedAt` > `publishedAt`, related posts by hub then tags, previous/next within the hub.

**Editorial rules enforced in the CMS:** title ≤ 70 characters, excerpt ≤ 160, exactly three takeaways, at least two internal links (validated on publish), cover alt text required, no external links to competitors (soft warning), no Latin-script paragraphs (warning).

*Amended 2026-09-14 (ADR-041, as shipped): the body is Lexical rich text (h2/h3, lists, links, blockquote, uploads; no tables); `readingMinutes` is computed on save; `updatedAt` is the field `contentUpdatedAt`, set by an editor or the freshness job; `origin` is `manual | ai | ai-edited`. Pagination is `/blog/page/{n}` and `/blog/category/{hub}/page/{n}` rather than `?page=`, and search is a client-side island over an embedded index rather than `plugin-search`, so every blog route prerenders (Constitution II). An em dash in the text is a third soft warning. `tags` are optional; related posts fall back to the hub, then recency.*

*Amended 2026-09-14 (Level 5b, ADR-043): the blog exists in English under `/en/blog`, `/en/blog/category/{hub}`, `/en/author/{slug}` and `/en/feed.xml` from the same documents; a post, hub or author with an English value is on the English site, one without is not. Editorial rules apply per language: the "Latin-script paragraphs" warning on the Arabic version, an "Arabic-script paragraphs" warning on the English one; reading time at 150 words a minute for Arabic and 200 for English; `readingMinutes` and `warnings` per language. The engine (§10.2) writes Arabic until 5c.*

### 10.2 Automated content engine

Dhia's decision (D-44): **fully automatic publishing with no human approval step.** The engine therefore carries every safety net that a human would otherwise provide. It is a module (`modules/ai-content`) with its own admin screens, and it never appears on the public site in any form (no "generated by" labels, no AI author).

#### 10.2.1 `ai-settings` Global (admin role only)

| Group | Fields |
|---|---|
| Providers | `activeProvider` (openai · deepseek · anthropic · google), `models` per provider (free-text model id, never hardcoded in code), API keys per provider stored encrypted with Payload's `encrypt`/`decrypt` and masked in the UI |
| Cadence | `enabled` (kill switch), `postsPerDay` (default 1; help text: "التوصية المدعومة بالدراسات: 8–16 مقالة شهرياً؛ الجودة قبل الكمية"), `publishHourRiyadh` (default 09:00), `maxPostsPerMonth` cap (default 31), `dailyCostCapUsd` |
| Language and style | `language` (ar only in this phase), `styleGuide` (long text, pre-filled from §4.1 and Appendix E), `systemPrompt` (versioned), `bannedPhrases` (pre-filled: قم بـ, تم , يرجى, بنجاح, الخاص بك, هناك …), `bannedClaims` (free-text list, pre-filled: any delivery promise other than 5 days, any product not in the catalog, any price not in the catalog, any claim about Printful/Printify beyond public facts, "أفضل في السعودية", guarantees of income) |
| Facts sheet | Read-only view generated from `site-settings` + `products` + `integrations` (prices, delivery, offer, integrations, contact). The engine injects it into every prompt and validates drafts against it. |
| Images | `imageMode` (generate · stock · hubDefault), `imageProvider` + key, `imageStyle` prompt suffix ("no text, no letters, no logos, flat studio light, brand blue accents"), `stockProvider` (pexels) + key |
| Quality | `qualityThreshold` (0–100, default 80), `maxRevisionPasses` (default 1), `minWords` 800, `maxWords` 1600 |
| Notifications | `notifyEmail` (Dhia), `weeklyDigest` on, `failureAlerts` on |

*Amended 2026-09-14 (ADR-042, as shipped): providers are `openai · deepseek · anthropic · google` plus a `mock` for tests only (`AI_CONTENT_MOCK=1`, refused in production); keys are encrypted with Payload's `encrypt` and read back masked; the settings carry per-provider cost rates (an estimate) and `reviewFirstRuns` (the first posts of a live provider land as drafts). `imageMode: generate` is refused until an image provider is wired; `hubDefault` and `stock` (Pexels) ship. The facts sheet is a read-only tab built live from the site settings, the products and the integrations.*

*Amended 2026-09-14 (Level 5c, ADR-043): the "Language and style" group is localised. `language` is no longer a setting: each topic names its language (§10.2.2), and the admin edits the style guide, system prompt, banned phrases and banned claims of each language under the panel's locale control (English pre-filled from the code defaults). The facts sheet renders in both languages.*

#### 10.2.2 `ai-topics` Collection

Fields: title, `language` (ar · en, default ar; the post is written and published in it, Level 5c), hub, primaryKeyword, secondaryKeywords[], intent (informational · commercial · seasonal), priority (1–5), preferredPublishWindow (for seasonal topics, e.g. National Day: publish six weeks before 23 September), status (backlog · scheduled · generating · published · failed · rejected), source (seed · manual · searchConsole), notes, resulting post relationship, lastError. The backlog is seeded from Appendix E on migration. Dhia can add topics manually; Level 4 adds Search Console-driven suggestions.

*Amended 2026-09-14 (ADR-042): `preferredPublishWindow` is a pair of dates (`windowStart`, `windowEnd`); a topic outside its window is not picked. Bulk add from CSV above the list; "Generate now" in the edit view.*

#### 10.2.3 `ai-runs` Collection (audit log)

One document per pipeline execution: topic, provider/model, each step's input hash, output summary, review score and rubric breakdown, tokens and estimated cost, duration, final status, post id, error. Retained 12 months.

*Amended 2026-09-14 (ADR-042): each run row also keeps the outline (the freshness job regenerates from it), the step log with an input hash over the brief and the outline, and `kind` (`generate | freshness`); each engine post keeps the facts sheet's numbers of the day (`factsBaseline`; drift is a number that was on the sheet and is not any more); cost is an estimate from tokens and the settings' rates. The schedules (hourly tick, weekly freshness, weekly digest with the twelve-month sweep) are Payload job schedules on the `ai` queue.*

#### 10.2.4 Pipeline (Payload Jobs workflow `generatePost`, tasks are retryable, each ≤ 120 s)

1. **pickTopic**: highest-priority `backlog` topic whose window is open; skip if a published post already covers the same primary keyword or has ≥ 60% title token overlap (dedupe); set `generating`.
2. **brief**: build the brief = facts sheet + hub description + primary/secondary keywords + intent + three "answer-first" questions the post must answer + internal link targets (`/products/*`, `/how-it-works`, `/faq`, related posts by hub).
3. **outline**: H2s phrased as questions, each with a one-sentence direct answer; the first H2 answers the primary keyword; a "أهم النقاط" list of three; one CTA block position after the second H2.
4. **draft**: Arabic, 800–1600 words, فصحى مبسطة with the §4.1 rules, short paragraphs, lists and tables where useful, at least one concrete example with real SAR numbers from the facts sheet, no first-person plural claims outside the facts sheet, no mention of AI, no Latin paragraphs, no em dashes, author voice "ضياء، مؤسس بحر برنت" only in the byline.
5. **selfReview**: a second model call grades the draft on a 100-point rubric: factual consistency with the facts sheet (30; any number or claim not in the sheet costs points; a numeric regex extracts all numbers with ريال/يوم/منتج context and compares), Arabic quality and banned phrases (25), structure and answer-first compliance (20), usefulness and specificity to Saudi merchants (15), length and formatting (10). If score < threshold, one revision pass with the critique; if still below, mark topic `failed`, log, alert Dhia, stop.
6. **image**: per `imageMode`: generate a 16:9 cover with a prompt built from the topic + `imageStyle` (never Arabic or any text in the image), or fetch one Pexels photo by an English keyword derived from the topic (store attribution and URL), or use the hub's default cover. Generate Arabic alt text.
7. **seo**: title ≤ 60 chars containing the primary keyword, meta description ≤ 155, Latin slug transliterated from the primary keyword (≤ 40 chars, unique), OG image = cover, `inLanguage: ar`.
8. **publish**: create the post (`origin: ai`, author ضياء, hub, tags), status published at the scheduled slot; run the editorial validations from §10.1 (internal links, takeaways, alt text); revalidate; IndexNow; sitemap; RSS.
9. **notify**: append to the weekly digest; immediate email on failure or when the cost cap is hit.

Scheduling: `GET /api/jobs/run?token=…` (constant-time token check) is called hourly by CranL's scheduler or by cron-job.org as the B7R app does; the handler runs due jobs, respecting `postsPerDay`, `maxPostsPerMonth`, `dailyCostCapUsd`, and the kill switch. A **freshness job** runs weekly: for the ten posts with the most Search Console clicks (Level 4) or, before that, the ten oldest published, re-run `selfReview` against the current facts sheet; if prices or promises changed, regenerate the affected paragraphs, set a real `updatedAt`, and revalidate.

*Amended 2026-09-14 (ADR-042, as shipped): the nine tasks are inline tasks of one workflow on the `ai` queue, each retried on its own; the model writes Markdown that is converted to the post editor's Lexical tree; the review merges the rubric with deterministic checks and refuses an em dash or an AI mention outright; the CTA is placed by the template (§6.11), not by the outline; step 6 uses the hub's default cover or a stock photo (generation deferred); scheduling runs on Payload's in-process job schedules (ADR-033) rather than an external hourly call, in 3c.*

#### 10.2.5 Guardrails (all mandatory)

- Kill switch in settings and a `AI_CONTENT_ENABLED` env override.
- Per-day and per-month caps; cost cap; provider timeouts; exponential backoff; no infinite retries.
- Dedupe against existing posts; never republish the same topic within 12 months.
- Facts-sheet validation; banned-claims scan; banned-phrases scan; no external links except b7r.app and government/official sources from an allowlist.
- One-click **unpublish** and **regenerate** buttons on every AI post in the admin; edits by an editor mark the post `origin: ai-edited` and exempt it from the freshness job.
- Every post carries the human byline (ضياء) and no AI disclosure (decision D-47). The `ai-runs` log is the internal audit trail.
- Research caveat recorded in the admin help text: unreviewed high-volume AI publishing risks Google's scaled-content policy; keep cadence moderate and quality gates strict (`docs/research/04` §5).

*Amended 2026-09-14 (ADR-042): the daily and monthly caps count runs started in the period, so a second runner or a restart cannot publish twice; `pickTopic` is a compare-and-set; `reviewFirstRuns` holds a live provider's first posts as drafts; external links are filtered to b7r.app, b7r.sa and `.gov.sa` hosts.*

#### 10.2.6 Provider layer

Vercel AI SDK provider registry: `openai`, `deepseek`, optional `anthropic` and `google`. Model ids are settings strings. Image generation through the same SDK where the provider supports it, otherwise a thin REST client. All calls server-side in jobs; nothing in the browser.

*Amended 2026-09-14 (ADR-042): the Vercel AI SDK with `openai`, `deepseek`, `anthropic` and `google`; image generation waits behind the provider interface.*

#### 10.2.7 Admin screens

"المحتوى الآلي" group: الإعدادات (the Global), المواضيع (backlog table with bulk add from CSV and a "توليد الآن" action), السجل (runs with scores and costs), لوحة المتابعة (posts this month, average score, failures, cost to date, next scheduled slot).

*Amended 2026-09-14 (ADR-042): the group is "AI content" with Engine settings, Topics and Runs; the monitoring numbers (posts this month, average score, failures, cost, next slot, latest runs) are a card on the dashboard for admins rather than a separate view. Amended 2026-09-15 (ADR-046): the three entries are the "Content engine" section inside the Blog group of the reshaped sidebar (Site · Catalogue · Blog · Visibility · Admin), in the Blog hue.*

### 10.3 Acceptance (Level 3)

1. Manual posts: an editor writes, previews, schedules, and publishes a post; hub pages, RSS, sitemap, IndexNow, and related posts update.
2. Automatic posts: with `postsPerDay = 1`, the engine publishes one post per day for five consecutive days from the seeded backlog, each scoring ≥ 80, each with three takeaways, internal links, a cover with Arabic alt text, no banned phrases, and numbers matching the facts sheet (verified by tests with a mocked provider and by one live run per provider).
3. Changing `site-settings.delivery.maxDays` and running the freshness job updates affected posts and their `updatedAt`.
4. Kill switch stops the next scheduled run within one hour; the failure path emails Dhia.
5. No public page, feed, or schema mentions AI.

---

## 11. Level 4: inbox, bookings, newsletter, analytics

### 11.1 Inbox

- `form-submissions` (from `@payloadcms/plugin-form-builder` or a custom collection fed by `/api/contact`): name, phone, email, inquiryType, message, source page, UTM, created, `status` (جديد · قيد المتابعة · تمت المعالجة), assignee, internal notes. List view with filters and quick actions: "رد عبر واتساب" (opens `wa.me` with the phone and a greeting), "رد بالبريد" (`mailto:`), mark handled.
- `bookings`: mirrored from Cal.com webhooks (§11.2): name, email, phone, start/end (Asia/Riyadh), meeting type, status (booked · rescheduled · cancelled · completed), Cal.com uid, notes.
- Both appear on an "البريد الوارد" dashboard view with counts of new items; optional daily email summary to Dhia.

### 11.2 Bookings (Cal.com)

- Dhia creates a hosted Cal.com account with one event type: **استشارة مجانية، 30 دقيقة** (Riyadh timezone, Arabic description, WhatsApp/phone question in the booking form). The event URL goes into `site-settings.bookingUrl`.
- Site: the contact page's booking card becomes an inline Cal.com embed (`@calcom/embed-react`, Arabic locale if available, brand colour `#0058B0`), plus a dedicated `/book` page with the same embed and the §4.11 copy. The CSP `frame-src` allows `app.cal.com`.
- Webhook `POST /api/webhooks/cal` (secret in `CAL_WEBHOOK_SECRET`, signature verified) upserts `bookings`; sends Dhia a notification email; adds the booker to the inbox.
- Fallback: if `bookingUrl` is empty, the WhatsApp behaviour from §6.9 remains.

### 11.3 Newsletter

- `subscribers` collection synced from the Resend audience (webhook or nightly sync): email, source page, created, status. Export CSV. Unsubscribe link handled by Resend.
- Admin can send a campaign later (out of scope now; keep the audience clean).

### 11.4 Analytics in the admin

- **Umami** first: the admin dashboard embeds Umami's share URL or calls its API (`/api/websites/{id}/stats`) for the last 7/30 days: visitors, page views, top pages, referrers, events (`cta_click`, `whatsapp_click`, `contact_submit`, `outbound_app_click`).
- **GA4** second: Analytics Data API via a Google service account (`GOOGLE_SERVICE_ACCOUNT_JSON` env, base64) for sessions by channel (including "AI Assistants"), key events, landing pages.
- **Search Console** third: Search Analytics API with the same service account (added as a property user): clicks, impressions, CTR, position by page and query; the top queries feed `ai-topics` suggestions (source `searchConsole`).
- A nightly job caches results into a `metrics` collection; the admin "التحليلات" view renders charts (recharts) from the cache so the admin never waits on Google APIs.

### 11.5 Acceptance (Level 4)

1. A contact submission and a Cal.com booking both appear in the inbox within a minute, with working reply actions.
2. `/book` and the contact page embed Cal.com and record a real test booking.
3. Newsletter subscribers list matches the Resend audience.
4. Analytics view shows Umami, GA4, and Search Console numbers for the last 30 days from the cache; Search Console queries create at least five suggested topics.
