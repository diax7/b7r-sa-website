# Architecture decision records

One entry per non-obvious choice (constitution VIII). Newest at the bottom. Dates absolute.

## ADR-001: Adopt the BRD v1.0 as the single source of truth (2026-09-12)

`B7R-WEBSITE-MASTER-BRD.md` (copied to `docs/`) governs scope, copy, design tokens, stack, and
gates. When code, research, or this log disagree with it, the BRD wins and is amended through
`docs/brd-sections/` + `docs/build-brd.py`. The constitution in `.specify/memory/constitution.md`
restates its §8.9 principles as CI/review gates.

## ADR-002: Repository root is this folder; `resources/` stays in-repo (2026-09-12)

The BRD's tree shows a `b7r-website-v2/` root; Dhia's working folder *is* the repository, so the
app lives at the root. `resources/` (fonts, photos, logos) is the asset source of truth and is
committed; `scripts/prepare-assets.ts` derives `public/` from it. `resources/source-files/`
(PSDs, zips) is git-ignored.

## ADR-003: next-intl without i18n routing (2026-09-12)

Level 1 is Arabic-only at the root. `next-intl` is configured in "without routing" mode (a single
`getRequestConfig` returning `ar`; no middleware/proxy, no `[locale]` segment), which keeps
Arabic at `/` with zero runtime cost and gives UI microcopy a typed home (`messages/ar.json`).
The English phase adds routing with `localePrefix: 'as-needed'` and `/en`.

## ADR-004: TypeScript 5.9, Vitest 4.1 (2026-09-12)

TypeScript 7.0 (native port) shipped days before this project started and Next.js has not yet
declared support; the BRD says 5.x. Vitest 5.0.0 was one day old; 4.1.x is used. Both are
revisited when the ecosystem catches up.

## ADR-005: Footer newsletter form is rendered disabled in Phase 1a (2026-09-12)

`/api/newsletter` is Phase 1b scope. Rendering the form with a fake success would breach
constitution VI; hiding it would misrepresent the footer design at the Dhia gate. The form is
visually complete with the submit button `disabled`; 1b enables it.

## ADR-006: Hero LCP image: `<picture>` + two media-gated preloads (2026-09-12)

`next/image`'s `priority` emits a preload, but two `<Image>`s (desktop/mobile) hidden by CSS
would both be fetched. `getImageProps` builds a `<picture>` with one `<source>` per breakpoint
but emits no preload at all. The Hero server component therefore renders the `<picture>` and
two `<link rel="preload" as="image" imagesrcset … media=…>` elements (hoisted to `<head>` by
React 19); browsers honour `media` on preloads, so exactly one image is fetched and preloaded
per viewport. E2E asserts one hero image request per project.

## ADR-007: Sample design rendered with Playwright/Chromium (2026-09-12): retired

Pillow cannot shape Arabic without libraqm and sharp's SVG text depends on system fonts. The
`scripts/generate-sample-design.ts` script rendered «تصميمك هنا» in ITF Rayat Round Bold through
headless Chromium (already a dev dependency for e2e) to a transparent 1200 × 600 PNG, committed
to `public/designs/sample-tasmeemak.png`. Retired 2026-09-13 with the sample link (ADR-036
amendment): script, PNG and `assets:sample-design` removed.

## ADR-008: CranL deploy deferred; Docker image verified locally (2026-09-12)

Dhia asked that nothing be pushed to GitHub until the Phase 1a design is approved. CranL deploys
from GitHub, so the "first CranL deploy" item of §12.2 waits for that approval. The Dockerfile is
built and smoke-tested locally (`GET /api/health`) instead.

## ADR-009: `motion` deferred to Phase 1b (2026-09-12)

Phase 1a's only use would be `useReducedMotion`; a 20-line hook in `lib/reduced-motion.ts`
covers it and keeps the home-page JS budget (§7.8) untouched. 1b adds `motion` for the
scroll-driven steps section, where the BRD calls for it.

## ADR-010: Subset fonts; preload Medium globally and Black on the home page (2026-09-13)

BRD 3.3 preloads Regular and Bold only and calls Black lazy. Measured: Medium (nav, buttons,
labels) and Black (the hero H1, the LCP element) are painted above the fold on every first
view, so both were fetched at highest priority anyway, one round trip later. Preloading them
and subsetting all five files (37 kB → 27 kB each; Arabic + Basic Latin + punctuation) moved
mobile Lighthouse Performance from 82 to 90 and LCP under DevTools throttling to 2.1 s. Bold
is not painted above the fold on `/` (H2s only), so it is no longer preloaded there; pages
whose H1 is Bold preload it themselves. BRD 3.3 and 7.8 amended accordingly.
Lighthouse's simulated LCP stays at 3.4–3.6 s (removing Bold from the preload set changed
nothing measurable) because Lantern charges every resource that starts before first paint,
all JS chunks included, to the LCP path. `lighthouserc.json` now asserts LCP ≤ 2.5 s and
CLS ≤ 0.1 as the constitution requires, so CI will be red on LCP until the simulated value
drops; tracked as a Phase 1b task (reduce initial JS: hero island slimming, no new eager
scripts). The category gate (Performance ≥ 90) and the DevTools-throttled LCP (2.1 s) pass.

Amended 2026-09-13 (ADR-039): `/fonts/*` is served immutable for a year, so a changed font
file takes a new name; the same path is never reused (RUNBOOK, fonts).

Amended 2026-09-23 (spec 010, ADR-065): the Rayat fallback's metrics were approximations
(size-adjust 104%, ascent 96%, descent 30%). Measured instead, from HarfBuzz-shaped widths of
the site's Arabic copy (85 percent) and a Latin line (15 percent) against Segoe UI and the
face's own ascent and descent, they are 87.3%, 104.2% and 60.5%. With the font files held back
800 ms so the page paints in the fallback first, home-page CLS was 0.094 with the old values,
0.006 under the budget, and is 0.0003 with the measured ones (`e2e/appearance.spec.ts` records
the value per family). The three curated alternates' fallbacks are measured the same way. No
font file changed: the fallback is a `local()` face in `tokens.css`.

## ADR-011: Mobile menu sheet loads on first intent (2026-09-13)

The Radix Dialog (focus trap, scroll lock, portal) costs ~15 kB gzip and is used only after a
tap on the burger. The burger itself is a plain server-rendered button; the sheet chunk is
fetched on pointer/touch/focus and mounted open on click. Keeps the home page's initial JS
under the 180 kB budget with headroom for Phase 1b's widgets.

## ADR-012: Scroll-driven steps without `motion` (2026-09-13)

BRD §8.1 listed `motion` for the steps and reveals. The steps section needs one number
(scroll progress → active step) and CSS does the rest; a 1 kB rAF hook attached only while
the section intersects does that, and the list layout is the default CSS so no-JS, reduced
motion and phones share one branch. `motion` stays out of the bundle; §8.1 amended.

## ADR-013: Testimonials "production" = production host (2026-09-13)

BRD §6.4.7 said `NODE_ENV=production` on `main`. A CranL preview build is also
`NODE_ENV=production` and must still show the «نموذج» cards for review, and the app cannot know
its branch at runtime. The rule now keys on `NEXT_PUBLIC_SITE_URL === https://b7r.sa`, the same
signal that gates noindex. Verified: the production-origin build serves zero `data-placeholder`.

## ADR-014: Simulated LCP: measured floor (2026-09-13)

Time-boxed investigation on `/` with every 1b section and analytics enabled. Lighthouse mobile
(simulated): Performance 91, FCP 1.1 s, LCP 3.4 s, CLS 0, TBT 50 ms. DevTools throttling:
LCP 2.1 s. Lighthouse's `largest-contentful-paint-element` audit reports *not applicable*
for this page, so Lantern's estimate is not attributable to one element; it charges every
resource started before first paint (four font weights ≈ 87 kB, hero image 12 kB, first-paint
JS 176 kB of which 117 kB is React + the Next runtime) to the LCP path. What moved the needle
this phase: tighter font subsets (27 → 21.7 kB per weight, Arabic features only), preloading the
weights the document actually renders (Regular, Medium, Bold everywhere; Black on `/`), a 198 px
`sizes` on the header logo (12 → 3 kB), and keeping every island (accordion, video, widget,
consent, GA loader) out of the first-paint JS via client-side `dynamic(..., { ssr:false })`.
What did not: dropping Bold from the preload set (browsers fetch a weight as soon as any text
in the document uses it; the H2s below the fold need Bold). The remaining floor is the React
runtime. Phase 1c amendment: the LCP ≤ 2.5 s assertion is `warn` in `lighthouserc.json` (the
threshold stays), because a permanently red step would hide an accessibility or SEO regression
under the same red; every other assertion stays `error`. Re-arm condition: flip it back to
`error` the first time any CI run measures ≤ 2.5 s, or when Dhia renegotiates the threshold.

## ADR-015: Newsletter mock transport for tests (2026-09-13)

`NEWSLETTER_TRANSPORT=mock` swaps Resend for an in-memory set so the success path is e2e
tested without a key. The mock is honoured only while `RESEND_API_KEY` is unset, and
`GET /api/health` reports `newsletter: live | mock | off`, so a mocked production cannot go
unnoticed. Not keyed on `NODE_ENV` or the site origin because CI's e2e runs the production
build with the production origin.

## ADR-016: CSP without nonces (2026-09-13)

Every public page is static, so a per-response nonce is impossible without dynamic rendering,
and a nonce next to `'unsafe-inline'` would switch the latter off in CSP3 browsers and break
the inline script gtag injects. The policy in `src/lib/security-headers.ts` keeps
`'unsafe-inline'` for scripts (as BRD 8.10 already listed) and adds `style-src 'self'
'unsafe-inline'` (BRD 8.10 omitted it, which would have blocked every `next/image fill`
element) plus `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors
'none'`. `e2e/csp.spec.ts` records `securitypolicyviolation` events across the flows that
touch inline styles, blob images and the third-party scripts, with a positive control so a
green run is proof. BRD 8.10 amended.

## ADR-017: 410s from `src/proxy.ts` (2026-09-13)

