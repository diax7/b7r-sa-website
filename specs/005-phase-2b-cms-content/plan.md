# Implementation Plan: Phase 2b: Every page from the CMS

**Branch**: `phase/2b-cms-content` | **Date**: 2026-09-13 | **Spec**: `specs/005-phase-2b-cms-content/spec.md`
**CTO plan review**: 2026-09-13, first pass 76, revised → **92, GO** (private backup bucket,
Turnstile in `beforeOperation`, request-scope-tolerant revalidation, SSR 404 prerequisite,
page-level redirects for admin-added rows, jobs endpoint denied, IndexNow gated on the
runtime flag, `marked` allowlist instead of a new stack, BRD deviations recorded).

## Summary

Move the remaining site content into Payload on the foundation 2a shipped: the `home`
global, a `pages` collection whose blocks are the sections the seven designed pages already
have, `faqs`, `testimonials`, `integrations`, redirects from the admin, an IndexNow job on
publish, scheduled publish, the login Turnstile, the Resend e-mail adapter, weekly backups
with a rehearsed restore, Arabic admin polish, and the content files deleted. Visitors see
the same pages; every edit lands through ADR-030's `revalidatePath` + 60 s ISR.

## Technical Context

New deps (exact pins, ≥ 24 h old): `@payloadcms/plugin-redirects@3.89.0`,
`@payloadcms/email-resend@3.89.0`. No Markdown sanitiser package: the existing `marked`
renderer gains an allowlist (B). Lexical is already installed (`@payloadcms/richtext-lexical`);
2b uses it for the first time on the site (rich text block) through `@payloadcms/richtext-
lexical/react` `RichText` with a converter map that emits the design system's `Prose`
markup (server component, no client JS). Jobs run in-process (`jobs.autoRun` cron every
minute in the container; skipped during build and in the CLI).

## Constitution Check

| # | Gate | Pass? |
|---|---|---|
| I | RTL | Admin already RTL; Lexical RTL editing asserted in the admin e2e; public unchanged |
| II | Static | Every page still prerenders; new CMS pages prerender from `generateStaticParams` and ISR (60 s) with `dynamicParams = true`; no page goes dynamic. Prerequisite: the SSR-rendered 404 (B0) so a `[slug]` route cannot turn unknown URLs into the bare document |
| III | Copy | Seeded from the existing content files (verbatim tests re-pointed to `src/content/seed/*`); UI strings (form labels, validation, buttons, aria) stay in code, they are interface copy, not content (ADR-031) |
| IV | Budgets | Rich text renders on the server; no Payload JS on public pages; LHCI five URLs unchanged |
| V | Tokens | Blocks render through the existing section components; `Prose` for rich text |
| VI | No fabrication | Nothing new is written; testimonials keep `placeholder: true` and ADR-013 |
| VII | Modules | Collections in `src/modules/cms/`, block renderers in `src/modules/pages/blocks/`, data layer in `src/lib/cms/`; `modules/pages` reads only `lib` + `core` |
| VIII | ADRs | ADR-031 blocks = designed sections, UI copy stays in code, `seo` group instead of `plugin-seo` (BRD §9.4 amendment), live preview deferred (BRD §9.3 amendment); ADR-032 seeded redirects stay build-time, admin-added rows resolve in the `[slug]` route; ADR-033 jobs in-process, IndexNow only under `B7R_RUNTIME=production`, revalidation tolerant of the job context; ADR-034 backups in a private bucket, restore rehearsed in CI |
| IX | Tests | per area below |
| X | No attribution | Yes |

## Approach

### A. `home` global: `src/modules/cms/globals/home.ts`
- Groups in BRD order: `hero` (slides array ×4: desktop media, mobile media, headline,
  subline, alt), `productStrip` (title, lead, five `products` relationships in order),
  `designer` (copy fields the section reads), `steps` (eyebrow/title/link + three steps),
  `video` (media, poster, title, lead, playAria, `enabled`), `whyUs` (eyebrow, title, three
  items with icon select, `enabled`), `testimonials` (eyebrow, title, placeholderTag,
  `enabled`), `integrations` (title, lead, tags, `enabled`), `faq` (title, link; items come
  from `faqs.showOnHome`), `ribbon` (title, lead, button). Draft + autosave, `schedulePublish`.
