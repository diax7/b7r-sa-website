# Runbook

## Local development

```bash
pnpm install                # ignore-scripts=true; sharp/esbuild use prebuilt optional deps
cp .env.example .env.local  # leave NEXT_PUBLIC_SITE_URL empty locally (site is noindex)
pnpm assets                 # resources/ -> public/ (logos, photos, badges, hero crops)
bash scripts/subset-fonts.sh # licensed fonts -> public/fonts (subset)
pnpm dev                    # http://localhost:3004
```

First time only: `pnpm exec playwright install chromium webkit`, `uv tool install prek`,
`prek install`.

## Gates (all must be green, zero warnings)

`pnpm typecheck` · `pnpm lint` · `pnpm format:check` · `pnpm check:rtl` · `pnpm test` ·
`pnpm build` · `pnpm e2e` (against the built app on :3004) · `pnpm lhci`
(set `NEXT_PUBLIC_SITE_URL=https://b7r.sa` for the run so SEO can reach 100).

On Windows `pnpm lhci` completes the audit but chrome-launcher fails to delete its temp
profile (EPERM) and reports failure; use `bash scripts/dev/lh-all.sh` locally, which builds,
serves, warms the image cache and prints the same mobile scores. CI runs
`bash scripts/ci/lighthouse.sh` on Ubuntu: it starts the server, requests every audited page
and its image transforms once (ISR entries and the `next/image` cache warm, the steady state
production reaches after the first visitor), then runs `lhci autorun` with three runs.

CI runs on the pull request only (ADR-045). Merge with `bash scripts/merge-pr.sh <number>
[subject]` (`gh` signed in with access to the repository): it refuses a branch whose remote
head does not contain `origin/main` (merge `main` in, push, let the PR run again), waits for
every check on the head, prints them and refuses unless every one is a pass (a cancelled run
counts as not green), squash-merges with the subject given or the PR's title, deletes the
branch and pulls `main`. `gh workflow run ci.yml --ref main` runs `main` by hand.

## Local CMS (Phase 2a)

```bash
docker compose up -d        # Postgres 16 on :5435 (db/user/password b7r) + MinIO on :9000/:9001
pnpm migrate                # apply src/migrations to the database in DATABASE_URL
                            # rotating PAYLOAD_SECRET signs everyone out AND makes every
                            # provider key in Engine settings unreadable: re-enter them
                            # (content:migrate also seeds the blog: six hubs, the author, three posts)
pnpm content:migrate        # seed products, media, the globals (home included), faqs, testimonials, integrations (create-only, ADR-026)
pnpm admin:create           # first admin from ADMIN_EMAIL / ADMIN_PASSWORD (12+ chars, not breached)
pnpm dev                    # admin at http://localhost:3004/admin (Arabic, RTL)
```

`.env.local` needs `DATABASE_URL`, `PAYLOAD_SECRET` (any 32+ characters locally),
`PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3004` and the admin pair. Media goes to
`public/media/` (gitignored) unless the `S3_*` rows point at MinIO (bucket `b7r-media`,
public download; add `IMAGES_ALLOW_LOCAL_IP=1` so the image optimiser accepts the
localhost endpoint, never in production). `bash scripts/ci/seed-check.sh` runs the seed and admin scripts through
their three outcomes against a fresh database, the way CI does.

