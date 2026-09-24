# Photo delivery: renditions from the edge, the designer preloaded (2026-09-20)

Dhia, 2026-09-20: "the speed of render of the photos feels slow; the blurry version stays a
long time before the real photo replaces it; the designer takes a long time to show a
product when I click between them; why weren't those photos loaded before I touch them?"
Approved after the investigation of the same day: option A in full, AVIF + WebP, the logos
and badges included.

## The cause, measured on b7r.sa

Every photo is a request to `/_next/image?url=…&w=…&q=…` (ADR-029): Next's optimizer
resizes the bucket's original and answers with `Cache-Control: public, max-age=31536000,
must-revalidate`. CranL fronts the site with a Bunny pull zone whose Smart Cache caches by
file extension and MIME type and does not follow the HTTP `Vary` header (Bunny's docs). Every
URL without an extension (the HTML, every `/_next/image`) comes back `cache-control: no-cache`,
`cdn-cache: MISS`, on every request; `/images/*`, `/fonts/*` and `/_next/static/*` keep their
headers and HIT. On one connection: a bucket file from the edge answers in **0.10 s**; the
optimizer with the size on disk in **0.15 to 0.45 s**; a size nobody asked for since the
last deploy (the container's `.next/cache/images` dies with it) in **1.5 to 3.2 s**. The home
page makes about 25 such requests; the first visitor after every deploy pays the cold path
on each. The designer asks for the same product photo under five different URLs (the
static preview at q75, the picker thumbs at 32 and 64, the canvas at 1080 and q82, the strip
at q90), so nothing warms the canvas, and a product switch is a fresh request made at the
click (`useImage`, `design-canvas.tsx:77`). Caching `/_next/image` at the edge is not a fix:
Bunny would pin one format for every browser and for WhatsApp's `og:image` fetch, and the
cold encode after each deploy would stay.

## What stands

`src/lib/photo.ts` (the one q92 source encode, `PHOTO_QUALITY`, the crop arithmetic);
`stampBlur` and the `blur` field (ADR-029); `mediaUrl` (relative on the same host, absolute on
S3); `prepare-assets.ts` and `hero-crops.ts`; `scripts/media-shared.ts` (`openPayload`,
`adminUser`, `allMedia`, `mediaBytes`); the storage plugin (`s3Storage`, `generateFileURL`,
one prefix `media`); the site CSP builder and its tests; the hero's own `<picture>` with
media-gated preloads and the blur under each breakpoint; the designer island, its state,
`useImage` for the person's own design, the 200 ms crossfade; the `og:image` through the
optimizer at 1200 wide (the JPEG a scraper gets); the e2e budgets (`hero-set-*` bytes, the
blur in the server HTML, no media preload on `/contact`); the CI MinIO job
(`S3_PUBLIC_URL=http://localhost:9000/b7r-media`, `IMAGES_ALLOW_LOCAL_IP`).

## The shape

**One ladder, two formats, deterministic names.** `src/lib/renditions.ts` (pure data):

```
RENDITION_WIDTHS = [128, 384, 640, 828, 1080, 1200, 1536, 1920, 2560, 3840]
RENDITION_FORMATS = ['avif', 'webp']
```

The media collection lists them as Payload `imageSizes`: one entry per width and format,
`name: 'avif1080'`, `width`, `withoutEnlargement: true` (a 1000 px photo's 1920 file is the
photo at 1000 px, so every name exists for every upload), `formatOptions: { format, options:
RENDITION_ENCODE[format] }`, `generateImageName` returning `${originalName}-${width}.${format}`
from the *configured* width (a closure per entry; Payload hands the function the output's
width, which is the photo's own under a rung it does not reach). `originalName` is the
sanitized stem (`parseFilename`), which is what the document's `url` carries before its
extension, so the URL rule below and the name rule agree. The storage plugin already uploads
every size to the bucket beside the original and deletes them on replace and on delete;
locally they land in `public/media` and Payload's file endpoint serves a size's filename
(`checkFileAccess` matches `sizes.*.filename`). Payload encodes the sizes inside the upload
request: a large photo takes seconds to save, once, in the admin; documented, and `effort`
is the knob if it ever hurts.

`RENDITION_ENCODE` is the encode the site ships today, as data beside the ladder: Next's
optimizer never hands sharp the component's quality for AVIF; it maps it
(`image-optimizer.js:901-907`: `avif({ quality: round(q * 50 / 80), effort: 3 })`, WebP takes
`q` as is). So `avif: { quality: Math.round(PHOTO_QUALITY * 50 / 80), effort: 3 }` (56, the
"sharp's 47 to 56" ADR-029 records) and `webp: { quality: PHOTO_QUALITY }`; sharp's default
4:4:4 stays. The CTO measured the alternative on the repo's sharp: `avif({ quality: 90 })` on
the 1920 hero is 151.9 KB in 1310 ms against 51.6 KB in 291 ms at the mapping; the 20
renditions of a 3000 px source 9.2 s and 2.06 MB against 2.0 s and 1.25 MB on 16 cores. The
first real upload on the container is timed (wall, RSS) and the number goes in the RUNBOOK.

`renditionUrl(src, width, format)`: the source's URL with its extension replaced by
`-${width}.${format}`, `width` snapped up to the ladder (the largest when past it). Works for
`/api/payload/media/file/x.jpg` (local), `https://storage…/media/x.jpg` (S3) and
`http://localhost:9000/b7r-media/media/x.jpg` (CI). Two `next/image` loaders,
`avifLoader` and `webpLoader`, are `({ src, width }) => renditionUrl(src, width, format)`.
`quality` is not a parameter any more: the renditions are encoded once, at `RENDITION_ENCODE`.

`renditions.ts` also exports `DEVICE_SIZES = [640, 828, 1080, 1200, 1536, 1920, 2560, 3840]`
and `IMAGE_SIZES = [128, 384]` (their union sorted is `RENDITION_WIDTHS`, a test asserts it)
and `next.config.ts` imports them, so `next/image`'s candidate list is the ladder one to one,
as a fact rather than a comment. `qualities: [75, 82]` stays for what still uses the optimizer
(the `og:image` at 82, the admin thumbnail fallback at 75). `remotePatterns` stays for them.

**`<Photo>`** (`src/components/shared/photo.tsx`, `'use client'` like `next/image` itself,
still server-rendered): the one way a CMS photo is rendered. Props mirror `next/image`
(`src`, `alt`, `sizes`, `fill` or `width`/`height`, `className`, `style`, `loading`,
`fetchPriority`, `decoding`, `preload`, `onLoad`) plus `blur` (the media's data URL). It
renders `<picture><source type="image/avif" srcSet sizes /><Image loader={webpLoader}
… /></picture>`: the AVIF candidates come from `getImageProps` with `avifLoader`, the `<img>`
is `next/image` with `webpLoader`, so the browser picks the format, the server has no
negotiation to do, and everything `next/image` does for an `<img>` still happens: the blur
as the `background-image` in the server HTML (the e2e's LCP check reads it there) and its
removal on load (so a PNG with alpha shows no halo once loaded), lazy by default, the dev
warnings. A function prop is why the component is a client module: `loader` cannot cross the
server boundary, and every call site passes strings and booleans only. With `preload`, the
component calls `ReactDOM.preload(avif.src, { as: 'image', type: 'image/avif', imageSrcSet,
imageSizes, fetchPriority })` with the caller's `fetchPriority` (the products listing
preloads three cards and marks one as the LCP, `products-listing.tsx:49`), and hands the
`<Image>` `loading="eager"` rather than its own `preload`, which would add an untyped WebP
preload an AVIF browser also fetches; a browser without AVIF ignores the typed preload and
finds the `<img>` in the markup (web.dev, "preload the most preferred type"). Every call
site drops `quality={PHOTO_QUALITY}` and `{...blurPlaceholder(x)}` for `blur={x}`;
`blurPlaceholder` moves into the component.

**The hero** keeps its `<picture>` and gains the format sources: `<source media=desktop
type=avif>`, `<source media=desktop type=webp>`, `<source type=avif>` (mobile), `<img>`
(mobile WebP). `imageSet` builds four `srcSet`s through the loaders. The two preload links
become AVIF-typed; the blur values are unchanged.

**The site CSP**: `img-src` gains the storage origin (`s3PublicOrigin()`, already the admin's
`mediaOrigin`; `next.config.ts` passes it to `headerRoutes`). In CI that origin is
`http://localhost:9000`; locally (disk) there is none and the URLs are same-origin.

**The designer, one URL per mockup.** `MOCKUP_WIDTH = 1080` moves to
`src/modules/designer/mockup.ts` with `mockupUrl(src, format)` (= `renditionUrl` at 1080).
The static preview cannot go through `getImageProps`: any `sizes` or `width` yields a
candidate list, and the browser's pick (1080 at 1x, 1200 at 1.2x, 2560 on a 2x laptop) would
differ from the canvas's fixed 1080. So a `<MockupPicture>` (server-safe, in the designer
module) renders `<picture><source type="image/avif" srcSet={avif1080} /><img
src={webp1080} …/></picture>` with the `fill` styling, the blur as background (a server
component, so the blur stays under the preview until the island replaces it; the mockups are
opaque JPEGs, so nothing shows through), `loading="lazy"`. Exactly two URLs exist for a mockup on the whole page, and the browser has
chosen one of them before the island mounts.

The canvas needs an `HTMLImageElement` of the same URL. `loadMockup(urls)` in
`src/modules/designer/canvas/mockup-image.ts` builds the same `<picture>` detached from the
document (`source[type=image/avif][srcset]` then `img`), sets the WebP `src` last and
resolves with the `<img>` on load: the browser runs the one source-selection algorithm it
ran for the preview, so the canvas's URL is the preview's by construction, with no probe, no
data URL and nothing started at module evaluation; a browser that ignores the detached
`<source>` loads the WebP, still correct. `useImage` keeps its shape for the person's own
design (a blob URL) and takes a loader for the mockup. No `crossOrigin`: nothing reads the
canvas back (`design-canvas.tsx` only `cache()`s the mockup node; Konva's hit canvas draws
colour keys, never the image), so a cross-origin mockup taints nothing anyone reads, and a
CORS-mode fetch beside the preview's no-cors `<img>` would be two cache modes for one URL and
a hard failure the day the edge drops its `access-control-allow-origin`. ADR-064 says: the
canvas is never read back; the day an export ships, `crossOrigin` goes on all three fetches
(the preview, the preload, the canvas) and the cut-over check gains the CORS header.

**The designer, preloaded.** `usePreloadedMockups(products, current, format)` in the island:
once the current mockup has loaded, it walks the other products in picker order and loads
each one's mockup through the same `loadMockup` (`fetchPriority = 'low'`, `decoding =
'async'`), one at a time, keeping the elements in a module `Map` keyed by the product's
mockup source; `useImage` returns a mapped element synchronously, so a switch draws with no
request and no decode, under the existing crossfade. Skipped when `navigator.connection?.saveData` is
true (Data Saver); a failed preload is dropped from the map so the click loads it the normal
way. Five mockups at 1080 are about 60 KB together. The picker thumbs go through `<Photo>`
at 32 px (the 128 rendition, 1 candidate).

**The public images** leave the optimizer. `prepare-assets.ts` writes, beside what it writes
today, the pixels each is shown at: `logo-header-176.png` and `logo-header-396.png` (88 and
198 px at 2x), `logo-white-footer-440.png`, `icon-72.png`, `icon-128.png`,
`misk-foundation-logo-360.png` (180 px at 2x); the payment badges stay as they are (94 by 56
for a 44 px chip is already 2x); the trust badges too (233 by 81 for their `b.w`). The
header, the mobile menu, the footer, the Misk credential block, the status page and the
WhatsApp widget render a plain `<img>` with `width`, `height`, `srcSet`/`sizes` where two
files exist, `decoding="async"`, `loading="lazy"` below the fold and `fetchPriority="high"` +
`ReactDOM.preload` for the header logo (it is preloaded today through `priority`). The video
poster (26 KB JPEG under a scrim, replaced by the video) is a plain lazy `<img>`; `/video/*`
joins `IMAGE_ROUTE_SOURCES` (a day at the edge, like `/images/*`). PNG throughout: the logos
have alpha and a WebP-only logo would break on the 2 % without it.

**The existing 33 photos**: `scripts/media-renditions.ts [--env <file>] [--dry-run]
[--force]` reads every media document, skips one whose `sizes` already holds every
rendition name (idempotent), otherwise takes its bytes (`mediaBytes`) and re-saves the file
under its own name through the Local API as the admin (`overwriteExistingFiles: true`):
Payload generates the sizes and the plugin uploads them; the original's object is re-put
with identical bytes; the blur is recomputed to the same value. It prints the count and the
bytes per format.

**Production, without a broken minute, whatever the order.** The migration adds the new
`sizes_*` columns and their filename indexes and drops the four dead groups of the old config
(`thumbnail`, `card`, `hero`, `og`, the 24 columns and 4 indexes
`20260918_213027_media_no_renditions.ts` left for "a later migration"); the running image
ignores columns it does not know and reads none of those. `focal_x` and `focal_y` stay:
Payload keeps the two hidden fields whenever `imageSizes` is set, whatever `focalPoint`
says (`uploads/getBaseFields.js`), so the generator emitted no drop for them, which is also
what the old image needs (drizzle reads name every column, and the image on `main` lists
the pair; RUNBOOK "Deploy" step 9). The build itself makes the deploy self-sufficient: `railpack.json` and the
Dockerfile run `bash scripts/ci/migrate.sh`, then `pnpm exec tsx scripts/media-renditions.ts`,
then `pnpm build`; both builds already hold the database, the secret and the S3 credentials
(the Railpack build gets the app's environment, the Docker build mounts the four secrets),
the script is idempotent and a no-op costs one query, so a deploy that runs before anyone
backfilled by hand still prerenders pages whose files exist, and an upload made between the
migrate and the deploy heals on the next build. The fast path, in the RUNBOOK: after the
merge, the migration and the script with `--env .env.cranl.local`, a check that the edge
serves what the build will name (`curl -I` one `-1080.avif` and one `-1080.webp` twice:
`content-type: image/avif` and `image/webp`, the second answer `cdn-cache: HIT`; the plugin
sets `ContentType` per size, `uploadFile.js:16-22`), then the deploy by hand; the build's
own run then finds nothing to do. `media-requality.ts` keeps working (a re-upload under a
new name regenerates the sizes).

**No focal point, no crop.** With width-only sizes the focal point moves no pixels
(`createImageSizes.js:72-84` computes the full frame), nothing in `src/` reads `focalX` or
`focalY`, and a focal change re-fetches the file and regenerates all twenty encodes
(`generateFileData.js:62-84`); the admin's crop rewrites the file under its own name, which
the RUNBOOK's naming rule forbids for a reason (the edge keeps the old object 30 days). Both
controls go (`focalPoint: false`, `crop: false`) and ADR-064 says: replace a photo by
uploading it again; it gets a new name.

**No animated upload.** `mimeTypes` admits WebP, which can be animated; Payload reads every
frame of one (`isAnimatedImage`) and sharp flattens them into a single tall strip for each
size, so a save would spend twenty encodes on twenty strips nobody wants. A `beforeOperation`
hook (`refuseAnimated`, beside `stampBlur`; `req.file` is on the request before the operation
starts, and `beforeValidate` would run after `generateFileData` has already encoded) reads
the file's `pages` with sharp and throws `APIError` 400 with a sentence in both languages
(rule 4). The panel's `crop` and `focalPoint` strings in `payload-ar.ts` go with the controls.

**ADR-064** records the change (the delivery rule of ADR-029 is superseded: the browser
loads the bucket's renditions; the optimizer stays for the `og:image` JPEG and the admin's
fallback thumbnail); ADR-029 gets a pointer.

## Files

Create: `src/lib/renditions.ts`, `src/components/shared/photo.tsx`,
`src/modules/designer/mockup.ts`, `src/modules/designer/mockup-picture.tsx`,
`src/modules/designer/canvas/mockup-image.ts`, `src/modules/designer/canvas/use-preloaded-mockups.ts`,
`src/modules/cms/hooks/animated.ts`,
`scripts/media-renditions.ts`, `src/migrations/<stamp>_media_renditions.{ts,json}`,
`tests/renditions.test.ts`, `tests/photo-component.test.tsx`, `tests/mockup-image.test.ts`,
`tests/media-animated.test.ts`,
`tests/media-renditions.test.ts` (the pure parts), `docs/plans/2026-09-20-photo-delivery.md`.

Modify: `next.config.ts`, `railpack.json`, `Dockerfile`, `src/modules/cms/collections/media.ts`,
`src/payload-types.ts`, `src/modules/home/hero/renditions.ts` renamed `frames.ts` (the hero's
two frames, so `src/lib/renditions.ts` is the only file of that name),
`src/lib/image-url.ts` (`blurPlaceholder` moves; `optimizedSrc` stays for og and the admin),
`src/lib/security-headers.ts` (+ test), `src/lib/photo.ts` (a sentence), the photo call sites
(`post-card`, `blog-post`, `author-page`, `event-pane`, `product-card-media`, `gallery`,
`product-strip`, `steps` ×2, `story`, `media-banner`, `cards`, `lexical-prose`, `hero` +
`hero-carousel`), `src/modules/products/products-listing.tsx` (fetchPriority through the
preload), the designer (`designer-static`, `product-picker`, `design-canvas`, `use-image`,
`designer-island`), the public-image sites (`header`, `mobile-menu`, `footer`,
`misk-credential`, `status-page`, `whatsapp-widget`, `video-section`),
`scripts/prepare-assets.ts`, `e2e/global-setup.ts` and `scripts/ci/warm-lib.sh` (comments;
they still warm the pages), `.github/workflows/ci.yml` (`designer.spec.ts` joins the MinIO
job's subset so a cross-origin mockup load is proven once in CI), `docs/DECISIONS.md`,
`docs/RUNBOOK.md` ("Assets", the cut-over; "Deploy" step 8's "cache `/_next/image*` freely"
rewritten to what was measured).

## States and edges

- A media document without renditions yet (uploaded on the old code, the backfill not run):
  its rendition URLs 404. The production sequence above prevents it; the admin's thumbnail
  falls back to the optimizer transform when `sizes` is empty.
- A photo narrower than a rung: `withoutEnlargement` writes it at its own width under that
  rung's name; the `srcset` claims more pixels than the file has, as the optimizer did.
- A PNG with alpha (an icon in the library): AVIF and WebP keep the alpha; the blur under
  it goes when `next/image` clears the placeholder on load, as today.
- An animated WebP: refused before the operation with a sentence, no encode spent.
- The build runs before the backfill by hand: the build backfills; nothing 404s.
- The local disk storage: renditions in `public/media`, served by Payload's endpoint; the
  seed's `content:migrate` uploads through the Local API, so a fresh database gets them.
- Data Saver on: no preload; a switch fetches on the click, as today, at edge speed.
- A preload that fails (offline mid-scroll): dropped from the map, the click retries.
- A browser without AVIF: WebP from the `<img>`; the detached `<picture>` picks WebP for the
  canvas by the same algorithm, so the preview and the canvas still share one URL.
- `og:image`, the admin thumbnail fallback and the public PNGs until Phase 4 keep using
  `/_next/image`, which keeps its route (`images.loader` stays `default`).

## Tests

- `renditions.test.ts`: the ladder snap (below, between, above, exact), the URL for the three
  URL shapes, `DEVICE_SIZES` with `IMAGE_SIZES` equal to `RENDITION_WIDTHS`, the encode
  constants (AVIF at Next's mapping, effort 3), the Payload sizes config (20 entries, names,
  `withoutEnlargement`, format options, the name a size produces from a small and a large
  source), the loaders.
- `photo-component.test.tsx` (react-dom/server, `process.env.__NEXT_IMAGE_OPTS` set from the
  exported sizes before the import, since `getImageProps` reads its ladder from there and
  vitest has no Next config): a `<picture>` with an AVIF source and a WebP `<img>`, the
  candidate list equal to the ladder, the blur background, `preload` calls `ReactDOM.preload`
  with the type and the caller's `fetchPriority` (spy), `fill`.
- `security-headers.test.ts`: `img-src` with and without the storage origin.
- `mockup-image.test.ts` (jsdom, `HTMLImageElement.prototype.src` stubbed to fire load or
  error): `loadMockup` builds source then img and resolves with the img; the preload hook's
  order, one at a time, the map, the saveData skip, the failure drop.
- `media-animated.test.ts`: a still and an animated WebP (sharp-made in the test), the
  refusal sentence in both languages.
- `media-renditions.test.ts`: `hasEveryRendition(doc)` and the plan for a document.
- `admin-config.test.ts` and the rest of the suite stay green; the e2e budgets and the LCP
  blur check run against the built app; the CI MinIO job proves the S3 path end to end
  (the browser fetching `http://localhost:9000/b7r-media/media/x-1080.avif` under the CSP).

## Phases

1. The pipeline: `renditions.ts`, the media config (sizes, no focal point, no crop, the
   animated refusal), the migration and types, `<Photo>`, the CSP, `next.config.ts`, the
   backfill script and its place in the two builds, the local run of the backfill, tests.
2. The call sites: every photo component and the hero on `<Photo>`, `products-listing`'s
   priorities through it; a grep proves no `quality=` and no `optimizedSrc(` survives outside
   the og and admin paths (a stray `quality={90}` would be a 400 from the optimizer);
   `pnpm build` and the e2e budgets green.
3. The designer: one URL per mockup, `loadMockup`, the preload hook, tests, `designer.spec.ts`
   in the MinIO subset.
4. The public images: `prepare-assets.ts`, the plain `<img>` sites, `/video/*` cache, tests.
5. Docs: ADR-064, ADR-029's pointer, RUNBOOK "Assets" (the cut-over, the container's upload
   timing) and "Deploy" step 8, the PR.

## As shipped (2026-09-20)

Five commits on `site/photo-delivery`, each reviewed by the CTO (plan 89 → Phase 1 82 then
94 after a build-time fix, Phase 2 94, Phase 3 93, Phase 4 95, Phase 5 96). Departures from
the text above: `blurPlaceholder` stays in `image-url.ts` with two users rather than moving;
the picture test proves the two formats agree candidate for candidate and the ladder is
proven by `renditions.test.ts` plus `next-config-imports.test.ts` (vitest cannot feed
`__NEXT_IMAGE_OPTS` an object); `<StaticImage>` carries the brand images with one lint
exception instead of ten; the blog's "own JS" budget line reads 12 KB because next/image's
client runtime left the layout's shared chunk when the header stopped importing it (ADR-064
records the measurement); the warm scripts warm pages only.

## Judgment calls

- Payload's `imageSizes` over a hook of our own with sharp and the S3 client: the plugin's
  upload, replace and delete lifecycle for two storages is worth 120 columns nobody reads.
- The same ladder for WebP as for AVIF: one function, one test; the 5 % on WebP pay a few
  kilobytes, never a wrong size.
- Per-component loaders, not `images.loaderFile`: Next 404s `/_next/image` when the global
  loader is not the default, and the `og:image` JPEG needs it.
- A typed AVIF preload only, no WebP preload: an AVIF browser would fetch both.
- `next/image` inside the `<picture>` rather than a bare `<img>` from `getImageProps`: the
  project's primitive keeps doing the client half (the blur's removal, `onLoad`, the
  warnings) and the component stays about 40 lines; the price is a client module, which
  `next/image` already was.
- A detached `<picture>` for the canvas instead of an AVIF probe: the browser's own
  selection, once, agreeing with the preview by construction.
- No `crossOrigin` on the mockups: nothing reads the canvas; one fewer dependency on the
  edge's headers, and the rule for the day an export ships is written down.
- The backfill in the build: one idempotent command makes the deploy order irrelevant.
- The ladder writes six identical files for a 1000 px photo (every rung above its width,
  twice): about 180 KB in the bucket per photo, nothing on the wire; a dedupe would need
  the mappers to know each document's width. Noted, not built.
- PNG for the public logos, pre-sized, no `<picture>`: alpha, universal, and a logo is not
  where bytes are.
- `qualities` keeps 75 and 82; `PHOTO_QUALITY` now names the renditions' encode, mapped
  for AVIF the way Next maps it.