- Mapper `toHome()` → the existing `Home` contract (`HomeSchema`); hero media through
  `mediaUrl`; strip order validated to five distinct published products.
- Hook: `revalidatePath('/')`.

### B0. Prerequisite: the 404 must be server-rendered before any `[slug]` route exists
- Today `notFound()` from a page answers `<html id="__next_error__">` with an empty body
  (ADR-024/030). With `src/app/(site)/[slug]/page.tsx` in place every unknown top-level
  URL would take that path instead of `global-not-found`. Before B lands: make the
  `[slug]` route return the routing-level 404 for anything not published, the route's
  `generateStaticParams` lists the published pages and unknown slugs are answered by a
  **rewrite in `src/proxy.ts`**: the proxy reads the allowlist from a tiny
  `src/app/api/pages/slugs/route.ts`, published page slugs ∪ admin-added redirect `from`
  slugs (ISR 60 s; the `pages` and `redirects` hooks `revalidatePath` it), fetched from
  `http://127.0.0.1:${PORT}` (never the public origin, never the CDN), cached in-process
  for 20 s with stale-while-revalidate so the endpoint's freshness is the only delay,
  fail-open to the static seven; anything else at the top level is rewritten to
  `/__404/<slug>`, a path no route matches, so Next renders `global-not-found` server-side
  with status 404 and the URL unchanged. `/products/<unknown>` keeps `notFound()` (a rare
  URL; ADR-030 accepted it).
- Slugs failing `^[a-z0-9-]{1,64}$` are rewritten without a lookup.
- Experiment already run (2026-09-13, products page): returning plain metadata and calling
  `notFound()` only in the page body still yields the `__next_error__` shell in the
  production build, so B0 is built as written. `await connection()` before `notFound()` is
  still worth trying so junk slugs never enter the ISR cache; verify known slugs still
  prerender.
- A unit test keeps the proxy matcher's static-route list equal to the `(site)` top-level
  route folders so the two cannot drift.
- Acceptance: an e2e that fetches the **raw HTML** of `/no-such-page` and `/nope-123` with
  `request.get` and asserts status 404, `lang="ar"`, `dir="rtl"`, `<h1>` and the three
  landmarks; the hydrated a11y test stays. If the proxy lookup must be dropped for any
  reason, `[slug]` does not ship and new pages wait, never the bare 404 site-wide.

### B. `pages` collection with blocks: `src/modules/cms/collections/pages.ts`
- Fields: `title`, `slug` (unique; the seven reserved slugs pre-seeded; `beforeValidate`
  refuses `products|blog|admin|api|contact-form|…` and slugs with a slash), `lead`,
  `blocks` (array of Payload blocks), `seo` group (title ≤ 70, description ≤ 160, ogImage),
  `updatedAt` (system). Drafts + autosave, `schedulePublish`, versions 25.
- Block set (each maps 1:1 to a section component that exists today):
  `richText` (Lexical), `steps` (title + items), `cards` (icon select + title + text ×3),
  `mediaBanner` (media, caption), `profitEquation` (how-it-works figures), `miskCredential`
  (title, text, logo), `contactCards` (uses site-settings; no fields beyond a heading),
  `contactForm` (no fields, the form and its strings stay in code), `bookingCard` (title,
  text, button, whatsappMessage), `faqList` (group filter or all), `legalBody` (Markdown
  textarea + `updatedAt` date). Blocks reference `src/modules/pages/blocks/*` renderers.
- Routing: the seven route folders stay (`/about/page.tsx` etc.) but render
  `<CmsPage slug="about" />`; a new `src/app/(site)/[slug]/page.tsx` (`dynamicParams = true`,
  `generateStaticParams` from published pages minus the reserved seven) serves new pages
  and admin-added redirects (D). The proxy matcher for B0 lists the static top-level
  routes as exclusions (`/((?!products|blog|about|contact|faq|how-it-works|terms|shipping|
  privacy|admin|api|_next|.*\..*)[^/]+)`), so the slug lookup runs only for `[slug]`
  candidates, and `next.config` `redirects()` stays as is. `sitemap.ts` lists published
  pages.
