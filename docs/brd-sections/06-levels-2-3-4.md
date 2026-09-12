## 9. Level 2: admin dashboard (Payload CMS)

### 9.1 Goal

Give Dhia and an editor a WordPress-like, Arabic, right-to-left admin at `https://b7r.sa/admin` to change every piece of site content and configuration without a deploy, while the public site stays static and fast. Payload CMS 3 runs inside the same Next.js app (decision from `docs/research/05`: MIT licence, Arabic RTL admin, built-in drafts, scheduled publishing, jobs queue, custom admin views).

### 9.2 Infrastructure additions

- CranL managed **Postgres** in the same project; connection string in `DATABASE_URL`. Daily automated snapshots (CranL) plus a weekly `pg_dump` to the S3 bucket by a job.
- CranL **S3 bucket** for media through `@payloadcms/storage-s3`; public read for images; served through the CDN zone. Original uploads are kept; Payload generates sizes (thumbnail 400, card 800, hero 1920, og 1200 × 630) with focal-point cropping.
- New env vars: `DATABASE_URL`, `PAYLOAD_SECRET` (≥ 32 random bytes), `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `PAYLOAD_PUBLIC_SERVER_URL`.
- The Docker image now runs migrations on start (`payload migrate`) before `next start`.

### 9.3 Payload setup

- Routes: admin UI at `/admin`, REST at `/api/payload/*` (rename from the default `/api` to avoid clashing with the site's API routes), GraphQL disabled.
- Admin locale: `ar` from `@payloadcms/translations`, `rtl: true`; the admin's document title "لوحة بحر برنت"; the logo and favicon replaced with the brand icon.
- Users collection with roles `admin` and `editor`:
  - **admin**: everything, including users, settings, redirects, deleting.
  - **editor**: create/edit/publish content collections (pages, products, FAQ, testimonials, blog); no users, no site settings, no redirects, no deletes of published items.
- Auth hardening: email + password (min 12 chars, checked against a breached-password list where feasible), login lockout after 5 failures for 15 minutes, Turnstile on the login form, session cookie `SameSite=Lax; Secure; HttpOnly`, admin routes `noindex` and excluded from the sitemap, `X-Robots-Tag: noindex` header on `/admin*`. 2FA is a later block (§12.6).
- Localisation: field-level `localized: true` on all text fields with locales `['ar', 'en']`, default `ar`, English left empty until the English phase.
- Drafts and versions on Pages, Products, Posts; autosave; scheduled publish via Payload's jobs queue; live preview for Pages and Posts pointing at the public route.

### 9.4 Collections and Globals (1:1 with the content contract in §8.4)

| Payload | Kind | Fields (summary) | Replaces |
|---|---|---|---|
| `site-settings` | Global | brand, contact, social, offer.welcomeCredit, delivery.maxDays, delivery.origin, bookingUrl, appUrls, badges (media[]), consent text | `content/site.ts` |
| `navigation` | Global | header items[], footer columns[], ctaLabel | `content/navigation.ts` |
| `home` | Global | heroSlides[] (media desktop/mobile, headline, subline), productStripOrder[], designerDefaults, steps[], video (media, poster, heading, lead), whyUs[], integrationsIntro, faqSelection (5 relationship), ribbon | `content/home.ts` |
| `seo-defaults` | Global | titleTemplate, defaultDescription, defaultOgImage, verification tokens (admin-only) | `content/seo.ts` |
| `products` | Collection | slug, name, shortDescription, description (rich text), baseCost, suggestedPrice, colors[] (name, hex, front media, back media), sizes[], material, weightGrams, printArea (fixed 28×38 + canvas fractions), printMethodLabel, sortOrder, seo (plugin) | `content/products.ts` |
| `pages` | Collection | slug (how-it-works, about, contact, faq, terms, shipping, privacy), title, lead, blocks[] (richText, steps, cards, miskCredential, contactCards, bookingCard, legalBody with updatedAt), seo | `content/pages/*`, `content/legal/*` |
| `faqs` | Collection | group, question, answer, order, showOnHome | `content/faq.ts` |
| `testimonials` | Collection | quote, name, store, avatar, placeholder (default false), order | `content/testimonials.ts` |
| `integrations` | Collection | slug, name, logo, status (available), order | `content/integrations.ts` |
| `media` | Collection | upload with alt (required, Arabic), focal point, credit | `public/images/*` |
| `redirects` | Collection (plugin) | from, to, type 301/308/410 | `lib/redirects.ts` |
| `users` | Collection | email, role, name | — |
| `posts`, `categories`, `authors` | Collections | Level 3 (§10) | `content/blog/*` |

Official plugins: `@payloadcms/plugin-seo` (title/description/OG fields with Arabic length hints and a preview), `@payloadcms/plugin-redirects`, `@payloadcms/plugin-form-builder` (Level 4), `@payloadcms/plugin-search` (Level 3), `@payloadcms/storage-s3`.

Field rules: every text field shows its §4 default as the initial value after migration; numeric fields for money are integers in SAR; `suggestedPrice` must be ≥ `baseCost` (validation); `delivery.maxDays` is an integer; `offer.welcomeCredit` is an integer displayed everywhere from this single value.

### 9.5 Editing experience

- The home page is a Global with fixed sections (order not editable; Dhia wanted a designed page, not a page builder). Each section's fields are editable; each section has an `enabled` toggle except hero, product strip, designer, and ribbon.
- Other pages use a small block set (rich text, cards, steps, media banner) so new pages can be assembled in Level 2 without code (for example a future `/creators` landing).
- Rich text is Lexical with headings H2/H3, lists, links, images, and a "CTA block" custom node; RTL editing verified.
- Product prices, the welcome credit, and the delivery days each carry a help text reminding the editor that they must match the app (no API sync, decision D-41).
- Media library requires Arabic alt text on upload.

### 9.6 Publish pipeline

On publish or update of any content: Payload `afterChange` hook → `revalidateTag('content')` and `revalidatePath` for affected routes → regenerate `sitemap.xml` (dynamic route reading from Payload with a 1-hour cache) → enqueue an IndexNow ping for the changed URLs (job) → clear the CDN zone for those paths if CranL exposes a purge API. Static pages stay static: the site reads content at build and via ISR (`revalidate` tags), never per-request from the database.

### 9.7 Migration from Level 1 content files

`scripts/migrate-content.ts`: reads `content/*` (already schema-validated), uploads referenced images to the media collection with their alt text, and creates documents. Idempotent (upserts by slug). After migration, the content files are deleted and `content/schema.ts` becomes the typed client for Payload's generated types. Level 1 pages are refactored to read from Payload through a thin data layer (`modules/*/data.ts`) with `unstable_cache` tags; components do not change.

### 9.8 Acceptance (Level 2)

1. Dhia logs in at `/admin` in Arabic RTL, edits the hero headline, publishes, and sees the change on b7r.sa within 60 seconds without a deploy.
2. Editor role cannot see users or settings and cannot delete published items.
3. All Level 1 acceptance criteria (§6.18) still pass; Lighthouse scores unchanged (content is still static at request time).
4. Migration script runs clean on an empty database and is idempotent on a second run.
5. IndexNow and revalidation hooks fire on publish (visible in job logs).
6. Backups exist and a restore has been rehearsed once (documented in `RUNBOOK.md`).

---

## 10. Level 3: blog and automated content engine

### 10.1 Blog (CMS-backed)

**Data model:** `posts` (title, slug, excerpt, hub relationship, tags[], cover media, takeaways[3], body rich text with the CTA block, author relationship, publishedAt, updatedAt (meaningful only), readingMinutes computed, status, `origin: manual | ai`, seo), `categories` (the six hubs with slug, name, description, hero copy for the hub page, defaultCover), `authors` (name ضياء, role مؤسس بحر برنت, bio, photo, sameAs[]), `tags`.

**Routes:** `/blog` (hubs strip, featured post, latest grid, pagination `?page=`), `/blog/category/{hub}` (hub page: H1, description, posts), `/blog/{slug}` (template from §6.11), `/author/dhia` (ProfilePage schema), `/feed.xml` (RSS 2.0, full text of the latest 20), sitemap entries with real `lastmod`. Search via `plugin-search` on `/blog?q=`.

**Templates:** unchanged from Level 1 plus: table of contents from H2s (desktop side rail), estimated reading time, "updated" date when `updatedAt` > `publishedAt`, related posts by hub then tags, previous/next within the hub.

**Editorial rules enforced in the CMS:** title ≤ 70 characters, excerpt ≤ 160, exactly three takeaways, at least two internal links (validated on publish), cover alt text required, no external links to competitors (soft warning), no Latin-script paragraphs (warning).

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

#### 10.2.2 `ai-topics` Collection

Fields: title, hub, primaryKeyword, secondaryKeywords[], intent (informational · commercial · seasonal), priority (1–5), preferredPublishWindow (for seasonal topics, e.g. National Day: publish six weeks before 23 September), status (backlog · scheduled · generating · published · failed · rejected), source (seed · manual · searchConsole), notes, resulting post relationship, lastError. The backlog is seeded from Appendix E on migration. Dhia can add topics manually; Level 4 adds Search Console-driven suggestions.

#### 10.2.3 `ai-runs` Collection (audit log)

One document per pipeline execution: topic, provider/model, each step's input hash, output summary, review score and rubric breakdown, tokens and estimated cost, duration, final status, post id, error. Retained 12 months.

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

#### 10.2.5 Guardrails (all mandatory)

- Kill switch in settings and a `AI_CONTENT_ENABLED` env override.
- Per-day and per-month caps; cost cap; provider timeouts; exponential backoff; no infinite retries.
- Dedupe against existing posts; never republish the same topic within 12 months.
- Facts-sheet validation; banned-claims scan; banned-phrases scan; no external links except b7r.app and government/official sources from an allowlist.
- One-click **unpublish** and **regenerate** buttons on every AI post in the admin; edits by an editor mark the post `origin: ai-edited` and exempt it from the freshness job.
- Every post carries the human byline (ضياء) and no AI disclosure (decision D-47). The `ai-runs` log is the internal audit trail.
- Research caveat recorded in the admin help text: unreviewed high-volume AI publishing risks Google's scaled-content policy; keep cadence moderate and quality gates strict (`docs/research/04` §5).

#### 10.2.6 Provider layer

Vercel AI SDK provider registry: `openai`, `deepseek`, optional `anthropic` and `google`. Model ids are settings strings. Image generation through the same SDK where the provider supports it, otherwise a thin REST client. All calls server-side in jobs; nothing in the browser.

#### 10.2.7 Admin screens

"المحتوى الآلي" group: الإعدادات (the Global), المواضيع (backlog table with bulk add from CSV and a "توليد الآن" action), السجل (runs with scores and costs), لوحة المتابعة (posts this month, average score, failures, cost to date, next scheduled slot).

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