The designer's print areas (`printArea.canvas` on each product) are content: the seed writes
them once, and `--force` fills only what is empty, so a database seeded before 2026-09-14
keeps the older, smaller areas until the five products' canvas values are re-entered from
`src/content/seed/products.ts` (the admin's product form, "Print area").

Admin components (a new field type such as rich text, a custom view): run
`pnpm payload generate:importmap` and commit `src/app/(payload)/admin/importMap.js`, or the
admin logs `PayloadComponent not found in importMap` and the field renders empty.

Schema changes: edit the collection, then `pnpm migrate:create <name>` (writes an SQL
migration under `src/migrations/` and normalises its imports), `pnpm migrate`, commit both
the migration and `src/payload-types.ts`. Migrations must be **additive** (add columns and
tables, never drop or rename in the same release): the running image keeps serving on the
old schema until the new image starts (ADR-025). Drop the old column in a later release.

Publish → live (ADR-030): every page regenerates at most once a minute when requested; a
publish also regenerates the product's page, the home, the listing and the sitemap right
away, and a global change regenerates every static route. A product created in the admin
gets its page on first request (`dynamicParams = true`); keep it that way, a
`dynamicParams = false` route 404s after an on-demand revalidation in Next 16.

Password resets: no e-mail adapter is wired yet (Phase 2b candidate), so «نسيت كلمة المرور»
sends nothing. An admin resets a colleague's password from the user's document in `/admin`.

A local database created before 2026-09-13 ran an earlier initial migration; rebuild it once
with `pnpm payload migrate:fresh --force-accept-warning`, then seed and create the admin
again (move `public/media` aside first so filenames do not collide).

## Fonts

`public/fonts/*.woff2` are subsets of the licensed ITF Rayat Round files
(`bash scripts/subset-fonts.sh`, needs `uv`): Arabic, Basic Latin and punctuation only,
~27 kB per weight. Re-run after `resources/brand/fonts/web` changes. The files are served
`Cache-Control: immutable` for a year (ADR-039), so a changed woff2 must get a **new file
name** (a version suffix); never overwrite the same path, browsers will keep the old bytes.

## Docker

The build prerenders every page from the CMS, so it needs the database and the Payload secret
as BuildKit secrets (ADR-025); `NEXT_PUBLIC_*` and the storage location are build args:

```bash
DATABASE_URL=postgres://b7r:b7r@host.docker.internal:5435/b7r PAYLOAD_SECRET=… \
docker build -t b7r-website:local \
  --secret id=DATABASE_URL --secret id=PAYLOAD_SECRET \
  --build-arg PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000 .
docker run --rm -p 3000:3000 -e DATABASE_URL=… -e PAYLOAD_SECRET=… \
  -e PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000 b7r-website:local
curl http://localhost:3000/api/health   # {"ok":true,"version":"0.1.0","db":"ok","media":"local",…}
```

`docker build --secret id=NAME` reads the value from the environment variable of the same
name. Local uploads (`public/media`) are not copied into the image.

## Deploy (CranL)

GitHub push and the first CranL deploy wait for Dhia's approval (ADR-008). When enabled:

1. Provision on CranL: Postgres 16 (a database `b7r`, a user with DDL rights, TLS) and an
   S3-compatible bucket `b7r-media` with public read; note the values for the matrix below.
   Region Saudi Arabia; port 3000; health check `GET /api/health` (`ok` is the liveness
   signal; `db`, `media`, `newsletter`, `contact`, `turnstile`, `indexnow` are reported).
2. Image: `.github/workflows/deploy.yml` runs on every push to `main` and on demand. It
   migrates the production database (`scripts/ci/migrate.sh`: `pnpm migrate`, then
   `migrate:status` must list every migration file as ran, three attempts; the Payload CLI
   once exited 0 in CI without applying anything), builds the image with the database and
   secret as BuildKit secrets, and pushes `ghcr.io/diax7/b7r-sa-website:{sha,latest}`. Point
   CranL at that image (deploy on new tag / webhook). Secrets go in the GitHub `production`
   environment (`DATABASE_URL`, `PAYLOAD_SECRET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`);
   non-secret values are environment **variables** (`NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_UMAMI_*`,
   `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_PUBLIC_URL`).
   Until the two secrets exist the workflow ends with a notice and deploys nothing. The
   GitHub runner must reach the database (public endpoint with TLS, or an allow-list); the
   fallback is building on CranL from the `Dockerfile` with the same secrets. `payload` is a
   `serverExternalPackages` entry (ADR-033): the standalone trace copies it from
   `node_modules`, so a slimmer image must keep that directory.
   Release order: migrate (the workflow does it) → new image starts → old image stops;
   migrations are additive so both images run on the schema (ADR-025).
3. Runtime environment: every row of the matrix below; the same `NEXT_PUBLIC_*` values as
   the build args. First deploy only: `pnpm content:migrate` and `pnpm admin:create` against
   the production database from a machine with the secrets (ADR-026), then sign in at
   `/admin` and change the password. A database seeded before 2b already holds products and
   the three settings globals, so the first 2b deploy runs `pnpm content:migrate --force`:
   it adds only what is missing (home, faqs, testimonials, integrations, the hero and step
   media) and never overwrites a document.
4. Set `B7R_RUNTIME=production` **only in the CranL production app**. `instrumentation.ts`
   then asserts the BRD 8.5 + 9.2 required set at server start and throws if anything is
   missing, so the container fails its health check and CranL keeps the previous image
   (ADR-021). Never set it in CI or previews.
5. Confirm the platform proxy sets `x-forwarded-for` (`curl -sI` from outside and read it
   back from a debug log line, or check the platform docs). The API rate limiters key on the
   last hop of that header; if it never arrives every visitor shares the `unknown` key and the
   sixth signup or message in ten minutes site-wide is refused.
6. HSTS carries `preload`. Submitting `b7r.sa` to the preload list commits every future
   `*.b7r.sa` subdomain to HTTPS; do that only once every subdomain (app, umami, …) serves TLS.
7. CDN / proxy rule: cache `/_next/static/*` and `/_next/image*` freely; never cache `/admin*`
   or `/api/*` (they answer `Cache-Control: private, no-store`); pages carry Next's own
   `s-maxage=60, stale-while-revalidate` and may be cached at the edge on those terms.
8. Rollback: redeploy the previous image from CranL's deployment list. The database is
   shared and migrations are additive, so the previous image runs on the current schema.

### Environment matrix

| Variable | Where | Value |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | prod only | `https://b7r.sa` (anything else = noindex + `Disallow: /`) |
| `NEXT_PUBLIC_APP_URL` | all | `https://b7r.app` |
| `NEXT_PUBLIC_WHATSAPP` | all | `966501699572` |
| `NEXT_PUBLIC_GA_ID` | prod | `G-JPB02M7C49` (CI: `G-TEST00000`) |
| `NEXT_PUBLIC_UMAMI_SRC`, `NEXT_PUBLIC_UMAMI_ID` | prod | Umami script URL + website id (CI: the `/umami-test.js` recorder) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | prod | Cloudflare pair (CI/local: the public always-pass test site key, no secret) |
| `RESEND_API_KEY`, `RESEND_FROM`, `CONTACT_TO`, `RESEND_AUDIENCE_ID` | prod | Resend key, `بحر برنت <no-reply@b7r.sa>`, `contact@b7r.sa`, audience id |
| `BOOKING_URL` | prod, optional | Cal.com link; empty = WhatsApp fallback on the booking card |
| `INDEXNOW_KEY` | prod | 8–128 chars `[a-zA-Z0-9-]`; served at `/indexnow/{key}.txt` |
| `GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION` | prod | verification tokens → `<meta>` tags |
| `B7R_RUNTIME` | prod only | `production` (turns on the startup assertion) |
| `NEWSLETTER_TRANSPORT`, `CONTACT_TRANSPORT` | CI/local only | `mock`; refused in production |
| `DATABASE_URL` | all | Postgres connection string (build **and** runtime) |
| `PAYLOAD_SECRET` | all | 32+ random characters; signs admin sessions (rotating it signs everyone out) |
| `PAYLOAD_PUBLIC_SERVER_URL` | all | `https://b7r.sa` in production (same origin as the site); `http://localhost:3004` locally and in CI |
| `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_PUBLIC_URL` | prod (+ local MinIO) | bucket, region (`auto` for MinIO/R2), API endpoint, public base URL of objects |
| `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | prod (+ local MinIO) | credentials with read/write on the bucket |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | one-off | `pnpm admin:create` on an empty users table; the e2e admin suite signs in with the pair |

### Cutover (BRD 12.4 items 13–18)

Keep WordPress on Hostinger until Dhia approves. Then: point `b7r.sa` A/CNAME at CranL,
`www` → apex 308 at the host, TLS valid; verify a redirect from `docs/brd-sections` §5.2 and a
410 from outside; keep Hostinger 14 days. Same day: Search Console domain property, sitemap
submitted, "Search generative AI control" on Include, request indexing for `/`; Bing Webmaster
Tools verified + sitemap; run `scripts/indexnow.ts` (see below) for the full URL list; crawl
with a link checker (zero 404s, zero mixed content); Rich Results Test on `/`, a product and
a post. `docs/LAUNCH-CHECKLIST.md` tracks the owner of every item.

## Legacy redirects

Old URLs with a trailing slash take two hops (`/showcase/` → 308 `/showcase` → 301
`/products`): the first is Next's own trailing-slash redirect. Single-hop would need
`skipTrailingSlashRedirect` plus explicit slash sources in `src/lib/redirects.ts`; not worth it
unless Dhia asks.

Admin redirects (Settings → التحويلات, admins only, ADR-032): one lowercase segment as the
source (`/old-name`), a page or a path/`https:` URL as the target, 301 or 302. A row added
in the admin answers 308 (301) or 307 (302) from `/[slug]` within a minute. The BRD §5.2 map
(`/showcase`, `/terms-conditions`, `/privacy-policy`, `/home-2`, `/en/*`) lives in
`src/lib/redirects.ts` and `next.config` only; the site refuses an admin source that is one
of its own routes and any loop.

## Jobs (scheduled publish, IndexNow)

The queue runs inside the app on a one-minute cron from the first request after a boot
(`/api/health` → `jobs: on`); `/api/payload/payload-jobs/run` answers 403 to everyone by
design. A scheduled publish is applied by the cron and the page regenerates on the 60 s
timer (the hook logs one `revalidatePath … skipped outside a request` line at info). Failed
jobs stay in the `payload-jobs` table with their error and show as `jobsFailed` in
`/api/health`; clear one with `DELETE /api/payload/payload-jobs/<id>` as an admin after
reading its `error`; completed ones are deleted.

To rehearse a scheduled publish locally: create a draft page in the admin, open its
«Schedule publish» drawer and pick a time a minute ahead (or, from a script,
`payload.jobs.queue({ task: 'schedulePublish', waitUntil, input: { type: 'publish', doc: { relationTo: 'pages', value: id } } })`);
within the next minute the log shows `Running 1 jobs.`, the document is published, and the
page answers 200 within a minute more.

## IndexNow

A publish in the admin queues an `indexnow-ping` job with the regenerated URLs (three
retries, exponential backoff), only when `B7R_RUNTIME=production` and `INDEXNOW_KEY` are
set, so CI and previews never ping (ADR-033). For the deploy-time submission:
`scripts/indexnow.ts <before.xml> <after.xml>` diffs two sitemap snapshots and POSTs the
changed URLs with `keyLocation = https://b7r.sa/indexnow/{key}.txt`. It exits 0 without a
request when `NEXT_PUBLIC_SITE_URL` or `INDEXNOW_KEY` is unset. Intended GitHub Actions step
on `main` once CranL deploys from it: fetch the live `sitemap.xml` before the deploy, poll
`/api/health` until `version` matches `package.json`, fetch it again, run the script. Until
then it is a manual step.

## Preview (draft mode)

«معاينة» on a page, a product or the home page opens `/api/preview?path=…&token=…`: a link
signed for one hour with the Payload secret (ADR-039). It turns on Next draft mode for that
browser, so the site shows the latest drafts (a bar at the top says so) until «خروج من
المعاينة» or `/api/preview/exit`. The link is a bearer: anyone holding it sees drafts for an
hour. Public pages are unaffected; they stay cached and published-only.

## Admin login gate (Turnstile)

With `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` set, the login page runs
the challenge on load and `/api/turnstile/login` sets a ten-minute gate cookie; a login
without it answers 401 «أكمل التحقق من أنك لست روبوتاً» (ADR-034). Without the secret the
gate is open and the boot log says so once. If the widget fails (script blocked), refresh
the page; the gate never sends the visitor to Cloudflare's servers from the login itself.

## Password reset (admin)

With `RESEND_API_KEY` + `RESEND_FROM` the «نسيت كلمة المرور» link sends the Arabic reset
e-mail through Resend (`/api/health` → `email: resend`). Without them (`email: console`) the
message is printed in the app log: read the `/admin/reset/<token>` link there, or set a new
password from a machine with the secrets: `pnpm payload …` is not needed, the
`admin:create` script only creates the first admin; use the admin UI as another admin
(Users → the account → new password).

## Backups and restore

Weekly, `.github/workflows/backup.yml` (Sundays 03:00 UTC, or «Run workflow») runs
`scripts/backup.sh`: `pg_dump --format=custom` → `s3://$BACKUP_S3_BUCKET/YYYY-MM-DD.dump`.
The bucket is **private** with its own key pair (put + list only); never the media bucket
, the script refuses it. Retention: a lifecycle rule on the bucket, e.g.
`mc ilm rule add --expire-days 30 cranl/b7r-backups` (or the provider's console). Set the
five `BACKUP_S3_*` secrets in the `production` environment; until then the workflow ends
with a notice.

Restore into a scratch database (the CI rehearsal `scripts/ci/restore-check.sh` does the
same on every run):

```bash
aws --endpoint-url "$BACKUP_S3_ENDPOINT" s3 cp "s3://$BACKUP_S3_BUCKET/2026-09-13.dump" ./backup.dump
psql "$ADMIN_URL" -c 'CREATE DATABASE b7r_restore;'
pg_restore --no-owner --no-privileges --dbname "$SCRATCH_URL" ./backup.dump
psql "$SCRATCH_URL" -c 'select count(*) from pages;'   # 7 or more
```

To restore production itself: stop the app, restore into a fresh database the same way,
point `DATABASE_URL` at it, run `pnpm migrate` (no-op when the dump is current), start the
app. Media lives in the S3 bucket and is not part of the dump.

## Contact form

`POST /api/contact` order: JSON + same origin → validation → honeypot (200) → rate limit
5/10 min/IP → Turnstile `siteverify` when `TURNSTILE_SECRET_KEY` is set → Resend
`emails.send` to `CONTACT_TO` with `replyTo` = the sender. `CONTACT_TRANSPORT=mock` (tests
only, refused with a key) keeps messages in memory. Message bodies are never logged.

## Open Graph images

`pnpm og` re-renders `public/og/default.png` and `public/og/products/*.png` with Playwright
(ADR-020); `pnpm og --locale en` renders the English set into `public/og/en/` (ADR-043).
Both read the CMS when `DATABASE_URL` is set (the live catalogue and tagline), else the
seed fixtures. Run both after a product or tagline change and commit the PNGs;
`tests/og-images.test.ts` fails when a product has no image. A product added in the admin
has no OG image until this runs: the page falls back to the language's default image.

## Lighthouse

`pnpm lhci` runs the five BRD 8.7 URLs on Ubuntu CI. On Windows use
`bash scripts/dev/lh-all.sh` (builds with the production origin, warms the `next/image` cache,
prints the four scores per URL). Expect ±3 points around the 0.9 performance threshold on `/`
and the product pages: the simulated LCP floor is the React runtime (ADR-014), and the first
transform of each image costs a point on a cold server.

## Video poster

`public/video/printer-marketing-poster.jpg` is the BRD 6.4.5 fallback still (the DTG printer
stock photo) because ffmpeg is not available in this environment. To use a real frame later:
`ffmpeg -ss 00:00:03 -i resources/video/printer-marketing.mp4 -frames:v 1 -q:v 3 poster.jpg`,
then replace the file and re-run `pnpm assets`.

## Newsletter (Resend)

`RESEND_API_KEY` + `RESEND_AUDIENCE_ID` enable the live transport (`/api/health` →
`newsletter: live`). The BRD names Resend audiences; Resend has since introduced segments and
kept `audienceId` as a supported legacy option, migrate to `segments: [{ id }]` when the
account moves. Without a key the endpoint answers `503 not_configured` and the form shows the
retry copy; `NEWSLETTER_TRANSPORT=mock` (tests only) keeps subscriptions in memory.

## Analytics

`NEXT_PUBLIC_GA_ID` turns on the consent card and GA4 (after «موافق»); `NEXT_PUBLIC_UMAMI_SRC` +
`NEXT_PUBLIC_UMAMI_ID` load Umami on every page. Local previews and CI point Umami at
`/umami-test.js`, a recorder that never sends anything.

## The visibility score (ADR-049)

- **Where.** Visibility → Visibility score (`/admin/visibility`), admins; the same number on
  the dashboard card. "Recompute" re-reads everything now (the page keeps a reading for a
  minute).
- **Reading it.** Six sections, each with a bar and its items in the order next, missing, done.
  An item over documents says "4 of 5" and lists what is left, each a link into the field in
  the language that is missing. "The site guarantees" under a section lists what cannot be
  wrong by construction; it earns no points. The footer says how the two numbers are made.
- **Two numbers.** The overall counts the outside signals (PageSpeed, the verifications, the
  assistants); "What you control" counts only the items that need no service. A filled site
  with no service connected reads about 70; until the GEO content ships (FAQPage schema, a
  compare page) the ceiling is 93.
- **On the review server** the site URL is not `https://b7r.sa`, so "the production address"
  reads missing with the reason (every page is noindex there, on purpose).
- **The checklist.** Visibility → Off-site checklist: five boxes for the work outside the
  site (LinkedIn company and founder, YouTube, X, a first third-party mention), each with what
  counts. Tick a box once the thing exists; the score moves at once.
- **Changing a weight or a threshold.** One line in `src/modules/visibility/rules/weights.ts`
  (the table ADR-049 quotes); the unit test holds the sums.
- **Connecting Search Console.** Google Cloud console → a project → IAM → Service accounts →
  Create (any name) → Keys → Add key → JSON: a file downloads once. Search Console → the
  `b7r.sa` domain property → Settings → Users and permissions → Add user: the account's
  e-mail (`…@…iam.gserviceaccount.com`), Full. Then Admin → Connections → Create: the service
  "Google Search Console", paste the whole file into Key, Save, Test. The Test lists the
  account's properties and checks ours is among them; the key reads back as `••••@…`, the
  account's e-mail tail. Enable the Search Console API on the project if the Test says 403.
- **Connecting Bing.** Bing Webmaster Tools → Settings → API access → generate the key
  (the site must be verified there first; import it from Search Console in one click). Admin
  → Connections → Create: "Bing Webmaster Tools", the key, Save, Test (lists the key's sites).
- **Connecting PageSpeed.** Admin → Connections → Create: "PageSpeed Insights", no key needed
  (the public quota is a few hundred runs a day; the pull uses ten). A key from Google Cloud
  (APIs → PageSpeed Insights API → Credentials) lifts the quota. Test runs one mobile audit of
  the home page and takes up to a minute and a half.
- **The pull.** Every night at 04:00 Riyadh the `ai` queue pulls each connected service and
  writes one snapshot row per source for the day, then the day's score; a second pull the
  same day replaces the day's rows. "Pull now" on the Score page queues it once (one per ten
  minutes); `pnpm visibility:pull` runs it from a shell and exits 1 when a service failed
  (`--check` runs it twice and proves the replacement, the CI integration check). The rows sit
  under the Score page as "Snapshots" (read-only). A service that fails writes no row and is
  named once in the log; the page keeps the last good snapshot with its date.
- **The topics it suggests.** Search Console's queries with fifty impressions or more that do
  not name the brand become backlog topics (`source: searchConsole`) for the engine to write,
  one per keyword, under the hub whose name and description share the most words.
- **The citation ledger.** Visibility → Prompts holds the questions a buyer asks an
  assistant (fifteen seeded; add, edit or switch off; a prompt that names the brand is
  ticked "Names the brand" and stays out of the rate). Every Monday at 07:00 Riyadh, every
  enabled AI connection under Admin → Connections is asked every enabled prompt with the
  vendor's web search on (OpenAI, Anthropic, Google; DeepSeek and a compatible endpoint are
  asked plain), and the Score page's ledger shows who named B7R, who linked, and the
  competitors named most; the rows sit under the page as Citations. "Run now" on the page
  starts a batch (one per ten minutes; a connection asked within the hour is skipped).
- **What it costs.** An estimate: fifteen prompts on one engine is about 15 × 1,500 output
  tokens plus the vendor's search fee (OpenAI and Anthropic $0.01 a search, Google $0.035),
  so $0.30 to $0.80 a week per engine, $2 to $4 for five. Each connection's monthly limit
  guards it; the engine's daily cost cap does not count it (that cap guards the writing).
  One `citation` run per connection per week lands in Blog → Runs with the cost.
- **Reading a red row.** A prompt no engine names B7R on carries "improve the answer block
  of" with a link to the page or post whose title is closest: make its opening paragraph
  answer that question in 40 to 80 words (E3), and let the next Monday tell.
- **A wrong batch.** Citations can be deleted by an admin (a test connection, a mis-set
  model): the rows leave the four-week window the score reads; the prompts stay. A batch
  that died mid-way (the container restarted) leaves a `running` run in Blog → Runs and
  keeps its connection out of the ledger for an hour; delete the run to ask again sooner.

## Traffic sources (ADR-048)

- **What it is.** The site's own count of where visitors come from and what the AI crawlers
  read. Visibility → Traffic is the page: pick 7, 30 or 90 days; the channels with their
  share, the top sources, the landing pages with the channel that brings most, and the
  crawlers with what they read most; the rows themselves sit under it as "Counts". The
  dashboard carries a "Traffic, last 7 days" card (admins). Nothing needs configuring: the
  beacon and the crawler count are on in every environment.
- **Reading it.** A landing's source is the referring site folded (`chatgpt.com`,
  `google.com`, `instagram.com`), a UTM token, or `direct`; the channel and its group (AI
  assistants, search, social, other sites, direct) are derived from the source when the card
  or the page reads it. A crawl's source is the bot (`gptbot`, `claudebot`, `googlebot`).
- **What it cannot know.** Google's AI Overviews and AI Mode arrive with a Google referrer
  and read as Google. The native apps (ChatGPT's, in-app browsers) send no referrer and
  count as direct. A page reached from a bookmark or a typed address is direct too.
- **Spikes.** A public counter can be fed: sixty landings a minute per address, so a spike of
  `referral` from one host you have never heard of is referrer spam, not visitors; ignore it,
  there is nothing to block. Crawl rows cannot be forged from outside (the proxy signs its
  reports).
- **The review server and CI.** The e2e lands on pages like a visitor, so the review
  server's direct and ChatGPT counts include the suite's page loads. The batcher writes every
  ten seconds: a row appears within that.
- **Adding a channel or a bot.** One line in `src/modules/traffic/channels.ts` (a host and
  its channel, or a UTM token and its host) or `src/lib/traffic/bots.ts` (the user-agent
  token, its family and role); the history re-buckets itself because the channel is derived
  at read. A bot named in `robots.txt` (C-08) must be in the table: a test says so.

## Known audit exceptions

`extract-zip <= 2.0.1` (GHSA-jmr9-qjv8-65gv, GHSA-7pqw-9j4j-h8q3) via
`@lhci/cli > lighthouse > puppeteer-core`. Dev-only, never in the image; the advisory names
`>= 2.0.2` as patched but it is not published. Ignored in `pnpm-workspace.yaml`; remove the
ignore when 2.0.2 ships.


## The content engine (BRD 10.2, ADR-042, ADR-047)

- **Keys.** Admin → Connections → Create: a name, the service (OpenAI, Anthropic, Google,
  DeepSeek, or "OpenAI-compatible endpoint" with the service's `https://` address for any
  other AI that serves the OpenAI API), the key, the model id (empty: the service's usual
  one), the two rates from its pricing page (empty: the published ones), a monthly limit in
  USD if you want one. Save, then press "Test connection": one short call through the stored
  key; the answer shows beside the button and is recorded on the row (last test, passed,
  what the service said). The key is stored encrypted and reads back as a mask; leave the
  mask to keep it, clear the field to remove it. Then Blog → Engine settings → Cadence →
  Connection: pick it.
- **The limit.** Each connection's "Spent this month" and "Runs this month" are read from
  the runs log (from the 1st, Riyadh time); a run is refused once the spend reaches the
  connection's monthly limit, until next month. The daily cost cap stays in the engine
  settings: two guards, one per day for the engine and one per month per connection. A test
  never counts.
- **Off.** A connection's switch off refuses every engine run on it (the dashboard says
  "Connection off" in amber); the test still works. The engine's connection cannot be
  deleted: pick another first. With no connection picked the dashboard shows "No
  connection" in red and nothing runs.
- **Switching on.** Cadence → "Engine on". `AI_CONTENT_ENABLED=false` in the environment stops
  every run whatever the panel says (the kill switch outside the panel). While
  `reviewFirstRuns` is above zero, a live provider's posts land as drafts for a read.
- **Trying it.** Add a topic (or bulk-add from CSV), open it and press "Generate now": the
  run starts within a minute on the `ai` queue and shows in Runs with its steps, score and
  cost; the post appears under Blog → Posts. A refused manual run (switch off, a cap, no
  connection, the connection off or over its limit) writes a skipped run with the reason; a
  connection without a key fails the run at its first model call, with the reason.
- **When a run fails.** Runs → the row's error and step log say which step and why; the topic
  reads `failed` with the same reason and can be retried with "Generate now". A failure
  e-mail goes to the notification address when "Failure alerts" is on.
- **The mock.** `AI_CONTENT_MOCK=1` (never in production; the boot assert refuses it) lets a
  connection of the kind "Mock (tests only)" run: deterministic posts built from the facts
  sheet, no network. CI and the review server use it (`scripts/dev/engine-demo.mjs` and the
  e2e create the mock connection when there is none).

- **Day to day (3c).** The hourly tick queues one run when the Riyadh hour reaches the publish
  hour and no run started today; the dashboard card shows the next slot. Monday 06:00 Riyadh
  the freshness pass reads the ten oldest engine posts against the facts sheet and rewrites
  the ones whose numbers changed (same slug, same cover, `contentUpdatedAt` set); Sunday 08:00
  Riyadh the digest e-mail goes out and runs older than a year are deleted. All three are
  Payload schedules on the in-process runner: nothing to call from outside. Crons are read on
  the runtime's UTC clock.
- **The review server.** `node scripts/dev/engine-demo.mjs run 5` writes five mock posts from
  the backlog (the daily cap's maximum; run it again the next day for more); `... clean`
  removes every engine post and run so the public e2e (which assumes the seed's three posts)
  passes again.
- **Going live.** Add the connection under Connections, test it, pick it in Engine settings,
  keep `reviewFirstRuns` at 3: the first three posts land as drafts for a read, then the
  engine publishes on its own. Watch the first digest and the connection's month.

## The admin's words (ADR-046)

Every field an editor sees carries a two-language sentence saying where it shows on the site
and what it does, then its limit or an example. They live in one map per entity
(`src/modules/cms/admin/descriptions/*.ts`; the engine's in
`src/modules/ai-content/descriptions.ts`), keyed by the field's path (`hero.slides.headline`,
`blocks.cards.items.title`), and reach the config through `describeFields()`. To change a
sentence, edit the map; to add a field, add its key (the config test fails until it exists
and refuses a key that names no field).

## The English site (Level 5, ADR-043)

The site is in English once `site-settings.brandName` and `site-settings.menu.ctaLabel` have English
values; `pnpm content:migrate` writes every English value after the Arabic documents (on a
database that already has content: `pnpm content:migrate --force`, which fills the missing
language and overwrites nothing). Until then every `/en` URL is a 404 (the bilingual
document), the Arabic header shows no switch and the build logs "The site is not in English
yet" for each English route it prerenders; the build itself succeeds. Order on a database
seeded before Level 5: deploy the image, run `pnpm content:migrate --force` against
production, then wait a minute (`revalidate`) or republish the site settings: `/en` answers
and the switch appears on its own.

Publishing a page in English: open the document, switch the locale to English in the panel's
locale control, fill the title and the rest, save. The page is on `/en/<slug>` and carries
hreflang to its Arabic twin once its English title is not empty; leave the title empty and
the page stays Arabic-only (no `/en` route, no pair). The same rule holds for products
(`name`), posts (`title`, from 5b), categories and authors (`name`). Media alt text has a
value per language; the Arabic one must be Arabic script.

Publishing a post in English (5b): the same document, the locale control on English; title,
excerpt, three takeaways and a body with two internal links (the same rules as Arabic, judged
on the English version when you publish from the English tab; publish the Arabic version from
the Arabic tab). Internal links typed as URLs go under `/en/` (`/en/products/hoodie`); a link
to a document resolves under `/en/` on its own. The sidebar's warnings and reading time are
the English version's. The post is on `/en/blog/<slug>`, in `/en/feed.xml` and paired with
its Arabic twin once its English title is not empty. Hubs (`categories`) and authors work the
same way (`name` decides). An Arabic-only post's switch sends the reader to `/en/blog`, an
Arabic-only product's to `/en/products` (ADR-044).

The English hero photos (ADR-044): each slide's two photos are per language, like its
headline. The seed ships mirrored copies of the Arabic placeholders (`public/images/hero-en/`,
made by `pnpm assets`), on which the printed wordmark reads backwards; replace them from the
home page's English tab (locale control on English, "Image (desktop 16:9)" and "Image (mobile
4:5)" on each slide) with photographs composed for the left-aligned copy: the product cluster
on the right, the calm area on the left. The overlay over the photo is "Fade over the photo"
under the slides: a switch and a colour, one setting for both languages. The proof chips are
zero to six; a chip's rows are shared by both languages and its text is per language, so a
chip added on the Arabic tab shows in English once its English text is written.

The engine in English (5c): a topic's `language` decides the post's language; the English
backlog is seeded beside the Arabic one, and a CSV import takes `language` as its seventh
column (`ar` by default): `title,hub,primaryKeyword,secondaryKeywords,intent,priority,language`,
for example `Connect a Shopify store,salla-zid-shopify,Shopify print on demand,,commercial,4,en`. Engine settings, "Language and style": switch the panel's locale
to edit the English style guide, system prompt, banned phrases and banned claims (the code
defaults show until you save your own). The facts sheet tab shows both languages. On the review server
`node scripts/dev/engine-demo.mjs run 1 en` writes one English post with the mock;
`... clean` removes it. `/llms.txt` and `/en/llms.txt` are generated from the CMS and
regenerate with the listings on publish; nothing to maintain by hand.

Interface strings (labels, buttons, validation, SEO templates) live in the code:
`src/content/copy/ar.ts` and `en.ts`. After editing the English bank run `pnpm copy:appendix`
(regenerates BRD Appendix I), then rebuild the BRD.
