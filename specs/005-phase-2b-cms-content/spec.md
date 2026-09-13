# Feature Specification: Phase 2b: Every page from the CMS

**Feature Branch**: `phase/2b-cms-content` · **Created**: 2026-09-13 · **Status**: Draft

**Input**: BRD §12.3 row 2b: `home` Global, `pages` with blocks, `faqs`, `testimonials`,
`integrations`, `redirects` plugin, SEO plugin, revalidation + IndexNow hooks, backups, admin
Arabic polish, content files removed. DoD: §9.8 all. Carried over from 2a (ADR-027, IDEAS):
the login Turnstile, the e-mail adapter, scheduled publish and live preview (§9.3).

**Dhia-owned, not blocking**: Turnstile keys, Resend domain, CranL Postgres/S3 and the
snapshot schedule. Everything is built and proven against Docker Postgres + MinIO and CI.

## User Scenarios & Testing

### US1: The home page from the admin (P1)
Dhia opens «الصفحة الرئيسية» in the admin: one document with fixed sections in the BRD order
(hero slides, product strip order, designer copy, steps, video, why-us, testimonials,
integrations intro, FAQ selection, ribbon). Each section's copy and media are editable; the
sections after the designer carry an `enabled` toggle (hero, strip, designer and ribbon
cannot be switched off, BRD 9.5). Publishing regenerates `/` at once. The section order and
the layout never change from the admin (a designed page, not a page builder).

### US2: Pages with blocks (P1)
`/how-it-works`, `/about`, `/contact`, `/faq`, `/terms`, `/shipping` and `/privacy` are
documents in a `pages` collection: slug (fixed list for the seven, free for new pages), title,
lead, and a block list drawn from a small set, rich text, steps, cards, media banner, the
MISK credential, the contact cards, the booking card, the FAQ list, the legal body (with its
`updatedAt` line). The seven existing pages render byte-for-byte the same copy after
migration (verbatim tests re-pointed at the seed). A new page (for example `/creators`)
can be assembled from the blocks and is a routed, indexed page on publish with its own
metadata. Rich text is Lexical: H2/H3, lists, links, images, and a «CTA» block; RTL editing
verified in the admin e2e.

### US3: FAQs, testimonials, integrations (P1)
Three collections replace the content files. `faqs` (group, question, answer, order,
`showOnHome`) feed `/faq` and the five home items (exactly five with `showOnHome`; the
admin refuses a sixth). `testimonials` (quote, name, store, avatar, `placeholder`,
order) keep the ADR-013 rule: while every entry is a placeholder the home shows the «نموذج»
badge on previews and omits the section on the production host. `integrations` (slug,
name, Latin name, logo, status, order) feed the tiles. Each publish regenerates the pages
that render it.

### US4: Redirects from the admin (P2)
`@payloadcms/plugin-redirects` holds the §5.2 map as the editor-facing source; the admin adds
or changes an entry and it is live within a minute without a deploy (308 for internal
targets, 307 for external, single-segment sources). `next.config` redirects and the
proxy's 410s keep working exactly as today for the seeded list. Loops, self-redirects,
nested sources and non-`https:` targets are refused in the admin.

### US5: Publish pipeline (P2)
Publishing any document regenerates the routes that render it (ADR-030) and, in the
production runtime only (`B7R_RUNTIME`), enqueues one IndexNow ping per changed public URL
through Payload's jobs queue (retried, logged, never blocking the editor). Scheduled
publish works through the same queue (`publishAt`); the queue runs inside the container
(`jobs.autoRun`), its run endpoint is closed to everyone, and a publish that happens from
the queue (outside a request) is covered by the 60 s timer without an error.

