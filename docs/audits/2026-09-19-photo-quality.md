# Photo quality (2026-09-19)

Dhia: "the photos look low quality; go ahead." Branch `site/photo-quality`; the CTO's
settlement (quality 90, one q92 source encode with full chroma, no renditions, no upscale,
blur-up on the media collection, new filenames on re-upload) is folded in. The numbers below
are from this worktree's own build served on :3014, against a build of `main` served on :3015
from the same review database, both measured back to back on the same machine.

## The cause

1. **Two lossy encodes, stacked.** `scripts/prepare-assets.ts` re-encoded every photo as
   JPEG q80 to q82 with 4:2:0 chroma (a 380 KB 1000 by 1000 product photo became 25 KB; the
   hero 83 KB at 1920 by 1080), then `next/image` encoded that as AVIF at Next's default
   quality 75 (the hero at 82). Next maps `quality` to sharp's AVIF scale as `q * 50 / 80`,
   so the browser got an AVIF at quality 47 to 51 of an already-soft JPEG: the product photo
   ended at 6.9 KB, the hero at 38 KB. The second encode is what smoothed the fabric weave,
   the collar stitching and the edges of the print.
2. **1x sources.** The product photos are 1000 px for a 560 px gallery box: a 2x screen asks
   for 1120 and gets 1000. The hero placeholders (1586 and 1672 px wide) were upscaled to
   1920 by sharp before the JPEG, then compressed again by the optimizer.
3. **Not the cause:** the browser already picks the right rendition. The `sizes` on every
   photo match the boxes, and the candidate widths in the srcsets are what the measurements
   below fetch (1920w for the desktop hero at 1920, 1200w for a 3x phone, 828w for a 400 px
   card at 2x).

Payload's `imageSizes` renditions (thumbnail 400, card 800, hero 1920, og 1200 by 630) were
never what the site served: `src/lib/cms/mappers.ts` (`mediaUrl`) and `src/lib/cms/blog.ts`
hand the original's `url` to `next/image`, `pnpm og` renders the share images with
Playwright, and a grep for `sizes.thumbnail|card|hero|og` across `src/`, `tests/` and `e2e/`
finds only the collection config, the generated types and the initial migration. They cost
three or four files per upload for nothing; they are gone (ADR-029, amended).

## What changed

- `scripts/prepare-assets.ts`, `scripts/hero-crops.ts`: every photo is written once at the
  source's own resolution, JPEG q92 mozjpeg with 4:4:4 chroma (`PHOTO_JPEG` in
  `src/lib/photo.ts`), never enlarged, capped at 3840 wide. The hero placeholders are now
  1586 by 892 and 794 by 992 (set A), 1672 by 941 and 753 by 941 (set B).
- `next.config.ts`: `qualities: [75, 82, 90]`, `deviceSizes` gains 3840. The hero, the
  product gallery and cards, the strip, the blog covers, the story photo and the media
  banner pass `quality={90}` (`PHOTO_QUALITY`); logos, icons and badges keep 75.
- Media: no renditions; a hidden `blur` field (a 24 px WebP data URL, about 300 bytes)
  computed by `stampBlur` from the request's file on upload or replacement; the mappers
  expose it and the photo components pass it as `placeholder="blur"`. The hero renders its
  own `<picture>`, so it takes the `background-image` Next computes, one per breakpoint,
  and clears it once the photo decodes. The admin's thumbnail is the optimizer's 384 px
  transform of the original.
- `og:image` of a CMS photo goes through the optimizer at 1200 wide (the JPEG a scraper
  gets is 58 KB for the pricing cover): a q92 cover is 410 to 530 KB and WhatsApp drops a
  preview image over roughly 300 KB (Meta documents 600 KB).
- `scripts/media-blur.ts` backfills `blur`; `scripts/media-requality.ts` re-uploads the
  seeded photos under a new name and deletes the old renditions. Both ran on the review
  database (the outputs are in the PR description).

## The numbers

What the browser fetches, through the URLs the pages emit (`Accept: image/avif,...`):

| Photo (candidate) | Before | After |
|---|---|---|
| Hero desktop, 1920w | 38,436 B, 1920 by 1080 (q82 over an upscaled q80 JPEG) | 38,662 B, 1586 by 892 (q90 over q92 at source size) |
| Hero mobile, 1200w | 19,262 B, 1080 by 1350 | 16,371 B, 794 by 992 |
| Product card on `/products`, 828w | 6,648 B, 828 by 828 (q75 over q82) | 8,835 B, 828 by 828 (q90 over q92) |
| Product page gallery, 1200w | 7,133 B, 1000 by 1000 | 10,380 B, 1000 by 1000 |
| Blog cover on the post, 2x of 760 px | 33,783 B, 1600 by 900 (the 1920w candidate) | 60,515 B, 1536 by 864 (the 1536w candidate `deviceSizes` gained in the review; the 1920w is 120,197 B) |

