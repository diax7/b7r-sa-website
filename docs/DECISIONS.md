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
registry; the sidebar shows a collection's document count (14 `count` queries per page, for
the sidebar only, 10 ms warm, never cached: a stale number right after Create is worse than
none). **An
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
field; the 187 site-facing sentences were checked against the components that read each
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
the test. A new row that leaves the model or a rate empty gets its kind's usual value. Two
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
`maxOutputTokens: 8`, no retries, a 20 s abort, the key read with `decryptKeys` through the
Local API; the outcome written on the row (the model id on success; on failure the vendor's
message, one line, URLs replaced, the key replaced, 200 characters at most); one test per
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
the stored value from the database row. Nothing in production had a key yet. **Not done.**
`filterOptions` on the engine's picker (every kind is engine-capable today; project 3's
analytics kinds bring the filter with their consumers); Perplexity; a shared rate-limit
store.
