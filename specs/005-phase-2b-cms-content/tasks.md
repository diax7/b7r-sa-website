# Tasks: Phase 2b — Every page from the CMS

**Input**: `plan.md` (CTO review 2026-09-13, 92 GO). **Branch**: `phase/2b-cms-content`.
Each phase ends with a CTO code review before the next starts.

## Phase 1 — home, faqs, testimonials, integrations
- [x] T101 `hooks/revalidate.ts`: `safeRevalidatePath` (missing-store invariant → one info line),
  `isVisibleChange`, `revalidateRoutes`; unit tests with the store absent; every hook uses it.
- [x] T102 Collections `faqs` (`homeOrder`, ≤ 5 guard in `beforeValidate`), `testimonials`
  (drafts), `integrations` (platform selects the code-shipped logo); global `home` (groups,
  `enabled` on every section but hero/strip/designer/ribbon, strip = five distinct product
  relationships, drafts + autosave, REST read staff-only); Arabic labels/help; migration
  `20260913_133525_home_faqs_testimonials_integrations`. `schedulePublish` waits for the jobs
  (phase 3).
- [x] T103 Data layer `getHome`, `getFaqs`, `getHomeFaqs`, `getTestimonials`, `getIntegrations`
  + mappers (`toHome` → `HomeSchema`, media via `mediaUrl`), `tests/home-mapping.test.ts`.
- [x] T104 Seed: `src/content/seed/{home,faq,testimonials,integrations}.ts`; `migrate-content.ts`
  extended (create-only, media deduplicated within a run); seed check green from an empty
  database; verbatim + schema tests re-pointed; `src/content/{home,faq,testimonials,
  integrations,why-us}.ts` deleted (`steps.ts` keeps the how-it-works five until phase 2).
  Interface strings → `src/messages/ar.json` (ADR-031).
- [x] T105 Home sections, About, How-we-work and the FAQ page read the CMS; `enabled` toggles
  honoured with `alternateTones`; ADR-013 rule kept; `CtaRibbon` reads `home.ribbon`
  (imported from `@/modules/core/cta-ribbon` so the core index stays client-safe); e2e
  `admin-content.spec.ts`: hero headline publish → `/` at once + a draft never shows,
  «why us» off → section gone and tones alternate, sixth `showOnHome` → 400, editor and
  outsider seats.

## Phase 2 — pages with blocks, SSR 404, content files gone
- [x] T201 B0: `connection()` before `notFound()` throws DYNAMIC_SERVER_USAGE in an ISR render
  (500) — closed; `src/app/api/pages/slugs/route.ts` (published slugs, ISR 60 s, revalidated by
  the pages hook); proxy rewrite of unknown top-level slugs to `/__404/<slug>` (127.0.0.1
  self-fetch, 20 s SWR cache in `lib/page-slugs.ts`, fail open, `SLUG_SHAPE` gate);
  `tests/site-routes.test.ts` keeps `CODE_TOP_LEVEL`, the matcher literal and the `(site)`
  folders equal; raw-HTML 404 e2e for `/no-such-page`, `/nope-123`, `/nope_123`.
- [x] T202 `pages` collection (`src/modules/cms/blocks.ts` block set, reserved slugs guarded
  in `beforeValidate`/`beforeDelete`, `seo` group, drafts/autosave); renderers
  `modules/pages/blocks/*` + `CmsPage` (first block carries the H1, tones alternate); the
  `contact` block lives in `modules/contact` and reaches `CmsPage` through the app-level
  renderer map (constitution VII); `RichText` converters (Prose, link allowlist, uploads via
  `next/image`); `lib/markdown.ts` allowlist + `tests/markdown-sanitise.test.ts`.
- [x] T203 The seven routes render `<CmsPage slug>`; `[slug]` route (`dynamicParams = true`,
  `generateStaticParams` minus the reserved seven); `cmsPageMetadata` from `pages.seo`;
  sitemap lists published pages (legal date from the body); the seed creates the seven and
  prunes their `seo-defaults` rows with a log line (ADR-026 exception); `src/content/
  {pages(partly),legal,steps}.ts` + `legal/*.md` → `content/seed/{pages.ts,legal/}`;
  `contactForm` + «آخر تحديث:» as interface copy; migration `20260913_142543_pages`;
  admin import map regenerated for the Lexical field.
- [x] T204 E2E: `/creators-e2e` published → 200 + sitemap + allowlist → deleted → bare 404 at
  once, full document after the allowlist window; reserved/forbidden slugs → 400; designed
  page delete/rename → 400; CMS pages ship no editor JS; the About document and a fresh
  rich-text block render RTL in the admin.

## Phase 3 — redirects and the publish pipeline
- [ ] T301 `@payloadcms/plugin-redirects` (option B): collection seeded from
  `lib/redirects.ts`, `beforeValidate` rules, `[slug]` resolution (308/307), hook
  revalidating the allowlist endpoint; unit + e2e (redirect added → 308 live).
- [ ] T302 Jobs: `indexnow-ping` task, queue from hooks under `isProductionRuntime()` + key,
  `autoRun` cron guarded by `isBuildPhase`, `access.run: () => false` (+ e2e 403),
  `schedulePublish` on home/pages/products/testimonials, `/api/health` `jobs` field;
  migration for `payload-jobs`.

## Phase 4 — login Turnstile, e-mail, backups, polish, docs
- [ ] T401 Login Turnstile: `beforeLogin` widget component, cookie, `beforeOperation` verify
  (fail-open without keys), unit + e2e with the stub.
- [ ] T402 `@payloadcms/email-resend` adapter, Arabic reset e-mail, RUNBOOK.
- [ ] T403 Backups: `scripts/backup.sh` (private bucket, `BACKUP_S3_*`), `backup.yml` weekly,
  `scripts/ci/restore-check.sh`, S3 job outsider 403 test, RUNBOOK restore procedure,
  LAUNCH-CHECKLIST 25.
- [ ] T404 Admin polish (groups, `useAsTitle`, Arabic everywhere); ADR-031…034 (+ ADR-026
  amendment); BRD §9.3/§9.4/§9.6 amendments; RUNBOOK (`content:migrate --force` on the
  first 2b deploy); `.env.example`; gates; CTO review; squash-merge; push.