The hero AVIF at 1920 stays far under the 220 KB budget of BRD 7.8 (38,662 B for set A,
52,406 B for set B, both from the server), so the budget line in
`e2e/a11y-and-budgets.spec.ts` is unchanged and the 85 fallback the CTO allowed for the hero
was not needed. The blog cover's 2x candidate is the one that grew (the source is now 2000
by 1125 instead of 1600 by 900, and the encode keeps the print's edges); a 3x phone fetches
the 1200w candidate at 29,434 B and a 1x desktop the 828w at 12,185 B. Before the review
added 1536 to `deviceSizes`, the 2x desktop fetched the 1920w candidate at 120,197 B for a
760 px box.

What is stored (the library, 33 files): 1,638.8 KB before, 3,739.9 KB after. A product photo
is 61 to 128 KB instead of 25 to 47; a cover 410 to 530 KB instead of 70 to 106. The bucket
holds them; the browser never fetches an original.

Lighthouse, mobile, simulated throttling, one run per URL on a machine shared with other
agents' builds (so plus or minus five points; `main` was measured twice, before and after
this branch, to bracket the noise):

| URL | `main` (run 1 / run 2) | This branch |
|---|---|---|
| `/` | perf 76 / 75, LCP 4.5 / 4.4 s, TBT 320 / 380 ms | perf 81, LCP 4.2 s, TBT 220 ms |
| `/products/tee-essential` | perf 80 / 79, LCP 4.4 / 4.1 s | perf 88, LCP 3.8 s |
| `/blog/how-to-price-printed-tshirt-saudi` | perf 81 / 89, LCP 4.2 / 3.6 s | perf 90, LCP 3.5 s |

Nothing here is the photos: the LCP element of `/` is the H1 (ADR-014), of the product and
post pages the photo, whose bytes moved by 3 KB and 86 KB at the 2x candidate. The image
bytes of the mobile home went from 86 KB to 99 KB; the seven `data:` placeholders Lighthouse
lists as image requests transfer nothing.

## The crops

400 by 400 pixels of the served AVIF, shown at 2x with nearest-neighbour scaling so every
served pixel is a 2 by 2 block, in `docs/audits/2026-09-19-photo-quality/`:

- `hero-desktop-1920w-before.png` / `-after.png`: the printed logo on the back of the tee.
  After: the fabric's texture and the grain of the print are there; before, a waxy smooth.
  The after crop covers more of the shot (1586 px wide against 1920 upscaled).
- `hero-mobile-1200w-before.png` / `-after.png`: the same region of the 4:5 crop.
- `product-card-828w-before.png` / `-after.png`: the collar of the black tee on `/products`.
- `product-page-1200w-before.png` / `-after.png`: the collar of the white tee on its page.
  After: the weave of the cotton and the stitch line of the collar; before, flat white.
- `blog-cover-1920w-before.png` / `-after.png`: the printed tote of the pricing post.
- `blur-up-hero-desktop.png`, `blur-up-product.png`: what a visitor sees while the photos are
  held back for six seconds: the placeholder under the copy, the tee's silhouette in the
  gallery box.

`served-before.json` and `served-after.json` hold the rows of the first table with the URLs.

## What remains Dhia's

The placeholders are what they are: 1586 px renders and 1000 px product photos. The
pipeline now keeps whatever is given to it: a 3000 px hero photograph is served at 3000 (a
2x screen at 1920 asks for 3840 and gets the photo whole), a 2000 by 2000 product export from
the PSDs in `resources/source-files` is served at 2000. When they land:

1. Put them under `resources/hero/examples` and `resources/products/{slug}/` and run
   `pnpm assets`, or upload them through the admin (the hook computes the blur, the
   optimizer resizes; no rendition to wait for).
2. `pnpm exec tsx scripts/media-requality.ts --dry-run`, then without the flag, on the
   review database; after the merge, `--env .env.cranl.local` for production, **then a
   redeploy** (RUNBOOK, "Assets"): a replaced photo gets a new name on purpose, the media
   collection revalidates no page, and the rebuild prerenders every page with the new
   names at once instead of the 60 s timer.
3. Re-run the measurement above at 2x on the real photographs and re-read the 220 KB
   budget: a 3000 px AVIF at q90 above about 250 KB puts the hero alone at 85.

Not touched, on purpose: the designer's mock-up (`optimizedSrc` at 82, drawn on a canvas),
the video poster (a stock still under a scrim), the author avatars (48 and 112 px).