`next.config` redirects cannot emit 410, so the retired WordPress URLs (BRD 5.2) are answered
by the Next 16 proxy with a static Arabic body (`src/lib/gone-page.ts`, `noindex`, cached a
day). The matcher is limited to those patterns so pages and `_next/static` never pass through
it; `src/lib/redirects.ts` holds the same list as data and a unit test keeps the two equal.
Renames use explicit `statusCode: 301` (Next's `permanent` flag would emit 308); the
trailing-slash 308 stays Next's, so `/about/` reaches `/about` in one hop and `/showcase/` in
two (308 then 301). `/en` and `/en/*` answer 302 until English exists.

## ADR-018: Sample blog bodies authored by the agent (2026-09-13)

BRD 4.13 asks for three placeholder posts with short bodies written by the agent. They were
written with the `ux-araby` rules under BRD 4.1 (فصحى مبسطة, no تم/قم بـ, Western digits),
with facts from BRD 1.1 only (prices, five products, 30 SAR credit, 5-day delivery, Jeddah),
marked `sample: true`, and listed in Appendix G for Dhia's review. Level 3 replaces them.

## ADR-019: Turnstile is optional until the keys exist (2026-09-13)

Without `NEXT_PUBLIC_TURNSTILE_SITE_KEY` the contact form renders no widget; without
`TURNSTILE_SECRET_KEY` the API skips verification and `/api/health` reports `turnstile: off`.
The token is obtained with `turnstile.execute()` at submit time (tokens expire after ~300 s;
a long message must never post a stale one) and the widget is `interaction-only`, so the
container stays empty unless Cloudflare needs the visitor to act. The API verifies after the
rate limiter so nobody can drive unbounded `siteverify` calls. Tests use Cloudflare's public
always-pass site key and a Playwright route that serves a stand-in for the widget script.

## ADR-020: Open Graph images are static PNGs rendered by Playwright (2026-09-13)

Satori (`next/og`) does not shape Arabic (no joining forms), and `ImageResponse` would drag
its WASM bundle into the standalone image for six pictures that change only with the product
list or the tagline. `scripts/build-og.ts` (`pnpm og`) renders an HTML template with the
self-hosted ITF Rayat Round files through Playwright at 1200×630 and commits the PNGs under
`public/og/`; `tests/og-images.test.ts` asserts one exists per product at the right size.
Product pages emit `og:type website` (Next's typed metadata has no `product` type and the
previews read title, description and image only); the `Product` JSON-LD carries the commerce
data. BRD 7.3 amended.

## ADR-021: Production env contract asserted at server start under `B7R_RUNTIME` (2026-09-13)

CI builds and serves with the production origin (for the noindex and Lighthouse SEO checks),
so a required-variable check keyed on `NEXT_PUBLIC_SITE_URL` would turn CI red. The BRD 8.5
"required in prod" set is asserted by `assertProductionEnv()` from `instrumentation.ts`
`register()` (at server start, not at build) and only when `B7R_RUNTIME=production`, a
variable set solely in the CranL app. It throws, so a misconfigured deploy fails its health
check and CranL keeps the previous image. `/api/health` reports `newsletter`, `contact`,
`turnstile` and `indexnow` so a mocked or unconfigured production is visible.

## ADR-022: Mount-time events queue until a sink and the tracker exist (2026-09-13)

`product_view` fires in a page effect that runs before the analytics bridge registers its
sinks (children's effects run first) and before the Umami script has loaded. `track.ts` now
holds events until the first sink registers and replays them once; the Umami sink holds
events until `window.umami` exists (retrying for ten seconds). Without this the BRD 6.6
`product_view` event was silently dropped on every product page.

## ADR-023: Sample testimonials written by the agent, still placeholders (2026-09-13)

Dhia asked for three complete testimonial cards ("generate 3 ones"). They are written under
BRD 4.1 with facts from BRD 1.1 only (Salla link, delivery inside 5 days, shipping under the
merchant's brand, no stock) and replace the «اسم التاجر / اسم المتجر» stand-ins in
`src/content/testimonials.ts`. They keep `placeholder: true`: previews show them with the
«نموذج» badge and the production host omits the section (BRD 6.4.7, ADR-013), because they
are not the words of real merchants and BRD 3.14 forbids fake reviews. Publishing them on
b7r.sa is a one-line decision for Dhia (`placeholder: false`), recorded here so the choice is
explicit. The verbatim-copy test no longer covers `testimonials.ts`.

## ADR-024: The CMS is a module under two root layouts (2026-09-13)

Payload lives in `src/modules/cms/` (config, collections, globals, access, hooks) and is
mounted through `src/payload.config.ts` (`@payload-config`). The public site moved to the
`(site)` route group and the admin to `(payload)`, each with its own root layout: Payload's
admin needs its own `<html>` (theme attributes, its stylesheet) and must not inherit the site
shell, fonts or analytics. Because two root layouts leave Next no single layout to compose a
404 from, the 404 is `src/app/global-not-found.tsx` (`experimental.globalNotFound`), which
renders the whole document through `src/app/site-document.tsx`, the shell it shares with the
site layout. Public reads go through `src/lib/cms/*` (Local API, published Arabic documents
only, zod-parsed into the Level 1 content contract) so no page imports Payload directly.

## ADR-025: The build needs the database; the image is built in CI (2026-09-13)

Every page is prerendered from the CMS, so `next build` needs `DATABASE_URL` and
`PAYLOAD_SECRET`. The production image is therefore built by `.github/workflows/deploy.yml`
(migrate → build with BuildKit secrets → push `ghcr.io/diax7/b7r-sa-website`) and CranL
pulls it; building on CranL itself would need the same secrets at build time and is the
documented fallback. Migrations are SQL files under `src/migrations/` (`push: false`), run by
the workflow before the image is built and again by Payload at start-up (`prodMigrations`,
gated off during `next build`); they must stay additive so the running image keeps serving
while the schema moves.

Amended 2026-09-17 (the launch): the Dockerfile's build stage migrates the database itself
(`scripts/ci/migrate.sh`, then `next build`) and takes the database and the secret from a
BuildKit secret mount when one is given, else from a build arg, and refuses to build with
neither. So the image builds wherever a platform builds a Dockerfile from the repository and
hands the app's environment to the build (CranL, Koyeb, Render, Qovery), and the GitHub
workflow is only for a platform that deploys a registry image. A build arg is consumed in the
build stage only; the runner stage is assembled from that stage's files, so neither value
reaches the image that runs. The migrate step left the workflow: one place migrates. On
CranL itself the Dockerfile path is dead: its Dockerfile builds get no variables at all (the
build stopped on purpose with every value empty, 2026-09-17), while its Railpack builds
("Automatic") do get them (a build there passed the variable check and stopped only on the
database that did not exist yet). So `railpack.json` carries the same three steps for
Railpack (migrate, build, assemble the standalone folder) and `scripts/start.mjs` starts the
standalone server on `0.0.0.0`; CranL's app is created with the Automatic build type. The
first such build failed to type-check: outside `NODE_ENV=production` Payload regenerates
`payload-types.ts` on every init, and the Connections picker filtered the mock kind out
of its `options` by `AI_CONTENT_MOCK`, so the union lost `'mock'` and `state.ts` no longer
compiled. Two fixes: the build stage runs in production mode, and the mock leaves the
picker through the select field's `filterOptions` (which the save validates against),
never through `options`, which the generated types read.

## ADR-026: Seed fixtures, create-only migration (2026-09-13)

Amended 2026-09-13 (2b phase 2, ADR-031): the one exception to "never overwrites": the
seed removes the seven designed pages' rows from `seo-defaults` once those pages exist,
with a log line, so their title and description have one source (the page's `seo` group).

The Level 1 content files moved to `src/content/seed/*` unchanged (still schema-validated and
BRD-verbatim tested). `scripts/migrate-content.ts` creates what is missing and never
overwrites: a non-empty database is refused without `--force`, and `--force` only adds. The
seed is also the static fallback for surfaces that must render without a database (the
error page, the 410 body). `scripts/ci/seed-check.sh` proves the three runs (empty, refused,
forced) and the first-admin policy against Postgres in CI.

## ADR-027: Admin passwords: 12 characters and not breached; Turnstile in 2b (2026-09-13)

`users` enforces a 12-character minimum and a Have I Been Pwned range check (k-anonymity:
five hex characters of the SHA-1 leave the server, padding requested, 3 s timeout, fail-open
with a warning) in `beforeValidate` and `beforeChange`, so the Local API, REST and the admin
all go through it. Lockout is 5 attempts / 15 minutes, sessions 8 hours, cookies
`SameSite=Lax` and `Secure` in production. The login Turnstile is designed for Phase 2b
(`beforeLogin` widget → cookie → `hooks.beforeLogin` verification) and its origin is already
in the admin CSP.

*Amended 2026-09-17 (Dhia): the minimum is 8 characters, not 12; the breach check, the five-attempt lock and the Turnstile gate stay.*

## ADR-028: The admin has its own headers (2026-09-13)

`/admin/*` and `/api/payload/*` answer with `X-Robots-Tag: noindex, nofollow`,
`Cache-Control: private, no-store` and a CSP of their own (`src/lib/security-headers.ts`
`adminHeaders`): no analytics origins, `img-src` adds the S3 public origin for upload previews,
`frame-src` and `script-src` allow only Turnstile. Payload's Gravatar avatar is off
(`admin.avatar: 'default'`) because it sends a hash of the editor's e-mail to gravatar.com;
the admin e2e records `securitypolicyviolation` events and expects none. `robots.txt` keeps
`Disallow: /admin/` and the sitemap never lists it.

## ADR-029: Media is served through the image optimizer (2026-09-13)

Uploads live on S3 in production (`@payloadcms/storage-s3`, public-read bucket) and on the
container's disk locally. The browser never loads a storage URL directly: `next/image` and
`optimizedSrc()` (the designer's Konva mock-ups) request `/_next/image?url=…`, which keeps
`img-src 'self'` on the site and the canvas untainted (same-origin response). Same-host
media URLs are stored relative (`mediaUrl` strips `PAYLOAD_PUBLIC_SERVER_URL`); the S3 host
is the one `images.remotePatterns` entry. Product OG images (`pnpm og`) read the CMS when
`DATABASE_URL` is set.

Amended 2026-09-19 (photo quality, Dhia: "the photos look low quality";
`docs/audits/2026-09-19-photo-quality.md`). **One lossy encode.** The assets scripts wrote
every photo as JPEG q80 to q82 with 4:2:0 chroma and the optimizer encoded that again as
AVIF at 75 (sharp's 47): the stacked pass is what softened the fabric and the print. Now
`prepare-assets.ts` and `hero-crops.ts` write a photo once, at the source's own resolution,
JPEG q92 mozjpeg with 4:4:4 chroma, never enlarged and capped at 3840 wide (`src/lib/photo.ts`
holds the numbers and the crop arithmetic as data), and every photo component asks
`next/image` for quality 90 (`images.qualities: [75, 82, 90]`; logos, icons and badges keep
75; `deviceSizes` gains 3840 so a 2x screen at 1920 gets a 3000 px photograph whole). The
hero placeholders are served at 1586 and 794 px rather than upscaled to 1920 and 1080; the
hero AVIF at 1920 measures 38 to 52 KB against the 220 KB budget, so BRD 7.8 stands. **No
renditions.** Payload's `imageSizes` (thumbnail, card, hero, og) were never served: the
mappers hand the original's URL to the optimizer and `pnpm og` renders the share images, so
they are gone from the collection; the panel's thumbnail is the optimizer's 384 px transform
of the original (`adminThumbnail`), and the `sizes_*` columns stay unread until a later
migration drops them (ADR-025, `20260918_213027_media_no_renditions`). **Blur-up.** A hidden
`blur` field on `media` holds a 24 px WebP data URL (about 300 bytes) that `stampBlur`
computes from the request's file on upload or replacement (a save of the alt text keeps it; a
file sharp cannot read logs and leaves it empty, never refusing the save); the mappers expose
it (`image.blur`, a slide's `blurDesktop`/`blurMobile`, a colour's `frontBlur`/`backBlur`, a
cover's `blur`) and the photo components pass it as `placeholder="blur"`; the hero, which
renders its own `<picture>`, applies the `background-image` Next computes per breakpoint
until the photo decodes, its preloads and fetch priority unchanged. `scripts/media-blur.ts`
backfills the field; `scripts/media-requality.ts` re-uploads the seeded photos at the new
encode under a **new name** (the seed's name plus 8 hex of the file's sha256), because the
bucket's CDN caches an object for a year as `immutable` and the optimizer caches its
transforms by URL for as long (RUNBOOK, "Assets"), and deletes the old renditions beside the
file. **A media rename ends with a redeploy** (the CTO's review): the media collection has
no revalidation hook, so a renamed file reaches the prerendered pages through ADR-030's 60 s
timer only, while the old file is already gone from the bucket; for that minute a photo not
cached at the CDN edge or by the optimizer is a 404 (the optimizer caches no failure, so
nothing outlives the minute). The rebuild prerenders every page with the new names at once
and clears the optimizer's cache; the script prints the reminder when it changed anything.
`deviceSizes` also gains 1536, the 2x candidate of the 760 px reading column, so a blog
cover's 2x fetch is the 1536 rendition (60,515 B for the pricing cover) rather than the
1920 one (120,197 B). **Share images.** A q92
cover is 400 to 530 KB and WhatsApp drops a preview image over roughly 300 KB, so the
`og:image` of a CMS photo is the optimizer's URL at 1200 wide (the JPEG a scraper without
an `Accept` header gets, about 60 KB), its declared size scaled to match; the `/og/*.png`
renders are unchanged. **Two findings of the same review, outside the photos.** The
bilingual hook's `inOtherLocale` (ADR-057) takes `req.file` off the request for the other
language's write and puts it back after: Payload's Local API clears it itself on this
version (`local/update.js`), so no second copy was ever uploaded (verified with a bilingual
upload and a replacement through REST: the names stay), but the guarantee is now the hook's
own, and the outer operation's `unlinkTempFiles` sees the file again. And the hook's second
write passes `fallbackLocale: false`, as its read did: a **global's** update reads its
original with the request's fallback locale and fills every omitted localized field from
that copy, so a write on `?locale=en` without `fallback-locale=none` copies the Arabic
into each empty English field (a collection's update by id reads without fallback, verified
2026-09-19); the e2e's restores of the home and site-settings globals carry the parameter
(RUNBOOK, "The English site").

## ADR-030: Publish → live: a 60 s timer plus `revalidatePath` on static routes (2026-09-13)

The plan was tag-based on-demand revalidation. Two Next 16.3.5 behaviours ruled it out,
both reproduced in the e2e that times a publish: `revalidateTag(tag, 'max')` only marks data
*stale*, so a page regenerated by `revalidatePath` still embeds the old `unstable_cache`
value; and the file-system cache returns `null` for a page whose tags expired, which for a
`dynamicParams = false` route (`/products/[slug]`) ends in `NoFallbackError` and a permanent
404 (`file-system-cache.js` documents the alternative it does not take). The design now:
every `(site)` page and the metadata routes carry `revalidate = 60`; the data layer reads
Payload directly, deduplicated per render with `React.cache`, published documents only
(`draft: false` alone still returns a never-published draft); the publish hooks call
`revalidatePath` on the product's page and the routes that list it, and on every static
route for a global. `/products/[slug]` is `dynamicParams = true` (code review, 2026-09-13):
a product published in the admin gets its page on first request instead of a 404 until the
next deploy, and the file-system-cache constraint above no longer applies, so a publish is
live on the page at once. The cost is that an unknown product slug answers `notFound()`
from a bare document (ADR-024) rather than the global 404; the client renders the view
inside the layout, crawlers get the 404 status. `e2e/admin.spec.ts` covers publish, draft,
create and delete; `tests/revalidate-hook.test.ts` the paths.

## ADR-031: The home page is a global of designed sections; interface strings stay in code (2026-09-13)

Phase 2b moves the home page into Payload as the `home` global (BRD 9.4, 9.5): one group
per section in page order, each with its copy and an «enabled» switch on every section
except the hero, the strip, the designer and the ribbon; drafts with autosave; the strip is
five product relationships validated to five distinct products; the hero photos and the
step icons are media. Three lines are drawn on purpose. (1) **Content vs. interface**: what a
visitor reads as prose (headlines, leads, buttons, chips, the sample link, the FAQ link) is
CMS content; what is attached to a control (input labels, legends, hints, helper text,
validation, aria) is interface copy and lives in `src/messages/ar.json`, still checked
verbatim against the BRD where it came from the BRD. An editor rewrites the pitch, not the
calculator. (2) **Brand assets are code**: the integration logos (SVG, which the media
library refuses on purpose, ADR-029) and the marketing loop ship with the site, so the
`integrations` document carries the platform (which selects the logo), the name and the
order, and the `home.video` group carries the copy and the switch; a new platform or a new
film is a deploy. (3) **Drafts are staff-only on the REST API**: the `home` global answers
403 to anonymous reads because a versioned global would otherwise hand its draft to anyone
with `?draft=true`; the site reads it through the Local API with `draft: false`. `faqs`
gains `homeOrder` (BRD 4.4 orders the five home entries differently from Appendix D) and a
`beforeValidate` count guard that refuses a sixth «show on home»; `testimonials` keeps
`placeholder` and ADR-013's rule in the section; the home tones alternate over the sections
that render (`alternateTones`, BRD 3.4). Every hook revalidates through
`safeRevalidatePath`, which turns Next's missing-request-store invariant (a job, a scheduled
publish) into one info line; the 60 s timer covers those. Hooks that refuse a save throw a
public `APIError(message, 400, undefined, true)`, never `ValidationError`: the built server
recognises Payload's error classes by `instanceof`, which fails once a class is bundled into
more than one chunk, and then drops the field data (the FAQ home limit and the password
policy both lost their Arabic reason on the runner that way). The seed (`content:migrate`) is
still create-only: `src/content/seed/{home,faq,testimonials,integrations}.ts` are the
verbatim sources and the fallback shapes; `src/content/{home,faq,testimonials,integrations,
why-us}.ts` are gone. BRD §9.4 amended for `home`, `integrations` and `faqs`.

Phase 2 (2026-09-13) adds the `pages` collection on the same lines. **A block is a designed
section**, never a layout primitive: `story` (the About header with the facts band switch),
`cards`, `steps` (the journey), `profitEquation`, `faqList` (all groups, or a slice of the
home entries), `miskCredential`, `contact` (one block for the whole contact section; the
form, the cards and booking are one designed grid, so the plan's three blocks became one),
`legalBody` (Markdown + its date), `mediaBanner` and `richText` (Lexical, rendered on the
server through the Prose converters with the same link allowlist as Markdown). The seven
designed pages are `pages` rows with reserved slugs: their route folders stay in the code
and render the matching document, the slug cannot change and the row cannot be deleted;
and every other published page is served by `/[slug]`. The first block carries the page
title as its H1; tones alternate over the blocks from surface; the ribbon follows the last
one. A page's `seo` group replaces its `seo-defaults` row (BRD §9.4 wanted `plugin-seo`; a
group with the same two limits needs no plugin), and the seed removes the seven moved rows
with a log line; the one recorded exception to ADR-026's "never overwrites". The contact
form's labels, placeholders, inquiry options (the API validates them) and validation lines
stay interface copy in `src/content/pages.ts`; «آخر تحديث:» moves to `ar.json`. The legal
Markdown is now admin content, so `lib/markdown.ts` allowlists: raw HTML is dropped, links
keep `https?:`, `mailto:` and site paths only, off-site links open with `rel="noopener"`
(closes the IDEAS item; `tests/markdown-sanitise.test.ts`). The rich-text editor carries the
BRD §9.5 feature set (H2/H3, bold, italic, lists, links to pages/products or a URL, media
images) and no more (no H1, alignment, code or tables), and the «CTA block» custom node
is deferred to IDEAS because no seeded page needs it. Every block section derives its ids
from an anchor computed per page (`faq`, `faq-2`…), so two blocks of one type never share
an id. The seven designed pages cannot be unpublished either (the route would have nothing
to render); a draft save or autosave still passes. The first block of every page sits on
surface, so `/contact` moved from ground to surface (BRD §6.9 amended). The `(site)/[slug]`
route with its consequences for unknown URLs is ADR-032. Live preview stays deferred (BRD §9.3
amended): it needs draft rendering on the public routes, which ISR + `revalidatePath` do
not offer.

Amended 2026-09-19 (photo quality, ADR-029 amended): the hero photos and the step icons the
seed uploads are the files `pnpm assets` derives, now at the source's resolution and one q92
encode; a slide's contract carries `blurDesktop` and `blurMobile` beside its two photos, and
the `Home` hero renders them as the placeholder under each breakpoint's photo. The seed's
media names (`hero-set-a-desktop.jpg`, `icons-3d-printer-print.jpg`) stay the key
`scripts/media-requality.ts` matches on; a re-uploaded file carries that name plus a hash.

## ADR-032: Unknown top-level URLs: the proxy answers the global 404 (2026-09-13)

With `src/app/(site)/[slug]/page.tsx` in place every unknown top-level URL would match the
route and answer `notFound()` from a bare document (ADR-024) instead of `global-not-found`
: a site-wide regression of the 404 page. The proxy now decides first: a top-level segment
that is none of the code-owned names (`CODE_TOP_LEVEL` in `lib/site-routes.ts`, kept equal
to the `(site)` folders by a unit test, repeated as a literal in the proxy matcher because
Next reads `config` statically) and shaped like a slug is looked up in the published pages;
anything unknown is rewritten to `/__404/<slug>`, a path no route matches, so Next renders
the global 404 server-side with status 404 and the URL unchanged (`e2e` reads the raw HTML).
The allowlist is `/api/pages/slugs` (ISR 60 s, revalidated by the pages hook), read from
`http://127.0.0.1:${PORT}` (never the public origin) and cached in-process for 20 s with
stale-while-revalidate; a miss re-reads the list at most once every 2 s, so a page
published a moment ago answers on its first request while a flood of unknown URLs costs one
loopback read per window; a slug that fails the shape check is refused without a lookup,
and when the endpoint cannot be read the request passes through (fail open: a page keeps
working, an unknown URL gets the route's bare 404 until the next read). A page deleted in
the admin is a bare 404 for up to 20 s and the full document after. `/products/<unknown>`
keeps `notFound()` (ADR-030); `await connection()` before it, tried to keep junk slugs out
of the ISR cache, throws `DYNAMIC_SERVER_USAGE` inside an ISR render and answers 500, so
that idea is closed.

Phase 3 (2026-09-13) adds the redirects. `@payloadcms/plugin-redirects` provides the
`redirects` collection (admin only, hidden from editors like the settings globals, Arabic
labels laid over the plugin's fields). The BRD §5.2 map stays in the code only
(`next.config` answers it first with the exact 301/302, the proxy keeps the 410 map, the
RUNBOOK lists it): seeding those rows into the admin was tried and dropped in review, because
an editable row that `next.config` answers before the route is a control that does nothing.
A row added in the admin is validated in `beforeValidate` (`redirectProblem`, pure and
unit-tested: one lowercase segment as the source, never a code-owned segment such as
`/about` or `/en`, a site path or an `https:` URL as the target, no self-target, no target
that is another row's source; a page reference is checked as the path it resolves to, so
two references cannot loop either) and resolves in the `[slug]` route: `resolveSlug` puts a
redirect before a page of the same slug, `permanentRedirect()` answers 308 for 301 rows and
`redirect()` 307 for 302 rows, cached by ISR and live within the allowlist window. The
trade-off stands as planned: admin-added rows answer 308/307 rather than 301/302 (both
permanent or temporary for Google) and single-segment sources only; the proxy design with a
runtime map is the documented upgrade if exact codes or nested sources are ever needed.
The redirects hook revalidates the source path and the allowlist, so a new source passes
the proxy at once.

*Amended 2026-09-16 (ADR-048): the matcher is one pattern, every request but the API, the
admin, Next's files and the asset folders (`PROXY_MATCHER`), so the proxy can also count
crawlers; the code-owned list stays what `localeSlug()` reads at runtime, and the 410 and
unknown-slug answers are unchanged.*

## ADR-033: Jobs run in-process; IndexNow only on the production runtime (2026-09-13)

Payload's jobs queue runs inside the Next process (BRD 9.6): `autoRun` on a one-minute
cron with `shouldAutoRun: () => !isBuildPhase()` so `next build` never starts it, completed
jobs deleted, and `access.run: () => false` so `/api/payload/payload-jobs/run` answers
nobody; the cron is the only runner (e2e). The site's own Payload client (`cms()`)
initialises with `cron: true`, so the first page render or health probe after a boot starts
the runner (a boot invariant, not something the first admin visit does), and `/api/health`
reports `jobs: on` plus `jobsFailed`, the count of jobs that exhausted their retries. Two
things run on it.
**Scheduled publish** (`schedulePublish: true` on `home`, `pages`, `products`,
`testimonials`): the publish fires the same `afterChange` hooks, but from a job there is no
request store, and when the cron fires inside a render's context Next refuses
`revalidatePath` with "during render which is unsupported"; `safeRevalidatePath` files
both refusals under one info line and lets the 60 s timer regenerate the page (verified:
a page scheduled through the Local API was published by the cron and served within a
minute); any other failure still surfaces. **IndexNow** (`indexnow-ping` task, three
retries with exponential backoff): queued by the products, pages, faqs, testimonials,
integrations and global hooks with the routes they regenerated (pages only, never the
sitemap, the manifest or an API path), but only when `B7R_RUNTIME=production` (the flag
set solely in the CranL production app, never derived from the origin) and a valid
`INDEXNOW_KEY` exist, so CI and previews never reach the endpoint, and never on a draft
save or autosave of a published document (`isDraftSave` reads the request's `draft` flag,
an editor typing into a live page must not ping every 1.5 s); a queue failure is logged and
the publish stands. `scripts/indexnow.ts` (the sitemap diff after a deploy)
remains for the deploy-time submission.

The build now marks `payload` as a `serverExternalPackages` entry: bundled and minified
into the server chunks its error classes lost their names (`loggingLevels` reads `err.name`,
so every expected 4xx logged at ERROR) and `instanceof` failed across chunks (the
`ValidationError` data loss of phase 1). As one runtime module both hold. Every guard the
site raises on purpose throws `Refused` (an `APIError` subclass with its own name and the
Arabic reason as the response message), filed under info by `loggingLevels`.


## ADR-034: Login gate, Resend for the admin's e-mail, backups in a private bucket (2026-09-13)

**Login Turnstile** (BRD 9.3). The plan verified a token per login attempt inside
`beforeOperation`; Turnstile tokens are single-use, so a mistyped password would have
needed a fresh challenge on every retry. Shipped instead: the widget above the login form
(`admin.components.beforeLogin`) executes once on mount and posts its token to
`/api/turnstile/login` (JSON + same-origin, 10 per 10 min per IP), which verifies it with
`siteverify` and answers a signed, HttpOnly, `SameSite=Lax` cookie scoped to `/api/payload`
: `<exp>.<hmac>` over the expiry and the client address with the Payload secret, ten minutes,
refreshed by the widget before it expires; binding the address means one solved challenge
cannot be shared across a farm (a visitor whose network changes mid-flow solves it once
more). `users.hooks.beforeOperation` (`gateLogin`, login only) admits a request whose
cookie verifies and throws a 401 with the Arabic reason before Payload touches the password
or the attempt counter; no network call on the login path itself. Without
`TURNSTILE_SECRET_KEY` the gate is open (204, no cookie, one warning at boot) so a fresh
install can sign in, and `/api/health` shows `turnstile: off`; but both Turnstile keys are
in the production-required set, so a production boot never runs the login open (ADR-019's
"optional until the keys exist" was the contact form; the login is a different risk). CI
keeps the always-pass site key and no secret; the pure pieces (`makeLoginGate`,
`verifyLoginGate`, `loginAllowed`) are unit-tested and the sign-in e2e asserts the widget
opens the gate.

**E-mail.** `@payloadcms/email-resend@3.89.0` is the adapter when `RESEND_API_KEY` and a
valid `RESEND_FROM` («بحر برنت <no-reply@b7r.sa>» or a bare address) are set; otherwise
Payload logs the message and the RUNBOOK's manual reset applies. The forgot-password mail
is Arabic and right-to-left with one button to `/admin/reset/<token>` on
`PAYLOAD_PUBLIC_SERVER_URL` (never the request's Host header); `/api/health` reports
`email: resend | console`.

**Backups** (BRD 9.8). `scripts/backup.sh` runs `pg_dump --format=custom` and uploads
`YYYY-MM-DD.dump` with the AWS CLI to a **separate private bucket** with its own key pair
(`BACKUP_S3_*`; endpoint/region fall back to the media bucket's); never the public-read
media bucket, which would hand password hashes and drafts to anyone guessing a date; the
script refuses `BACKUP_S3_BUCKET = S3_BUCKET`. `.github/workflows/backup.yml` runs it
weekly from the `production` environment (a notice, not a failure, while the secrets are
unset). Retention is a lifecycle rule on the bucket (`mc ilm rule add --expire-days 30`,
RUNBOOK). A backup that cannot be restored is not a backup, so CI rehearses one every run:
`scripts/ci/restore-check.sh` dumps the seeded database, restores it into `b7r_restore`
and counts products, pages, FAQ entries and media; the MinIO job uploads a real dump to a
private `b7r-backups` bucket and asserts that an outsider gets 403 on the object and on the
listing, and that the script refuses the media bucket. LAUNCH-CHECKLIST 25 carries the CI
evidence; the once-off rehearsal from a CranL snapshot stays Dhia's.

*Amended 2026-09-17 (ADR-052): the backup workflow, the script and the restore rehearsal were removed at Dhia's instruction; the platform's snapshots are the backup.*

## ADR-035: Product cards carry a colour state; the gallery is one photo with a toggle (2026-09-13)

Dhia's design review: cards show two colours, hovering a swatch previews it, clicking makes
it the active colour, and hovering the photo flips to the back of the active colour; the
product page was too long. `ProductCard` becomes a small client island: the name is a
stretched link (the whole card still navigates, one accessible link), two swatch buttons
(44 px targets, `aria-pressed`) sit above the link, and the flip is bound to the card's hover
and paused while a swatch previews. Before hydration the first colour renders as before. The
gallery drops thumbnails, arrows and the «صورة n من 4» counter: one photo that flips on
hover, tap or arrow keys, a visible front/back toggle so the back is discoverable on a phone,
the colour swatches, and a hidden live region for screen readers. Description, specs and the
size chart share one section. The home strip keeps its expand-on-hover panels (IDEAS). BRD
§6.5 and §6.6 amended.

## ADR-036: The designer's print area is the upload target; one colour per product (2026-09-13)

Dhia's design review: the designer should be more compact, show only white (the tote in
beige), take the upload on the printable area itself with a prompt, offer an «×» to remove
the placed design, and hide the editing bounds unless the pointer is inside. The colour
picker and the dropzone are gone; `PrintAreaOverlay` is an HTML layer aligned to the Konva
print area (stage coordinates, hence the one `rtl-allow`): empty, it is a visually hidden,
focusable file input with the prompt «اضغط لرفع شعارك أو صورتك» as its label (keyboard and
click both open the picker; drag-and-drop stays on the canvas); with a design, one 44 px «×»
(«إزالة التصميم») at the print-area corner that is inert while hidden. Edit chrome (outline,
handles, «×») shows while a mouse pointer is inside the canvas or the design is selected by
a tap or click; touch keeps its selection, a press elsewhere on the mockup clears it. The
canvas starts empty with the prompt (Dhia can flip it to the pre-placed sample in one line:
`initialState.design`); «جرّب تصميماً جاهزاً» places the sample. Uploads stay in memory;
the island revokes a replaced object URL. The two new strings are Appendix G rows and are
listed for the 2b `home` seed. BRD §6.4.3 amended.

Amended 2026-09-13 (Dhia's quick edits): the sample design is gone: no «جرّب تصميماً
جاهزاً» link, no `designer.sample` CMS field, no `designer_sample` event, no
`public/designs/sample-tasmeemak.png` (ADR-007 retired). The canvas starts empty and only an
upload fills it; every design is an object URL. The pricing legend «التسعير» and the
«تقدير لا يشمل الشحن والضريبة» footnote are gone from the calculator too. The migration
drops the `designer_sample` column in place (pre-launch, with no running image to protect);
after launch a removed field is a two-release contract (ADR-025).

## ADR-037: The video is a muted background loop (2026-09-13)

Dhia's design review: a continuous looping background video with the copy over it, not a
poster with a play button. This departs from BRD §3.7 ("no continuous background
animations except the waves") and §6.4.5 ("no autoplay anywhere, no loop"), so both are
amended and constitution principle V is bumped to 1.1.0 naming the loop. The conditions
that keep it acceptable: muted (`muted` set as a property before `play()`; React omits the
attribute in server HTML), decorative (`aria-hidden`, no controls, the copy carries the
meaning), lazy (poster and copy are server-rendered; the loop mounts near the viewport with
`preload="none"`, so nothing is fetched above the fold and Lighthouse is unaffected) and
reducible (poster only under `prefers-reduced-motion`, Save-Data, or a refused `play()`). A
fixed scrim keeps the copy at AA on every frame. The `video_play` event is retired (§6.6,
§6.16 event list).

## ADR-038: Widget at the bottom-left, grouped numbers, a smaller riyal symbol (2026-09-13)

Dhia's design review, three global changes. The WhatsApp widget moves to the bottom-left,
which in this RTL-only site is the inline end: `end-6`, no physical property; BRD §6.15's
"one intentional physical property" is retired (a future LTR locale would put it
bottom-right, the conventional LTR spot). Its panel is positioned inside the fixed dock above
the button, so opening it never moves the button (the old flex layout shifted it). Every
displayed number goes through `formatNumber` (`Intl.NumberFormat('en-US')` grouping,
integers without decimals, two otherwise); form inputs never receive grouped strings. The
riyal symbol renders at 0.85 em instead of 1 em. BRD §3.11 and §6.15 amended.

## ADR-039: The admin panel: shadcn/ui shell on Payload's engine, dark only (2026-09-13)

Dhia asked for the panel to be rebuilt on shadcn/ui with icons everywhere, easy to use, and a
design system for whatever comes next. Payload keeps rendering the edit and list views
(rebuilding them would re-implement drafts, versions, uploads and Lexical for no editor gain)
and we own everything around them (`specs/007-admin-ui/`): the theme, the sidebar, the header,
the account menu, the login, the dashboard, the field widgets and the descriptions.

**Dark only.** Dhia likes Payload's dark grey; `admin.theme = 'dark'` removes the light theme
and the brand sits on top: ITF Rayat Round as `--font-body`, the B7R accent on Payload's
selection colour (its "success" ramp: focus rings, checkboxes, radios, the published pill), the
primary blue on `.btn--style-primary`, radii 6/8/13 px. The greys are untouched. Constitution V
("light only") governs the public site; the panel is outside the site design system by the 2a
plan.

**Two stylesheets, one token vocabulary.** `src/styles/tokens.css` holds the shared,
colour-free tokens (font, type scale, radius, motion, the `@font-face`s); the site's
`globals.css` adds the light palette, `src/app/(payload)/admin.css` adds a dark palette with
the **same names** mapped onto Payload's variables via `@theme inline`. So
`src/components/shared|ui/*` render in both worlds with no fork. The blue splits on dark:
`primary` (`#0058b0`) is a fill with white text, `accent` (`#0098e0`) is the colour of blue
text, icons and focus; `text-primary` is not used in admin components (2.6:1 on the greys).

**Why unlayered utilities.** Payload's CSS lives in `@layer payload-default, payload`. Tailwind's
utilities are imported into `admin.css` without a layer and without preflight, so they beat
Payload's rules on our own elements without `!important`, and brand overrides of Payload's
elements go in `@layer payload` as Payload documents. One thing to know: the site's stylesheet
also reaches `/admin` because `global-not-found.tsx` (a root-level route) imports it and Next
bundles root-level CSS everywhere; the site's utilities are layered (`@layer utilities`), so
the admin's unlayered copies win, and its `@theme inline` values are inlined into the
utilities, so the site's `:root` variables cannot leak into them. Admin components therefore
use utilities only, never `var(--color-*)`.

**Public bundle.** The site's Tailwind sources exclude `src/modules/cms/admin` and
`src/app/(payload)` (`@source not`), the admin stylesheet scans only `src/modules/cms/admin`
and `src/components`, and the budget e2e guards the public CSS size and JS.

**Future things.** `src/modules/cms/admin/icons.ts` types its keys from the generated config,
so a new collection or global without an icon is a type error; `tests/admin-config.test.ts`
walks every collection and global for group, Arabic labels, description, title field and list
columns. `docs/ADMIN-DESIGN-SYSTEM.md` is the reference and `.claude/rules/admin-ui.md` the
checklist. Deliberately no `defineCollection` wrapper: a test over a dozen call sites is the
same guarantee with no API surface (CTO plan review, 90).

Phases: (1) foundation: this ADR, tokens, primitives, icons, descriptions; (2) the shell:
sidebar, header, palette, account, login; (3) the dashboard, the preview button (Next draft
mode; the proxy passes requests carrying the draft cookie), `lastSavedBy`, field widgets.

Amended 2026-09-18: the dashboard's seven sections, its range control and its readers are
ADR-059; the quick-action tiles, the health card and the latest-changes list below are as
Phase 3 shipped them.

Phase 3 (2026-09-13, as shipped). **Dashboard** (`views.dashboard.Component`, rendered inside
Payload's template): a greeting, quick-action tiles filtered by the user's permissions, the
system health card from `healthReport()` (the same function `/api/health` answers; no HTTP
hop) and the latest saves across every entity the user may open, read through the Local API
with `overrideAccess: false`. **`lastSavedBy`** (a `group { name, at }` snapshot, sidebar,
read-only) is stamped by a shared `beforeChange` hook on every collection and global when a
person is behind the request and the save is not a draft; the plan called it
`lastPublishedBy`, but the same field sits on collections without drafts, where every save
is the live row, so «آخر حفظ» is the honest label for both. **Preview**: `admin.preview` on
pages, products and `home` builds `/api/preview?path=…&token=<exp>.<hmac>` (one hour, signed
over the path with the Payload secret; a bearer by design); the route validates the path
shape, enables Next draft mode and redirects; `/api/preview/exit` clears it and returns to
the referring page. The proxy passes requests carrying `__prerender_bypass` through the slug
allowlist, the fetchers read `draft: true` without the `PUBLISHED` filter in that request
(`lib/cms/read-mode.ts`; `draftMode()` is static-safe, so every page stays ISR), the mappers
accept drafts in a preview and fill a missing search title from the page's own, and a
warning-coloured bar on the site says what the editor sees is not public. **Widgets**
(`admin.components.Field`): `EnabledSwitch` on every section switch with a description that
names the section, `IconSelect` for the lucide selects, `PlatformSelect` with the brand SVGs.
Not shown on the dashboard: the last backup date (only the bucket knows; a status posted by
the weekly workflow is the way, docs/IDEAS.md). Accepted edge: the proxy passes through on
the *presence* of the draft cookie, so a visitor who sets a junk cookie of that name reaches
the `[slug]` route, where Next rejects the value and the published read runs; an unknown slug
then gets the route's own 404 instead of the global one. Nothing leaks.

## ADR-040: No em dashes anywhere (2026-09-13)

Dhia's rule, for the whole system including SEO: the em dash never appears in site copy,
search titles and descriptions, admin strings, e-mails, alt text, captions, comments, docs or
the BRD. Arabic takes «،» or a colon, English a comma, a colon or a new sentence; titles take
a colon; a missing table value is a hyphen; numeric ranges keep the en dash. Enforced by
`scripts/check-em-dash.ts` (`pnpm check:dash`) in the pre-commit hook and CI, written down in
`.claude/rules/writing.md`, and applied once across the repository (the BRD sections were
rebuilt from the swept sources). The reset e-mail subject, the gallery alt text and the size
chart caption changed accordingly.

Amended 2026-09-13 (Dhia's review of the panel, `admin/ui-2`). **English panel.** The UI
language is English for everyone (`i18n.supportedLanguages: { en }`, so a browser's
Accept-Language cannot switch it); the content locale stays Arabic-first. Admin-facing
messages (refusals, the login gate, the reset e-mail) are English; every text control carries
`unicode-bidi: plaintext` so Arabic content reads right-to-left inside the left-to-right
panel and a slug or URL reads left-to-right, without a per-field setting. **Icon rail.**
Closed on a desktop (above Payload's `l` breakpoint, 1440 px) the sidebar no longer vanishes:
the template grid keeps a 72 px column, the aside stays visible and interactive, every entry
is an icon with a tooltip, the account avatar opens its menu, and the collapse/expand buttons
persist Payload's `nav` preference like its own toggler (now hidden on desktops). At or under
the breakpoint the drawer behaviour is unchanged. **Header.** A bordered search box (opens the
palette; Ctrl/⌘ K still works) and a bordered "View website" link with text; both left the
sidebar. **Colour that means something.** Blue is the main action and the active state, green
publishes (the publish button of a document with drafts, the published pill), red deletes
(the Delete items, row removal, the confirm button), amber warns (Unpublish, Revert). Payload's
buttons read their colours from custom properties, so the overrides set the properties.
**Font.** The self-hosted font files were served with `max-age=0`, so every admin navigation
re-validated them and painted the fallback first; they are now `immutable` for a year and
preloaded from the admin layout too. **Brand icon.** The site's preflight (`img { max-width:
100% }`, which reaches `/admin`) squeezed the header icon into an 18 px column; the inline
`max-width: none` restores the square. Widgets keep their per-field descriptions in English.

Amended 2026-09-14 (Dhia's second review round and the closing review, `admin/ui-2`).
**The rail is CSS, not a second markup.** The first version decided "rail or not" in the
client after hydration, so a collapsed sidebar painted late and shifted every page it landed
on. The server now renders the same tree open or closed; `admin.css` hides `[data-rail-hide]`
and shows `[data-rail-show]` when the aside is closed above the `l` breakpoint, keeps the
72 px column and the aside visible regardless of Payload's hide-until-hydrated rule, and the
first frame of every navigation is already the rail. Hydration only adds tooltips, `aria-label`s
and lifts `inert`. **Sidebar foot.** The collapse/expand control sits above the account block
(not beside the brand); the brand row reads "B7R Print Website" at body size; the drawer at
or under 1440 px never shows the collapse control (Payload's own close button serves it).
**Header icon.** Payload's `.step-nav__home` wrapper is 18 px; it is 24 px now so the brand
mark is whole. **Palette centring.** The dialog's card variant assumed RTL (`translate-x-1/2`);
the admin is LTR, so the transform is direction-aware. **"Last saved" widget.** The
`lastSavedBy` group rendered as two empty read-only inputs; `SavedByField` renders one line
("by Dhia · 2 hours ago", or "No save recorded yet." for a row seeded or saved before the
field existed) and nothing on a create form. **Locale suffix hidden.** Payload appends an em
dash and the locale name to every localized label; nearly every content field is localized,
the header's locale switcher already names the locale, and the dash breaks ADR-040, so
`.field-label .localized` is hidden. **Redirect type defaults to 301.** The plugin's required
select started empty. **Untitled rows.** Payload's autosave creates a document the moment
"Create New" opens (its behaviour, kept: it is what makes autosave work); such a row has no
title, and the dashboard's latest-changes list now says "Untitled" instead of the id, next
to the list view's "No Title". Known third-party traits, noted and left: Payload's upload
meta line and pagination ellipsis use an em dash; the checker covers our sources, not
`node_modules`.

Amended 2026-09-14 (Dhia's third notes and the CTO's closing review). **No reload inside the
admin.** Every in-admin link in our shell (sidebar entities and brand, quick-action tiles,
latest changes, "My account") is Payload's `Link` (Next's, with Payload's route-transition
bar), as Payload's own nav and our palette already were; a plain `<a>` remains only for the
site link (new tab) and `/admin/logout`. The e2e asserts a window marker survives a sidebar
click and a tile click. Rail links carry `aria-label` from the server render, since the CSS
hides their text before any JS runs. **Abandoned drafts stay off the dashboard.** A row that
is a draft with no title and no saver is an autosave nobody used; `recentActivity()` skips it.
**Hues on the dashboard.** Dhia asked for more colour: the greeting's name in the accent, a
rocket on "Start here", and a hue per entity on the quick-action discs and the latest-changes
discs (pages violet, products and integrations teal, FAQ orange, media and testimonials pink,
the settings and the home page blue, the site link green for "live"). Hues are identity, not
meaning; the four meaning colours keep their jobs. Tokens `violet`, `teal`, `orange`, `pink`
(each at least 5.8:1 on the surface) and `success-tint` were added. **Room under the header.**
Every view started flush under Payload's 56 px header; 24 px now. **Collapse control** at the
start of its row. The saved-by widget's strings moved to `strings.ts`.


## ADR-041: The blog in the CMS: Lexical body, static listings, a search island (2026-09-14)

Phase 3a (`specs/008-level-3-content/`, BRD §10.1) moves the blog from three Markdown files
into Payload: `posts`, `categories` (the six hubs of Appendix E, each with its own page,
description, lead and default cover), `authors` (one seeded author with a page and
`ProfilePage` data) and `tags` (optional; related posts fall back to hub then recency).
**Lexical body.** A post's body is the same rich text an editor uses on pages, with exactly
the features the Markdown transformers cover (h2/h3, paragraphs, bold, italic, lists, links,
blockquote, uploads; no tables), so the content engine's Markdown (3b) converts to the tree an
editor would produce, and one server renderer (`modules/core/rich-text`) serves pages and
posts. Every H2 gets the id `section-n` by position, computed from the tree at render time,
so the table of contents and the anchors agree whoever wrote the post. **The CTA is placed by
the template** after the second H2, as in Level 1; there is no CTA block to misplace.
**Editorial rules on publish** (`fields/editorial.ts`): a publish is refused, with the
reason, without a title (≤ 70), an excerpt (≤ 160), exactly three takeaways, a cover and at
least two links to pages of this site; a competitor link, a Latin paragraph or an em dash
become `warnings` an editor sees in the sidebar (never a refusal). `readingMinutes` and the
warnings are computed on every save; `publishedAt` fills on the first publish;
`contentUpdatedAt` is the "updated" date and only shows when later than the publish day.
`origin` tells a hand-written post (`manual`) from the engine's (`ai`) and from one an
editor changed since (`ai-edited`); the three Level 1 posts seed as `ai` because they were
machine-written (ADR-018) and stay owed Dhia's read. **Static listings, no query string.**
Reading `searchParams` would make `/blog` a dynamic route (Constitution II), so pagination is
`/blog/page/[n]` and `/blog/category/[hub]/page/[n]` (page 1 is the base route; page 1's
segment, page 0 and an out-of-range page are 404s), and the search is a client island over an
index the page embeds (slug, title, excerpt, hub of the published posts), folded like the
admin palette (`lib/arabic-fold.ts`); `q` is read from the URL on mount so a search can be
linked, and no server query runs. `plugin-search` is not used (one collection, a few hundred
posts at most, no other collection to search across); BRD §10.1 amended. Arabic
normalisation stops at the fold (hamza forms, alef maqsura, diacritics). **Routes.**
`/author/[slug]` joins the code-owned top-level segments; `/feed.xml` is RSS 2.0 with the
latest 20 posts in full (`content:encoded` from `@payloadcms/richtext-lexical/html`, every
link and image made absolute), announced on every page as `alternates.types`; the sitemap
lists posts with `lastmod` = `contentUpdatedAt` or `publishedAt`, the hub pages and the
authors, never a paginated page. A post's publish, unpublish, slug change or delete
regenerates its page, the listings (index, paginated pages, hub pages, author page, feed,
sitemap) and pings IndexNow for the pages. **Admin.** A "Blog" group with icons and hues;
"Write a post" replaces "Upload a file" among the dashboard tiles (the library is one click
away in the sidebar and every upload field); the rich-text editor uses the brand face
(`--font-serif` pointed at it: Payload's Georgia had no Arabic). The nav preference is now
written whole from one copy of the state on every change (Payload's merge path batches across
writes and two quick changes could lose one). Robots disallows `/*?q=` instead of `/*?hub=`.


## ADR-042: The content engine: Markdown in, Lexical out, a mock behind a gate (2026-09-14)

Phase 3b (`specs/008-level-3-content/`, BRD §10.2) builds the automated content engine as a
server-only module, `src/modules/ai-content/`, that nothing under the site's routes imports.
**Shape.** `ai-settings` (a global, admin only), `ai-topics` (the backlog) and `ai-runs` (the
audit log, read-only in the panel, written through the Local API) carry the fields of
§10.2.1 to §10.2.3. The pipeline is nine pure steps over a `Store` interface and a
`Provider` interface (`pipeline/run.ts`): pickTopic, brief, outline, draft, review (with one
revision pass), image, seo, publish, notify. Payload's `generatePost` workflow wraps each step
in an inline task with its own retries on the `ai` queue, which the in-process autorun
(ADR-033) serves one job at a time; the workflow itself never retries, a failed run is a row.
**Markdown in, Lexical out.** The model writes Markdown; `convertMarkdownToLexical` with the
posts editor's own config turns it into the tree an editor would produce, so one renderer
serves both (ADR-041). **The provider layer** is the Vercel AI SDK (`ai`, `@ai-sdk/openai`,
`@ai-sdk/deepseek`, `@ai-sdk/anthropic`, `@ai-sdk/google`, exact pins); model ids are
settings strings; every call carries a 120 s timeout. **The mock provider** answers with
deterministic Arabic fixtures built from the topic and the facts sheet (every post differs)
and records its calls; the settings may select it only when `AI_CONTENT_MOCK=1`, which the
production assert refuses, so the pipeline is unit-tested end to end (eight scenarios) and the
cms e2e runs it once against the production build. **Keys** are text fields encrypted with
`payload.encrypt` (derived from `PAYLOAD_SECRET`: rotating the secret invalidates every stored
key), read back as a mask unless the request carries `context.decryptKeys`, which only the
pipeline's Local API reads set; the admin form posting the mask back keeps the ciphertext, an
empty value clears it. **Review** merges the model's 100-point rubric with deterministic checks
(numbers with a unit compared against the facts sheet, banned phrases as whole words with
«هناك» at a sentence start only, Latin paragraphs, length, first-person promises); an em dash
or an AI mention refuses the draft whatever the score. **Guards** (`caps.ts`): the switch and
`AI_CONTENT_ENABLED`; daily and monthly caps counted on runs started in the period (never on
published posts, so a second runner cannot publish twice); the cost cap; the publish hour in
Riyadh; `pickTopic` is a compare-and-set on the topic's status. `reviewFirstRuns` (default 3)
lands a live provider's first posts as drafts; the mock never counts it down. Links in a draft
are filtered to the brief's internal targets, `b7r.app`, `b7r.sa` and `.gov.sa` hosts. A
duplicate topic (keyword published within twelve months, or a title sharing 60 % of its
tokens) is rejected before any model call. **Cuts and departures** (BRD amendments): no
monitoring view, a "Content engine" card on the dashboard for admins instead (§10.2.7);
`imageMode: generate` stays in the select but the run refuses it until an image provider is
wired behind `Provider.image?`, `hubDefault` and `stock` (Pexels) ship (§10.2.1, §10.2.4);
schedules on the in-process runner instead of an external hourly call (§10.2.4, ADR-033);
cost is an estimate from tokens and per-provider rates in the settings (§10.2.3). A manual
"Generate now" that the guards refuse writes a skipped run with the reason (a person asked);
the hourly tick (3c) stays quiet. **Routes**: `/api/ai/generate`, `/api/ai/regenerate`,
`/api/ai/topics/import` accept JSON from the site's origin and an admin only (`payload.auth`),
403 otherwise; `ai-*` entities are admin-only on the REST API. The `ai` group, icons and hues
follow the design system; "Regenerate" sits in an engine post's sidebar for admins.

**Amended 2026-09-14 (Phase 3c, the engine live).** The schedules are Payload job schedules on
the `ai` queue, served by the same in-process autorun (ADR-033), each a task with the default
`beforeSchedule` (one queued at a time): `content-tick` hourly (`0 * * * *`), which reads the
settings and the day's counts and queues one `generatePost` when the guards pass (the pipeline
checks them again when the job runs); `content-freshness` Monday 06:00 Riyadh and
`content-digest` Sunday 08:00 Riyadh, both as crons on the runtime's UTC clock (Riyadh is
UTC+3 without daylight saving). Payload queues a scheduled job ahead with `waitUntil` at the
next cron time, so the guards are judged in the task handler, never in a schedule hook. **Drift**
is a number the facts sheet carried when the post was written and does not carry now: every
engine post keeps the sheet's numbers of the day (`posts.factsBaseline`, hidden from the form;
the seed writes it for the migrated three, the runs log is swept yearly and the post is not),
and the freshness pass reads the ten oldest published `ai` posts against that baseline; an
illustrative figure that was never on the sheet is not drift (the review already charged for
it). A drifted post is regenerated under
its slug and cover from the outline stored on its last successful run, with the current facts;
a `freshness` run skips the posts-per-day and per-month caps and the hour (it rewrites, it does
not add) and respects the switch, the env and the cost cap, which now counts every run's cost.
`ai-edited` posts and posts without a baseline (an editor's own) stay outside the pass. The
`ai` queue is serial: a Monday freshness batch delays that day's post by the batch's duration,
chosen over a second runner. A failed regeneration leaves the post and
its topic `published` with the error on the topic. The digest e-mail lists the week's posts
with score and cost, the failures with their reason and the next slot, when "Weekly digest" is
on and an address is set; the twelve-month sweep of the runs log runs with it (a topic's
`lastRun` link is nulled by the database). The backlog seeds the thirty Appendix E topics with
their hub, keywords, intent and priority; seasonal windows are computed for their next
occurrence at seed time (Ramadan as fixed dates); the three topics the Level 1 posts cover are
seeded `published` and linked, so the engine never writes them twice. The review server carries
mock posts written from the backlog by `scripts/dev/engine-demo.mjs` (five a day, the cap's
own maximum; the ten of the plan take two days) with a `clean` that restores the seed the
public e2e assumes. The live run per provider (§10.3 item 2) is Dhia's:
a key, the provider, "Generate now".

## ADR-043: The English site: a subdirectory, a second root layout, per-locale banks (2026-09-14)

Level 5a (`specs/009-level-5-english/`, BRD §5.1, §7.1, §7.3, §7.5) ships the English site at
`b7r.sa/en/`. **A subdirectory, not a subdomain**: one host, one domain authority, one
deployment, one sitemap; `en.b7r.sa` would split the signals and the certificate for no
gain. **Two root layouts** on route groups: `app/(site)` renders `<html lang="ar" dir="rtl">`,
`app/(en)/en` renders `<html lang="en" dir="ltr">` on the same `SiteDocument`; every English
route file is a thin wrapper that calls the shared route helper with `locale: 'en'`, so a
page is written once. `experimental.globalNotFound` makes the 404 one static bilingual
document (`global-not-found.tsx`); a `notFound()` under a route-group root layout renders the
bare shell, so the proxy rewrites an unknown `/en/*` URL to the global 404 the same way it does
at the root (ADR-032). `Content-Language` follows the document (`ar` on pages, `en` on `/en`
and `/en/*`, a later header route for the same key). **Copy per locale.** next-intl is removed
(ADR-003 retired): the site's interface strings are two typed banks, `content/copy/ar.ts`
(defines the shape) and `content/copy/en.ts` (`SiteCopy`), read by `copyFor(locale)` on the
server and passed to islands as small slices (`shellCopy`). A client component never imports
a bank: the error boundaries read `content/copy/error-page.ts`, which both banks reference,
because a bank import in a client file ships both languages to every page (16 KB gzipped,
found by the blog's JS budget). Appendix I of the BRD is generated from the English bank by
`pnpm copy:appendix`; `tests/content-verbatim` checks both banks. **Content per locale.**
Payload's localisation already carried `en`; every public read now passes
`publicRead(locale)` = `{ locale, fallbackLocale: false, draft: false, overrideAccess: true }`
and the presence gate `inLocale(field)` (title-like field exists and is not empty in the
request locale) in both directions, so an English page never shows Arabic prose as a
stand-in and an Arabic-only page is absent from `/en` (404, no hreflang). A document's
twins come from one read at `locale: 'all'` of its title field (`documentLocales`); the
code-owned routes exist in English once `site-settings.brandName` and `navigation.ctaLabel`
have English values (`localeEnabled('en')`), which the proxy checks through
`/api/pages/slugs/en` (`enabled: false` answers 404 for every `/en` URL on a database
seeded before Level 5), the English root layout answers `notFound()` for the same state (so
`next build`, which prerenders `/en`, succeeds on an Arabic-only production database and the
English routes regenerate once the seed ran; a throw there would have failed every deploy
until then; CI builds once with `SITE_ENGLISH=off`, a test-only switch refused in production,
to keep that proof), the Arabic header shows no switch and the 404 no English line while the site
has one language (`siteLocales()`). The blog stays Arabic-only until 5b
(`BLOG_ENGLISH_PENDING`: `/en/blog` 404, no pair on `/blog`). **SEO.**
Canonical under the locale's prefix; `alternates.languages` `{ ar, en, x-default → ar }` and
`og:locale:alternate` only when both twins exist; sitemap alternates from the same pairing;
JSON-LD `inLanguage` per locale, `availableLanguage: ['ar', 'en']`; English titles use
`| B7R Print`. The manifest stays Arabic (one manifest per origin, the default language).
**The switch** is a link, not a redirect: the header (and the phone menu) links the twin in
the other language by its own name, rendered on the server as the current path under the
other locale (right for every page with a twin, before hydration and without JavaScript) and
downgraded on mount to that language's home when the page emits no `<link rel="alternate"
hreflang>` for it, so a page without a twin never sends the reader to a 404. An unknown
`/en/*` URL answers the bilingual 404 document under `Content-Language: en` (the header
route matches the request path; the document is the one static 404). No browser-language
detection
(BRD §5.1; a Saudi reader on an English phone must land on Arabic). **The seed** writes the
English values of every localised field (`scripts/migrate-content-en.ts`, `ensureEnglish`)
after the Arabic documents exist, idempotent per document; `content:migrate --force` fills a
missing language on a database that has content, the one exception to ADR-026's
"adds nothing" (it adds values to existing rows, never rows). Media alt text is localised;
the Arabic-script validator applies to the Arabic value only. `products.sizes.label` and
`sizesSummary` are localised by a data-carrying migration. **Details settled on the way.**
The riyal symbol's accessible name is one hidden `<span id="sar-name">` per document
(`aria-labelledby`), so the price does not repeat «ريال سعودي» in the English reading order;
list separators («، » / ", ") come from the bank; the hero copy sits at the inline end in LTR
so it never covers the photo's subject; the pinned steps dim inactive items by colour, not
opacity, so they meet AA; `--color-success` darkens to `#15803D` (the profit line was 3.1:1
on `ground`; §3.2 amended) and the navy footer's newsletter messages read in white. The
Arabic site is byte-for-byte unchanged in body HTML for the five audited pages
(`scripts/dev/golden.mjs diff`, one class added to the hero). **Known state**: the English
pages share the Arabic-rendered Open Graph images (`public/og/**`, whose text is Arabic);
English renders (`pnpm og --locale en`, `public/og/en/`) are the first task of 5b. **Owed
Dhia's read**: the English bank (Appendix I), the English CMS content and the English legal
drafts, which the agent wrote.

**Amended 2026-09-14 (Phase 5b, the blog in English).** The blog routes exist under `/en`
(`(en)/en/blog/**`, `(en)/en/author/**`, `/en/feed.xml`) as thin wrappers over the same
route helpers; `BLOG_ENGLISH_PENDING` is gone and the sitemap lists the English blog with
its pairs. **A translation pair is one document**: a post, a hub or an author with values in
both languages is the same row with the same slug, so the pair's hreflang and the switch
need no second field; a post with one language is on that language's site only (the
presence gate), and an Arabic-only post's switch goes to the English blog's home.
`readingMinutes` and `warnings` are localised (a data-carrying migration moved the Arabic
values): both are computed in the language being saved (`req.locale`), the reading time at
that language's pace (`WORDS_PER_MINUTE`) and the warnings by that language's rules, so the
Arabic "paragraphs in Latin script" soft rule has an English mirror, "paragraphs in Arabic
script" (`arabicParagraphs`); the hard rules (title 70, excerpt 160, three takeaways, two
internal links) hold in both, judged on the version being published. Internal document links
in a body resolve under the locale (`docHref(doc, locale)`, the prose renderer and the feed),
and the panel's preview opens the document in the locale being edited. A localised array
with no rows reads back as `null` (Payload), which the admin field and the tests accept.
**Revalidation** (a 5a gap): every publish regenerates both documents (`withEnglish` in the
hooks; the sitemap and the manifest once), including the English allowlist
`/api/pages/slugs/en`; a regenerated 404 costs nothing. **IndexNow** hears less
(`pingPaths`): the document's own route in the language that was saved (the other
language's page did not change), the listings in every language the site is in, and never
a `/en` URL while the site is not in English, because repeated 404 submissions count
against the key; the hooks ask the globals through `lib/cms/locale-enabled` (no
`server-only`, so the seed scripts load the config too). **Open Graph** renders per language:
`pnpm og --locale en` writes `public/og/en/{default,products/*}.png` left-to-right from the
English values (`fromSeed` lays the English seed over the Arabic products when the CMS is
absent); `defaultOgImage(locale)` and the product lookup pick the set. **The seed** writes
the six hubs, the author and the three Level 1 posts in English (`content/seed/en/blog.ts`,
bodies in `content/seed/blog/en/*.md` with links under `/en/`), new rows for the localised
takeaways (never the Arabic rows' ids: a localised array keeps rows per language), and the
editorial gate refused the first draft of one title at 73 characters, as it should. The
English search runs on the same fold (`fold` lower-cases and normalises Latin too). The
engine's own checks stay Arabic until 5c. **Owed Dhia's read**: the English hub names and
descriptions, the author's role and bio, and the three English posts.

**Amended 2026-09-14 (Phase 5c, the engine in English, and `llms.txt`).** A topic carries its
language (`ai-topics.language`, `ar` by default, in the CSV import as a seventh column), and
every read and write of a run follows it: the facts sheet is built from the settings and the
catalogue in that locale with its own wording and link targets under `/en/`; the hub and the
published posts (for links and the dedupe) are read in that locale with the presence gate,
so an Arabic title is no duplicate of an English topic; the post is written with
`locale: 'en'` and lands on the English blog only. **The style tab is localised**
(`styleGuide`, `systemPrompt`, `bannedPhrases`, `bannedClaims`, a data-carrying migration
moved the Arabic values; `systemPromptVersion` stays shared): the admin edits each language
under the panel's locale control; the code defaults per language (`DEFAULT_STYLE`) are the
fields' `defaultValue`, which Payload applies on read, so the English tab shows them from the
first visit without a seed (the store falls back to the same constants). **Prompts**
have an English set (`pipeline/prompts.ts`, a text table per locale; the header gains a
`LANGUAGE:` line the mock switches its fixtures on); the rubric's `arabic` dimension is now
`language` in both. **Checks** follow the language: English unit words (`SAR 45`, `45
riyals`, `5 days`, `28 cm`, `180 g`, `5 products`), the banned phrases of that language's
tab, first-person promises in English (`we guarantee`), and the script rule mirrored (the
deduction is `script`: Latin paragraphs in Arabic, Arabic paragraphs in English); the em dash
and the AI mention refuse in both. The slug comes from the model's proposal or the
transliteration of the keyword, which passes Latin through. The run's label carries `[en]`,
which the dashboard card and the digest show. **The English backlog** (Appendix E, fifteen
topics aimed at BRD §7.7's English prompts) seeds beside the Arabic thirty; the three the
Level 1 posts already cover in English seed `published` and linked, as the Arabic do. The
review server wrote one English post from it with the mock at score 90; the cms e2e runs an
English topic and proves the post is on `/en/blog` and in `/en/feed.xml` only, with no Arabic
in its body. The freshness pass reads the Arabic sheet for drift (one catalogue, the same
numbers in both languages) and regenerates a post in its topic's language. **Which language gets written** is
the backlog's call, not the engine's: the hourly tick picks by priority then age across both
backlogs, so at one post a day the Arabic thirty go first unless an English topic carries a
higher priority; raise a topic's priority to write it sooner. No alternation rule until Dhia
asks for one. **`llms.txt`**
(BRD §7.10 reopened): one per language (`/llms.txt`, `/en/llms.txt`), built from the CMS the
way the sitemap is (the site settings, the SEO defaults' titles and descriptions, the pages,
the catalogue with cost and suggested price, the published posts with their excerpts),
regenerated with the listings on every publish, never pinged (IndexNow gets pages only). The
evidence that answer engines read it is thin; it costs one route per language and nothing on
the page. **Owed Dhia's read**: the English style guide, system prompt, banned phrases and
claims, the fifteen English topics, and the English `llms.txt` wording.

## ADR-044: Dhia's review of the English site and the shell (2026-09-14)

Dhia's first read of the English site and the shell after Level 5, applied in one PR. **The
hero mirrors.** ADR-043 kept the English copy at the inline end, over the calm right area of
the same photo; Dhia wants the English hero to read left to right like the Arabic reads right
to left: the copy, the dots and the overlay at the start edge of each document, so the hero
photos are now per language (`hero.slides[].imageDesktop`/`imageMobile` localized). The site
reads without locale fallback (ADR-043), so the migration copied the shared photo into every
existing language row and the English tab is required like the headline; until Dhia's English
photographs exist, the English placeholders are the Arabic shots flipped by
`scripts/hero-crops.ts` (`public/images/hero-en/`), which mirrors the printed wordmark too.
Dhia chose that in the interview knowing it, so the layout can be judged now; the RUNBOOK
says to replace them. The English display is the `display` utility's own LTR variant (56 px,
1.12 leading, -0.02 em tracking, nested like `mirror-rtl`, nothing in the shared tokens):
measured at 1280 px with a 600 px column, every English headline is two rows and every
subline one, after three English strings were shortened (slide 3's headline, slide 4's
subline, the delivery chip). **Chips 0 to 6** (`minRows: 0`): the rows are shared by both
languages and the text is per language, so the mapper hides a row whose text is empty in the
requested language instead of throwing. **The overlay** is `hero.overlay` in the admin: an
`enabled` switch and a `#rrggbb` colour (a `ColorField` widget: the browser's picker beside
the text), drawn through `color-mix()` on `--hero-overlay`, direction-aware (`to left` in
RTL, `to right` in LTR). **The switch keeps the page.** The link computed its href once in an
effect keyed on the target only, so after a client-side navigation it still pointed at the
first page's twin (the home, for a reader who entered on `/`). It now derives the href from
`usePathname()` on every render and, per pathname, reads the page's `hreflang` link; a page
without a twin falls back to `fallbackPath()`: the section's listing in the other language
(`/blog/*`, `/author/*` → the blog, `/products/*` → the products), no longer the home. **The
switch is an icon**: the translate glyph in a 44 px ring, `aria-label` from the copy bank and
a CSS-only tooltip with the target language's name (`data-tooltip`, the `tooltip` utility;
no Radix Tooltip in the root layout, BRD 7.8's first-paint budget). Desktop: between the nav
and the CTA; phones: in the menu's top bar. **No login.** `navigation.loginLabel`,
`site-settings.appUrls` (its `register` was read by nothing either: the app URL is
`NEXT_PUBLIC_APP_URL`) and `lib/utm.ts`'s `loginUrl` are gone, with their columns.
**The menu.** The sheet fades in from above (was: from the start edge); its top bar mirrors
the header (logo, switch, X); the burger morphs into the X and back (keyframes on the
`translate`/`rotate` properties Tailwind's utilities set, the X as the resting state, the in
and out tokens matching the sheet's own so Radix's exit wait never cuts the morph); WhatsApp
is an icon among the socials, named `socialAria.whatsapp` from the bank, so
`navigation.menuWhatsappLine` leaves the CMS (ADR-031: interface strings live in code; the
error pages keep the sentence in `error-page.ts`). **The header** rests at 88 px (72 on
phones) and still shrinks to 60 when scrolled. **The footer** logo is 48 px; below `lg` the
brand block spans the row and centres, the links and the policies share one row in two
columns, the newsletter spans, the badges centre. **The admin says which language is open.**
Payload's localized label suffix, hidden since ADR-039, is now one neutral pill with the code
of the open locale (`AR`/`EN`, drawn by `admin.css` from `html[data-content-locale]`, which the
header sets; no pill before hydration), so a field with a pill changes per language and a
field without one is shared; a `LocaleNote` line before the document controls of every
document with localized fields says the same in words (`tests/admin-config.test.ts` checks
the registration on every such config).

## ADR-045: CI runs on the pull request only; the merge goes through one script (2026-09-15)

Every PR cost two identical CI events: the `pull_request` run and the `push` run on `main`
after the squash merge, about 32 billed minutes each (the quality job 24, the S3 job 8 in
parallel), so about 64 per PR plus reruns; the month's free minutes ran out on 2026-09-14 and
blocked PR #15. The `push` run repeats the PR run by construction: changes land by squash
merge only (BRD 8.2), and a branch whose remote head contains `origin/main` lands the tree the
PR run tested (`refs/pull/N/merge`). So `ci.yml` runs on `pull_request` and `workflow_dispatch`
(a full run of `main` by hand: `gh workflow run ci.yml --ref main`), and the property the push
run used to check is checked by `scripts/merge-pr.sh <number> [subject]` instead, every time
and the same way: fetch; `origin/<branch>` must contain `origin/main`, else it stops with the
instruction to merge `main` in and let the PR run again; `gh pr checks --watch --fail-fast` on
the head, every check line printed, then the gate proper, every check in the pass bucket
(`gh pr checks` exits 0 on a cancelled check: only failed and pending are non-zero);
`gh pr merge --squash --delete-branch` with the subject given or the PR's title, the PR number
appended, no body; `main` checked out and pulled fast-forward only. Found on the way:
the CI warm-up (`e2e/global-setup.ts`, `scripts/ci/warm-lib.sh`) requested every image
transform with the default Accept (any type), which Next answers with a resized JPEG, while
every browser in the suite and Lighthouse's Chrome get AVIF (WebKit lists WebP before AVIF, but
Next answers with the first of its own `formats` the client accepts), so no AVIF was ever warm and
the first minute of a run paid the cold encodes (PR #15's second run: the no-JS home tests
past 30 s for `load`); both warmers now send `image/avif,image/webp,*/*;q=0.8`. The trade-off,
accepted: `main` has no CI event, so the deploy (ADR-025, its own `push` trigger; its
`next build` fails closed on a broken `main`) trusts the routine, and a merge from the GitHub
UI skips the script. The re-arm path if that ever matters: `push: main` back in `ci.yml` and
a `workflow_run` gate on the deploy. Considered and not done: keeping `.next/cache` between
runs (Next's `actions/cache` pattern): a `pull_request` run's cache is scoped to its PR, and
with no trusted run on `main` nothing writes `main`'s scope, so it would warm only the reruns
of one PR (about 20 to 45 s per job) and would need a restore/save split to keep the runtime
image cache (`.next/cache/images`, written by `next start` during the e2e and Lighthouse) from
being saved and served stale to the budgets test; caching the Playwright browsers
(Playwright's CI guide: the restore costs what the download costs, and the OS dependencies
cannot be cached); more Playwright workers (the default, 50% of cores, adapts to the runner
class and keeps the WebKit device projects honest); sharding the e2e across jobs (shorter wall
clock, more billed minutes). Open, for Dhia's call: the admin suite runs twice per event (the
quality job on local-disk media, the S3 job on MinIO, the storage production uses); dropping
it from the quality job would save about 3 minutes.

## ADR-046: The admin reshape: five task groups, one colour each, a header that says where (2026-09-15)

Dhia's read of the admin after a week of use: too many doors, each page used differently,
too little colour to find one's way, options that do not say what they do. The panel had
19 sidebar entries in 5 groups of one grey (Content listed the home page last, after the
collections; the blog was four entries; the engine three), every big form was one scroll, and
the descriptions were terse. Decided with him, in one interview, with a mock: **five task
groups by what he is doing**, Site (home page, pages, site settings, media), Catalogue
(products, store integrations, testimonials, FAQ), Blog (posts, with hubs, authors and tags
as secondary entries under it, and the content engine as a section inside it), Visibility
(search defaults, redirects; the score and the traffic pages of the next projects join here)
and Admin (users; connections next), each with **one identity colour** carried by every
entity of the group onto the sidebar, the page header and the dashboard: Site the accent blue,
Catalogue teal, Blog violet, Visibility pink (orange was the nearest free hue and sits next to
amber, the "careful" colour), Admin a neutral slate. The registry is `admin/icons.ts`
(`ADMIN_GROUPS`, `ADMIN_NAV`): typed against the generated config, so an entity without a
place is a type error, and `tests/admin-config.test.ts` asserts that each config's
`admin.group` (still what Payload groups by) names the registry's group. `navGroups()` keeps
Payload's `groupNavItems` for permissions and hidden entities and shapes the result by the
registry; the sidebar showed a collection's document count (14 `count` queries per page, for
the sidebar only, 10 ms warm, never cached: a stale number right after Create is worse than
none) until ADR-058 took the counts out and kept a badge only for a number that asks for
action. **An
amendment of the design system's §2**: the active sidebar entry sits on its group's tint with
weight and `aria-current`, not on blue; blue keeps the main action, links, focus and the Site
group. **The page header** (`EntityHeader`, in the description slot under Payload's title,
`admin.components.Description` on collections where the list view shares it,
`admin.components.elements.Description` on globals, each registered with its own `serverProps`
because the slot carries no global slug): the entity's icon in a disc and a bar in its hue,
the description, a "Shows on:" sentence from `admin.custom.shows` (both languages), a link to
the public listing for products, posts and FAQ, and on the home page "10 sections, N on" read
from the saved document (the slot renders outside Payload's form, so the live switches are
out of reach; the number follows a save). The locale note (ADR-044) stays before the document
controls: the description slot renders on list views too, where it would be wrong. Renamed:
Integrations to Store integrations, SEO defaults to Search defaults (slugs unchanged); Runs
takes a history icon, Engine settings sliders, the Blog group a pen so it no longer repeats
the Posts icon. Not changed: Payload's list and edit views, Lexical, the theme, permissions.
Decided with Dhia for the next PRs of the same project: Navigation folds into Site settings
as a "Menus & footer" tab (a data migration), the three menu labels stay editable there
(his exception to ADR-031's rule that interface text lives in code), the big forms become
tabs, every field gets a description that says what it does on the site, and a Connections
collection holds every API key with a test and a monthly limit (ADR-047). **Done in PR B1
and B2 (2026-09-15):** the menus are `site-settings.menu` (migration
`20260915_143152`, the six `navigation*` tables gone); the forms are tabs, one per section of
the site in site order (Home ten named tabs in place of its groups, same columns; Product
four; Post three with the sidebar untouched; Page two; Site settings four with the menus as
the named tab `menu`); and every field an editor sees says where it shows and what it does,
then its limit or an example, in both languages, through one map per entity
(`modules/cms/admin/descriptions/*.ts`, `modules/ai-content/descriptions.ts`) applied by
`describeFields()` on the config, so the ~240 sentences are read in one place; the config
test refuses a field without both languages (layout, hidden, read-only, label-less and
label-less groups descended, hidden and read-only fields skipped) and a map key that names no
field (a read-only field is a real field for the map, since its sentence still renders); the 187 site-facing sentences were checked against the components that read each
field, and 16 corrected. Found on the way: tags, the testimonial's avatar and the settings'
legal entity are read by nothing on the site (related posts go by hub, ADR-041; the copyright
line is fixed copy), and their descriptions say so; whether to keep them is Dhia's call.

## ADR-047: Connections: one place for every AI key, with a test and a monthly limit (2026-09-15)

**Context.** The engine's keys lived in its settings, one group per vendor with a select for
the active one: four keys to keep, no way to try one before a run, no per-key budget, and
nothing for "any AI with an API" (Dhia's request, admin reshape plan D7) or for the accounts
project 3 will read (prompt tracking through the same vendors, Search Console, Bing,
PageSpeed). **Decision.** A `connections` collection (Admin group, admins only): `label`,
`kind` (`openai`, `anthropic`, `google`, `deepseek`, `openai-compatible` with an `https://`
base URL, `mock` for tests, refused in production as before), `model`, `apiKey` (the
existing secret scheme: encrypted at rest with `PAYLOAD_SECRET`, masked on read, kept when
the form posts the mask back), the two rates, `monthlyLimitUsd` (empty: no limit),
`enabled`, and read-only `lastTestAt` / `lastTestOk` / `lastTestMessage` written only by
the test. A new row that leaves the model or a rate empty gets its kind's usual value (since 2026-09-18 the cheap model: `gpt-4.1-mini`, `claude-haiku-4-5`, `gemini-3-flash-preview`). Two
numbers are derived on every read and never stored: `spentThisMonthUsd` and
`callsThisMonth`, the `ai-runs` rows naming the connection since the Riyadh month began,
`skipped` left out. **No ledger**: the runs are the record; `ai-runs` gains a nullable
`connection` relationship and keeps `provider` and `model` as text for the history. The
engine settings lose the Providers tab for one `connection` relationship on the Cadence tab;
`ai-settings.images.pexelsKey` stays where it is (not a language model). **The guards.**
`capDecision` refuses, in this order and for freshness runs too: env, switch, no
connection, connection off, the daily cost cap, the connection's monthly limit at
`spent >= limit` (overshoot at most one run), then the daily and monthly post caps and the
hour. A manual run refused by the connection writes a skipped row with the reason; the
hourly tick stays quiet. A job whose provider cannot be built (no key on the connection)
still runs so the first model call records the reason on the run: `providerOrRefusal`. The
dashboard card and the health row share one reading (`engineState`): on, off, mock,
`noConnection` (red), `connectionOff` (amber); the card names the connection with its
month's spend and limit. The engine's connection cannot be deleted (`beforeDelete`, a
`Refused` 400: "pick another in the engine settings first"). **The test.**
`POST /api/connections/test { id }` behind the admin guard: one `generateText` with
`maxOutputTokens: 32` (OpenAI's Responses API refuses fewer than 16), no retries, a 20 s
abort, the key read with `decryptKeys` through the Local API; the outcome written on the row
(the model id on success; on failure the vendor's message through `safeMessage`: one line,
URLs replaced, the key replaced, 200 characters at most; a run's error and the failure e-mail
go through the same helper, at 1,000 characters); one test per
connection per ten seconds in memory (one container, ADR-033); the button renders only on a
saved row and reads "Save, then test" while the form is dirty; the mock answers without a
call. **Dependencies.** `src/modules/connections/` is the leaf (the collection, kinds, the
model factory `languageModel` that `provider/sdk.ts` now calls, the spend helper, the
reader, the test); the engine depends on it and nothing there imports the engine. The
Payload config and the engine import its files directly: the module's index re-exports the
admin API guard (now `modules/cms/admin-api.ts`, shared by the `/api/ai/*` and
`/api/connections/*` routes), which reaches the config, and an import of the index from the
config side would be a cycle. The Riyadh clock moved to `lib/riyadh.ts` and the secret field
to `modules/cms/fields/secret-field.ts` for the same reason. **Migration**
`20260915_165626_connections`: one connection per vendor that had a key (ciphertext copied,
same scheme), a mock connection when the mock was active, the settings pointed at the active
vendor's connection (null when it had no key: the engine refuses with "no connection" until
one is picked), every run linked by its provider text, the vendor columns dropped; `down`
restores them. **Found on the way.** The secret field's `previousValue` in a `beforeChange`
hook has been through `afterRead`, so it is the mask, not the ciphertext: saving a document
with the mask, or any Local API update that omitted the field (the engine's
`decrementReviewFirstRuns`), stored the mask and made the key unreadable. The hook now reads
the stored value from the database row. Nothing in production had a key yet. The `openai` kind is the Responses API, whose
`max_output_tokens` floor is 16: the plan's 8 would have failed every OpenAI test. **Not
done.**
`filterOptions` on the engine's picker (every kind is engine-capable today; project 3's
analytics kinds bring the filter with their consumers); Perplexity; a shared rate-limit
store.

## ADR-048: Traffic sources: our own counter of visitors and AI crawlers (2026-09-16)

**Context.** Dhia wants to see in the admin where visitors come from (ChatGPT, Gemini,
Claude, Perplexity, Google, the social networks, other sites, nobody) and which AI crawlers
read the site. GA4 needs consent and its own UI; Umami has its own UI. His decision: **our
own counter**, first-party and cookieless, honest about being a count and not an audit.
Interview (2026-09-16): landings only, nothing stored in the browser; crawlers counted,
nothing blocked (C-08 stays); a dashboard card and a Traffic page under Visibility; daily
counts kept forever. **Decision.** One collection `traffic` of daily rows `(date, kind,
source, path, hits)` with a compound unique index; the only writer is a multi-row `INSERT ...
ON CONFLICT DO UPDATE SET hits = traffic.hits + excluded.hits` through the adapter's drizzle
handle; the panel reads it (admins), the API creates, changes and deletes nothing. **The
channel is derived at read, never stored** (`channelOf(source)`, `modules/traffic/channels.ts`):
the rows keep one vocabulary, the source, and the classifier's table can grow and re-bucket
the history. At write time `sourceOf()` picks one word: a referrer host the table knows
(folded of `www.`/`m.`/`l.` and the app-link forms), else a known `utm_source` token folded
to its host (ChatGPT appends `utm_source=chatgpt.com`, Perplexity `perplexity`, Copilot
`copilot`), else the host as it is, else an unknown token, else `direct`; the site's own host
as a referrer is an internal move the client missed and stores nothing. **The beacon**
(`modules/core/analytics/landing-beacon.tsx`, in `PageExtras`, never in the admin): on a
fresh navigation (`performance` says `navigate`, so a reload or back/forward counts nothing
twice) whose referrer is not same-origin, one keepalive POST of the path, the referrer and
`utm_source`; no storage, no retry. The 404 shell renders `PageExtras`, so a dead inbound
link is counted with its path, which is the broken link an admin wants to see. **The
endpoint** `POST /api/traffic/landing`, in order: JSON with an `Origin` present and matching
the site (a browser always sends one on a POST; a bare script call is refused), a user agent
that is not a bot (the table's, or anything calling itself a bot: 204 and nothing stored), a
body that parses (`lib/traffic/landing.ts`: a page path of zero to four plain segments, `/`
and `/en` included; the referrer bounded; the token `[A-Za-z0-9._-]`), sixty a minute per
client address in memory, then one count. **The crawler counter.** The proxy now runs on
every page request (one matcher, `PROXY_MATCHER` in `lib/site-routes.ts`, repeated as a
literal in `proxy.ts` because Next reads `config` statically and kept equal by the test);
the 410 and unknown-slug logic keeps its own conditions, so no existing answer changes. A
**document GET** (no `rsc` or `next-router-prefetch` header, no `_rsc` query, not HEAD, not a
retired URL) of a page or a machine file (`llms.txt`, `en/llms.txt`, `robots.txt`,
`sitemap.xml`, `feed.xml`, `en/feed.xml`) by a user agent the bot table knows
(`lib/traffic/bots.ts`: OpenAI's three, Anthropic's three, Googlebot, Perplexity's two,
Bing's two, Applebot, Meta's two, Amazonbot, Bytespider, CCBot, DuckAssistBot, YandexBot;
`Google-Extended` and `Applebot-Extended` are robots.txt tokens, never a user agent; a test
holds that every C-08 bot is in the table) is reported over loopback to
`POST /api/traffic/crawl` with `event.waitUntil`, fire-and-forget, a failure logged once a
minute. The report carries `x-b7r-internal`, an HMAC-SHA256 of `traffic-crawl` under
`PAYLOAD_SECRET` through Web Crypto (`lib/internal-token.ts`; the proxy and a route handler
are separate module graphs, so a boot-time random cannot be shared), compared in constant
time: nobody outside the container can add a crawl row. The pure halves the proxy needs live
in `lib/traffic`, so its bundle never pulls Payload. **The batcher**
(`modules/traffic/counter.ts`): `count()` stamps the Riyadh date at that moment; every ten
seconds (or at 500 keys) the map is swapped for a fresh one and the snapshot written in one
statement; a failed write merges back by addition; a 5,000-key ceiling drops new keys with
one warning; the timer is `unref()`ed and guarded on `globalThis`; a SIGTERM flush races
Next's own close and usually saves a deploy's last seconds; a crash loses up to ten. One
container (ADR-033). **The card** (`modules/traffic/admin/traffic-card.tsx`, admins): the
last seven days' landings, one bar per group (AI, search, social, other sites, direct; the
Visibility pink on the surface track, identity not meaning), the top channel, the crawler
reads, an empty state before the first visitor. **Not stored, ever:** an IP, a user agent
string, a cookie, an identifier, a time finer than the day. **Honesty.** A public counter can
be fed: bounded per address, not in distinct hosts, so referrer spam can appear in the
sources (the RUNBOOK says how to read it); Google's AI Overviews and AI Mode arrive with a
Google referrer and read as Google; the native apps (ChatGPT's, in-app browsers) send no
referrer and inflate `direct`; the e2e lands like a visitor, so the review server's count
includes the suite's. **BRD.** §6.16 gains the beacon; §11.4's Umami pull loses its referrer
part to this counter (visitors and page views stay "if ever"); GA4 stays for consented
sessions; Search Console comes with project 3. **The page (PR 2b).** `/admin/traffic` is a Payload custom view (`admin.components.views`,
from `ADMIN_VIEW_COMPONENTS` in `modules/cms/admin/views/registry.ts`), a server component
that gates itself first (`adminView()`, `views/gate.tsx`): Payload 3 renders a custom view
with a `path` for anyone, so a visitor is redirected to the login with the way back, an
editor sees the "Admins only" sentence inside the shell, and the rows are read with the
user's access, never `overrideAccess`. Ranges of 7, 30 and 90 days as links; the totals and
the five groups; four tables with an empty state each (the channels with their share and
first and last day; the top twenty sources; the top twenty landing pages with the channel
that brought most; the crawlers with their company, their role (answering a person, indexing
for search, gathering for training) and the pages they read most); the three honesty lines
at the foot. Tables, not charts: the design system has no chart primitive and the numbers
are small. The registry gained custom views (`ADMIN_VIEWS` in `icons.ts`: label, path,
icon; `EntityType` is `collections | globals | views`; a placement in `ADMIN_NAV.views`; a
collection may sit under a view, as the `traffic` rows sit under the page as "Counts"); the
sidebar and the palette list a view like a global, by the registry's own rule (admins), and
the data paths that walk entities (the dashboard's Latest changes, the counts, the palette's
search) leave views out explicitly. Project 3's Score page reuses all of it.

*Amended 2026-09-19 (Level 4 PR 4c, Dhia's decision in the Level 4 interview): **Umami's
numbers join the counter on the dashboard; GA4 stays in GA.** Umami's are the truest people
numbers this site has: its script loads for every visitor without consent (ADR-052), GA4
only after the bar is accepted, and our own counter counts landings (a page opened from
elsewhere), not people. A connection kind `umami` (`speaks: 'service'`, secret `apiKey`,
one enabled row like the other services): the API key from Umami Cloud's settings, the base
`https://api.umami.is/v1` unless the row names an address (`https://umami.b7r.app`, whose
API is `<address>/api` with its login token as the Bearer); the website id is the one Site
settings → Analytics already holds, so the Test refuses a row while that field is empty, in
the tester's language (the one sentence of ours a service Test writes; the service's own
answer stays in its terms). The nightly pull gains the `umami` source
(`visibility/services/umami.ts`: pure parsers over the `stats` shape, `dayWindow()` on
**Riyadh** day boundaries in milliseconds, the boundary every other `metrics` source keeps,
so the dashboard never sums two different days): one `stats` call per day, each written as
its own `metrics` row (`source: 'umami'`, `{ visitors, pageviews, visits, bounces,
totaltime }`), 90 days back on the first run, then yesterday and the day before every night
(late hits land in yesterday; today is never read, it is not over), a night missed filled
from the day after the newest row; then the three dashboard ranges ending yesterday
(`compare=prev`), written into yesterday's row as `data.ranges[7|30|90] = { …, previous }`,
because a range's visitors are its unique people, not its days' uniques added up (the CTO's
review: a merchant who came on three days is one visitor, the number Umami's own dashboard
shows and Dhia will compare with); the calls paced under the Cloud's 50 per 15 s. On the
dashboard: when the range holds a `umami` row the visits tile is Umami's visitors for the
range (the range object of the newest row that carries it) with our landings on the line
under and the change against Umami's previous range; while no row carries the range object
(rows from before it was pulled) the days are summed and the tile and the card say so
("daily visitors, summed" / «زوّار الأيام، مجموعةً»); the "Where visits come from" card
gains a people row (visitors, page views, the average visit as `m:ss` from `totaltime /
visits`) for the same range, through yesterday; without a row the tile and the card read
exactly as before. The Traffic page is untouched. `docs/RUNBOOK.md` "Connecting Umami"; the
checklist row; BRD §11.4 amended.*

## ADR-049: The visibility score: how compliant the site is with SEO and GEO, and what to do next (2026-09-16)

**Context.** Dhia asked for a percentage per section of how compliant the site is with SEO and
GEO, with what is done, what is next and what is missing, dynamic with the content, guiding him
to the field that fixes each thing, connected to Search Console and the free services, with the
goal of 100%. His SEO + GEO prompt (the Citation Trinity: identity, extractability,
corroboration; crawl access; the citation ledger) is the rubric. Interview (2026-09-16): Search
Console, Bing and PageSpeed as Connection kinds, Google by a service account; the ledger with
web search on; weekly, guarded by each connection's monthly limit; **outside signals count in
the percentage**, with a site-only number beside it. Plan: `docs/plans/2026-09-16-visibility-score.md`
(CTO 93 GO). **Decision, PR 3a.** A rules engine of pure checks over one snapshot
(`modules/visibility/snapshot.ts`: every published document in both languages, the media rows
they use, the settings, the checklist, the connections without their keys, the counters, the
production flag; read with the page's user, never `overrideAccess`), a Score page and a card.
**Points versus facts.** A thing the site guarantees by construction (a required field, a
publish rule: a product's photo, price and sizes; a post's takeaways, cover and links; the
Arabic alt text and tagline; the socials' presence; the sitemap, `llms.txt`, canonicals,
hreflang) can never be missing and earns no points: each section lists them as facts. Points go
to what can move. **The table** (`rules/weights.ts`; sections 15 + 20 + 30 + 10 + 10 + 15):
Identity I1 the English tagline 4, I2 the profiles as https links 4, I3 About in both languages
3, I4 every author of a published post with a bio, a photo and a profile link 4; Crawl access
C1 the production address (robots allow and indexing only on `https://b7r.sa`) 5, C2 IndexNow 3,
C3 Search Console connected and its Test passed 4, C4 Bing the same 3, C5 every published
document in English while the site is 5; Extractability E1 the emitted title within 70 and
description within 155 on every page in every language (as `metadata.ts` derives them) 6, E2
English alt on every photo in use 4, E3 every post's first paragraph 40 to 80 words 6, E4 a
question H2 on every post 4, E5 at least five FAQ entries per language 3, E6 `FAQPage` JSON-LD 4
and E7 a compare page 3 (both project 4, missing until then); Corroboration R1 the five-box
off-site checklist (`visibility-checklist` global) 10; Measurement M1 landings in 30 days 3, M2
five prompts per language 3, M3 a ledger run in 14 days 4; Outside signals P1 PageSpeed mobile
≥ 90 on five pages by the median of three nights 6, P2 impressions 3, P3 a category term in the
top ten queries 2, P4 the cited-rate ≥ 50% (next ≥ 10%) 4. A rule over documents is pro-rata
("4 of 5" is 80%, `next` while partial) and lists up to ten of them, each linking to the field in
the locale that is missing; a rule with nothing to judge is done. The overall is the sum over
100; the site-only percentage is earned over possible on the items minus C3, C4, M3 and P1 to
P4 (74 possible). A filled production site with no service scores about 70; until project 4
ships E6 and E7 the ceiling is 93; the page says both. **The page** `/admin/visibility`
(`ADMIN_VIEWS.visibility`, `adminView()`): the ring (the Visibility pink, identity), the
site-only number, one card per section with its findings in the order next, missing, done
(done collapsed after five), each with its guide, link and documents, the section's facts at
the foot; "Recompute" bypasses the minute's per-process, per-user cache. No stored score: the
score is a function of the content; the nightly snapshot (PR 3b) keeps the history. The
Visibility group's order: the Score page, its checklist, the search defaults, the Traffic page
and its counts, redirects. **Also in 3a:** `slogan: site.tagline` on the `OnlineStore` node, so
I1's sentence is true. **Two BRD lines**, for Dhia to veto: `FAQPage` JSON-LD returns for the
answer engines (project 4's ADR amends §7.10; Google dropping the rich result was the reason it
was "not done"); Google Business Profile stays not done (no premises); §7.7's quarterly manual
prompt check is replaced by the ledger (PR 3c). **Next:** PR 3b the three service kinds, the
nightly pulls and the `metrics` snapshots; PR 3c the prompts and the citation ledger.

**Decision, PR 3b (2026-09-16): the services.** Three Connection kinds that speak to a service
rather than a model (`speaks: 'service'` in `KINDS`; the engine's picker filters them out):
Google Search Console by a service account's JSON key file, Bing Webmaster Tools by its API
key, PageSpeed Insights by an optional API key (the public quota without one). One enabled
connection per service kind (`oneServicePerKind`, a `Refused`), so the pull never chooses. The
secret field takes the kind into account: a service-account row's paste is checked at save
(`parseServiceAccount`: the file's `type`, `client_email`, `private_key`) and refused on the
field as a `ValidationError` from the `beforeChange` hook, since Payload runs a field's hooks
before its `validate` and would validate the ciphertext; it reads back masked as the account's
e-mail tail (`••••@…iam.gserviceaccount.com`) so Dhia knows which account. Google's token comes
from the JWT-bearer flow signed with Web Crypto RS256 (`lib/google-jwt.ts`, forty lines, no
`google-auth-library`; the token cached in memory by key id for its hour). The Test per kind
(`SERVICE_TESTS`, handed to `testConnection` by the route since the visibility module depends
on connections, not the reverse): Search Console lists the account's properties and checks the
domain property `sc-domain:b7r.sa` is among them; Bing lists the key's sites; PageSpeed runs one
mobile audit of the home page (90 s). **The pull** (`visibility-pull`, 04:00 Riyadh on the `ai`
queue, serial by ADR-033; "Pull now" on the page through `POST /api/visibility/pull`,
`adminOnly`, one per ten minutes; `pnpm visibility:pull` from a shell): Search Console's
28-day window ending three days back (totals, the top 25 queries, pages and countries), Bing's
last 28 days and top queries (`GetRankAndTrafficStats`, `GetQueryStats`), PageSpeed for `/`,
`/products`, the first product, `/blog` and the newest post on mobile and desktop, one URL at
a time with 90 s each and a partial row rather than none; then the day's score row. Every row
is an upsert by `(date, source)` (a unique index and `ON CONFLICT DO UPDATE`), so a second pull
the same day replaces the day's rows; `pnpm visibility:pull --check` proves it against the
database in CI. A service whose pull fails writes no row and is named once in the log; the
page shows the last good snapshot with its date. The top Search Console queries feed the
engine's backlog (`ai-topics`, `source: 'searchConsole'`, BRD 11.4): non-brand, ≥ 50
impressions, ≤ 100 characters, one per keyword, the hub with the most word overlap, priority by
impressions. **The page** gains the outside signals as facts (one panel each with the
snapshot's date, "Connect" when no connection exists, a waiting sentence when one does and no
pull has run) and "up N points since <date>" from the oldest of the last eight score rows. The
`metrics` collection is "Snapshots" under the Score page, read-only, admin-only. **Rejected:**
GA4 (BRD 11.4's second source): Search Console and the site's own counter (ADR-048) answer the
same questions without a consented-sessions gap; `google-auth-library` (a dependency for one
signature); storing the score only on the page (no history to say "up 6 points").

**Decision, PR 3c (2026-09-16): the citation ledger.** Two collections under the Score page:
`prompts` (the questions a buyer asks an assistant: text, language, intent, `namesBrand`,
enabled, order; fifteen seeded by `content:migrate` from the BRD's category terms, ten Arabic
and five English, two compare prompts naming the brand) and `citations` (read-only: one row
per prompt, per connection, per batch: date, provider, model, mode, mentioned, linked,
`namesBrand` as asked, the URLs, the competitors, a 400-character excerpt, the links to the
prompt, the connection and the run). **The ask** (`ledger/ask.ts`): the connection's model
through `languageModel()`, the vendor's own web search where it has one (`searchTool()` in
`connections/model.ts`: OpenAI's `web_search`, Anthropic's `web_search` 2026-02-09 with three
uses, Google's `google_search` grounding; a Saudi `userLocation` on the two that take one),
the prompt as typed with no system prompt naming B7R, 1,500 output tokens, 60 s; DeepSeek, a
compatible endpoint and the mock are asked plain. **The reader** (`ledger/read-answer.ts`, pure):
`mentioned` by `(^|[^\p{L}])(?:و|ف|ل|ب|ك)?بحر\s*بر(?:ي)?نت` or `\bb7r\b` after `fold()`,
never bare «بحر»; the URLs from the SDK's sources (OpenAI, Anthropic), from Google's source
titles (its URLs are grounding redirects), from Perplexity's raw `citations` and
`search_results`, or from the text in the plain mode; `linked` when a URL is ours; the
competitors of BRD 2.3 by host or by name. **The batch** (`ledger/run.ts`, `citation-ledger`,
Monday 07:00 Riyadh on the `ai` queue; "Run now" through `POST /api/visibility/ledger`, one
per ten minutes): every enabled AI connection asks every enabled prompt in order, one
`ai-runs` row of kind `citation` per connection (the tokens, the searches at the kind's
`searchFeeUsd` and the cost summed; the label "N prompts, M cited, K not run"), one
citation row per prompt; a twenty-minute budget per connection leaves the rest as not run;
a connection over its monthly limit, without a key, or asked within the hour is skipped with
a run that says why. The writing engine's `dailyCostCapUsd` leaves `citation` runs out
(`costTodayOf`); the connection's monthly limit counts them. The mock kind answers without a
call behind its gate (names B7R with a link on an Arabic prompt, two competitors on an
English one), which is what the e2e and the review server run. **The page** gains the ledger:
the cited-rate and linked-rate per engine over four weeks on the non-brand prompts, the
per-prompt table with an engine per column (a check or a cross with its `aria-label`, or "not
run"), the latest answers as collapsible excerpts, the competitors named most, and for a
prompt no engine names B7R on, the page or post whose title shares the most words, to
improve. M2, M3 and P4 read the prompts, the last finished run and the window's rows.
The text decides `namesBrand` too (a prompt naming «بحر برنت» or `b7r` leaves the rate even
unticked); the competitors are matched by name on word boundaries ("merchant" is not Merch by
Amazon); Google's grounding fee counts one per grounded prompt, since its provider emits no
tool-call part; a compatible endpoint that hands citations in its body reads as "with search";
a citation row keeps the prompt's text and carries a day-and-connection title; admins may
delete a wrong batch. **Rejected:** one run per prompt (seventy-five rows a week in the runs
list); a system prompt that names B7R (the answer would name it back); counting a brand-naming
prompt in the rate. BRD §7.7's quarterly manual check is this ledger, weekly.

**Amended 2026-09-16 (Dhia): a period per prompt, the brand's own questions, the mock out of
the picker.** Each prompt carries `everyDays` (1 to 365, seeded 1: every prompt daily, his
call); the job runs every morning at 07:00 Riyadh and asks a connection the prompts due on it
(never asked, or last asked at least the period ago, by the newest citation day per prompt on
that connection); a connection with nothing due writes no row; "Run now" asks every enabled
prompt whatever its period (`input.all`). Seven prompts that name the brand join the seed («ما
هو بحر برنت؟», "Is B7R Print legit?", the prices, the Salla link): they leave the cited-rate
as the compare prompts do and record what the engines say about B7R by name. The cost note on
the page's period field: about $0.03 per engine per day for a daily prompt with web search
on; each connection's monthly limit is the guard. The mock kind stays in code for the tests
and shows in the Connections picker and the engine's picker only where `AI_CONTENT_MOCK=1`
(the tests, the review server), never in production; the Mock rows on the review database
were removed at his request. **The same day, from the first real batch:** a citation row keeps
the whole answer as rich text (`answer`, the posts' editor's conversion of the markdown, up
to 20,000 characters) and the ledger table opens it in a dialog, formatted, with the links
it cited; the verdict in a cell is a green or red badge in words, and every checkbox in
every list is such a badge (`BoolCell` through `describeFields`, never Payload's `true` /
`false` pill). The cost estimate follows the model: `MODEL_RATES` names the vendors'
published prices for the likely models and a row takes them when its model is sent (the
rates stay editable); the search fee is by model family (`searchFeeFor`: OpenAI's mini and
nano models search at $25 a thousand, Gemini 3 grounds at $14); Anthropic's search count is
read from its usage metadata rather than the tool-call parts, which over-count, and its tool
is capped at one search a prompt (three read 20,000 input tokens an answer). An answer's links
are sanitised three times over: Lexical's markdown transformer and link node refuse a
`javascript:` URL at conversion, and the dialog renders through `safeHref` like the site's
prose. A model change from the admin form arrives with every field, so "untouched rates" means
equal to the row's, not absent; the longest model family wins the rate lookup. The two custom
views (Traffic, the Score page) render inside Payload's `DefaultTemplate` through
`AdminShell` with the step nav: they had rendered bare, with no sidebar and no way back, a
defect he reported.

*Amended 2026-09-18 (Dhia's decision under the Phase 3 brief of the pre-launch programme,
"minimise overall usage, daily to weekly", executed on the AI cost audit in
`docs/audits/2026-09-18-ai-cost.md`; it reverses his 2026-09-16 "daily on every prompt"): every
prompt weekly, the brand prompts included (the
score reads four weeks and M3 a fortnight; a daily brand prompt would have cost $17 a month
for nothing the rules read); Google on `gemini-3-flash-preview` and Anthropic on
`claude-haiku-4-5` (the same search tools at half and a third of the price; OpenAI's cost is
its search fee, so the mini stays); a monthly limit on every AI connection ($10 / $5 / $5);
the kinds' defaults are the cheap models. Measured: $2.64 a batch on the old models, $1.42 on
the new; about $6 a month weekly. Applied to the review and the production databases by
`scripts/ai-spend.ts`, which also removed three queued jobs carrying a Riyadh-clock time.*

## ADR-050: The GEO content: FAQPage schema, the compare page, answer-first openings, the off-site kit (2026-09-16)

**Context.** Project 4 of Dhia's 2026-09-15 programme: the content the visibility score
(ADR-049) says is missing on the site's side. On the review server the score read 49 with E6
(`FAQPage` JSON-LD, which BRD §7.10 listed as "explicitly not done"), E7 (no compare page), E3
(two Arabic posts opening with a story), E4 (two posts without a question heading) and E1 (two
English search titles over 70 characters) open; the rest of the open items are Dhia's side.
Interview (2026-09-16): B7R vs Printful with the facts drafted from Printful's public pages and
dated, the page a draft until Dhia approves; `FAQPage` on the FAQ page only; the rewrites
drafted for his approval; the off-site kit drafted for him. Plan
`docs/plans/2026-09-16-geo-content.md` (CTO 92 GO). **Decision.** (1) `jsonLd.faqPage()` emits a
`FAQPage` node (`@id <url>#faq`, `inLanguage`, one `Question` per entry with its `Answer` as
plain text) on the page whose slug is `faq`, in both languages, from the same items its
`faqList` block renders (`faqItemsFor`), so the schema cannot drift from the visible questions.
The gate is the slug, not "any page with the block": `how-it-works` carries a slice of the same
questions, and the same questions as `FAQPage` on two pages is what the schema guidelines warn
against. BRD §7.10 amended: `FAQPage` returns for the answer engines (Google dropped the rich
result; the assistants read the schema); `HowTo`, `SearchAction`, `Speakable`, Google Business
Profile and `LocalBusiness` stay out. E6 becomes a rule (done while the published FAQ page
carries its FAQ section) with its 4 points: an editor can unpublish the page, so it can move.
(2) A `compare` block (schema, Payload config, mapper, seed converter, renderer): `ours`,
`theirs`, `asOf` (the day the other side's pages were read, shown under the table as text),
three rows or more of criterion / ours / theirs, `bestFor` and `notBestFor` lists, an intro and
a closing; rendered as a captioned table with scoped headers, the criterion column sticky in an
`overflow-x-auto` container, then the two lists. **No link leaves the page** (BRD §7.9: external
links only to b7r.app, the profiles and Misk): the sources are named as text and listed in the
PR. The page `compare-printful` (a top-level slug: the `[slug]` route and the proxy's live
allowlist need nothing; E7 reads `compare`/`vs` slugs) is seeded in both languages as a
**draft** (the seed's `Page.draft`, honoured on the Arabic create and on the English update,
since an update without `draft` publishes a versioned document): the public route answers 404
and the preview renders it until Dhia publishes it. Its Arabic copy is written under BRD §0.5
(`TODO(copy)`, `TODO_COPY` in the verbatim test, listed in the PR); Dhia approved it on
2026-09-16, it is BRD §4.18 with its SEO row in §4.16, the markers are gone, and the page is
seeded published (it was published on the review server the same day). E7 reads `next` once the block's `asOf` is older
than 180 days (`THRESHOLDS.compareAsOfDays`), with the guide to re-read and re-date: the as-of
date carries points, not a block constraint. (3) The three Level 1 posts' seed bodies rewritten
where the rules said: the pricing post and the print-on-demand post open with a 40 to 80-word
answer, the pricing post gains «كم تكلفة تيشيرت مطبوع في السعودية؟» and its English form "What
does a printed T-shirt cost in Saudi Arabia?" as H2s; the two English search titles over 70
characters get a `seoTitle` in the seed. `pnpm content:drafts` (`scripts/post-drafts.ts`)
writes the seed's bodies as **drafts** of the published posts in both languages, the live text
unchanged until Dhia publishes the draft in the admin; a fresh database seeds the new text
directly. A unit test holds every seeded body, in both languages, to the opening and the
question heading through the rules' own helpers. (4) `docs/OFF-SITE-KIT.md`, headed a draft for
Dhia's review: the LinkedIn company and founder copy in both languages, a three-minute
walkthrough script, the pinned X post and ten places for a first mention; he posts and ticks
the five boxes. The table's amounts are prose («45 ريالاً», «30 ريالاً»), the form BRD §0.4.5 allows where §4
spells it: the row is a sentence a reader and an engine quote, not a price position, so the
`SarAmount` glyph rule of the catalogue does not apply; §4.18 carries the amounts in that form
once approved. B7R's side of the table repeats the settings' facts (the base cost, the five
days, the welcome credit) as words; a change to those settings is a change to this page too,
which the RUNBOOK says. **Rejected:** `FAQPage` on every page with a `faqList` block (duplicate
questions); a stacked-card table mode (the sticky-column table reads at 400 px); a warning the
block forces on a stale `asOf` (a rule with points instead); linking to Printful's pages as
sources; a `price` cell type rendering `SarAmount` in the table (block growth for one row); a
second compare page before the first is cited; `HowTo` and `Speakable`.

## ADR-051: The hero never grows wider than its photo (2026-09-17)

Dhia, on an ultra-wide screen: the hero photo stretched across the whole viewport and lost
its quality. The desktop photos are 1920 × 1080 (`renditions.ts`), and the image optimiser
resizes a candidate to the width asked, so `sizes="100vw"` on a 3440 px viewport fetched a
3440 px upscale of a 1920 px photo. The rule is as plain as his request: the hero has
`max-width: 1920px` and is centred; on a wider screen the page's white shows on both sides
and nothing else changes (the header still sits over it, the height is still the viewport).
The desktop rendition's `sizes` is `(min-width: 1921px) 1920px, 100vw` on the `<source>` and
the preload, so the 1920 px candidate is the one fetched. A first version made the hero a
rounded card under the header with a height cap; Dhia refused it as over-engineering and it
was removed the same day. `e2e/home-hero.spec.ts` asserts the width, the centring and the
fetched width at 2560 and 3440.

## ADR-052: The environment is technical; settings live in the admin (2026-09-17)

Dhia, at the first deploy, on the variable list: "the environment is only technical things
like APIs and DB things"; anything a person at B7R changes belongs in the admin, and a
switch like `SITE_ENGLISH` or a backup pipeline is not wanted. So:

- Gone from the environment: `NEXT_PUBLIC_WHATSAPP` (the site already read the settings'
  WhatsApp number; the variable was dead), `CONTACT_TO` (the contact form now sends to the
  settings' contact address), `BOOKING_URL` (the settings' booking link, no fallback),
  `GOOGLE_SITE_VERIFICATION` and `BING_SITE_VERIFICATION` (the SEO settings' verification
  group, which existed and was never read), `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_UMAMI_SRC`
  and `NEXT_PUBLIC_UMAMI_ID` (a new Analytics tab on the site settings), `SITE_ENGLISH`
  (the switch and its CI build), `BACKUP_S3_*` (the weekly workflow, the script and the
  restore rehearsal: the platform's snapshots are the backup).
- Optional now: `NEXT_PUBLIC_APP_URL` (defaults to the app), `RESEND_FROM` (defaults to the
  brand on its own domain), `INDEXNOW_KEY` (derived from `PAYLOAD_SECRET` when unset; the
  key is public by design and a hash reveals nothing).
- Required in production: the origin, the database, the secret, the bucket, the Resend key
  and audience, the Turnstile pair. Thirteen values, all technical.

Two consequences worth their sentence. The content security policy is static (ADR-016) and
used to take the Umami origin from the environment at build; it now admits Umami Cloud and
B7R's own umami.b7r.app (BRD 7.7), exact hosts and never a wildcard (a dangling subdomain
must not become script on the site's origin), and the admin's Umami field accepts only those
(`umamiSrcAllowed`), so a configured script is never blocked; the CI stand-in on the site's
own origin is `'self'`. The derived IndexNow key is as strong as `PAYLOAD_SECRET`, and a
weak secret is already the end of everything else. C2 of the visibility score reads the
ping's own predicate (production runtime and a key) rather than the key alone, which is now
always there. The CI seeds its dummy analytics ids into the settings (`scripts/ci/analytics-ids.ts`)
instead of the environment. ADR-034's backup pipeline and ADR-043's English-off build are
withdrawn by this decision; migration `20260916_230030_site_analytics`.

## ADR-053: The island header (2026-09-17)

Dhia, on the sticky header: the blurred, shrinking bar is "typical, like every AI website".
Four working studies were made (the island, a side rail, a hide-on-scroll bar with a
full-screen curtain menu, a solid brand ribbon with a section indicator); he chose the
island, with one change: the same capsule on top on phones too, holding the logo, the button
and the burger, nothing at the bottom of the screen.

The rule (BRD 6.2 amended): at rest the header is the full-width bar it was; past the 24 px
sentinel it settles into a capsule 12 px below the top edge, 880 px wide at most on desktop
and the viewport minus 24 px on phones, 64 / 58 px tall, solid white, a hairline, a
blue-tinted lift, no blur, with the brand's 13 px corner (his first look: the pill read as
off-brand and too light; the corner is now the buttons' own, the bar heavier, the links at
16 px). The motion is one soft curve (`--ease-settle`, `cubic-bezier(.22,.61,.36,1)`) over
720 ms on the width, the height, the radius, the offset and the inner padding (his second
look: 480 ms felt rushed), with the colours on the standard curve, and none under reduced
motion. The sticky
wrapper keeps reserving the rest height, so the change never shifts the page. One CTA
element serves both layouts (compact on phones), so the e2e's single-element locator holds.
`e2e/header-menu.spec.ts` asserts the capsule's geometry on both layouts and the absence of
a backdrop filter.

## ADR-054: The shiny CTA, an admin switch (2026-09-17)

Dhia wants a second look for the header's button, chosen from the admin beside the button's
text: "shiny, with this little animation and hovering", from a reference component, in our
colours, font and radius rather than the reference's. `Button` gains the variant `shiny`
(`.btn-shiny` in `globals.css`): the primary button with a gradient of the brand's two blues
(`--color-primary` to `--color-accent` and back) that slides across on hover over 700 ms, a
soft blue glow, a light inner rim, and a glint of light crossing the face every 4.5 s at
rest, from the start edge in both writing directions; none of the motion under reduced
motion. The design system's gradient rule is amended for this one case (two blues, same
hue). His second look: the switch must cover every place a call-to-action button stands,
not the header alone, and the glow was too strong. So the switch is site-wide, `ctaShiny`
on the site settings' Brand tab (off by default; migration `20260917_192112_cta_shiny`), and
every main CTA reads it: the header, the phone menu, the hero, the video, the ribbon (as
`inverseShiny`, the same sheen in white and the accent tint on the primary ribbon), the
product page and its sticky bar, the designer's three buttons, the post's in-post CTA. The
glow is 10 px at 22% (14 px at 32% on hover). The CTA text fields say where the switch is.
The header carries `data-shiny` for the tests. The classic buttons stay the default. The label
never sits on the accent itself: the visible window is 36% of a 280% gradient, so under the
centred label the blue is about #006dc0 at rest (5.3:1 with white) and #0067bb on hover
(5.6:1); the lighter band falls at the padded edges where there is no text, and the label
crosses the accent only during the 700 ms slide. The stops and the 280% size are what
make this true; a later "more shine" edit must re-check the numbers. The glint is the
site's third continuous animation after ADR-037's two, transform-only and off under
reduced motion.

## ADR-055: Scroll reveal on every section, by the primitives (2026-09-18)

Dhia: a subtle animation as things scroll into view, on every item and every page, and on
future additions. Until now `Reveal` wrapped four lists by hand and hid them by CSS under
`html.js`, which would have delayed the first paint anywhere a wrapped element sat above the
fold. The rule now: `Section` carries `data-reveal` by default (`reveal={false}` for the hero,
which is not a Section anyway, and for a section holding a `position: fixed` child, since a
transformed ancestor becomes its containing block: the designer); a grid marks
`data-reveal-stagger` and its children stagger 60 ms by index; `Reveal` stays for a hand-placed
element and is a server component now. One client island in `PageExtras`
(`RevealObserver`, the arming in `modules/core/reveal-arm`) runs once hydration is done, so
React has finished with the DOM before a class is added (the CTO's review: an inline script
before hydration adds classes the dev hydration diff reports on every section): an element
already in view is marked visible at once and never hidden, so the LCP and the fold are never
touched; one below the fold is hidden and fades up 12 px over 400 ms when it enters (an
IntersectionObserver with an 8% bottom margin); the hide itself is instant, since a fade-out
is what axe and Lighthouse read as half-transparent text (the first CI run's contrast
failures on the product cards); a MutationObserver arms elements added later; the stagger
delay is capped at the ninth child; a printed page shows everything. The CSS hides
nothing by itself, so content is always there without JavaScript, and the arming exits under
reduced motion; the graceful loss is a scroll in the first second, which shows plain content.
`e2e/reveal.spec.ts` asserts the four rules and that the hero image has no hidden ancestor;
new components inherit the behaviour through `Section`, which is what makes "future
additions" true without anyone remembering.

## ADR-056: The Arabic admin (2026-09-18)

Dhia, in the pre-launch programme: "add Arabic language support to the admin; I can switch
the language to see it in Arabic; it must support right-to-left". This reverses the "English
panel, Arabic content" of ADR-039 (his review of 2026-09-13, recorded in ADR-040's amendment):
the panel now reads in English or in Arabic, per person.

**The switch is Payload's.** `i18n.supportedLanguages` is `{ en, ar }` with `en` the
fallback. Payload resolves the language per request from its `payload-lng` cookie (set for a
year by the account view's language select through a server action, then a refresh), else
the browser's `Accept-Language`, else the fallback (so an Arabic browser opens the Arabic
panel at the login page before anyone chooses, which the e2e asserts from a fresh Arabic
context; the admin suite's own browser is English for that reason); it sets `lang` and `dir`
on `<html>` itself (`dir="RTL"` for Arabic, from its `rtlLanguages`), and every label and
description the configs carry as `{ ar, en }` already followed `i18n.language`. Nothing of
ours stores the choice.

**Two axes, never one control.** The UI language (the cookie, the account view) and the
content locale (the AR / EN pills, `html[data-content-locale]`, `?locale=`, the user's
`locale` preference) are different things: the first says what language the panel speaks,
the second which language of a document is open. Switching one leaves the other alone; the
code says so where they meet (`strings.ts`, `locale-note.tsx`, `actions-client.tsx`), and
Payload's own «اللغة» is split into «لغة اللوحة» (the panel's) and «لغة المحتوى» (the
document's) so the two selects never read alike. The e2e opens the English content of a page
inside the Arabic panel and checks both attributes.

**Our strings are two trees of one shape.** `adminStrings` (English) is the shape;
`AdminStrings` widens its literals (a string leaf to `string`, a pair to a pair, a list to a
list, a function keeps its signature) and `adminStringsAr` is typed as that, so a string
added in one language without the other is a compile error. A component picks its tree per
render, `adminStringsFor(i18n.language)` on the server and `useAdminStrings()` (a `'use
client'` hook over Payload's `useTranslation`) on the client, never at module top level: the
old `const s = adminStrings.x` at import time would have fixed the language at build. Counts
that Arabic declines (days) are small functions rather than templates.
`tests/admin-strings.test.ts` walks both trees (every leaf, the same kind, the same
placeholders, nothing extra), reads the Arabic under the ux-araby rules a regular expression
can hold (no «تم» + مصدر, no «قم بـ», no «!», no «/» or Latin comma between Arabic words, no
«بنجاح», no «الخاص بك», no em dash, no Eastern digits), and checks the resolver.

**Digits stay Western** (design system §5). One formatter, `admin/format.ts`, hands
`Intl` a locale with `-u-nu-latn` (`ar-u-nu-latn`, `en-GB-u-nu-latn`): numbers, `dd/MM/yyyy`
dates and "5 minutes ago" («قبل 5 دقائق», the Arabic plurals from `Intl.RelativeTimeFormat`)
all read Western digits in both languages; `tests/admin-format.test.ts` asserts "1,234" in
Arabic. Day keys (`YYYY-MM-DD`) are shown as they are. The `relative-time.ts` module is
replaced by it.

**Payload's `ar` pack is community work**, and the strings an editor meets daily carried
«تم» + مصدر, «قم بـ», wrong hamzas («أنشاء جديد»), mistranslations («محصول» for crop,
«واضح» for clear, «المواقع» for locales), an untranslated «Toggle block», a translated
placeholder («{{العنوان}}») and one leaked instruction to a translation model
(`general.restoring`). `admin/payload-ar.ts` holds ours on top, merged through
`i18n.translations.ar` (a key there wins, the rest stays Payload's), typed against the `en`
pack so a wrong key is a compile error, and read by the same test.

**RTL of our own components.** `check:rtl` already forbids physical utilities; on top of it
the `mirror-rtl` utility is declared in `admin.css` (the site sheet reached the admin by
accident and the admin must not depend on it), the sidebar's tooltips open away from the
rail on whichever side it sits, the account menu passes the document direction to Radix
(which reads none from the page), the palette's Enter glyph is never mirrored (the key looks
the same on an Arabic keyboard), a date pair in a table sits in a `dir="ltr"` span, and the
sidebar's remembered group state is keyed by the group's registry key rather than its label,
so it survives a change of language; a state saved under the old English labels is simply
not found, so every group opens once after this ships (a refinement, not a regression). The
e2e "the admin in Arabic" switches through the
account view, asserts `html[dir="rtl"]`, the groups, the dashboard, a list, an edit view
with its content locale, the two views, runs axe on the shell, and switches back.

**The rules' sentences (amended 2026-09-18, the Phase 2 text review).** The visibility
rules' own text (ADR-049: some seventy titles, guides, facts and the labels of the documents
a rule lists) was left English inside the Arabic Score page by the first cut. It is now
written in both languages beside the logic it belongs to (rule 12 of `admin-ui.md`): every
sentence in `modules/visibility/rules/*` is a `Text` pair (`{ en, ar }`, `visibility/types.ts`),
`Finding`, `Fact` and `Item` are generic over it, `scoreOf()` stays a pure function of the
snapshot that answers in both languages, and `reading(payload, { user, language })` picks the
request's language once (`pickScore`) so the Score page and the dashboard card read plain
strings; `language` is required, so a call site cannot forget it (the nightly score row
uses `scoreOf` directly and needs none). The section names left `weights.ts`
(`SECTIONS[].label` was dead: they live in both string trees as `visibility.sections`), so
the table there is the keys and the weights ADR-049 names. The Arabic follows the ux-araby
rules (verb-first guides, nominal titles, «أو» not
«/», Arabic comma, Western digits, no «تم», no «!»), and the audit's 2.19 and 6.3 are applied
to both languages: arrows became words ("Admin, Connections", «الإدارة، الاتصالات»), no guide
names an environment variable or a code path (C1 and C2 say the address and IndexNow are set
where the site is hosted, nothing in the panel), and each guide still links to the field that
fixes the finding in the locale that is missing. `tests/visibility-rules-strings.test.ts`
walks every rule over three snapshots (every branch of every guide, the listed documents, the
checklist's labels) and refuses a sentence without both languages, a number quoted in one
language only, an Arabic that breaks the regular-expression rules (shared with the admin
strings test through `tests/helpers/arabic-rules.ts`), and any arrow, environment variable or
`admin/` path in either language; the Arabic e2e asserts the first open finding's title and
guide are Arabic script. The same review moved the two "wait ten minutes" answers of the Score
page's buttons into the admin strings (`adminOnly()` now resolves the request's UI language
the way Payload does) and wrote the traffic table's date range in words instead of an arrow
(6.3). The checklist global reads its labels from the rule's `CHECKLIST_ITEMS`, one source.
**Not translated, on purpose:** a connection's `lastTestMessage` is a record written once at
test time in the service's own terms (a model id, `sc-domain:b7r.sa (siteOwner)`, `mobile
performance: 92`, an HTTP status and reason), never a sentence for a reader; our own words in
it (`services/tests.ts`, `connections/test.ts`) are terse and technical for that reason.

**The switch in the header (amended 2026-09-19, PR 1 of the Arabic panel's second pass).**
Dhia: "top right, an option to switch the interface language". The panel's language is now
one control in two places, `nav/language-switch.tsx`: at the trailing end of the header's
actions beside the search box and "View website" (top right in English, top left in Arabic,
as the direction flips with the other controls, ADR-058), and at the foot of the phone
drawer. Above 1024 px it is a `role="group"` labelled "Panel language" / «لغة اللوحة» with
the two names, each in its own language and never translated («العربية», "English": Payload's
`languageOptions`, each pack's `general.thisLanguage`), the current one `aria-pressed` and
visibly marked; at 1024 px and under it folds to one icon with its label as a tooltip
("Switch to Arabic" / «بدّل إلى الإنجليزية») that toggles to the other language. No cookie
of ours: a click calls Payload's own `switchLanguage` from `useTranslation()`, which runs
the server action the root layout hands its provider (the `payload-lng` cookie, a year,
path `/`; no `cookiePrefix` is set, so the name is exactly that) and then `router.refresh()`,
and the root layout, a server component, reads the cookie again for `<html lang dir>`, the
client config's translations and everything `useAdminStrings()` reads: one refresh, no
reload (the e2e counts no `load` event), the control disabled while the switch is pending.
The account view's own select stays and agrees with the header. **The refresh is a reload
for a document form:** Payload's `Form` replaces its state from the server's `initialState`
on every `router.refresh()` (`forms/Form/index.js`, `REPLACE_STATE` with `optimize: false`),
so unsaved changes are gone after a switch; the account view's own select has always had
the same effect, unnoticed on a page with no content form. On an autosaving document
(pages, posts, products, testimonials, home; 1.5 s) the draft comes back, so the text is
there; on any other form it would be lost, so a sentinel inside every document form
(`document/form-modified.tsx`, first in the `beforeDocumentControls` slot every config gets
through `admin/document/config.ts`; an entity's own action such as Generate now comes after
it) mirrors Payload's `useFormModified` onto `<body data-admin-form-modified>`, counted per
form so a document drawer over an edit view does not clear it, taken off on unmount so
leaving the view leaves no stale flag; while it is set the switch asks first in our
`Dialog`: "Unsaved changes are lost when the language changes. Save first, or switch
anyway." with "Switch anyway" (amber: careful, not red) and "Cancel". Two forms render no
`beforeDocumentControls` and are not guarded: the account view's own small form and
Payload's bulk "Edit many" drawer on a list; both stay as they are. The e2e
drives the switch at 1440 and 390 in both directions (the cookie by name, `lang` and `dir`,
the marked name, the placement, the tooltip, the drawer's copy, axe on the header in both
languages), the autosaved page's text back after a switch, and the site settings' guard
(cancel and Esc keep the text and the language, "Switch anyway" flips the panel).

## ADR-057: Side-by-side bilingual editing (2026-09-18)

Dhia's brief, from the pre-launch programme (Phase 2): "I do not want to edit English and
Arabic separately by switching the page language. Put the Arabic and English sections side
by side so both are visible at the same time." Settled with the CTO before code as
**approach A**: no change to how Payload stores or validates a locale, a custom field on top.
**What is side by side.** Every localized `text`, `textarea` and `select` field that holds
one value and sits outside an array or a blocks field: `describeFields()`, the one pass every
config's fields go through (ADR-046), renders it with `BilingualField`
(`modules/cms/admin/fields/bilingual/*`), Payload's own field for the open locale beside the
same input for the other locale, tagged with the other code by the same pill ADR-044 draws
on localized labels (`.admin-locale-tag` shares the declarations in `admin.css`). In a row
the pair takes the full line unless the config gives the field a width; under 32 rem of
container width the two stack. Seventy fields across fourteen collections and globals (the
home page's 28, the site settings' 8, the products' 7, the pages' and the posts' 4 each, the
engine settings' 4, and so on) became bilingual with no config edit. **What stays on the
switch.** Rich text (Lexical), arrays and blocks (their rows are shared and their text per
language, ADR-044), uploads and relationships, a `hasMany` text or select, and a localized
field that has a widget of its own; the locale note before the document controls now says
so in words ("A field tagged AR has its English beside it: type the English next to the
Arabic, one Save writes both. Rich text, lists and blocks stay per language: switch the
locale at the top to edit their English. Fields without a tag are shared."). **Why a second
write.** Payload 3.89 writes one locale per request: `beforeChange/promise.js` keeps the
stored value for every locale but `req.locale`, and there is no all-locales write. So the
other language's edits wait in `translations`, a hidden non-localized JSON on the same
document (`admin.hidden`, out of the description maps, a `Diff` component that renders
nothing keeps it out of the versions view, read by signed-in staff only), shaped
`{ [otherLocale]: { [fieldPath]: { value, base } } }` where `base` is what the other locale
held when the editor started (read once per document view through the REST API in the other
locale, `fallback-locale=none` so an empty English reads as empty, `draft=true`, and again
after every save, by a small store shared by every bilingual field on the page). The locale
key is not decoration: a session that typed English while editing Arabic, autosaved, then
switched the locale must never write that English into the Arabic; the hook applies only the
entries of the locale that is not being saved. The collection's and the global's
`afterChange` hook (`hooks/translations.ts`, listed after the entity's own hooks) applies
them with `payload.update({ locale: other, req, draft: doc._status === 'draft' })`
(`updateGlobal` for a global), with `translations: null` in the same write (non-localized,
so it rides along; no third write), inside the same transaction because it carries `req`,
with `overrideAccess: false` so the second write is exactly what the editor could do
themselves. Payload's `createLocalReq` writes `locale`, `fallbackLocale`, `context` and
`query.depth` onto the `req` it is handed, so the hook puts them back in a `finally`; the
hooks after it and the response still need the request's own. **The three guard rails.**
(1) A Save or Publish applies; an autosave (`?autosave=true`) never does: the entries ride
along in the draft version until a real save, and survive a reload. (2) An entry applies
only when the editor changed it (`value !== base`) and the other locale still holds `base`
at apply time (read first): a stale prefill loses nothing, the stored edit wins, and the
client drops the entry the next time it reads the other locale. When entries exist but none
applies (all stale), that save makes no second write and the row's JSON is not cleared: the
base check keeps the entries inert and the client's reconcile drops them on the next open,
so a stale entry lives in the row until the next applying save. (3) A refusal in the other
locale fails the whole save: the second write throws, the transaction rolls back (Payload's
nested operation kills it), and the editor reads a `Refused` naming each field and the
language ("Title in English: This field is required."); a collection's own rule (a post's
publish rules) is prefixed with the language. The second write runs the hook again with
`context.skipTranslations`, which returns at once; the entity's other hooks run for the other
language as they would on the locale switch (the revalidation pings the other language's
URLs, which did change). Only paths `bilingualPaths()` names are ever written: the JSON
comes from the client, so `_status`, a slug, a secret or a row inside a block cannot be
smuggled through it; and the row stores whatever a signed-in user sends, so the field's
`validate` refuses more than 200 entries or 64 KB serialised, with the reason in the panel's
language. A bilingual Save leaves two version rows, one per language write, so the history
is measured in language writes and the cap doubles: `maxPerDoc` 50 on products, pages and
posts (was 25), 20 on testimonials (was 10), `max` 50 on the home page (was 25).
**Known limits, as on the switch.** A draft save skips validation, so
a blanked required English text lands in the draft and a later Publish from Arabic does not
re-validate English (Payload validates the request's locale only); the English site's gate
(a document reaches it when its title-like field has an English value, ADR-043) is the net.
Touching any English field on a Publish validates the whole English document, exactly as a
Publish from the English locale does: an English side half filled fails with the fields
named. **Tests.** `tests/translations-hook.test.ts` (the apply's table: changed, unchanged,
stale, a required blank, a collection's refusal, an autosave, a draft, the re-entry guard,
the locale key, a nested path and a smuggled one, a global, the request put back after a
throw); `tests/admin-config.test.ts` (the component sits on exactly the bilingual paths of
every config, never on rich text, arrays, blocks, uploads or relationships; the JSON and the
hook go together; the hidden field needs no description); two e2e in `e2e/admin.spec.ts`
(a page's title and the site settings' tagline in both languages in one Save, read back
with `?locale=all`, the refusal of a blanked English title). Migration
`20260918_033852_translations`: one nullable `jsonb` on the fourteen tables and the five
version tables. The bilingual root carries no `data-admin-ui`: it hosts Payload's inputs,
which the shell's element reset would strip; `data-admin-bilingual` is the e2e hook.

**Amendment, 2026-09-18 (PR A of `docs/plans/2026-09-18-no-locale-switch.md`): rows too.**
Dhia, after seeing the live panel: "there is no editing for the English content separated
from the Arabic; something that has Arabic and English has the two fields next to each other,
not a switch of where you are editing; the header's locale change is the same thing; I don't
want to be switching between them, one edit for both languages." The rule that settles the
classes, with the CTO: a light field (text, textarea, select, number) keeps the JSON entry; a
heavy field (rich text, upload) gets a real sibling twin (PR B). So the paragraph above that
kept arrays and blocks on the switch is reversed: `describeFields` renders every localized
light field inside the rows of an array or a blocks field with `BilingualField` too (55
fields across the products' colours and sizes, the pages' blocks, the home page's slides,
chips, steps and reasons, the site settings' menus, the search defaults' routes, the posts'
takeaways), and the entry is keyed by the row's id, never its index
(`hero.slides.<rowId>.headline`, `blocks.<rowId>.items.<itemId>.title`): the admin form makes
the id when a row is added (`ADD_ROW` in `@payloadcms/ui`'s `fieldReducer.js`), the server
keeps a supplied id, and Payload's own locale merge for rows is id-keyed
(`getExistingRowDoc.js`), so a reorder keeps the entry with its row, a deleted row's entry is
dropped, and a duplicated row (a new id) starts with an empty other language, which the
list's description says. `bilingualPaths()` is a config walk (`shapeOf`) that also yields,
per array or blocks path and per block slug, which subfields are localized; the hook
resolves every entry key against it and the saved document at apply time (`resolveKey`: a
bilingual leaf, a row the document has, the row's block type), so a crafted id, a
non-localized subfield or a `blockType` never reaches the write. Payload's array write is
positional and a partial list would drop the other rows, so an entry inside a list sends the
whole list in the other locale (`otherLocaleRows`): for each row of the saved document by
id, the non-localized subfields from it, the localized ones from the stored row of the other
locale matched by id (null for a row that locale has no text for yet: a row added on the
same save), the planned writes on top; nested lists the same inside their row; the saved
language's text is never copied into the other. The base check is unchanged for scalars and
for rows alike (`readKey` walks a list by id). Two consequences worth knowing: touching any
English field of a list on a Publish validates the whole English list, so a row added
without its English fails with the field named, the same net as a half-filled English side
elsewhere; and a list localized as a whole cannot be paired, so `posts.takeaways` became a
shared array with a localized `text` (migration `20260918_114349_takeaways_rows_shared`: the
Arabic rows keep their ids, the English text moves under them paired by `_order` as the seed
created it, the versions table the same, both directions verified on a copy of the database
and read back with `?locale=all`); `seo-defaults.routes` already had that shape since the
initial migration, so there was one restructure, not two. The post's `warnings` stays
localized as a whole: computed and read-only, a fact, not an edit. What still stays on the
switch: rich text (the page block's body) and uploads (the hero's two photos), until PR B's
twins. The locale note says so ("inside lists and blocks too", "Rich text and images stay
per language"). Tests: `tests/bilingual-rows.test.ts` (the walk, the resolver, the key
reader and the index-to-id mapping, the row builder: reorder, delete, a new row on the same
save, a nested block array, a crafted id and a crafted non-localized path with the block
slug, the Arabic never copied into an untouched English row), the hook with a blocks row and
with a made-up row, the census in `tests/admin-config.test.ts` (55 in rows; the three heavy
row fields; the one whole-localized list); two e2e (a comparison row's text in both
languages, a fourth row with its English and a keyboard move in one Publish; a hero slide's
line on the home page). The mechanism is built for exactly two locales: with a third, the
pair resolver returns nothing and every field falls back to Payload's switch (a decision to
take the day a third language is added, not a bug).

**Amendment, 2026-09-18 (PR B of the same plan): the heavy twins.** The light/heavy rule
as built: a light field (text, textarea, select, number) keeps the JSON entry; a heavy field
(rich text, upload) gets a real sibling field, `<name>Twin` (`twinField()` in
`fields/bilingual.ts`: `type` and `editor` or `relationTo` copied from the original,
`localized: false`, labelled «النص بالإنجليزية» / "English text" or «الصورة بالإنجليزية» /
"English photo", read by signed-in staff only, `NoDiff` in the versions view, the class
`admin-twin` that `admin.css` gives the EN pill and a left-to-right editor), placed right
after the original in the config so Payload's own component renders the Arabic full width
and the English full width under it. Form state exists only for config paths, which is why
a second Lexical on the JSON was never possible and the twin is a column: `content_twin` on
the page's rich-text block, `body_twin` on the post, `image_desktop_twin_id` and
`image_mobile_twin_id` on the hero slide, and the same on their versions tables (migration
`20260918_131849_heavy_twins`, additive). The four heavy fields of the census are covered
(`pages.blocks.richText.content`, `posts.body`, `home.hero.slides.imageDesktop` and
`imageMobile`); `shapeOf` records a heavy field as a twin only when its twin follows it in
the same field list with the same editor (two sanitized adapters count as the same editor
when their features match, since Payload turns the one `lexicalEditor()` provider into an
adapter per field) or the same collection, and `tests/admin-config.test.ts` refuses a
localized rich text or upload without one. **Population.** The plan said an `afterRead` hook
with one extra English read; it is a `beforeRead` hook with none (`populateTwins`,
`populateGlobalTwins` in `fields/twins.ts`): Payload runs a collection's or a global's
`afterRead` hooks inside `update` too, before `afterChange`, where it would have overwritten
the typed English with the stored one and refreshed its base before the apply read either,
and a global's hook cannot tell that pass from a read; `beforeRead` runs in read operations
only and, as Payload documents, before the locales are flattened, so the document it sees
carries every locale (`{ ar, en }`) and the twin is filled from the document's own English.
It runs for a signed-in user reading the default locale, never under the re-entry flag, so
the site's reads and the mechanism's own English reads pay nothing and a first admin read
costs one walk of the document and no query. A twin that is null is filled and its base
written into the hidden JSON under the original's key as `{ base }` (a sha256 of the
canonical English rich text, keys sorted at every level so jsonb's order never matters; an
English photo's id); a twin holding a value is the pending English of an autosaved draft
and is kept with its base. **At rest every twin is null.** The twin's own `beforeChange`
stores null on a Save or Publish and keeps the value on an autosave (so a draft carries the
pending English across a reload), and the apply reads what was typed from the request's
data (Payload's field hooks run on a copy), falling back to the document before the write
for a twin the request did not send: Payload's scheduled publish and any script writes
`data: { _status }` alone (`versions/schedule/job.js`), the JSON rides into it by field
fallback, and `previousDoc` is the draft as stored, its twin the English an autosave kept
or null at rest, so a pending English lands with the light entries while a null is never
read as "cleared" (the CTO's review of this PR). The apply treats a twin as one more entry: the
value from the data by row id, the stored English from the read in the other locale, and
`twinApplies` (the value's base differs from the entry's and the stored English still
hashes to it) decides as the light fields' base check does; a rich text or photo cleared
over an existing English applies and lets Payload's `required` refuse it on a Publish
("Content in English: This field is required."), an empty photo over none is nothing. An
applying twin lands on the original's key in the same nested write, a twin inside a row
through the whole-list row build (`otherLocaleNode` already carried the heavy names; the
write overlays the value where a light entry's would sit); the row's twin travels null. The
response to the save shows every twin as the English now stands (the written value, or the
stored one read before the write) with a fresh base in the JSON, so the form the admin
rebuilds from the response is ready for the next save without a reload. A duplicated row
copies its twin (the form copies the row's fields), so the English rich text or photo comes
along while the light fields' English starts empty; a list whose rows hold a twin says so
(`SHARED_ROWS_WITH_TWINS_NOTE`). The twins pair with a save from the default locale only;
while the English locale itself is open `admin.css` hides them (the original is the
English there) and a save from it stores null. The public API never carries a twin (the
field's read access) nor the JSON, and the site's mappers read none
(`tests/bilingual-twins.test.ts` maps a page and the home page with the twins filled and
null and gets the same). Tests: `tests/bilingual-twins.test.ts` (the field's hooks and access, the canonical
hash stable across key order and changed by content, the upload base, `twinApplies` in the
differs, equal, stale, nothing-yet and cleared cases, the population's guards and its
fill by row id, what a write carries, what the response shows, the mappers),
`tests/translations-hook.test.ts` (a rich-text twin written and shown, equal, stale, a
first English over none, a block row twin by id with the whole list, an upload twin by id
with a cleared one written as null, a save in English ignoring them, a light entry and a
twin in one write), `tests/bilingual-rows.test.ts` (the walk's twins, the resolver's kinds,
a twin write inside its row, `writeKey`), the census; two e2e in `e2e/admin.spec.ts` (a
page's rich-text block edited in Arabic and in its twin by one Publish and read back with
`?locale=all`, both bodies, the twin null, the JSON cleared, then the English emptied and
refused with the field and the language named; a hero slide's English photo cleared and
picked again through the twin's own picker, landing in `?locale=en` with the Arabic and the
other slides untouched; a Publish that touches only Arabic making one version, not two:
the one premise resting on Lexical's internals, that mounting the twin's editor does not
re-serialise the English, pinned). A package upgrade that bumps Lexical's node versions
makes one content-identical English write with a version on the first save of each
document, and heals itself there. `shapeOf` is memoised per field array (a `WeakMap`), so
a read or a save pays the walk once per process. What still follows the locale control:
nothing of one value; the switch itself goes in PR C.

**Amendment, 2026-09-18 (PR C of the same plan): no locale switch.** Dhia's sentence, the
directive of the plan: "I don't want to be switching between them, one edit for both
languages." The light/heavy rule as it stands: a light field (text, textarea, select,
number) is edited in both languages side by side through the JSON entry; a heavy field
(rich text, upload) through the real twin under it; a read-only fact with two languages
shows both (the rule reaches what nobody edits too). **The gate.** The switch went only
once the census in `tests/admin-config.test.ts` read zero: of the 131 localized fields
across the 23 configs, 125 light ones wear `BilingualField` (55 of them inside rows), the
four heavy ones are followed by their twins with the same editor or collection, and the
post's two computed facts, `warnings` (the one list localized as a whole) and
`readingMinutes`, both read-only and written by the post's own `beforeChange` for the
language of each write (the nested English write included, so the English warnings follow
the English body), carry widgets that show the other language under the open one:
`WarningsField` lists the English warnings under the Arabic ones, `ReadOnlyLine` the
English reading time under the Arabic, each language under its pill (`LocaleTag`), the
English read through the same shared store the form's bilingual inputs use
(`useOtherLanguage`, one REST read per document view, again after every save; a field that
is not localized pays no read), with the loading and the failure lines while it is not
there. Nothing is an exception, and the census names anything else by entity and path, so
a future localized field that lands there is a field no widget shows the other language of
(a heavy field without its twin, a light field with a widget of its own, a `hasMany`, a
relationship, a list localized as a whole) and no switch reaches. **What went.** Payload's localizer in the header (its button
and the spacer it kept under it) is hidden in `@layer payload`, and the header's controls
took the gutter it held; the locale note before the document controls, its rows in
`admin.css`, the `localized` option of `collectionComponents` / `globalComponents` and the
`locale.legend` / `locale.editing` strings of both trees are deleted (a note that named an
"open language" had nothing left to say); the `SHARED_ROWS_NOTE` sentences now read "a
duplicated row copies the Arabic only; its English starts empty"; the twins' hiding under
the `en` locale went with the `en` view; the AR pill on a localized label is static in the
stylesheet, since the panel edits the default locale and nothing else, and the header no
longer writes `html[data-content-locale]`. The Publish menu's "Publish in Arabic"
(`publishSpecificLocale`, a different path through Payload's update that would leave the
English where it was) and the schedule drawer's "Locale to publish" select are hidden the
same way: publishing both languages at once (the drawer's default, "All") is the one
supported choice, and the e2e asserts the menu and the drawer offer no other. The REST
API still accepts `?publishSpecificLocale=<code>` on a write, and such a write is outside
the mechanism: the hook pairs the request's `req.locale` (from the query) with the other
locale and knows nothing of a per-locale publish, whose path through Payload's update
(`update.js`) is a different one; nothing in the panel sends it, and a script that does is
on its own. Payload's
"Copy to locale" in the document menu stays: a data operation, not a view, and the
navigation it ends with (`?locale=en`) is caught by the redirect below. **The stranded
preference.** Payload's `RootPage` writes every `?locale=` it is given into the person's
persistent `locale` preference (`getRequestLocale` in `@payloadcms/next`) and reads it back
on every admin request after, and its client `LocaleProvider` reads the same query, so an
old English link would have left someone in the English view with no switch to come back.
Two things close that: migration `20260918_142817_purge_locale_preference` deletes every
`locale` row of `payload_preferences` (data only, `down` a no-op), and the proxy now matches
`/admin` too (`PROXY_MATCHER`, `ADMIN_PREFIX` in `lib/site-routes.ts`, the CMS config's
`routes.admin` reads the same constant) and answers an admin URL carrying `?locale=` with a
307 to the same URL without it, before Payload's page runs, the other parameters kept
(`stripAdminLocale`; the `Location` is absolute on the request's own origin because Next's
proxy adapter parses it with no base and answers a relative one with a 500, then
relativises it when its host is the request's, which holds by construction, so the browser
gets `/admin/...` in the container too, where `request.url` names the bind address; every
other admin request passes through untouched). Payload's own
push to `?locale=ar` after a create or a duplicate costs one such redirect, and the
`LocaleProvider` never navigates, so the redirect cannot loop. The visibility
guides that linked a document "in the locale that is missing" now link the field that
fixes the finding (Payload's `field-<path>` input id as the fragment; the anchor scrolls
only when the field's tab is active, and the guides name the tab) and say which column
("the English field beside the Arabic title", "the English body is the editor under the
Arabic one"); the dashboard's "documents without English" link lands on the title field
the same way; no URL under `src/` carries `?locale=` (`tests/visibility.test.ts` walks
every rule's links). **What the REST `?locale=` still does.** Everything it did: the API
is outside the proxy's matcher, so `?locale=en` reads or writes the English document,
`?locale=all` returns every language, and the mechanism's own English read and nested
English write use it; only the panel lost the query. Tests: the census gate, the proxy
(`tests/site-routes.test.ts`: the 307 with its `Location`, the root, a pass-through, a site
path that merely starts with the letters), the strings without a `locale` branch, the
helpers without the option, the guides' links and sentences, the two widgets with both
languages, the loading and the failed line, and the one-locale case; the e2e (no visible localizer
and no note on a document, a global and a list from 390 to 1440 px, in English and in
Arabic; a light pair beside a stacked heavy pair on one page; the English text and the
English rows landing in `?locale=en` REST reads after one Save; the empty English refused
with the field named; the Publish menu and the schedule drawer without a locale; the twin
adding no axe violation of its own; a `?locale=en&foo=bar` admin URL redirected to
`?foo=bar` with no preference left behind and the next form in Arabic).

## ADR-058: The sidebar: one tree, one breakpoint (2026-09-18)

**Context.** The admin audit of 2026-09-18 (section 1) found two open/close systems by
width (Payload's drawer with its hamburger at or under 1440 px, our collapse button and a
rail above), a 1440 px laptop treated as a small screen, a rail that was an icon wall of 26
entries, group headers that looked like entries, document counts sitting where badges sit,
an active entry with no edge mark and two account entry points. Dhia wanted Cloudflare's
sidebar: groups with a clear open/close control, separation between groups, the active entry
unmistakable, the collapse control where the hand expects it, the same on narrow screens.
The audit weighed a two-tier sidebar (a rail of groups beside a panel of the selected group's
entries) against one sidebar with collapsible groups and the collapse toggle at the bottom,
and recommended the second, shape B, for five groups with 26 entries; the CTO agreed with
two corrections kept from the design memo and two settlements.

**Decided.** Shape B, as built in `src/modules/cms/admin/nav/*`:

- **One tree.** The dashboard is a real entry (active on the admin route alone). The five
  task groups of ADR-046 are rows of 40 px, weight 600, an 8 px dot in the group's hue before
  the name and the chevron at the end; the whole row toggles (`button[aria-expanded]` owning
  a `role="group"` labelled by it, the list inside it, because an `li` under a `ul` whose
  role is overridden fails the list rule). Entries are 36 px with a 24 px disc in the group's
  hue; secondary entries 32 px and 13 px under a 2 px guide line; a hairline between groups
  only. The active entry sits on its group's tint with a 3 px bar on the leading edge and a
  solid disc, `aria-current="page"`, and its group is forced open unless the person closed
  it on that very page. Hover is `surface-2`, focus the accent ring.
- **The two corrections kept.** The state (open or collapsed, each group) stays in Payload's
  `nav` preference, per user and server side, never `localStorage`; the hues and the active
  tint are ADR-046's, not Cloudflare's single grey. The registry `ADMIN_NAV` is untouched.
- **Counts out, badges only for action.** No entry shows a document count (ADR-046 amended).
  A badge stays for a number that asks for action: runs that failed this week on Runs (red),
  posts whose newest version is a draft on Posts (amber), connections past their monthly
  limit on Connections (red). One number per thing (the CTO's review): the first two are
  the dashboard's own readers (ADR-059, `dashboard/readers.ts`): `failedRuns` over its
  `FAILED_RUNS_DAYS` window and `draftsWaiting` for posts through `countVersions` with
  `latest: true`, so the badge, the dashboard's tile and its hand line show the same figure
  and say it in the same sentence (`dashboard.hand.failedRuns`, `dashboard.tiles.drafts`);
  the third is `overLimitConnections` beside `connectionSpend`. Read in parallel with the
  user's access, never cached, a failed read logs and leaves the entry bare. The cost,
  counted the way ADR-059 counts the dashboard's: five queries per page render for an admin
  (the runs' one `count`, the drafts' two `countVersions`, of which the badge shows the
  waiting one and not the stale one, and the connections' two `find`s), two for an editor
  (the drafts; the other entries are not in the editor's sidebar), each a few milliseconds
  warm.
- **One breakpoint, Payload's `m` (1024 px).** Above it the sidebar is inline: open at 264 px,
  or the 64 px rail when collapsed by the one button above the account (« open, » collapsed,
  mirrored in RTL): the brand mark, the dashboard icon, the five group icons (the active
  group's with the bar, a group with a badge with a dot) and the avatar; a click on a group
  icon opens a 224 px flyout of the group's entries, a Radix `DropdownMenu` of links (focus
  moved in, arrows and a typed letter, Esc back to the icon), since a Popover is not among
  the repo's Radix packages and a menu of links is the right role for it anyway. The tree and
  the rail are both in the markup and the stylesheet shows one by the aside's open class, so
  a collapsed sidebar paints as a rail on the first frame. Payload's provider closes the nav
  at or under its `l` breakpoint (1440 px) on hydration and on a resize; a layout effect puts
  the preference back before paint, and the stylesheet keeps the nav visible and in the
  template's grid from 1025 px up, which is how the 1440 px special case goes. At 1024 px and
  under the sidebar is a drawer over the page (320 px; the full width under 768): our
  hamburger at the leading edge of the header opens it (Payload's two hamburgers and its
  header avatar are hidden in `@layer payload`), the X at the same spot inside the drawer,
  Esc, a tap on the scrim or a navigation closes it, the page behind is `inert` while it is
  open, rows are 44 px, the collapse button hides, the account block and the panel's
  language switch (Payload's `switchLanguage`) sit at the foot.
- **The keyboard model** (`keyboard.ts`, pure, tested). The tree is a `nav` with `aria-label`
  and one tab stop: a roving `tabindex` puts Tab on the row focused last, else the current
  page's entry, else the first, and Tab leaves after it; Arrow Up and Down walk the rows
  without wrapping, Home and End jump to the ends, a typed letter jumps to the next row whose
  label starts with it (folded like the palette, so «ا» finds «أدوات»), wrapping; Enter or
  Space toggles a group, Enter opens a link. "Tab through every row" and "roving tabindex"
  cannot both hold; the roving model is the accessible one, and every row is still one
  arrow away.
- **The header.** The search box is 240 px and grows to 320 on focus; "View website" keeps
  its text; both fold to icons at the drawer widths, where Payload caps the actions at
  300 px, and icon-only carry a tooltip beside their label (the icon-only rule). The locale
  switcher stays in the header (it leaves for the document header with the side-by-side
  editing, section 4 of the audit) and moves into the gutter the avatar left, so it no
  longer overlaps our controls. The sidebar stays on the page colour, not one step above
  it: the identity hues on their tints reach 4.5:1 there (blue 4.9, violet 5.3) and fall
  under it on the surface (4.1, 4.5), which is also why the flyout, a menu on the surface,
  marks its active entry with the hue, the weight and the bar and no tint; and the flyout is
  not modal, because a modal menu marks the rest of the page `aria-hidden` with the focused
  icon inside it, which axe refuses.

**Not done here.** Palette hits ranked by match quality (the audit's 1.9) is the palette's
own change; `g` then a letter to jump to a group, the audit's "later, not now".

## ADR-059: The dashboard: what matters at a glance (2026-09-18)

**Context.** The admin audit (`docs/audits/2026-09-18-admin.md`, §5) found the dashboard a
server report and a save log: an owner could not answer "how is the site doing" from it (no
visits over a range or trend, no cited rate, no drafts waiting, no published this week, no
spend against limits, no next runs), the system-status card mixed what an owner acts on
with what the environment is, the engine card listed the ledger's runs, and nothing had a
range. The audit's section 5 proposed seven sections and named the reader behind every
number; the CTO agreed with four edits.

**Decision.** The dashboard (`modules/cms/admin/dashboard/*`, still Payload's
`views.dashboard` inside its template) is seven sections, top to bottom: (1) the greeting
by the Riyadh hour, the 7 / 30 / 90 day range at the trailing edge and the "needs a hand"
line (failed runs this week, a connection at its limit, an enabled connection whose last
Test failed, documents without English, drafts older than a week); (2) four tiles: visits
with the change against the previous range, the cited rate, the visibility score with its
trend, "went live" in the range (a post by its publish date, a page or product by the last
save of the live document, which the hint says) with the drafts waiting; (3)
where visits come from; (4) what the assistants say; (5) the content; (6) the engine and
the spend; (7) the server. The quick-action tiles fold into section 5 as the home tile and
two bordered buttons ("Write a post", "Add a product"); "Add a page" and "Add a question"
are one click away in the sidebar and leave the dashboard. The four edits: the cited-rate
tile says "on the category prompts" (the brand prompts are outside the rate, cost audit §2);
section 4's next run is the next morning a prompt is due, computed by the run's own
`duePrompts` against the last citation day per prompt and connection over the ledger's
window (`schedule.ts`), or the plain sentence "07:00 Riyadh, when a prompt is due" when
there is no prompt or no enabled connection; section 6's spend bar turns amber with "No
monthly limit" when a connection has none, as the ledger card does, and red at the limit;
"drafts waiting" is the one number the documents table cannot answer (a newer draft over a
published version lives in the versions table), so it is two `countVersions` on
`latest: true` per content collection, the dashboard's one non-trivial query, and every
count links to the list filtered on `_status`. "Run now" stays off the dashboard: it costs
money and lives on the Score page.

**The range control** is a search param (`/admin?days=30`), rendered by the server as links
with `aria-current`, no client state; anything but 7, 30 or 90 is the week. It drives the
visits tile, the published tile and the visits section; the cited rate keeps the ledger's
28-day window and the engine its month, as the audit sequenced. The previous range is the
double range minus the current (`trafficSummary` twice).

**The readers.** The existing ones are reused as the audit's table names them
(`trafficSummary`, `reading` and `scoreTrend`, `ledgerReading`, `engineSummary`,
`healthReport`, `recentActivity`); four are new (`readers.ts`): published in the range
(posts by `publishedAt`, pages and products by the last published save), drafts waiting and
stale, documents without their English title (`locale: 'all'`, no fallback, nothing while
the site is Arabic only) and one row per AI connection with `connectionSpend`; plus the
failed runs of the week and the next occurrence of each scheduled task, computed on the
Riyadh clock from the cron each task exports beside itself (`visibility/schedule.ts`,
`visibility/ledger/schedule.ts`, `ai-content/schedule.ts`: one constant read by the task and
by the dashboard, so the two cannot drift). One server render, every read in one `Promise.all`, each guarded: a failing reader
logs and its section shows the "not available" word; a reader the user may not run is
skipped and its section is not rendered (the editor's dashboard is the greeting, the
published tile, the content and the server). Nothing new is cached: the score reading keeps
its minute per process and user; a render of an admin's dashboard is about fifty-five small
Local API calls (sixty-five when the score's minute has lapsed), the largest shares the
latest-saves walk, the health report's engine state and the score snapshot, all parallel.

**The engine card** loses its run list and its average score (the runs page holds them; a
failed run reaches the "needs a hand" line) and gains the caps: posts against the monthly
cap, today's cost against the daily cap. `engineState` reports the two caps.

**Both languages.** Every string in both trees; the Arabic counts (runs, documents, drafts,
engines) decline through `arabicCount`; the greeting is «صباح الخير» in the morning and
«مساء الخير» from noon (Arabic has no afternoon greeting); `formatSlot` says "today 07:00",
"tomorrow 04:00" or the date, the hour on the Riyadh clock, Western digits. Bars grow from
the start edge (`inline-size`); the server section is a native `details`, so it folds
without JavaScript and opens itself when a row is red.

**Tests.** `tests/dashboard.test.ts` covers the range with its default and bounds, the
greeting, the "needs a hand" rules, the crons against the tasks, the next occurrences, the
ledger's next morning, the four readers against a recorded fake Payload, the tiles and the
actions by permission; `tests/admin-format.test.ts` covers `formatSlot`. The admin e2e walks
the seven sections, the range as a link, the drafts link with its `_status` filter, the
server folded unless red, the editor's view, and axe on the dashboard in both languages.

## ADR-060: Icons and colour in the panel: two hue carriers per screen, a colour with its word (2026-09-19)

**Context.** Dhia's second Arabic-panel brief (2026-09-19, `docs/plans/2026-09-19-arabic-panel-2.md`,
PR 3): "more icons and colours inside the admin dashboard to improve the overall UI". The
panel had ADR-046's identity hues in more places than the eye could rank: the page header
carried its group's hue twice (a bar and a disc), the active form tab read in the accent
whatever the group, the dashboard's content card mixed three hues (a page's disc blue, a
product's teal, a post's violet, plus the action buttons), and a document's status in a
list was Payload's plain word. Form tabs, collapsibles and groups had no icons at all. The
CTO settled the rule before the build.

**Decision: the colour rule** (design system §2, one sentence). A screen shows its group's
hue in at most two places, the entity header's icon tile and the active tab's bar; a status
colour appears only on the status pill and the `BoolCell`; every other icon is the text
colour, every other surface neutral. Green is live, amber is draft or careful, red is failed
or delete; a colour never appears without its word. On the dashboard the card's icon takes
the group hue, the body stays neutral, never two hues in one card. The sidebar keeps
ADR-046's group hues as they are. This amends ADR-046's "carried onto the page header's disc
and bar and the dashboard's discs": the header's bar is neutral now, the dashboard's
per-entity discs are neutral, and the hue moved to the card's title icon. Kept as they are,
each a colour beside its word: the hand line's and the server rows' green and amber
(ADR-059), the Score page's finding icons (ADR-049), the accent on Payload's Edit and
Versions tabs (blue is "active", §2's table), and the report pages' one identity hue on the
ring and the bars (ADR-048, ADR-049: a report, not a document). A bar inside a dashboard
card keeps the card's one hue (the traffic bars pink, the engine's caps violet), amber and
red at a cap beside the badge that says so.

**Section icons.** A registry `SECTION_ICONS` in `admin/icons.ts` (a place for a section of
the site, a noun for a thing, the entity's own icon where the section is one: the product
strip is the products' shirt, a Search tab the search defaults' glass, the Engine group the
engine's bot) and `sectionIcon('key')` on the `admin` of every tab, every collapsible and a
labelled group with a noun of its own (the key rides `admin.custom.icon`, which Payload
keeps on the client). Never twice in one strip, never the entity's own icon, always the
text colour, 16 px. **How they are drawn, and why this way.** Payload 3.89 has no slot for a
tab's label (a tab's `admin` carries `condition` and `description` only) and never renders
a custom `Field` on a `tabs` field (`addFieldStatePromise` returns before `renderFieldFn`
for that type; found by the first build, which had put the widget there). A JSX-returning
`label` is passed through by `getTranslation` but breaks the words census and the diff
view; a CSS mask keyed by tab order would copy the SVGs into `admin.css` outside the
registry and shift when a tab is added. So `describeFields()` places a `ui` field
(`tabIcons`) right after every tabs field, carrying the tabs' keys in order, whose
`IconTabs` (`admin/fields/icon-tabs.tsx`) portals one icon into each
`button.tabs-field__tab-button` by index, never by text: Payload renders every tab button
in config order and keeps a hidden one in the DOM with `--hidden`, the button is a flex row
with a gap (so `order: -1` puts the icon first in both directions), and a portal's node is
left alone when the label or the error pill re-render. The icons mount after Payload's
render (a layout effect keyed on the tab count), one portal per button keyed by its index,
and when the tabs field is not the previous sibling or its buttons are not as many as the
tabs, nothing mounts: plain tabs are the degraded state, never a thrown error. One file
reaches into Payload's DOM, its header names the three package facts and the version they
were read at (3.89); the e2e asserts buttons = tabs on every tabbed form, so a Payload
release that drops hidden buttons fails a test, not a screen; when Payload ships a tab
`Label` slot, the file is deleted and the pass stops placing the field. A collapsible or a
group uses Payload's own `admin.components.Label` slot (`SectionLabel`, the fallback's own
markup with the icon first). **The active tab's bar** takes the document's group hue: the
portal span carries `data-admin-section-hue` (from `useDocumentInfo`), and `admin.css`
reads it through `:has()` on the active button's `::after`; the active label is the text
colour (it was the accent, a third carrier); a tab with errors stays red with its count.
`tests/admin-config.test.ts` refuses a tab or a collapsible without an icon, an icon
repeated in a strip, one that repeats the entity's, a strip out of place, and pins that the
pass places it.

**The status pill.** A document's `_status` in a list reads as a pill with its word
(`StatusCell`): Published green, Draft amber, and **Changed amber, its own word («معدّل»,
a glossary row), never folded into Draft**: a changed page is live with newer text waiting,
a draft is not on the site. The third word comes from Payload 3.89's list view, which marks
a draft row that has a published version `_displayStatus: 'changed'`
(`@payloadcms/next/dist/views/List/enrichDocsWithVersionStatus.js`, one `findVersions` per
list render) and hands that to the `_status` cell (`renderCell.js`); without our cell such
a row read "Draft". `_status` is not in our configs (Payload appends it at sanitize when
`versions.drafts` is on), so a drafted collection lists `statusColumn()`: Payload's
`mergeBaseFields` deep-merges a same-named field over its base, and the field carries our
cell and nothing of its own except the two keys sanitize insists on before the merge, the
type (a field without one throws) and the label key (sanitize stamps a label from the name
onto a field without one, which would then win the merge; ours is Payload's own
`version:status`); the options and `Field: false` stay Payload's. The runs' outcome carries
the same cell: Failed red, the rest neutral. `BoolCell` stays green and red. A status word
is a glossary row and a pair in both string trees before it is a pill.

**The dashboard.** `DashboardSection` takes a `hue` for its title icon (visits and
assistants pink, content blue, engine violet, server slate; an empty section the same); the
content card's home tile, its per-collection discs, the saves' discs and the action buttons
go neutral and the per-entity hue leaves `data.ts`; a draft in the saves reads amber like
every draft pill; a tile keeps its one disc.

**Tests and gates.** The config test's gates above and its `_status` walk (the censuses
leave Payload's merged column out); `tests/status-cell.test.tsx` for the tones and the
words in both languages; the admin e2e asserts the tab icons on every tabbed form and the
three collapsibles of a post, and, at 1440 and 390 in both languages, counts the hue
carriers of a product and a global (one tile, one bar, in the group's colour, the labels in
the text colour), reads the status pills' words in a list with a draft of its own, checks
the amber pill's contrast against its row (≥ 4.5:1, computed from the rendered colours),
and runs axe on a document, a global, a list and the dashboard.

## ADR-061: The inbox: the contact form's messages as rows under Site, stored before they are mailed (2026-09-19)

**Context.** BRD §11.1 asked for an inbox of the contact form's submissions with a status,
an assignee, internal notes and quick reply actions, and a dashboard view of new items
(Level 4, `docs/plans/2026-09-19-level-4.md`, PR 4a). Until now `/api/contact` validated,
rate-limited, checked Turnstile and sent one e-mail through Resend; a submission that
arrived while the key was missing or the provider was down was a 503 to the sender and
nothing anywhere else, and a sent one lived only in the mailbox. Dhia's interview settled
the scope: messages and, next, bookings; a status and notes; no assignee (one person
answers), no subscribers list (Resend keeps the audience; a future block), no daily
summary (the badge and the card are the summary).

**Decision: the row is the record, the e-mail a copy.** A `messages` collection
(`src/modules/inbox/messages.ts`): `name`, `phone`, `email`, `inquiry`, `message`,
`locale`, `page` (the path the form was on), `utm` (source, medium, campaign), `status`
(`new` · `following` · `handled`), `notes`, `emailed`. `/api/contact` runs in its old
order to the Turnstile check, then **stores the row first** through the Local API with
access overridden (`storeMessage`, the one writer; the collection refuses every create
through the API), then sends; a send that succeeds sets `emailed: true`, one that fails
leaves it `false` and the route answers 200 all the same, since the message is safe and
the panel shows the flag (a second attempt by the sender would only make a second row).
A store that fails is logged and the e-mail still tried; only a submission that could be
neither stored nor sent is an error to the sender (503 without a transport, 500 otherwise).
The form posts its `page` and the `utm` parameters of its own address; the route folds
what it gets by the traffic beacon's rules (`pagePath`, `UTM_MAX`) and falls back to the
`Referer` header, never refusing a message over its origin. A UTM value over the bound or a
page over the bound is invalid input like any other field. The newsletter is untouched.

**Where it sits.** A section **Inbox** («الوارد») first in the **Site** group, with its own
icon and the messages inside it; PR 4b adds the bookings there. Not a sixth group (every
free hue sits beside a meaning colour or the accent, and the "daily task" signal is the red
badge and the dashboard card, ADR-058 rule 14). `NAV_SECTIONS` gained a `place` (`first` or
`last`) and one pure order (`nav/order.ts`, `groupBlocks`) that the tree, the rail's flyout,
the keyboard model and the active-row rule all read, so a section can open a group (the
inbox) or close it (the engine under Blog) without the four disagreeing.

**The status words** are three glossary rows and three pills through `StatusCell`: **New**
blue («جديد», the one that asks for a person; blue because it is the thing to act on, not a
draft and not a failure; the `Badge`'s `accent` tone, `accent-on-tint` #33a8e6 on the
accent's 10 % tint, since `text-primary` is never used on dark and the accent itself on a
blue tint over the surface reads 4.1:1; this reads 5.3:1, and the e2e composites the pill
over its row through a canvas and asserts 4.5:1, CI's finding of 2026-09-19), **Following**
amber («قيد المتابعة», a reply pending, like a draft), **Handled** green («معالَج», done). «تمت المعالجة», BRD §11.1's word, is «تم» +
مصدر and the ux-araby gate refuses it; the passive participle is the panel's word and the
action reads «علّم كمعالَج» ("Mark handled"). The list is name · inquiry · status ·
created, newest first, searchable by name, e-mail and phone.

**The actions** above a message's form (`beforeDocumentControls` after the sentinel, one
component): "Reply on WhatsApp" opens `wa.me/<digits>?text=<greeting>` with a greeting in
the **message's** language (the `inbox.reply` records in both string trees, keyed by the
content locale; the panel's language never decides what the merchant reads), only when the
row has a phone; "Reply by e-mail" opens `mailto:` with a subject in that language; "Mark
handled" is an `ApiAction` on `POST /api/inbox/messages/:id/handle`, which goes through
`adminOnly()` with `roles: ['admin', 'editor']` (the guard gained a roles option and now
hands the route the person, so the write runs with their access, never the route's; a
write Payload refuses answers its status with the panel's own sentence in the caller's
language, `refusalOf`, never Payload's English under an Arabic button), turns
the form's status select to Handled through a field `UPDATE` with its `initialValue` (the
form stays clean, no unsaved-changes prompt) and disables itself with "Handled already."
once the row is handled.

**The badge and the card.** A fourth badge kind `inbox` on Messages: the count of `status:
new`, red when any, read by the dashboard's own `inboxReading` (one `find` with the user's
access, `status` indexed for it) so the sidebar, the card and their sentences agree
(`dashboard.inbox.newMessages`, declined in Arabic). The dashboard gained an **Inbox card**
before the Content card, a third of that row on a desktop and above it when stacked: the
sentence with the count linked to the list filtered on New, the newest three new messages
with the sender, the inquiry and the first 80 characters cut at a word (`excerpt.ts`), each
a link to its form, "All messages" at the end; «لا رسائل جديدة» when there is nothing. The
Site blue on the title icon is its one hue. Editors see it (they read the messages); the
hand line is untouched (ADR-059).

**Personal-data rules** (the first rows holding a stranger's name, phone and e-mail; rule
18 of `.claude/rules/admin-ui.md`): no personal field in any log line (a failed send names
the row's id; a failed store names the error's name alone, never `err:`, since a database
error's message is the failed query with its parameters, drizzle's `Failed query: …
params: …`, and pino's serializer would write the sender's fields out; the test reads
every key of the entry); the sender's fields carry field-level `access.update: () =>
false` and `readOnly`, so the record is what the form sent, for everyone: Payload answers
a refused field by dropping it from the write, so an editor's PATCH that names the phone
keeps the phone and the status change lands; `emailed` carries the same refusal on its
own, and `markEmailed` passes it only because the Local API's `overrideAccess` skips
field access; `status` and `notes` are the two fields anyone writes;
admins and editors read and update, an admin alone deletes, nothing is deleted
automatically (RUNBOOK); the outsider seat is proved in `tests/access.test.ts` and in the
e2e (list, read, create, update and delete all refused for the public key). The public
contact e2e removes the rows it creates with the admin's token when it has one.

**Consequences.** The contact form works from the day the site is up, before Resend is
configured: the messages wait in the inbox with `emailed: false` and the RUNBOOK says what
that means. A stored-but-unsent message is never retried automatically (there is no
outbox job; the inbox is the place to answer from). The e-mail body is unchanged (BRD
4.17). `adminOnly()`'s success now carries `user`. BRD §11.1 is amended (no assignee, the
subscribers list deferred, the status words); `docs/LAUNCH-CHECKLIST.md` gains the row "a
real submission lands in the inbox on production". Tests: `tests/messages.test.ts` (the
route stores then sends, a failed send keeps the row, a failed store still sends, the
honeypot stores nothing, the page and the UTM from the body and the referer, the bounds),
the access rows, the config census (the section, the icons, the columns, the pill, the
read-only lines, the refused updates), `tests/status-cell.test.tsx`, the badge reader and
the card's reader and excerpt, and the admin e2e (a submission through `POST /api/contact`
appears in the list with its pill, in the card and in the badge; the WhatsApp and mailto
targets; mark handled flips the pill, clears the count and disables itself; the editor
changes status and notes and never the phone; the outsider gets nothing; axe on the list
and the document in both languages at 1440 and 390; the row deleted at the end).

## ADR-062: Bookings of our own: the picker, the delegated calendar, the grid and the index, the signed link, the sweep (2026-09-19)

**Context.** BRD §11.2 planned the free consultation on a hosted Cal.com account embedded on
`/book` and the contact card, mirrored into the inbox by a webhook. Dhia's Level 4 interview
(2026-09-19, `docs/plans/2026-09-19-level-4.md`) settled otherwise: bookings are **built
inside b7r.sa**. Cal.com hosted is a second product for one event type, its embed a third-party
iframe on the site's most important page, its data outside the panel; the self-hosted
edition (Cal.diy) the vendor now calls non-production, and it would be a second app to run,
back up and upgrade for the least ownership. Every consultation still carries a Google Meet
link, created on the Google Workspace calendar of `b7r.sa` through the service account
whose key is already pasted for Search Console. The CTO settled the seven points below before
the build (plan review 88, GO with the settlements).

**The settings** are a global of their own, `booking` under Site beside Home and Site
settings (a place on the site with its own switch and its own revalidation, not a sixth tab
of the panel's largest form): the switch (`EnabledSwitch`), the consultation's bilingual
name, the length, the gap, the notice, the window, the daily cap, the weekly hours and the
closed dates in Riyadh time, the calendar owner's address. `site-settings.bookingUrl`
leaves the config; its column stays for a later migration to drop by hand, as ADR-025 asks
of every removal. An unsaved global reads its defaults from the seed; the seed writes it
once, off.

**The calendar by domain-wide delegation, two narrow scopes.** `signJwt` and `accessToken`
(`lib/google-jwt.ts`) take an optional subject: the assertion carries `sub: hostEmail`, and
Google issues a token for that user's calendar. The subject is always the settings' value,
never one from a request. The kind `google-calendar` (a row of its own under Connections,
the same key file pasted again, ADR-047's one row per service) asks
`https://www.googleapis.com/auth/calendar.events` and
`https://www.googleapis.com/auth/calendar.freebusy`, never the whole `calendar` scope:
delegation lets the key act as any user on the domain for the scopes the Admin console
granted, so the grant is exactly the two the feature uses. The client
(`modules/bookings/google.ts`) speaks `freeBusy.query`, `events.insert` with
`conferenceDataVersion=1` and a `createRequest` (`hangoutsMeet`, a fresh `requestId`),
`events.patch` and `events.delete`, all with `sendUpdates=none`: the merchant is an attendee
so the event is theirs on their own calendar if they use Google, but Google e-mails nobody;
the site's own e-mails carry the link, in the merchant's language, with the calendar file
attached. A Meet link still `pending` in the insert's answer is read again up to three
times a second apart; an event without its link after that reads as failed with its id, so
the sweep asks for the link rather than making a second event. The Meet `createRequest` id
is minted on the row (`meetRequestId`) before the first insert and reused by every retry,
so an insert that timed out on our side but reached Google is deduplicated by Google
rather than doubled (the CTO's revision of the phase-1 review; a row from before the field
existed gets its id written before its first retry). The `mock-calendar` kind
serves the tests and the review server, refused in production like the AI mock; its `fail`
flag (the row's `model` field) makes every call fail and drives the failed path end to end.

**The grid rule and the index.** A slot is `from` plus a multiple of `length + gap`
(`slots.ts`, pure, tested on the Riyadh day boundary), so two bookings that overlap share a
`start`. The route refuses a start that is not on the grid (400) and re-checks the day's
free slots inside the write (409); a partial unique index, `CREATE UNIQUE INDEX
bookings_start_active ON bookings (start) WHERE status <> 'cancelled'`, makes the race a
database refusal, which the store maps to the same 409 (Payload's adapter wraps the `23505`
as a validation error on `start`). A generated migration never carries a partial index, so
it is created and dropped by hand in its own raw-SQL migration, the snapshot beside it the
previous one unchanged. A cancelled booking leaves the index and frees its slot.

**The signed link, no token column.** The manage link's token is `<id>.<hmac>`, the
HMAC-SHA256 of the id under a key derived once from `PAYLOAD_SECRET` for the purpose
(`internalToken('booking-manage')`), verified in constant time. Nothing else is in it: the
route reads the row and decides by its status and its end (a cancelled or past booking
refuses every action; the link lives a day past the end), so an expiry lives on the row,
never in the token, and one link serves the booking's life. A bearer by design, as the
preview link is. `GET /api/bookings/ics?token=` serves the calendar file by the same token.

**The routes and the flows** (`modules/bookings/service.ts` over ports: a store, a calendar,
a mailer, a clock) so the route handlers stay thin and the tests run the flows against a
map. `POST /api/bookings` in the contact route's order (JSON and same origin, zod, honeypot,
rate limit, Turnstile), then the switch, the grid, the horizon, the free slots, the row, the
event, the e-mails; a Google refusal leaves the booking standing with `calendar: failed`,
Dhia's e-mail says so, the merchant's says the link follows. `GET /api/bookings/slots?date=`
is public, rate limited, cached a minute, and refuses a date outside today..the window (the
host's pattern cannot be scraped for months); the host calendar's free/busy is read once a
minute per day and, when the calendar fails to answer, read as free with a log line, so an
outage costs the Meet link (retried) and not every booking. A move obeys the notice on
both ends: the current start must still be beyond it, and the new slot is one of the day's
free slots; a cancel is allowed until the start. Every log line names the row's id and
never a personal field; a mail that fails is a log line, never a failed booking; and every
route catches its own failures (rule 18): an error that reached Next uncaught would be
printed whole, and a failed query's message carries its parameters, the merchant's fields,
so the route answers a 500 with a generic word and logs the route and the error's name
alone. A staff status put back from cancelled is refused in the panel's language: the
event is gone and the slot free, so the merchant books again.

**The sweep** (`sweep.ts`, every fifteen minutes on a queue of its own with one job at a
time, so two passes never send twice): `start <= now + 24 h AND start > now + 1 h AND NOT
reminded24h` sends the day reminder; `start <= now + 1 h AND start > now AND NOT
reminded1h` the hour reminder (and closes the day flag too, for a runner so late the day
window passed); `end < now` on an active booking sets `completed`; a failed calendar is
retried three times an hour apart, a recovery sending the link mails. The windows are
open-ended on purpose: a runner that was down sends late rather than never. Sent, then
flagged: a crash between the two sends twice, a crash before never sends, and the first is
the lesser harm. The dashboard's jobs list reads an every-N-minutes cron beside the daily
and weekly ones. The bookings queue's runner tick sits at second 30 (`30 * * * * *`, a
six-field cron) while the engine's queue ticks at second 0: Payload's scheduler
(`payload/dist/queues/operations/handleSchedules/defaultAfterSchedule.js`, lines 19 to 37)
writes the whole `payload-jobs-stats` global from the tick's own snapshot, so two queues
ticking in the same second clobber each other's `lastScheduledRun` and the loser's schedule
fires on every tick (the sweep ran every minute on 2026-09-19 until the offset). The
condition `tests/jobs-runner.test.ts` keeps: no scheduled task on a third queue at second
0 or 30; a new scheduled queue takes a second of its own (`docs/upstream/payload-jobs-stats-race.md`
holds the report for Payload).

**The site.** `/book` and `/en/book` (the §4.19 copy, written under §0.5's fallback rule
and listed for Dhia's read; a `WebPage` graph; in the sitemap while the switch is on, a
404 while it is off, as a page with nothing to offer should be) and `/book/manage`, never
indexed and standing whatever the switch says, since a booking made earlier keeps its link. One client island
(`modules/bookings/picker`), loaded near the viewport over a server-rendered stand-in like
the newsletter island: the strip of days on the Riyadh clock (a closed day greyed with its
reason), the day's free starts from the API with Western digits in both languages, the
form with Turnstile at submit, the confirmation. The contact card holds the same island
inline while the switch is on and keeps the WhatsApp way otherwise; the `/contact` JS
budget is measured (207 KB of our chunks before and after, the island never in the first
paint) and asserted. The Turnstile container renders from the island's first render: the
hook mounts the widget once, on mount, and the form appears only after a slot is chosen.

**The panel.** The `bookings` collection: editors update the status and the notes (the
field rule refuses the rest), admins correct the merchant's fields and delete, the API
creates nothing (the routes are the only writers, with access overridden), the facts the
routes write read as lines. A status set to cancelled by a person (a request with a user;
the routes and the sweep write with none) does what the merchant's own cancel does, the
event deleted and both e-mails sent, through a hook that loads the mailer and the calendar
on demand, since the config is loaded by the CLI under plain Node where `server-only`
throws; a delete of the row touches nothing. The same personal-data rules as the messages (ADR-061).

**In the panel (phase 2, on PR 4a's inbox section).** `bookings` is the second entry of the
Inbox section with the status pill (`booked` green, `rescheduled` amber, `cancelled` red,
`completed` neutral; the words are glossary rows) and one action above the form,
"Remind on WhatsApp": a `wa.me` link to the merchant's phone with the reminder prefilled in
the merchant's language (the span on the Riyadh clock, the Meet link when the row has one),
shown while the booking is still ahead; nothing automatic (the Business API is a later
block). The inbox badge counts the new messages and the bookings still ahead that start
today (Riyadh) as one number, its sentence "{n} waiting in the inbox"; the dashboard's
Inbox card splits it in two lines and lists, after the newest three messages, the next
three bookings with the moment on the Riyadh clock and the status word. The Google Calendar
connection's Test reads the host's free/busy for today through the delegated key (the key
file, the API and the delegation proved in one call) and answers the host and the count of
busy blocks; a settings global without a calendar owner is refused in the tester's language
before any call; the mock calendar's Test fails on its fail flag. The words the merchant
reads (`DATE_LOCALES`, `riyadhSpanLabel` in `lib/riyadh.ts`) are one place for the e-mails,
the picker and the reminder.

**Tests and gates.** `booking-slots` (the grid, the gap, the notice, the horizon, the closed
dates, the cap, the busy blocks, the Riyadh day boundary), `booking-google` (the delegated
assertion, the parsers over recorded bodies, the poll, the mock), `booking-mail` (every body
in both languages, the calendar file), `booking-routes` (the order, the 409 twice, the
failed-Google path, the manage link's refusals, no personal field in a log line),
`booking-sweep` (the windows, idempotence, the retries), `booking-actions` (the reminder's
text and link, the tones, the day query), the calendar Tests in `booking-google`, the badge
and the card reader in `admin-nav` and `dashboard`, the outsider's rows in
`access.test.ts`, the config census; the e2e books in both languages on the review server
with the mock calendar, moves and cancels on the manage page, refuses an off-grid start,
runs axe at 1440 and 390, then reads the panel's side: the row and its pill in the inbox
section, the card and the badge, the reminder's href, the editor's limits, the cancelled
row that stays cancelled, axe in both languages at 1440 and 390.

**Dhia's side, once:** enable the Calendar API on the service account's Cloud project; in
the Workspace Admin console add domain-wide delegation for the account's client id with the
two scopes; paste the key on a Google Calendar connection and Test it; set the calendar
owner's address and switch the booking on (RUNBOOK "Bookings"). A leak is a key rotation
in the Cloud console, never a row edit.

## ADR-063: The booker: one card in three panes, the days endpoint, the split confirm, the add-to-calendar menu, the host as the author record (2026-09-20)

**Context.** PR 4b (ADR-062) shipped the mechanism behind a functional but flat picker: a
strip of days, pills of times, a form appended under them, a plain success card. Dhia, after
booking a test slot: "it needs much better UI/UX in all the steps from the client side;
similar to the premium options like Cal.com itself or the same level; very nice, smooth,
easy, professional; this is so important." The plan (`docs/plans/2026-09-20-booker.md`, CTO
plan review 90, GO) replaces the client-facing surfaces only; the routes, the store, the
calendar client, the e-mails and the sweep are what ADR-062 made them.

**One card, three panes, three modes.** Cal.com's booker translated into the site's design
system, never its look: one card on the surface tone with the 13 px corner, the hairline
and `--shadow-island`, the panes divided by hairlines. The **event pane** (who the merchant
meets, the consultation's name, the blurb, then the length, "Google Meet" and «توقيت الرياض
(GMT+3)» as meta rows with monochrome icons), the **calendar pane** (a month grid) and the
**times pane** (the day's free starts down a column). At lg and up three columns (event 280
px, calendar 1fr, times 220 px, the times scrolling inside their cell), from md the event
pane over the other two side by side, under md one column with the times unfolding under
the grid on a pick and the page scrolling to them. `page` is `/book` (the island mounts
eagerly: the card is the hero), `inline` the contact card (the event pane collapsed to a
header row carrying the card's own title, the times only after a pick, the island near the
viewport as before), `reschedule` the manage page. `src/modules/bookings/booker/*` replaces
`picker/*`; the class strings live in `styles.ts` because the island and its stand-in draw
the same card.

**The host is the author record.** Rather than three host fields of their own, the booking
global names a `host` (a relationship to `authors`; the seed points at Dhia's record, whose
bilingual name and role and photo are maintained in one place already) and a bilingual
`blurb`. The site reads the global at Payload's default depth, so the record and its photo
come populated; no photo shows the initial in the accent tint. `hostEmail` stays the
technical field it is (the calendar owner, an account). A database seeded before gets both
from `pnpm content:migrate --force`, which runs the booking pass after the blog pass so the
author exists. One additive migration (`20260920_001023_booking_host`), which also carries
the `status` index PR 4b's second phase declared after its migration was generated.

**The month's open days come from `GET /api/bookings/days?month=YYYY-MM`.** The rules, the
closed dates, the notice, the horizon and the day's bookings against `maxPerDay`, and never
the host calendar: Google decides the exact slots on the day click, so a day can open in
the grid and then show the empty state when the host is busy all day. Each day answers its
**free count**, not a boolean: the grid mutes a full day and the times pane's skeleton draws
the right number of rows. A month outside today's..the horizon's is refused (the host's
pattern cannot be read for a year), the switch off too; sixty a minute per address like the
slots, cached a minute. The pure arithmetic is `days-of-month.ts` beside `slots.ts`.

**The grid.** Sunday first, the weekday initials of the locale (Intl's narrow names: «ح ن ث
ر خ ج س», "S M T W T F S"), six rows always so the pane keeps its height from month to
month (the blank sixth row hides under md, where the times sit beneath), ‹ › bounded by
today's and the horizon's months and mirrored by meaning (previous is toward the past in
either direction: the icon is the mirrored chevron the `Icon` wrapper already draws),
today ringed, an open day a real button on the ground tone with the accent dot, a closed,
past or full day muted and never focusable, the selected day the filled disc. `role="grid"`
with `aria-selected` on the cells, one cell in the Tab order (the selected day, else the
first open one), the arrows moving by reading direction (Left is "next" in RTL), a week up
and down, Home and End along the row, skipping closed days and turning the page at the
month's edge with the focus landing on the new month's first or last open day; Enter and
Space select; the month line is `aria-live`, so a page turn is announced. On `/book` the
first open day is selected on arrival (the next month's when this one has none), so the
times column is never empty; the contact card waits for a pick.

**The split confirm, under three accessibility conditions.** A tap on a time splits the row
into the time and «أكّد» (Cal.com's pattern): the split is two real buttons, the time with
`aria-pressed` and the confirm focusable the moment it appears (Enter on a time reveals it,
Tab reaches it); a pointer anywhere else collapses it, never a focus-out (a keyboard user
Tabs from the time to the confirm without the row closing under them); the reveal is a
grid-column transition on a row that stays mounted, so the focus stays where it was, and
it is instant under reduced motion. The state machine is `split.ts`, pure and unit-tested.

**The form step and the success view.** The two right panes give way to the form (200 ms,
8 px, honoured by reduced motion), the event pane keeping the chosen time with a «رجوع»
that returns to the times; the name field takes the focus. The card keeps its height across
the step on md and up by a min-height read from the pick step. A slot taken meanwhile (409)
returns to the times with the day read again (a cache-busting count on the read, since the
routes answer with a minute's cache) and a line saying so; a failure keeps the values and
points to WhatsApp. The success view fills the card: the check disc that scales in once,
«موعدك محجوز», the rows What / When / Who / Where with icons (the merchant's name as typed,
never from a later read; the Meet link as a button, or the sentence that says it follows),
the note, then the add-to-calendar menu and the way to the manage page.

**Add to calendar is one button and a menu of three.** Dhia's instruction on the success
view: not a bare download link but «أضف إلى التقويم» opening a menu, each entry with its
mark: Google Calendar (the `calendar.google.com/calendar/r/eventedit` link with the compact
UTC span and `ctz=Asia/Riyadh`, a new tab), Outlook Calendar (the `outlook.live.com`
compose deep link with the Riyadh wall clock and its offset; an Office 365 account lands on
its own calendar from it), Apple Calendar (the site's own `.ics` route: on an iPhone or a
Mac the file opens Calendar, which is how Cal.com's own Apple entry behaves). The menu is
the site's Radix dropdown primitive (keyboard, typeahead, Escape, the focus return, the
close on an outside pointer); the three marks are inline SVGs of our own, 20 px, monochrome
like the site's other brand glyphs (the CSP admits no external asset). The same menu stands
on the manage page. The builders are `calendar-links.ts`, pure and unit-tested.

**The manage page in the same card.** The event pane carries the booking's time and its
status pill; the right panes the summary rows, «غيّر الموعد», «ألغِ الحجز» and the menu.
The reschedule opens the calendar and the times inline: the booking's own slot (not free,
so the route lists no row for it) is put back in its place, marked and not selectable; the
confirm reads «أكّد التغيير» and patches under the same notice rule on both ends; a move
reads the day again afterwards. The cancel goes through the site's `Dialog` («إلغاء
الحجز؟», the consequence, «أبقِ الموعد» as the way back since a destructive dialog's dismiss
should say what it keeps, «ألغِ الحجز» in red) opened from a trigger so the focus returns;
a cancelled, past or invalid link is a full-card message with the way to book again.

**Loading and weight.** On `/book` the island mounts eagerly over a stand-in that is the
real event pane rendered on the server (the LCP words) with the island's own loading state
for the other panes at the same dimensions, so the hydration moves nothing; the manage
page's stand-in the same with a loading line where the booking goes. The booking island's
chunk measured 5,722 B gzipped before; the booker's own chunks, read by the e2e as every
script the server HTML does not reference, 49,359 B on 2026-09-20 (of which 16,764 B the
menu primitive and its positioning), the line at 56 KB; `/book` and `/contact` first paints
stay under 180 KB and the island out of both. `/book` joins the LHCI list at 0.9; the CI
switches the booking on for that run only (`scripts/ci/booking-on.ts`), since the public
e2e projects assert the WhatsApp fallback with it off.

**Words.** Every string in both banks under ux-araby (verb-first actions: «أكّد», «أكّد
الحجز», «أكّد التغيير» rather than the plan's nominal «تأكيد», as the rest of the site's
buttons; Western digits; Riyadh times with ص/م), BRD §4.19 rewritten and §6.9's card
paragraph, still `TODO(copy)` for Dhia's read. The panel's glossary gains "host (who the
merchant meets)" as «مقدّم الاستشارة», kept apart from the calendar owner.

**Not in scope.** A timezone picker (every merchant is on Riyadh time; the line says so), a
12/24 h toggle, guests, a week or column layout, a custom success URL, an Office 365 link
of its own, host fields of our own, screenshots in the repository (a scratch folder outside
it, linked from the PR).

## ADR-065: The Appearance global: the brand as values, not literals (2026-09-22)

**Context.** Every brand value is frozen at build time: the blues, the neutrals, the typeface
and the logo live in `src/styles/tokens.css` and `src/styles/globals.css`, and changing one is
a code change. Dhia asked for a screen in the panel that owns all of it, so that changing the
blue once moves the whole site, with the gradient they liked registered there as one named
background among others. Specified in `specs/010-brand-settings/spec.md`, approved 2026-09-22.

**The decisions.** A background is a **set**, not a colour: the background, the text tone on
it, the muted tone and the button variant that reads on it, because Shopify shipped exactly
that model, is migrating merchants away from it, and its developer forum documents the
clashing buttons that result. A few colours are set by hand and the rest derived, with each
rule carrying its contrast requirement, so an unreadable pair cannot be produced by choosing a
colour; an override that fails its requirement is refused, not warned. The typeface is a
curated self-hosted list defaulting to ITF Rayat Round, whose licence permits serving only
from b7r.sa. The global is named **Appearance** («المظهر») because Site settings already has a
Brand section holding the brand's words, and the glossary forbids two concepts sharing a word.
The panel's colours stay its own; its typeface follows the brand, since `tokens.css` is shared.

**What the calibration changed.** Before `derive.ts` was written, every candidate rule was
tested against the hex the site ships (`specs/010-brand-settings/calibration.md`). Only two
reproduce exactly on a principled constant: `primary-hover` is primary multiplied by 0.84 in
sRGB, and `accent-tint` is accent at 10 percent over the surface. `ground` reproduces on a
fitted constant (0.041; a round 0.04 gives `#f6f8fc`). Four tokens are designed rather than
computed and no rule reaches them: `border`, `text-muted`, `accent-on-tint` and `navy`.

Two consequences for the model this document and the BRD describe. **`primary-dark` is a
source, not a derivation**: at L 46.7 in OKLCH against primary's 47.0 it is the same
lightness, so "primary darkened" was never the rule; it is the logo's second blue, and
`ground` derives from it. **`navy` stays a source too**, though BRD §3.2 called it "(derived)":
no sRGB multiple of primary can lift navy's red channel from 0 to 10. So the screen shows five
pickers where Dhia approved four, and the footer will not follow a rebrand until navy is
changed with it. Both are flagged for Dhia rather than decided silently.

**Two errors found in the BRD, corrected in §3.2 with this ADR.** `--color-text-muted` was
documented at 4.6:1 on white and measures 6.00:1, which is safe. `--color-accent` was
documented at 3.5:1 and measures **3.20:1**, which is not: that figure is the stated reason
accent is banned for body text on white and permitted at 24 px bold, and the true value clears
the 3:1 large-text floor by 0.20 rather than the 0.50 the document implied. The rule it
justifies must not be relaxed on the strength of the written number.

**The gradient and the BRD.** §3.2's "never gradients between hues, a single flat colour per
surface" gains a second exception beside ADR-054's button sheen: a background set may be a
gradient between the brand's own blues, with an optional grain overlay. Gradients between
unrelated hues stay banned.

**How it reaches a page.** No stylesheet is restructured. Custom properties inherit and
`var()` substitutes on the element the declaration applies to, so a scoped
`[data-surface] { --color-surface: … }` is all a per-section background needs. `SiteDocument`
emits one `:root:root` block, which outranks Tailwind's `:root, :host` whichever way Next
hoists the stylesheet. An earlier draft proposed moving the tokens to `@theme inline`; that
emits no `--color-*` property at all and would have deleted the variable out from under 43
hand-written rules, the body background and both typefaces among them.

**Failure behaviour.** `brandCss` runs while every page and the global 404 render, so it never
throws: colours are parsed at the boundary, checked again on the way into the stylesheet, and
the whole call sits inside a catch. A brand that fails any pair falls back to the shipped
palette and logs which pair failed and by how much. Two gates hold it: the emitted block is
compared token by token against a checked-in fixture of `globals.css` at 9989617, and every
`var(--…)` the three stylesheets read must be defined by a `@theme` block, by the emitted
block, or by a designed allowlist of the properties Payload and Radix provide at runtime.


**Amended 2026-09-23 (phase 1b review).** The three designed colours are no longer stored as
"factory pins": a designed value applies while every brand colour its rule reads is still the
shipped one, so a change and its undo cannot lose it. Only the colours set by hand are stored,
as a list, because Payload hands a validator the save deep-merged over the stored document and
a merge unions an object's keys but replaces a list.

**Amended 2026-09-23 (phase 1c).** Two corrections to the text above, from the CTO's review:

- *How a section reaches a page.* A scoped `--color-surface` is not all a section needs: it
  would repaint every card inside the section. A section paints its own `--section-bg` and
  `--section-image` and sets the text, link, border and focus colours for its words; every
  island inside it (a white or grey card, a primary button) reads the page's tones again from
  copies declared once at the root (`--page-text` and its kin), which no section can reach.
  The rules that set `color` sit in the components layer so a text utility still wins; the dark
  set's white button is unlayered so it beats the button's own `text-white`.
- *The gradient.* Dhia chose (2026-09-23) that Sea mist keeps the colours of the reference
  image rather than following the brand, so it is not "a gradient between the brand's own
  blues": it is a fixed set in the library, named on the "does not follow" panel, and its deep
  bloom was lightened (#00609b to #4f9cd7, hue and chroma kept) until its text, secondary text
  and links read 4.5:1 at every point with the grain counted. Three sets are built from the
  brand instead (white, light grey, deep sea) and follow it; they cannot be deleted. A set's
  contrast check samples the whole field from edge to edge, grain included, not only its
  stops. The library accepts a gradient between any colours: BRD 3.2's ban on gradients
  between unrelated hues is the admin's to keep, not a validator's, since a rule that judged
  "related" hues would refuse good sets as often as bad ones.

**Amended 2026-09-23 (phase 1d).** What the brand reaches outside the stylesheet:

- *The logo* is drawn, not shown: `scripts/trace-logo.py` traces `logo.png` and `icon.png` into
  one path per blue (`src/modules/core/logo-paths.ts`, about 19 KB), sent once per document as
  two `<symbol>`s and drawn with `<use>` wherever the shell shows it, each path filled with
  `var(--logo-*, var(--color-*))`. The footer sets the three `--logo-*` to white. An upload in
  the Logo tab replaces the drawing in that place and keeps its own colours. Dhia chose tracing
  (2026-09-23) over keeping the PNGs; the trace is Dhia's to confirm by eye (BRD 3.1, amended).
- *The icons* are routes: `src/app/icon.tsx` draws the mark at 32, 192 and 512 px (no other
  size is drawn; `/icon/99` is a 404) and `apple-icon.tsx` at 180 px on the page's white, in
  the painted accent and primary dark. The manifest points at them, and it and the viewport's
  `theme-color` read the painted primary. An Appearance save revalidates the icon routes with
  the pages. `icon` and `apple-icon` are code-owned top-level segments, since the proxy would
  otherwise take them for page slugs.
- *The e-mails* (a booking, a contact message, a password reset) read the painted colours when
  they are sent (`readMailPalette`, which takes the sender's Payload so the reset e-mail can call
  it from inside the config graph); a failed read sends the mail in the shipped colours and
  logs a warning.
- *Still raster, and listed as not following:* `favicon.ico` (a format Next cannot draw), the
  panel's logo, the share images, the 410 page, the 3D icons and the video poster.
