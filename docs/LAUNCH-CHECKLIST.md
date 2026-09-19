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
| 6 | GA4 consent flow verified in DebugView; Umami receiving events (optional) | Dhia | done 2026-09-18 | The ids go in Site settings → Analytics (ADR-052); Umami on cloud.umami.is or umami.b7r.app, or leave it empty. Both set on production; `node scripts/dev/analytics-probe.mjs` visits, accepts the bar and lists every request to the two services with its status (GA `/g/collect` 204, Umami `/api/send` 200); Umami's gateway moved to `gateway.umami.is` and the policy admits it since 2026-09-18 |
| 7 | Google and Bing verification tokens in SEO settings → Verification | Dhia | open | They become `<meta>` tags; the IndexNow key needs nothing (derived from the secret, served at `/indexnow/{key}.txt`) |
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
| 15 | Search Console: the `https://b7r.sa/` property stays (its HTML-tag token in SEO settings → Verification), a Domain property added by DNS TXT, the old WordPress sitemap removed, `sitemap.xml` submitted, generative AI control on Include, request indexing for `/` | Dhia | open |
| 16 | Bing Webmaster Tools: verified, sitemap submitted, IndexNow ping for all URLs (`scripts/indexnow.ts`) | Dhia | open |
| 17 | Link checker on the live site: zero 404s, zero mixed content | Dhia | open |
| 18 | `robots.txt`, `sitemap.xml`, canonicals and JSON-LD verified on the live domain with the Rich Results Test | Dhia | open |

## Level 2 (Phase 2a) additions, platform-neutral since 2026-09-17

| # | Item | Owner | Status | Notes |
|---|---|---|---|---|
| 19 | Postgres 16 provisioned on the platform (TLS, DDL user, an external connection string); `DATABASE_URL` in the app's environment | Dhia | open | Daily snapshots on; the platform's builder reaches it (RUNBOOK "Deploy") |
| 20 | S3 bucket `b7r-media` with public read; the six `S3_*` values set in the app's environment | Dhia | open | `/api/health` → `media: s3`; MinIO locally |
| 21 | `PAYLOAD_SECRET` (32+ random chars) generated once and set in the environment; the four connections' keys pasted again after the restore | Dhia | open | `openssl rand -base64 48`; rotating it signs every editor out and makes every stored key unreadable (ADR-047); on the review database the OpenAI and Google rows test fine on the new models (2026-09-18) and the Anthropic row's key decrypts to garbage: pasted damaged, not a rotated secret; paste it again there too |
| 22 | First deploy's data: the review database restored (`pg_dump` → `pg_restore`, `public/media/` copied to the bucket under `media/`), or the seed on an empty one (`pnpm migrate`, `pnpm content:migrate`, `pnpm admin:create`); sign in and change the password | Dhia + agent | open | ADR-026; RUNBOOK "Deploy" step 4; the seed refuses a non-empty database |
| 23 | The app on CranL from the repo, build type **Automatic** (Railpack; a Dockerfile build gets no variables there), port 3000 or `PORT`, health check `/api/health`, one instance, the environment set before the first build | Dhia | open | RUNBOOK "Deploy"; a first build on the platform's temporary domain without `B7R_RUNTIME` and `NEXT_PUBLIC_SITE_URL` (noindex) is the rehearsal |
| 24 | An editor account created for the second person; the editor seat verified (no users, no settings, no delete of published) | Dhia | open | `e2e/admin.spec.ts` proves the matrix in CI |
| 25 | Backups: none of ours (Dhia, 2026-09-17). Confirm the platform's snapshot schedule and retention, restore one snapshot into a scratch database once, keep `PAYLOAD_SECRET` beside the database credentials in the password manager, turn on the bucket's versioning | Dhia | open | RUNBOOK "Backups": a backup that cannot be restored is not a backup |
| 26 | English content present (a restored review database has it; a fresh seed gets it from `pnpm content:migrate`); `/en` answers 200 and the header shows the switch | Dhia | open | ADR-043, RUNBOOK "The English site" |

## Added 2026-09-17 (the light pre-launch check)

