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
profile (EPERM) and reports failure; use `bash scripts/dev/lh.sh` locally, which builds,
serves and prints the same mobile scores. CI runs `pnpm lhci` on Ubuntu.

## Fonts

`public/fonts/*.woff2` are subsets of the licensed ITF Rayat Round files
(`bash scripts/subset-fonts.sh`, needs `uv`): Arabic, Basic Latin and punctuation only,
~27 kB per weight. Re-run after `resources/brand/fonts/web` changes.

## Docker

```bash
docker build -t b7r-website:local .
docker run --rm -p 3000:3000 b7r-website:local
curl http://localhost:3000/api/health   # {"ok":true,"version":"0.1.0","time":"…"}
```

Runtime env: `NEXT_PUBLIC_*` values are inlined at build (pass them as `--build-arg`).

## Deploy (CranL)

GitHub push and the first CranL deploy wait for Dhia's approval (ADR-008). When enabled:

1. Connect the repo; build from the `Dockerfile`; region Saudi Arabia; port 3000; health
   check `GET /api/health` (returns `ok`, `version`, and `newsletter | contact | turnstile |
   indexnow` states).
2. Environment: every row of the matrix below. `NEXT_PUBLIC_*` values are inlined at build,
   so pass them as build args as well as runtime env.
3. Set `B7R_RUNTIME=production` **only in the CranL production app**. `instrumentation.ts`
   then asserts the BRD 8.5 required set at server start and throws if anything is missing,
   so the container fails its health check and CranL keeps the previous image (ADR-021).
   Never set it in CI or previews.
4. Confirm the platform proxy sets `x-forwarded-for` (`curl -sI` from outside and read it
   back from a debug log line, or check the platform docs). The API rate limiters key on the
   last hop of that header; if it never arrives every visitor shares the `unknown` key and the
   sixth signup or message in ten minutes site-wide is refused.
5. HSTS carries `preload`. Submitting `b7r.sa` to the preload list commits every future
   `*.b7r.sa` subdomain to HTTPS; do that only once every subdomain (app, umami, …) serves TLS.
6. Rollback: redeploy the previous image from CranL's deployment list. Nothing is stateful in
   Level 1 (the rate limiters and mock transports are in memory).

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

## IndexNow

`scripts/indexnow.ts <before.xml> <after.xml>` diffs two sitemap snapshots and POSTs the
changed URLs with `keyLocation = https://b7r.sa/indexnow/{key}.txt`. It exits 0 without a
request when `NEXT_PUBLIC_SITE_URL` or `INDEXNOW_KEY` is unset. Intended GitHub Actions step
on `main` once CranL deploys from it: fetch the live `sitemap.xml` before the deploy, poll
`/api/health` until `version` matches `package.json`, fetch it again, run the script. Until
then it is a manual step.

## Contact form

`POST /api/contact` order: JSON + same origin → validation → honeypot (200) → rate limit
5/10 min/IP → Turnstile `siteverify` when `TURNSTILE_SECRET_KEY` is set → Resend
`emails.send` to `CONTACT_TO` with `replyTo` = the sender. `CONTACT_TRANSPORT=mock` (tests
only, refused with a key) keeps messages in memory. Message bodies are never logged.

## Open Graph images

`pnpm og` re-renders `public/og/default.png` and `public/og/products/*.png` with Playwright
(ADR-020). Run it after a product or tagline change and commit the PNGs;
`tests/og-images.test.ts` fails when a product has no image.

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
kept `audienceId` as a supported legacy option — migrate to `segments: [{ id }]` when the
account moves. Without a key the endpoint answers `503 not_configured` and the form shows the
retry copy; `NEWSLETTER_TRANSPORT=mock` (tests only) keeps subscriptions in memory.

## Analytics

`NEXT_PUBLIC_GA_ID` turns on the consent card and GA4 (after «موافق»); `NEXT_PUBLIC_UMAMI_SRC` +
`NEXT_PUBLIC_UMAMI_ID` load Umami on every page. Local previews and CI point Umami at
`/umami-test.js`, a recorder that never sends anything.

## Known audit exceptions

`extract-zip <= 2.0.1` (GHSA-jmr9-qjv8-65gv, GHSA-7pqw-9j4j-h8q3) via
`@lhci/cli > lighthouse > puppeteer-core`. Dev-only, never in the image; the advisory names
`>= 2.0.2` as patched but it is not published. Ignored in `pnpm-workspace.yaml`; remove the
ignore when 2.0.2 ships.
