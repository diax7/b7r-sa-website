# Feature Specification: Phase 2a — Payload core (admin, users, settings, products, media)

**Feature Branch**: `phase/2a-payload-core` · **Created**: 2026-09-13 · **Status**: Draft

**Input**: BRD §12.3 row 2a: Payload install in the same app; Postgres and S3 on CranL; users
and roles; `site-settings`, `navigation`, `seo-defaults`, `products`, `media`; migration
script; the site reads products and settings from Payload via a cached data layer.
Detail: §9.1–9.4 (setup, infrastructure, collections), §9.6 (publish pipeline, the parts that
apply to products and settings), §9.7 (migration), §9.8 items 1 (for products), 2, 3, 4.

**Dhia-owned, not blocking**: the CranL Postgres, the CranL S3 bucket and every credential.
Everything is built and tested against Docker Postgres + MinIO locally and a Postgres service
in CI; the RUNBOOK gives CranL the exact env matrix.

## User Scenarios & Testing

### US1 — Arabic admin (P1)
Dhia opens `/admin`, sees the login in Arabic and right-to-left («لوحة بحر برنت» as the
document title, the brand icon as logo), logs in with email + password, and lands on a
dashboard listing المنتجات, الوسائط, المستخدمون (admin only) and the three globals
(إعدادات الموقع، التنقل، إعدادات SEO). Admin routes are `noindex` (meta + `X-Robots-Tag`)
and absent from the sitemap. GraphQL is off; REST lives at `/api/payload/*`.

### US2 — Roles (P1)
Two roles. **admin**: everything. **editor**: read/create/update products and media, publish
drafts; cannot see or edit users, site settings, navigation, SEO defaults; cannot delete a
published product. Enforced by collection/global access functions and proven by tests that
use the REST API with an editor session (403s), not only by hidden UI.

### US3 — Products edited without a deploy (P1)
An editor changes a product's short description and publishes. Within 60 seconds the public
`/products/{slug}`, `/products`, the home strip and the designer show the new text, without a
deploy. Products carry drafts/versions with autosave; the public site reads only published
documents. `suggestedPrice ≥ baseCost` and the fixed 28 × 38 print area are validated in the
admin. Colour photos come from the media collection (front required, back optional).

### US4 — Settings and navigation from the admin (P2)
`site-settings` (brand, contact, social, welcome credit, delivery days/origin, booking URL,
app URLs), `navigation` (six primary items, four policy links, labels) and `seo-defaults`
(title template, per-route titles/descriptions, default OG image, verification tokens —
admin-only fields) drive the shell, the footer, the ribbon, the contact page and metadata.
Editing any of them revalidates every page that reads it.

### US5 — Media (P2)
Uploads require Arabic alt text, keep the original, generate thumbnail 400 / card 800 /
hero 1920 / og 1200×630 with focal-point cropping, and are stored on S3 when `S3_*` is set
(CranL) or on local disk otherwise (dev, CI). Public read for images.

### US6 — Migration (P1)
`pnpm content:migrate` seeds the three globals, the five products and their
photos (uploaded to media with the existing alt text) from the Level 1 content, idempotently
(second run changes nothing; upsert by slug/global). Runs clean on an empty database in CI.
The first admin user is created by `pnpm admin:create` from `ADMIN_EMAIL`/`ADMIN_PASSWORD`
(one-off, documented).

### US7 — Level 1 unchanged for visitors (P1)
Every §6.18 acceptance criterion and every existing e2e still passes; Lighthouse on the five
URLs unchanged (no Payload JS on public pages); pages remain prerendered at build and refresh
through `revalidateTag`/`revalidatePath` only.

## Requirements
- FR-001 Payload 3.89 with `@payloadcms/next`, `@payloadcms/db-postgres`, `@payloadcms/storage-s3`,
  `@payloadcms/translations` (`ar`), `@payloadcms/plugin-seo` on products; GraphQL disabled;
  `routes.api = '/api/payload'`; admin at `/admin`.
- FR-002 Route groups: existing site under `src/app/(site)/`, Payload under `src/app/(payload)/`;
  a `(site)/[...missing]/page.tsx` catch-all so unknown URLs still get the site's 404 (two root
  layouts).
- FR-003 Users: `role` select (`admin` | `editor`), password ≥ 12 with a breached-password check
  (HIBP k-anonymity range API, fail-open with a log), `maxLoginAttempts: 5`, `lockTime: 15 min`,
  cookies `SameSite=Lax; Secure` in production. Turnstile on the login form is deferred (ADR).
- FR-004 Localization `['ar', 'en']`, default `ar`, `localized: true` on text fields; English
  stays empty.
- FR-005 Data layer `src/lib/cms/*` (Local API with `draft: false` + `unstable_cache` with
  tags `products`, `site-settings`, `navigation`, `seo`) returning the existing
  `content/schema.ts` types (zod-parsed so drift fails loudly); components unchanged.
  `afterChange`/`afterDelete` hooks revalidate tags and the affected paths. Media URLs are
  never requested raw by the browser: every image (cards, gallery, strip, designer mockups)
  goes through `next/image`, so the CSP `img-src` stays `'self'` and the Konva canvas stays
  untainted.
- FR-006 Migrations in `src/migrations/` (`push: false` everywhere, additive-only); CI runs
  `pnpm payload migrate` against a Postgres service; the production deploy is a CI job that
  migrates the production database, builds the image and pushes it to GHCR for CranL to pull;
  `prodMigrations` runs at container start as a safety net and never during `next build`.
- FR-007 Seed fixtures: the migrated content files move to `src/content/seed/*.ts` (still
  schema-validated and BRD-verbatim tested); `src/content/{site,navigation,seo,products}.ts`
  are deleted. The seed script is create-only and refuses a non-empty database without
  `--force`; it never overwrites a document the CMS holds.
- FR-008 Env: `DATABASE_URL`, `PAYLOAD_SECRET`, `PAYLOAD_PUBLIC_SERVER_URL`, `S3_BUCKET`,
  `S3_REGION`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` (+ `ADMIN_EMAIL`,
  `ADMIN_PASSWORD` for the one-off create); production-required set extended
  (`PAYLOAD_SECRET` ≥ 32 chars); `/api/health` reports `db` and `media` as fields while
  staying a liveness probe (`ok: true` whenever the process answers).
- FR-009 `compose.yaml` with Postgres 16 and MinIO for local dev; CI also runs the admin, CSP
  and products e2e against MinIO so the S3 URL shape is exercised before CranL.
- FR-010 Tests: unit (access matrix, data-layer mapping, breached-password client, revalidation
  hook wiring); integration (migration idempotency against Postgres, in CI); e2e (admin login
  RTL/Arabic, editor 403s via REST, product edit → public page within 60 s, admin noindex +
  sitemap exclusion, all Level 1 suites green).

## Success Criteria
- SC-001 §9.8 item 1 for products (edit → live ≤ 60 s, no deploy), item 2 (editor limits proven
  by API tests), item 3 (Level 1 suites and Lighthouse unchanged), item 4 (migration clean and
  idempotent in CI).
- SC-002 Public-page JS budget and the CSP e2e unchanged (admin routes get their own CSP).

## Out of scope (2b)
`home`, `pages`, `faqs`, `testimonials`, `integrations` collections; redirects plugin; live
preview; scheduled publish; IndexNow hook; backups; admin polish; deleting the remaining
content files.
