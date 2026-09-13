# Launch checklist (BRD 12.4)

Owner: **Dhia** unless marked *code*. Status as of 2026-09-13 (end of Phase 2a). Nothing here is required for the local build to pass; every item is needed for
b7r.sa to go live.

## Before cutover

| # | Item | Owner | Status | Notes |
|---|---|---|---|---|
| 1 | Three real testimonials entered, `placeholder` removed, or the section disabled in writing | Dhia | open | Placeholders carry «نموذج» and the section is omitted on the production host (ADR-013) |
| 2 | Zid and Shopify enabled in the app so «متاح الآن» is true | Dhia | open | Appendix G 3 |
| 3 | Final hero photos delivered and cropped, or placeholders accepted for launch | Dhia | open | `scripts/hero-crops.ts` re-crops from `resources/hero/` |
| 4 | Resend domain `b7r.sa` verified (SPF, DKIM, DMARC); test contact email received at contact@b7r.sa | Dhia | open | `RESEND_API_KEY`, `RESEND_FROM`, `CONTACT_TO`, `RESEND_AUDIENCE_ID`; `/api/health` → `contact: live`, `newsletter: live` |
| 5 | Turnstile keys set; a bot submission blocked; a human submission passes | Dhia | open | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`; `/api/health` → `turnstile: on` |
| 6 | GA4 consent flow verified in DebugView; Umami receiving events | Dhia | open | Code done (1b); needs the real ids and the Umami site |
| 7 | `INDEXNOW_KEY` file live; Google and Bing verification tokens set | Dhia | open | Served at `/indexnow/{key}.txt`; tokens become `<meta>` tags |
| 8 | OG default and product images render in WhatsApp, X and LinkedIn previews | Dhia | open | Images exist (`pnpm og`); check after DNS |
| 9 | Favicon set and manifest validated | *code* | done | `/favicon.ico`, `/icons/icon-192.png`, `/icons/icon-512.png`, `/manifest.webmanifest` |
| 10 | All §5.2 redirects tested against the live old URL list | *code* / Dhia | done locally | `e2e/redirects.spec.ts` covers every entry; re-run `curl -I` on the live host after DNS |
| 11 | Lighthouse CI green on the production build; axe zero serious issues | *code* | done (with ADR-014 caveat) | Five URLs 90–96 / 100 / 100 / 100; LCP assertion (≤ 2.5 s) stays red by decision |
| 12 | RTL QA on iOS Safari and Chrome Android with screenshots | Dhia | open | Playwright runs WebKit (iPhone 15) and Chromium (Pixel 7) on every route; a real-device pass is still Dhia's |

## Cutover

| # | Item | Owner | Status |
|---|---|---|---|
| 13 | DNS `b7r.sa` → CranL; `www` redirect; TLS valid | Dhia | open |
| 14 | Old Hostinger site kept 14 days, then cancelled | Dhia | open |

## After cutover (same day)

| # | Item | Owner | Status |
|---|---|---|---|
| 15 | Search Console: domain property verified, sitemap submitted, generative AI control on Include, request indexing for `/` | Dhia | open |
| 16 | Bing Webmaster Tools: verified, sitemap submitted, IndexNow ping for all URLs (`scripts/indexnow.ts`) | Dhia | open |
| 17 | Link checker on the live site: zero 404s, zero mixed content | Dhia | open |
| 18 | `robots.txt`, `sitemap.xml`, canonicals and JSON-LD verified on the live domain with the Rich Results Test | Dhia | open |

## Level 2 (Phase 2a) additions

| # | Item | Owner | Status | Notes |
|---|---|---|---|---|
| 19 | CranL Postgres 16 provisioned (TLS, DDL user); `DATABASE_URL` in the GitHub `production` environment | Dhia | open | Daily snapshots on; the runner must reach it or the image is built on CranL (RUNBOOK "Deploy") |
| 20 | S3 bucket `b7r-media` with public read; the five `S3_*` values set (secrets + variables) | Dhia | open | `/api/health` → `media: s3`; MinIO locally |
| 21 | `PAYLOAD_SECRET` (32+ random chars) generated once and set in the environment | Dhia | open | `openssl rand -base64 48`; rotating it signs every editor out |
| 22 | First deploy: `pnpm migrate`, `pnpm content:migrate`, `pnpm admin:create` against production; sign in and change the password | Dhia | open | ADR-026; the seed refuses a non-empty database |
| 23 | CranL pulls `ghcr.io/diax7/b7r-sa-website:latest` (package visibility or a pull token); health check on `/api/health` | Dhia | open | `deploy.yml` pushes on every merge to `main` once the secrets exist |
| 24 | An editor account created for the second person; the editor seat verified (no users, no settings, no delete of published) | Dhia | open | `e2e/admin.spec.ts` proves the matrix in CI |
| 25 | Backup restore rehearsed once from a CranL snapshot into a scratch database | Dhia | open | BRD 9.8 (6) |

## Also needed before any of the above

- GitHub repository `diax7/b7r-sa-website` (private) exists; CranL project creation is still Dhia's.
- `B7R_RUNTIME=production` in the CranL production app only (ADR-021).
- Container smoke test on the 2a image (owner: agent) — **done 2026-09-13**: `docker build` with the BuildKit secrets against the compose Postgres (338 MB), then `docker run` with the runtime env: `/api/health` → `db: ok`, `media: local`; `/` and `/products/hoodie` 200, `/showcase` 301, `/wp-admin` 410, `/nope` 404, `/admin/login` carries `X-Robots-Tag` and `no-store`. Repeat against the GHCR image once `deploy.yml` has the secrets.
- Container smoke test (owner: agent) — **done 2026-09-13** on the 1c image (`docker build -t b7r-site:1c .`): `/api/health` reports the four integration states, `/showcase` → 301, `/wp-admin` → 410, CSP + `Content-Language` headers present, `/og/products/hoodie.png` 200, and a run with `B7R_RUNTIME=production` and missing variables exits 1 listing them (the health check would fail). Repeat on the image CranL builds before cutover.
