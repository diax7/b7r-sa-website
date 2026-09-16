# Launch checklist (BRD 12.4)

Owner: **Dhia** unless marked *code*. Status as of 2026-09-17 (the light pre-launch check; the plan and the three decisions are in `docs/plans/2026-09-16-production-launch.md`). Nothing here is required for the local build to pass; every item is needed for
b7r.sa to go live.

## Before cutover

| # | Item | Owner | Status | Notes |
|---|---|---|---|---|
| 1 | Three real testimonials entered, `placeholder` removed, or the section disabled in writing | Dhia | open | Placeholders carry «نموذج» and the section is omitted on the production host (ADR-013) |
| 2 | Zid and Shopify enabled in the app so «متاح الآن» is true | Dhia | open | Appendix G 3 |
| 3 | Final hero photos delivered and cropped, or placeholders accepted for launch | Dhia | open | `scripts/hero-crops.ts` re-crops from `resources/hero/` |
| 4 | Resend domain `b7r.sa` verified (SPF, DKIM, DMARC); test contact email received at contact@b7r.sa | Dhia | open | `RESEND_API_KEY`, `RESEND_FROM`, `CONTACT_TO`, `RESEND_AUDIENCE_ID`; `/api/health` → `contact: live`, `newsletter: live` |
| 5 | Turnstile keys set; a bot submission blocked; a human submission passes; the admin login shows the widget | Dhia | open | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`, required in production since the login gate (ADR-034): the app refuses to boot without them; `/api/health` → `turnstile: on` |
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
| 13 | DNS `b7r.sa` → the platform (A/CNAME only; keep every MX and TXT record); `www` redirect; TLS valid | Dhia | open |
| 14 | Old Hostinger site kept 14 days, then cancelled | Dhia | open |

## After cutover (same day)

| # | Item | Owner | Status |
|---|---|---|---|
| 15 | Search Console: the `https://b7r.sa/` property stays (its HTML-tag token in `GOOGLE_SITE_VERIFICATION`), a Domain property added by DNS TXT, the old WordPress sitemap removed, `sitemap.xml` submitted, generative AI control on Include, request indexing for `/` | Dhia | open |
| 16 | Bing Webmaster Tools: verified, sitemap submitted, IndexNow ping for all URLs (`scripts/indexnow.ts`) | Dhia | open |
| 17 | Link checker on the live site: zero 404s, zero mixed content | Dhia | open |
| 18 | `robots.txt`, `sitemap.xml`, canonicals and JSON-LD verified on the live domain with the Rich Results Test | Dhia | open |

## Level 2 (Phase 2a) additions, platform-neutral since 2026-09-17

| # | Item | Owner | Status | Notes |
|---|---|---|---|---|
| 19 | Postgres 16 provisioned on the platform (TLS, DDL user, an external connection string); `DATABASE_URL` in the app's environment | Dhia | open | Daily snapshots on; the platform's builder reaches it (RUNBOOK "Deploy") |
| 20 | S3 bucket `b7r-media` with public read; the six `S3_*` values set in the app's environment | Dhia | open | `/api/health` → `media: s3`; MinIO locally |
| 21 | `PAYLOAD_SECRET` (32+ random chars) generated once and set in the environment; the four connections' keys pasted again after the restore | Dhia | open | `openssl rand -base64 48`; rotating it signs every editor out and makes every stored key unreadable (ADR-047) |
| 22 | First deploy's data: the review database restored (`pg_dump` → `pg_restore`, `public/media/` copied to the bucket under `media/`), or the seed on an empty one (`pnpm migrate`, `pnpm content:migrate`, `pnpm admin:create`); sign in and change the password | Dhia + agent | open | ADR-026; RUNBOOK "Deploy" step 4; the seed refuses a non-empty database |
| 23 | The app on the platform from the repo, build type `Dockerfile`, port 3000 or `PORT`, health check `/api/health`, one instance, the environment set before the first build | Dhia | open | RUNBOOK "Deploy"; a first build on the platform's temporary domain without `B7R_RUNTIME` and `NEXT_PUBLIC_SITE_URL` (noindex) is the rehearsal |
| 24 | An editor account created for the second person; the editor seat verified (no users, no settings, no delete of published) | Dhia | open | `e2e/admin.spec.ts` proves the matrix in CI |
| 25 | Backup restore rehearsed once from a platform snapshot into a scratch database; the weekly `Backup` workflow needs the five `BACKUP_S3_*` secrets on a second, private bucket and a database the GitHub runner can reach | Dhia | open | BRD 9.8 (6); CI rehearses a restore of the seeded database every run (`scripts/ci/restore-check.sh`), ADR-034 |
| 26 | English content present (a restored review database has it; a fresh seed gets it from `pnpm content:migrate`); `/en` answers 200 and the header shows the switch | Dhia | open | ADR-043, RUNBOOK "The English site" |

