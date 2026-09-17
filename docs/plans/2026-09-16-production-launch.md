# Production launch: what must be true before b7r.sa moves to the new site

Written 2026-09-16 for Dhia. A study, not an action: nothing here has been provisioned,
changed or deployed. One environment only (production on CranL); no staging.

## 1. Are we ready?

**The code is.** Every merge to `main` passes the full CI (types, lint, 618 unit tests, the
seed, the build, the admin and site e2e on three browsers, Lighthouse, the S3 media job, the
CSP, the backup-restore rehearsal). The Docker image was built and smoke-tested on
2026-09-13 (338 MB; `/api/health`, the redirects, the 410s, the headers). The site, the
admin, the English site, the blog, the traffic page, the visibility score, the citation
ledger and the GEO content are all on `main` (PR #28 merges the last of it).

**The content mostly is.** The review database (the one at `localhost:3004`) holds what you
edited: 8 pages (the comparison published), 5 products, 16 FAQ entries, 3 posts (drafts),
33 media documents, the 22 prompts and the four connections. Still open on your side:
three real testimonials (the section stays hidden on b7r.sa while the three entries are
placeholders), the author's photo and profile link, the three post drafts to publish, and
«متاح الآن» for Zid and Shopify once the app has them.

**The infrastructure is not.** Nothing exists on CranL yet, and every account and key in
§4 is yours to create. One technical question must be answered on CranL before anything
else (§2, D3), because the build needs the database.

Realistic timeline once you start: half a day of accounts and keys (you), one small PR
(me), one sitting together for the data (an hour), one rehearsal on CranL's temporary
domain, then the DNS change. Four calendar days is comfortable.

## 2. Three decisions to take first

**D1. Which database goes live: the review database, restored.** It carries your edits,
the published comparison, the posts, the prompts, the citations already collected and the
connections. A fresh seed would give a clean database and lose all of that. Before the
dump, the review database is cleaned (§5): the Mock connection and its citations, any
page or product the e2e left behind, the two failed jobs in `payload-jobs`.

**D2. A new `PAYLOAD_SECRET`, and the four keys re-entered.** The connections' keys are
encrypted with the secret (ADR-047): under a new secret the four rows read "unreadable"
until you paste the keys again (OpenAI, Gemini, Anthropic, the Search Console JSON), five
minutes of work. The alternative, carrying the local secret into production, keeps a
secret that has lived in `.env.local` on a laptop. New secret. The admin password changes
the same day for the same reason (the e2e signs in with the pair in `.env.local`).

**D3. Who builds the image: the platform, from the repository (done 2026-09-17).** The site
prerenders every page from the database at build time (ADR-025), so `next build` needs
`DATABASE_URL` and `PAYLOAD_SECRET`. CranL's documentation describes one path, an
application built **from the GitHub repository** with a Dockerfile, and so do Koyeb, Render
and Qovery; all of them hand the app's environment to the build. The Dockerfile now takes
the two values from a BuildKit secret when one is given and from a build arg otherwise,
migrates the database, then builds; it refuses to build with neither. Verified with a
build-arg build against the compose database. The GitHub workflow stays for a platform that
deploys a registry image instead. What remains on the platform: set the environment before
the first build, and use the database's external connection string (the builder must reach
it).

## 3. What the code needed before the first deploy (done 2026-09-17, one PR)

- The Dockerfile of D3; the RUNBOOK's "Deploy" section rewritten for a platform that builds
  from the repository; `deploy.yml` kept only for a platform that deploys images, its own
  migrate step gone (the build migrates); ADR-025 amended.
- `docs/LAUNCH-CHECKLIST.md` brought to 2026-09-17 (items 27 to 32).
- The hero beyond Full HD (ADR-051), Dhia's one design change before launch.
- An outsider's read of the API checked (item 31): nothing to fix.
- Not done, on purpose: a staging environment, CDN rules, GlitchTip, HSTS preload, the deep
  audit (later, when there is time and budget for it).

## 4. Accounts and keys (you; the technical set, ADR-052)

`B7R_RUNTIME=production` makes the server assert this set at start (ADR-021), so a missing
value is a failed health check, never a half-working site. `/api/health` reports each
integration's state. Everything else (the WhatsApp number, the contact address, the
analytics ids, the verification tokens, the booking link) is entered in the admin.