- Metadata: `pageMetadata` from the page's `seo` group with the `seo-defaults` row as the
  fallback (the rows for the seven routes move into the pages' `seo` groups; `seo-defaults`
  keeps `/`, `/products`, `/blog` and the template).
- Rich text → HTML on the server with `RichText` (`@payloadcms/richtext-lexical/react`, no
  `use client` in its tree, verified) + a converter map to `Prose` classes; upload nodes
  render through `mediaUrl` + `next/image` (ADR-029); links limited to
  `https?:|mailto:|/` and get `rel="noopener"` when external. Markdown (legal bodies) keeps
  `lib/markdown.ts` (`marked`) with a renderer override that drops raw HTML
  (`html: () => ''`) and applies the same link allowlist, no new dependency; unit-tested
  with `<script>`, `<iframe>`, `onclick=` and `javascript:` inputs. Closes the IDEAS item.
- Sitemap `lastModified` for `/terms`, `/shipping`, `/privacy` comes from the page's
  `legalBody.updatedAt` (the visible line, JSON-LD and the sitemap agree).

### C. `faqs`, `testimonials`, `integrations`: `src/modules/cms/collections/`
- `faqs`: group select (the four BRD groups), question, answer (plain text), order,
  `showOnHome` with a `beforeValidate` count guard (≤ 5); no drafts (small, atomic edits).
  Hooks: `/`, `/faq`.
- `testimonials`: quote, name, store, avatar (media, optional), `placeholder` (default
  false), order; drafts. Hook: `/`. Mapper keeps `Testimonial` contract; ADR-013 rule stays
  in the section component.
- `integrations`: slug, name, nameLatin, logo (media), status select, order. Hook: `/`.
- Data layer: `getHome()`, `getPage(slug)`, `getPages()`, `getFaqs()`, `getTestimonials()`,
  `getIntegrations()`, `React.cache`, `PUBLIC_READ` + `PUBLISHED` where versioned.

### D. Redirects: `@payloadcms/plugin-redirects` (CTO option B, ADR-032)
- Plugin with the `redirects` collection (from, to {internal page | external URL}), admin
  only, seeded from `src/lib/redirects.ts` (renamed + english lists; the 410 list is
  informational, 410s stay in the proxy). Validation in `beforeValidate`: path-only
  single-segment `from`, no self/loop (`from === to`, or `to` is itself a `from`),
  external `to` only `https:`.
- The seeded list keeps working exactly as today: `next.config` `redirects()` (301/308
  and the `/en/:path*` glob) and the proxy's 410 list are unchanged. Rows added later in
  the admin resolve in the `[slug]` route: the slug is looked up in `redirects` before
  `pages`; internal → `permanentRedirect()` (308), external → `redirect()` (307); cached
  by ISR, live within a minute. Trade-off recorded: admin-added rows answer 308, not 301
  (both permanent for Google) and only single-segment sources; the proxy design with a
  runtime map is the documented upgrade if Dhia ever needs exact 301s or nested sources.
- The `redirects` hook revalidates the B0 allowlist endpoint so a new source passes the
  proxy within the same minute.
- Unit: resolver precedence (redirect before page, reserved slugs first), loop refusal,
  scheme check; e2e: add a redirect via REST → 308 live ≤ 60 s; the §5.2 suite unchanged.