## Added 2026-09-17 (the light pre-launch check)

| # | Item | Owner | Status | Notes |
|---|---|---|---|---|
| 27 | Umami: a site on cloud.umami.is or your own instance, or say so and the two variables leave the required set | Dhia | open | `NEXT_PUBLIC_UMAMI_SRC`, `NEXT_PUBLIC_UMAMI_ID` are asserted at start with `B7R_RUNTIME=production` |
| 28 | A monthly limit on every AI connection; the prompts' periods set; the Mock connection and its citations removed before the dump | Dhia | open | RUNBOOK "The citation ledger"; the Anthropic row has no limit today |
| 29 | The hero beyond Full HD is a card of the photo's width (ADR-051) | *code* | done | `e2e/home-hero.spec.ts` at 2560 and 3440 |
| 30 | The image builds where the platform builds from the repository (build args, migration inside the build) | *code* | done | Dockerfile, ADR-025 amended; the first build-arg build on 2026-09-17 found a production-only type error (the mock kind and the generated types), fixed the same day |
| 31 | An outsider's read of the API: `connections`, `prompts`, `citations`, `payload-jobs`, `users` answer 403 anonymously; GraphQL is off; drafts are not served | *code* | done | `tests/access.test.ts`; checked on the review server 2026-09-17 |
| 32 | An external uptime monitor on `/api/health` every five minutes | Dhia | open | UptimeRobot or cron-job.org; the platform's own check restarts, the external one tells you |

## Also needed before any of the above

- GitHub repository `diax7/b7r-sa-website` exists (its visibility is Dhia's); the platform project is still Dhia's.
- `B7R_RUNTIME=production` in the production app only (ADR-021).
- zizmor's cache-poisoning finding on `deploy.yml` stays open by decision (2026-09-17): the
  GitHub Actions cache scope is written only by `deploy.yml`, which runs on push to `main`;
  `ci.yml` runs on pull requests without a Docker cache, so a fork cannot seed what the
  deploy reads.
- Container smoke test on the 2a image (owner: agent), **done 2026-09-13**: `docker build` with the BuildKit secrets against the compose Postgres (338 MB), then `docker run` with the runtime env: `/api/health` → `db: ok`, `media: local`; `/` and `/products/hoodie` 200, `/showcase` 301, `/wp-admin` 410, `/nope` 404, `/admin/login` carries `X-Robots-Tag` and `no-store`. Repeat against the GHCR image once `deploy.yml` has the secrets.
- Container smoke test (owner: agent), **done 2026-09-13** on the 1c image (`docker build -t b7r-site:1c .`): `/api/health` reports the four integration states, `/showcase` → 301, `/wp-admin` → 410, CSP + `Content-Language` headers present, `/og/products/hoodie.png` 200, and a run with `B7R_RUNTIME=production` and missing variables exits 1 listing them (the health check would fail). Repeat on the image CranL builds before cutover.