### US6: Login hardening and e-mail (P2)
The admin login form carries Turnstile when `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set (ADR-027
design: widget before login → cookie → `beforeLogin` verification), with the always-pass
test key in CI. `@payloadcms/email-resend` sends password resets and the verification e-mail
of a new editor from `RESEND_FROM`; without a key the admin sees the RUNBOOK note.

### US7: Backups (P2)
`scripts/backup.sh` takes a `pg_dump` and uploads it to a **private** backups bucket (never
the public media bucket) with a 30-day retention; a GitHub Actions schedule runs it weekly
against production once the secrets exist (no-op notice until then). A restore is
documented and rehearsed once against a scratch database in CI
(`scripts/ci/restore-check.sh`); CI also proves an outsider cannot list or read the
backups bucket.

### US8: Admin polish and content files removed (P3)
Every collection, global, field, help text and group label is Arabic (English left as the
generated fallback); the dashboard groups read «المحتوى», «الإعدادات», «الإدارة»; the
document titles use Arabic `useAsTitle`. `src/content/*.ts` other than `schema.ts`,
`seo-copy.ts`, `blog/*` (Level 3) and the seed fixtures are deleted; the seed folder holds
every migrated document.

### US9: Level 1 unchanged for visitors (P1)
Every §6.18 criterion, every e2e suite and Lighthouse on the five URLs stay green; no admin
JS reaches a public page; pages remain prerendered with ISR (60 s) and on-demand paths.

## Requirements
- FR-001 `home` global with grouped sections and `enabled` toggles; hero slides carry desktop
  and mobile media (focal point) with the BRD alt rule; product strip order is five product
  relationships; FAQ selection is derived from `faqs.showOnHome` (not a second list).
- FR-002 `pages` collection with drafts + autosave, `slug` unique, `blocks` from the fixed
  set; the legal body block renders Markdown through an allowlisting renderer (IDEAS:
  sanitise before `Prose`); new slugs route through `src/app/(site)/[slug]/page.tsx` with
  `dynamicParams = true` and `generateStaticParams` from published pages; reserved slugs
  (`products`, `blog`, `admin`, `api`, …) refused; unknown top-level URLs keep the
  server-rendered global 404 (raw-HTML e2e).
- FR-003 `faqs`, `testimonials`, `integrations` collections with `order`, drafts on
  testimonials only; `showOnHome` limited to five by a `beforeValidate` hook.
- FR-004 `@payloadcms/plugin-redirects` seeded from `src/lib/redirects.ts`; rows added in
  the admin resolve in the `[slug]` route (308/307); the build-time rules and the proxy's
  410s stay as they are for the seeded list.
- FR-005 Publish hooks extended per collection (`revalidatePath` on the exact routes); an
  IndexNow job (`payload.jobs`) queued on the production host only; scheduled publish through
  Payload versions `schedulePublish` with the queue running in-process.
- FR-006 Login Turnstile: custom `beforeLogin` component rendering the widget, a short-lived
  cookie with the token, verified in `hooks.beforeOperation` (login) with
  `TURNSTILE_SECRET_KEY` before the password is checked; skipped when the keys are unset;
  the admin CSP already allows the origin.
- FR-007 `@payloadcms/email-resend` wired from `RESEND_API_KEY` + `RESEND_FROM`; `users`
  `verify: false` (admin creates accounts), password reset e-mail in Arabic.
- FR-008 Backups: `scripts/backup.sh` (pg_dump → S3, retention), `.github/workflows/backup.yml`
  weekly, RUNBOOK restore procedure, CI restore check.
- FR-009 Migration: `scripts/migrate-content.ts` extended for the new documents (create-only,
  `--force` guard unchanged); verbatim tests re-pointed; content files deleted.
- FR-010 Tests: unit (block mappers, showOnHome limit, redirect resolution, IndexNow job
  payload, Turnstile verify); integration (seed of every collection in CI); e2e (home edit →
  live, new page → routed, FAQ edit → live, redirect added → live, login with the Turnstile
  stub, editor seat on the new collections, backup script against the CI Postgres).

## Success Criteria
- SC-001 §9.8 items 1–6: hero headline edit live ≤ 60 s; editor limits proven on every new
  collection; Level 1 suites and Lighthouse unchanged; migration clean and refused on rerun;
  IndexNow and revalidation visible in logs; a restore rehearsed and documented.
- SC-002 `src/content` contains only `schema.ts`, `seo-copy.ts`, `blog/`, `legal/*.md` (moved
  into the seed) and `seed/`.

## Out of scope (Level 3–4)
Blog collections, search, the content engine, inbox, bookings, analytics views.
