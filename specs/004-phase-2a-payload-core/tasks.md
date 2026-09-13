# Tasks: Phase 2a — Payload core

**Input**: `plan.md` (CTO review 2026-09-13). **Branch**: `phase/2a-payload-core`.

## Wiring
- [x] T001 Route groups: move the site into `src/app/(site)/` (layout, page, error, not-found, every page folder except `api/`); keep metadata files, `api/`, `indexnow/`, `global-error.tsx` at the root. The 404 is `global-not-found.tsx` + `site-document.tsx` (ADR-024), not a catch-all. All Level 1 e2e still green.
- [x] T002 `src/payload.config.ts` (+ `@payload-config` path), `withPayload`, `src/app/(payload)/{layout,custom.css,admin/[[...segments]]/{page,not-found},api/payload/[...slug]/route}`, importMap; `routes.api=/api/payload`, GraphQL off, i18n ar/en, localization ar/en, admin meta + brand icon/logo; admin header set (`adminHeaders()` + unit test); `robots`/`sitemap` unchanged.

## Collections and globals — `src/modules/cms/`
- [x] T003 `access.ts` + `tests/access.test.ts` (role × operation matrix; delete published vs draft).
- [x] T004 `users.ts` (roles, lockout, cookies, password policy hooks) + `lib/pwned.ts` + `tests/pwned.test.ts`; `scripts/create-admin.ts` (`pnpm admin:create`).
- [x] T005 `media.ts` (alt Arabic, focal point, sizes, S3/local storage) + `sharp` to dependencies.
- [x] T006 `products.ts` (fields 1:1, drafts+autosave, price validation, plugin-seo, Arabic labels/help texts) and globals `site-settings.ts`, `navigation.ts`, `seo-defaults.ts` with BRD defaults; `hooks/revalidate.ts` + `tests/revalidate-hook.test.ts`.
- [x] T007 Migrations: `pnpm payload migrate:create initial` → `src/migrations/`; `push: false`; `prodMigrations` gated off during build.

## Data layer and call sites — `src/lib/cms/`
- [x] T008 `payload.ts`, `products.ts`, `settings.ts` (Local API `draft:false`, `locale:'ar'`, `React.cache` per render — ISR instead of tags, ADR-030; zod-parsed) + `lib/image-url.ts optimizedSrc` + `tests/cms-mapping.test.ts`.
- [x] T009 Switch call sites (enumerate with `rg "from '@/content/(products|site|navigation|seo)'"`): pages' `metadata` → `generateMetadata`, header/footer/ribbon/contact/strip/designer/products/sitemap/OG script/JSON-LD; designer `useImage` via `optimizedSrc`; `next.config` `images.remotePatterns`.
- [x] T010 Seed fixtures `src/content/seed/*`; delete `src/content/{site,navigation,seo,products}.ts`; `scripts/migrate-content.ts` (create-only, `--force` guard); `scripts/build-og.ts` reads Payload when configured; verbatim + schema tests re-pointed.

## Env, health, infra
- [x] T011 `env-server.ts payloadEnv()`, production-required set (+ secret length), `/api/health` `db`/`media` fields; `.env.example`; `compose.yaml` (done); RUNBOOK "Local CMS", deploy sequence, CDN rule, additive migrations, OG regeneration.
- [x] T012 CI: Postgres service, migrate → seed → admin:create → build → e2e; second job with MinIO for the S3 subset; `deploy.yml` (migrate → build → GHCR) gated on the `production` environment; Dockerfile build secrets.

## Verification
- [x] T013 E2E `admin.spec.ts` (RTL/Arabic login, editor 403s via REST, edit → live ≤ 60 s, noindex, sitemap exclusion); integration test of the migration (empty → counts; rerun semantics; admin:create policy); all Level 1 suites; Lighthouse five URLs.
- [x] T014 ADR-024…029, BRD §9.2/9.3/9.7 amendments, LAUNCH-CHECKLIST (CranL Postgres/S3, GHCR pull, secrets), gates, commit, CTO code review, squash-merge, push.

## Outcome (2026-09-13)

- ADR-030 replaces the tag design: `revalidate = 60` on every `(site)` page and the
  metadata routes, `revalidatePath` on static routes from the publish hooks, product pages
  on the timer (Next 16.3.5 file-system cache 404s a `dynamicParams = false` route after an
  on-demand revalidation; reproduced by `e2e/admin.spec.ts` before the change).
- Extra: Gravatar off in the admin (found by the CSP recorder), font preloads via
  `react-dom` `preload()` (each face was emitted twice), product OG fallback to the default
  image when `pnpm og` has not run for a new product.
- Code review (CTO, 2026-09-13): public reads filter `_status = published` (a never-published
  draft was returned by `draft: false`); `/products/[slug]` is `dynamicParams = true` and the
  hook revalidates the product page (a product added in the admin had no page until the next
  deploy); JSON-LD/sitemap share `absoluteUrl` for S3 media; the password policy throws a
  `ValidationError` (400, inline) from `beforeValidate` only; globals hidden from editors in
  the panel; SVG uploads dropped; print area validated at the API; `.gitattributes` LF;
  `@payloadcms/plugin-seo` removed (never imported — the BRD 4.16 templates cover titles and
  descriptions; the plugin returns with `pages` in 2b if wanted); `lib/cms/env.ts` moved out
  of the module so `lib` no longer imports `modules`.