| # | Item | Owner | Status | Notes |
|---|---|---|---|---|
| 27 | The admin, after the restore: WhatsApp number and contact address checked (Site settings → Contact), the analytics ids entered (Analytics), the verification tokens (SEO settings); nothing of this is in the environment any more (ADR-052) | Dhia | open | `.env.example` is the whole technical list |
| 28 | AI spend (Dhia's Phase 3 brief, reversing his daily period of 09-16): every prompt weekly, the cheap models and a monthly limit on every AI connection ($10 / $5 / $5), on the review and the production databases | *code* | done 2026-09-18 | `scripts/ai-spend.ts`; the four keys still need pasting again on production (row 21) |
| 29 | The hero never grows wider than its photo; white on both sides beyond 1920 px (ADR-051) | *code* | done | `e2e/home-hero.spec.ts` at 2560 and 3440 |
| 30 | The image builds where the platform builds from the repository (build args, migration inside the build) | *code* | done | Dockerfile, ADR-025 amended; the first build-arg build on 2026-09-17 found a production-only type error (the mock kind and the generated types), fixed the same day |
| 31 | An outsider's read of the API: `connections`, `prompts`, `citations`, `payload-jobs`, `users` answer 403 anonymously; GraphQL is off; drafts are not served | *code* | done | `tests/access.test.ts`; checked on the review server 2026-09-17 |
| 32 | An external uptime monitor on `/api/health` every five minutes | Dhia | open | UptimeRobot or cron-job.org; the platform's own check restarts, the external one tells you |

## Added 2026-09-18 (the site audit, `docs/audits/2026-09-18-site.md`)

| # | Item | Owner | Status | Notes |
|---|---|---|---|---|
| 33 | English hero chips: Home → Hero → Proof chips → the English text on the three rows ("100% free", "No minimum order", "Kingdom-wide delivery in 5 days"); a row without English text is omitted from `/en` | Dhia | open | Audit item 8; check the production database the same way |
| 34 | The ADR-050 drafts published in both languages (Posts → the three posts → the draft version): the answer-first opening and the question H2 on the pricing post, the English `seoTitle`s under 60 characters | Dhia | open | Audit item 9; the visibility rules E1, E3 and E4 stay open until then |
| 35 | `GET /api/health` on the production host says `media: "s3"` | *checked* | done 2026-09-18 | Audit item 11: with local media every photo URL is `/api/payload/media/file/*`, served `noindex, nofollow` and `no-store`, so product photos never enter Google Images and a CDN caches nothing. If the answer is `local`, exempt `/api/payload/media/file/` from `adminHeaders()` (`src/lib/security-headers.ts`) with `public, max-age=31536000, immutable` (filenames are unique) |
| 36 | Site settings → Analytics → Umami: the production script URL and website id (`cloud.umami.is` or `umami.b7r.app`), never the review stand-in `/umami-test.js` | Dhia | done 2026-09-18 | Audit item 17; row 6 covers GA4 |
| 37 | Seed copy that changed after the review database was seeded (the seed is create-only, so the admin carries it): Site settings → Menu → CTA, Home → Hero → primary CTA and Home → Ribbon → button read «ابدأ براندك مجاناً» (one tanween form); Home → Video → lead ends «كل شيء يحدث عندنا في جدة.»; FAQs → «كيف يتم الربط؟» becomes «كيف أربط متجري؟»; Pages → Terms §4 «يدفع العميل عبر وسائل الدفع الإلكترونية المعتمدة في المنصة.» and Shipping §6 «نعوّض أو نعيد الطباعة فقط إذا كان الخطأ من طرفنا، …»; FAQs → «كيف أتواصل معكم؟» → the English answer reads "+966 50 169 9572"; Products → بربتوز أطفال → the size labels and the sizes summary with en dashes («0–3M» … «12–18M», both languages); SEO settings → Routes → `/` → OG image cleared (the field is shared by both languages and pinned the Arabic render on `/en`); SEO settings → Routes → the `/blog`, `/terms`, `/shipping` and `/privacy` descriptions in Arabic and the `/terms` and `/privacy` ones in English as the seed now has them (one clause longer) | Dhia | open | Audit items 13, 14 and 15 (the «يتم» sentences, the tanween, the English phone, the size ranges, the OG image, the short descriptions); the BRD rows carry the same text; the e2e assert the seeded values |
| 38 | `bash scripts/dev/lh-all.sh` with every public route as arguments (27 Arabic, 27 English) on the production build: performance 90 or more on the seven LHCI URLs (`/`, `/products`, `/products/tee-essential`, `/contact`, `/blog/how-to-price-printed-tshirt-saudi`, `/en`, `/en/products/tee-essential`), 85 or more on every other route; accessibility, best practices and SEO 100 (a `noindex` hub or author reads SEO 69 until it has posts, item 10); CLS 0 | *code* | done 2026-09-18 on the review build (the agent's pass: 13 routes at 90 or more, all 54 at 85 or more) and again on the merged main b817287 (the checklist pass: median 88, 52 of 54 at 85 or more, the two home pages under the machine's load; CI's runner holds the 90 gate on the eleven LHCI URLs) (`docs/audits/2026-09-18-site.md`, "After the fixes") | Audit item 12, BRD §7.8 amended: CI asserts eleven of the routes on every PR (`lighthouserc.json`); this pass covers the rest, and is repeated on the production host after cutover with the real Umami script and the S3 media |
| 39 | The temporary domain smoke after the programme: `node scripts/dev/cranl-smoke.mjs [origin]` (the admin in English and Arabic, the sidebar's five groups, the dashboard's tiles and sections, a bilingual twin, one publish and one upload through the API, both undone); re-run once after the cutover with `https://b7r.sa` | *code* | done 2026-09-18 (22 of 22 on main da6de95) | Reads `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env.local`; prints outcomes only |

## Added 2026-09-19 (photo quality, ADR-029 amended)

| # | Item | Owner | Status | Notes |
|---|---|---|---|---|
| 40 | The real photographs: the hero at 3000 px wide (both compositions, ADR-044) and the product photos at 2000 by 2000 exported from the PSDs in `resources/source-files`; the pipeline serves them whole the day they land | Dhia | open | Under `resources/hero/examples` and `resources/products/{slug}/`, then `pnpm assets` and row 33; or uploaded through the admin (RUNBOOK "Assets"). Row 3 stays for the crops. Then re-run the audit's measurement at 2x (`docs/audits/2026-09-19-photo-quality.md`, the served bytes of the 1920w and 3840w candidates) and re-read the 220 KB budget of BRD 7.8: a 3000 px AVIF at q90 above about 250 KB puts the hero alone at 85 (the CTO's fallback), the rest of the photos stay at 90 |
| 41 | Production after the merge: `pnpm exec tsx scripts/media-requality.ts --env .env.cranl.local --dry-run`, then without the flag (every seeded photo re-uploaded at the new encode under a new name, the old renditions deleted from the bucket), then `scripts/media-blur.ts --env .env.cranl.local` for any upload the pass did not cover, **then a redeploy** (Deploy → Redeploy on the platform, or an empty commit on `main`): the rebuild prerenders every page with the new names at once | *code* / Dhia | open | Done on the review database 2026-09-19; the CDN caches an object as immutable for a year, which is why the names change (RUNBOOK "Assets"). Without the redeploy the pages keep the old names until their 60 s timer runs (ADR-030; a media document revalidates nothing of its own), and the old files are already gone from the bucket: a photo not cached at the CDN edge or by the optimizer is a 404 for that minute |

## Added 2026-09-19 (Level 4 bookings, ADR-062)

| # | Item | Owner | Status | Notes |
|---|---|---|---|---|
| 42 | The Google Calendar API enabled on the service account's Cloud project, and domain-wide delegation added in the Workspace Admin console for the account's client id with the two scopes `https://www.googleapis.com/auth/calendar.events` and `https://www.googleapis.com/auth/calendar.freebusy` | Dhia | open | RUNBOOK "Bookings": the steps; never the whole `calendar` scope |
| 43 | A `google-calendar` connection with the key file pasted again on its own row, its Test green (today's free/busy on the host's calendar); Site → Booking → the calendar owner's e-mail, the hours checked, then Booking open | Dhia | open | Until the switch is on, `/book` says the WhatsApp way and the contact card keeps the BRD 4.11 message; `/api/health` is untouched by the switch |
| 44 | A real test booking on the live site: the row in Site → Bookings, the event with its Meet link on the calendar, the confirmation and Dhia's notification e-mail (needs row 4's Resend keys), the manage link's move and cancel, then the row deleted | Dhia + agent | open | BRD §11.5 (2); a booking made before the calendar is on stands as `calendar: off` and says the link follows |
| 45 | The booking copy (BRD §4.19: the page, the picker, the e-mails, the `/book` search row) read and approved, or corrected in `src/content/copy/{ar,en}.ts`; then out of `TODO_COPY` in the verbatim test | Dhia | open | Written under BRD §0.5's fallback rule, as the compare page was |