### E. Publish pipeline: `src/modules/cms/hooks/`
- `revalidate.ts` gains per-collection path maps (pages: `/${slug}` + `/sitemap.xml`; faqs:
  `/`, `/faq`; testimonials/integrations: `/`; home: `/`; redirects: the `from` path).
  All hooks call `revalidatePath` through one helper that catches Next's "static
  generation store missing" invariant (thrown outside a request, the jobs cron and
  `schedulePublish` run from the process), logs once at info ("outside a request; the 60 s
  timer covers it") and returns; unit-tested with the work store absent. The same helper
  serves `revalidateProducts`, whose `previousDoc` shape from a job is covered by the test.
- `jobs`: task `indexnow-ping` (`payload.jobs.queue` from `afterChange` when
  `isProductionRuntime() && INDEXNOW_KEY`, `B7R_RUNTIME`, never the origin alone, so CI
  and previews never ping; payload = the changed URLs computed in the hook; handler reuses
  `lib/indexnow.ts`; retries 3, backoff); `schedulePublish: true` on home, pages, products,
  testimonials; `jobs.autoRun: [{ cron: '* * * * *', limit: 10 }]` guarded by
  `shouldAutoRun: () => !isBuildPhase()`; `deleteJobOnComplete: true`;
  `jobs.access.run: () => false` (the cron runs in-process; the `/api/payload/payload-jobs/run`
  endpoint answers 403 to editors and outsiders, asserted in the admin e2e).
- Health: `jobs: 'on' | 'off'` field.

### F. Login Turnstile + e-mail: `src/modules/cms/auth/`
- `admin.components.beforeLogin: ['@/modules/cms/auth/login-turnstile#LoginTurnstile']`
  (client component rendering the widget with the site key from a server-provided prop,
  writes the token to a `turnstile` cookie, `SameSite=Lax`, 5 min). Verification runs in
  `users.hooks.beforeOperation` filtered to `operation === 'login'`, Payload's login
  operation checks the password before `beforeLogin` (`auth/operations/login.js`), so the
  cookie is verified with `siteverify` (reuse `lib/turnstile.ts`) **before** any lookup and a
  missing/invalid token throws `AuthenticationError` without touching the password oracle
  or the attempt counter. Fail-open when `TURNSTILE_SECRET_KEY` is unset (logged once).
  CI: the always-pass site key + the e2e widget stub already in place; unit test for the
  hook with a fake `siteverify`.
- `email: resendAdapter({ apiKey, defaultFromAddress, defaultFromName })` when
  `RESEND_API_KEY` is set; Arabic subject/body for `forgotPassword` via
  `users.auth.forgotPassword.generateEmailHTML/Subject`; no adapter → Payload logs, RUNBOOK
  documents the manual reset.

### G. Backups: `scripts/backup.sh`, `.github/workflows/backup.yml` (ADR-034)
- A **separate private bucket** (`b7r-backups`, no anonymous policy, its own key pair with
  put + list only), never the public-read media bucket, which would expose password hashes
  and drafts to anyone guessing a date. Env: `BACKUP_S3_BUCKET`, `BACKUP_S3_ACCESS_KEY_ID`,
  `BACKUP_S3_SECRET_ACCESS_KEY` (endpoint/region shared with media); locally a second MinIO
  bucket without the `download` policy.
- `pg_dump --format=custom` → `aws s3 cp` (the `aws` CLI on the runner; `mc` locally) to
  `YYYY-MM-DD.dump`; 30-day retention as a lifecycle rule documented for CranL/MinIO
  (`mc ilm`); weekly cron in Actions with the production environment (notice when secrets
  are unset). `scripts/ci/restore-check.sh`: dump the seeded CI database, restore into
  `b7r_restore`, count products/pages, runs in the quality job after the seed check.
- Outsider-seat test in the S3 CI job: `GET <endpoint>/b7r-backups/<file>` and the list
  `GET <endpoint>/b7r-backups/` answer 403; the media bucket's own policy is unchanged.
- RUNBOOK "Backups and restore" + LAUNCH-CHECKLIST 25 marked with the CI evidence.

### H. Seed, verbatim tests, deletion
- `scripts/migrate-content.ts` extended: home, the seven pages (blocks built from the
  seed objects), faqs, testimonials, integrations, redirects; still create-only.
- Content files → `src/content/seed/{home,pages,faq,testimonials,integrations,steps,why-us,
  legal}.ts` + `legal/*.md`; `src/content/schema.ts` gains `Page`/`Block` types;
  `tests/content-verbatim.test.ts` re-pointed; `src/content/{home,pages,faq,testimonials,
  integrations,steps,why-us,legal}.ts` deleted. UI copy that stays in code moves to
  `src/messages/ar.json` (interface strings only).
- Access: `home`, `pages`, `faqs`, `testimonials`, `integrations` are content,
  `create/update: isEditorOrAdmin`, `delete: canDeleteVersioned` where versioned, visible
  to editors; `redirects` admin-only and hidden from editors like the settings globals.
- Migrations: each phase adds an additive migration (`pnpm migrate:create`), including the
  `payload-jobs` and `redirects` tables; the deploy workflow migrates before the build.
- First 2b deploy: `pnpm content:migrate --force` against production (the 2a guard refuses
  a non-empty database), RUNBOOK deploy notes and LAUNCH-CHECKLIST 22 amended. The seven
  `seo-defaults` route rows whose copy moves into `pages.seo` are deleted by the seed with
  an explicit log line, so the admin shows one source, the one recorded exception to
  ADR-026 "never overwrites" (amendment line in ADR-026).
- Admin polish: Arabic labels/descriptions on every field, `admin.group` «المحتوى» for
  home/pages/faqs/testimonials/integrations/media, «الإعدادات» for the globals + redirects,
  «الإدارة» for users; `useAsTitle` Arabic fields; dashboard order.
- Interface strings (form labels, validation, buttons, aria) stay in `src/messages/ar.json`
  (Constitution III's second home); spec SC-002 holds.

### I. Tests
- Unit: `blocks-mapping.test.ts` (each block → props), `home-mapping.test.ts`,
  `faq-limit.test.ts`, `redirect-resolver.test.ts`, `indexnow-job.test.ts`,
  `turnstile-login.test.ts` (hook order, fail-open), `markdown-sanitise.test.ts`
  (`<script>`, `<iframe>`, `onclick=`, `javascript:` stripped; allowed links kept),
  `revalidate-hook.test.ts` extended (job context without a work store).
- Integration (CI): seed of every collection; restore check; backup bucket outsider check.
- E2E: `admin-content.spec.ts`, home hero headline edit → `/` ≤ 60 s; new page
  `/creators-e2e` published → 200 + in sitemap → deleted → 404 **with the full document in
  the raw HTML**; FAQ `showOnHome` sixth → 400; redirect added → 308 live; login with the
  Turnstile stub; editor seat on `home` and the new collections (create/edit ok, delete
  published 403, redirects 403, jobs run endpoint 403 for editor and outsider). Raw-HTML
  404 test for `/no-such-page` (B0). JS-budget test on `/how-it-works` (rich text server-
  rendered). Existing suites green.

## Phasing (each phase gets a CTO code review)
1. Collections + data layer + seed + verbatim (home, faqs, testimonials, integrations) →
   the home page from the CMS; the request-scope-tolerant revalidation helper.
2. B0 (server-rendered 404 with the raw-HTML e2e) → `pages` blocks + the seven pages +
   `[slug]` route + Markdown allowlist + content files deleted.
3. Redirects (option B) + publish pipeline (jobs with `access.run` denied, IndexNow under
   the runtime flag, scheduled publish) + health field.
4. Login Turnstile (`beforeOperation`) + e-mail adapter + private-bucket backups/restore +
   admin polish + docs/ADRs + BRD §9.3/§9.4 amendments.

## Judgment calls (ADRs)
- ADR-031 Blocks are the designed sections; interface strings stay in code; a `seo` group
  replaces `plugin-seo` (BRD §9.4 amended); live preview deferred (BRD §9.3 amended,
  IDEAS) because it needs draft rendering on the public routes.
- ADR-032 Seeded redirects stay build-time (`next.config` + proxy 410s); admin-added rows
  resolve in the `[slug]` route (308/307, single-segment); the runtime proxy map is the
  documented upgrade.
- ADR-033 Jobs run in-process on a one-minute cron with the run endpoint denied; IndexNow
  only under `B7R_RUNTIME=production`; revalidation from a job context falls back to the
  60 s timer instead of throwing.
- ADR-034 Backups land in a private bucket with their own credentials; restore rehearsed in
  CI; the media bucket stays the only public one.

## Open items for Dhia (do not block)
Turnstile keys, Resend domain + `RESEND_FROM`, the CranL snapshot schedule, the private
backup bucket and its key pair, and the `production` environment secrets for the backup
workflow.