| What | Variable(s) | Where to get it | Health |
|---|---|---|---|
| Canonical origin | `NEXT_PUBLIC_SITE_URL`, `PAYLOAD_PUBLIC_SERVER_URL` = `https://b7r.sa` | n/a; anything else makes the site noindex | |
| Database | `DATABASE_URL` | the platform's Postgres (§5) | `db: ok` |
| Admin sessions and key encryption | `PAYLOAD_SECRET` | `openssl rand -base64 48`, generated once, stored only on the platform | |
| Media | `S3_BUCKET`, `S3_REGION` (`auto`), `S3_ENDPOINT`, `S3_PUBLIC_URL`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | the platform's bucket `b7r-media` with public read and its credentials | `media: s3` |
| E-mail (contact form, newsletter, password reset) | `RESEND_API_KEY`, `RESEND_AUDIENCE_ID` | resend.com: verify the domain `b7r.sa` (SPF, DKIM, DMARC records at your DNS host), create an audience | `contact: live`, `newsletter: live`, `email: resend` |
| Bot gate (forms, admin login) | `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Cloudflare dashboard → Turnstile → a widget for the hostname `b7r.sa` | `turnstile: on` |
| Production switch | `B7R_RUNTIME=production` | set only on the production app, never anywhere else | |

Never set in production: `AI_CONTENT_MOCK`, `NEWSLETTER_TRANSPORT`, `CONTACT_TRANSPORT`,
`IMAGES_ALLOW_LOCAL_IP` (the server refuses the first three anyway). `AI_CONTENT_ENABLED`
stays unset until Level 4 has your go; the engine is off in the settings today.

## 5. CranL (you, with the values above)

1. Project, region **Saudi Arabia** (or the nearest MENA region CranL offers).
2. Postgres 16, database `b7r`; note the connection string; confirm daily snapshots exist
   on the plan.
3. Bucket `b7r-media`, public read, credentials created once, the endpoint and the CDN or
   public URL noted (`S3_PUBLIC_URL`).
4. The application from `diax7/b7r-sa-website`, branch `main`, build type `Dockerfile`,
   port 3000, health check `GET /api/health`, **one instance** (the job queue runs inside
   the app on a one-minute cron; two instances would run every job twice).
5. The environment variables of §4 (`cranl apps env push` takes a `.env` file). The first
   build runs on CranL's temporary domain **without** `B7R_RUNTIME` and **without**
   `NEXT_PUBLIC_SITE_URL`: the site is then noindex by construction while we rehearse.
6. Custom domain `b7r.sa` with `www` redirecting to the apex and automatic TLS, added only
   at cutover (§7).

## 6. The data (one sitting, you and me, before the first real build)

1. Clean the review database: the Mock connection and its citations, e2e leftovers, the
   failed jobs; set a monthly limit on every AI connection (the Anthropic row has none).
2. `pg_dump --format=custom` of the review database → `pg_restore` into CranL Postgres;
   `pnpm migrate:status` there lists every migration as ran; the counts match (8 pages, 5
   products, 16 FAQ, 3 posts, 33 media, 22 prompts).
3. Media: copy `public/media/` (1,030 files: originals, sizes, OG) into the bucket under
   the `media/` prefix; the rows already carry `prefix = media`, so the URLs resolve on the
   bucket unchanged. Verify one image URL from a browser.
4. In the admin on the temporary domain: paste the four keys again (D2), change the admin
   password, create the editor account for the second person.

The first real build then prerenders from this database. A fresh seed
(`content:migrate`, `admin:create`) is the fallback if the restore fails, at the cost of
everything in D1.

## 7. Rehearsal, cutover, the same day after

**Rehearsal on the temporary domain** (all of it before DNS): `/api/health` shows every
integration live; `/`, `/en`, a product, the comparison, a post answer 200; `/showcase`
301, `/wp-admin` 410, `/nope` 404 (design); admin login shows the Turnstile widget; a
media upload lands in the bucket; the contact form reaches `contact@b7r.sa`; a newsletter
signup shows in the Resend audience; a publish regenerates its page within a minute; the
Traffic page reads Search Console; "Run now" on the ledger is **not** part of the rehearsal
(real spend); RTL on a real iPhone and Android once (the launch checklist's item 12).

**Cutover**: set `NEXT_PUBLIC_SITE_URL`, `PAYLOAD_PUBLIC_SERVER_URL` and `B7R_RUNTIME`,
redeploy (a rebuild: the origin is inlined), then DNS. Change **only** the `A`/`CNAME`
records for `b7r.sa` and `www`; keep every `MX` and `TXT` record (your mail and the domain
verifications live there). TLS valid; `www` → apex; from outside: one redirect from the
§5.2 list, one 410, the CSP header. Keep Hostinger 14 days, then cancel it.

**Same day**: Search Console (see the note below), sitemap `https://b7r.sa/sitemap.xml`
submitted, "request indexing" for `/`; Bing Webmaster Tools verified and the sitemap
submitted; `scripts/indexnow.ts` once with the full URL list; a link checker over the
live site (zero 404s, zero mixed content); Rich Results Test on `/`, a product, a post and
the FAQ page; GA4 DebugView shows the consent flow; an external uptime monitor on
`/api/health` (UptimeRobot or cron-job.org, every five minutes; CranL's own check restarts
the container, the external one tells you).

**Search Console and the WordPress site**: the property `https://b7r.sa/` is about the
URL, not the software behind it. The new site takes it over at cutover; the old pages'
history stays in the same reports and nothing conflicts. Put the property's HTML-tag token
in `GOOGLE_SITE_VERIFICATION` so verification survives WordPress; add a Domain property
`b7r.sa` verified by a DNS TXT record (covers www, http and every subdomain) and add the
service account as a user on it too; remove the old WordPress sitemap entry from the
Sitemaps report once it 410s. Nothing to delete.

**First week**: watch the ledger's cost per engine and the connections' limits; set the
prompts' periods from what the first week shows; publish the three posts; the repo's
visibility is yours to flip back.

## 8. Out of scope, on purpose

A staging environment; a CDN zone; GlitchTip; HSTS preload; the AI engine's first post
(Level 4); the off-site kit (yours, by hand); OpenRouter (a broker resells the same
tokens plus its fee, and the cost here is search and tokens, not the API).