## Also needed before any of the above

- GitHub repository `diax7/b7r-sa-website` exists (its visibility is Dhia's); the platform project is still Dhia's.
- `B7R_RUNTIME=production` in the production app only (ADR-021).
- zizmor's cache-poisoning finding on `deploy.yml` stays open by decision (2026-09-17): the
  GitHub Actions cache scope is written only by `deploy.yml`, which runs on push to `main`;
  `ci.yml` runs on pull requests without a Docker cache, so a fork cannot seed what the
  deploy reads.
- Container smoke test on the 2a image (owner: agent), **done 2026-09-13**: `docker build` with the BuildKit secrets against the compose Postgres (338 MB), then `docker run` with the runtime env: `/api/health` → `db: ok`, `media: local`; `/` and `/products/hoodie` 200, `/showcase` 301, `/wp-admin` 410, `/nope` 404, `/admin/login` carries `X-Robots-Tag` and `no-store`. Repeat against the GHCR image once `deploy.yml` has the secrets.
- Container smoke test (owner: agent), **done 2026-09-13** on the 1c image (`docker build -t b7r-site:1c .`): `/api/health` reports the four integration states, `/showcase` → 301, `/wp-admin` → 410, CSP + `Content-Language` headers present, `/og/products/hoodie.png` 200, and a run with `B7R_RUNTIME=production` and missing variables exits 1 listing them (the health check would fail). Repeat on the image CranL builds before cutover.
