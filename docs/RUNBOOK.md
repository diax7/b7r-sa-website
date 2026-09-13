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

## Deploy (CranL) — pending

Deferred until Dhia approves pushing to GitHub (ADR-008). When enabled: connect the repo,
Dockerfile build, region Saudi Arabia, env from `.env.example`, health check `GET /api/health`,
rollback = redeploy the previous image from CranL's deployment list.

Deploy checklist: confirm the platform proxy sets `x-forwarded-for` (`curl -sI` from outside
and read it back from a debug log line, or check the platform docs). The API rate limiters key
on the last hop of that header; if it never arrives every visitor shares the `unknown` key and
the sixth signup in ten minutes site-wide is refused.

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
