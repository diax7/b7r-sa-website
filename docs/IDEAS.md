# Ideas parked outside the current phase

Constitution VIII: features outside the current phase are written here, not built.

- Docker image is 338 MB after 2a (307 MB after 1c, 292 MB after 1a) vs the BRD 8.6 target of 250 MB; the app layer is ~60 MB and the rest is `node:22-alpine`. Evaluate a distroless/slim base or pruned locales before the CranL deploy. The 1c image was smoke-tested: health, 301, 410, CSP/Content-Language headers, OG assets, and the `B7R_RUNTIME=production` gate exits 1 with the missing-variable list.
- Simulated LCP on `/` stays at 3.4 s vs the 2.5 s LHCI assertion after the 1b time box (ADR-014); the floor is the React runtime. Options for later: React Compiler / smaller runtime when available, or renegotiate the assertion with Dhia against the DevTools-throttled 2.1 s.
- JS on `/` after 1b: 176 kB of 180 kB with every widget configured (all islands lazy). Anything new on the home page must be lazy.
- Rich text «CTA block» custom node (BRD §9.5): a `BlocksFeature` block with label + href rendered as the primary button; add when a page needs a call to action inside prose (ADR-031).
- Live preview for pages (BRD §9.3) needs draft rendering on the public routes; the ISR + `revalidatePath` pipeline serves published documents only (ADR-031, 2b). A `?preview=<token>` dynamic route that reads drafts is the likely shape.
- `/contact` ships ~58 kB more JS than the home baseline (Radix Select, form, Turnstile hook). A native `<select>` restyled to the tokens would cut most of it if BRD 3.10's Radix mandate is ever relaxed. On the GitHub runner Lighthouse mobile scores it 0.88–0.89 (93 locally, ADR-014 variance), so its performance assertion is at warn level in `lighthouserc.json` (`assertMatrix`) while the other four URLs stay at error; lifting it back to error is the acceptance test for that JS cut.
- Home JS budget test aborts route prefetches (`Next-Router-Prefetch`) so it measures the home route alone; the prefetched chunks for header/footer links are real bandwidth on 4G and worth a look if the BRD ever budgets navigation.
- Lighthouse variance on the simulated mobile run is ±3 points around the 0.9 threshold for `/` and the product pages (ADR-014 floor); `scripts/dev/lh-all.sh` warms the `next/image` cache first because the cold first transform alone costs a point.
- One transient e2e failure seen on a cold server (first run after `restart.sh`): `products.spec.ts › mobile sticky bar appears after the CTA scrolls out` on iphone-15 (`toHaveAttribute aria-hidden`), not reproduced on three later cold runs. If it recurs, wait for hydration of `[data-product-sticky]` before scrolling instead of relying on `retries: 1`.
- Next 16.3.5 logs `Error: Internal: NoFallbackError` with a stack trace for every request to an unknown slug under a `dynamicParams = false` route (`/products/nope`) in `next start` (`response-cache/index.js` logs the generator error after an early resolve). The response is still the global 404; the noise is only in the container log. Re-check after the next Next upgrade; if it persists, a log filter in CranL is cheaper than a workaround.
- The Docker image now embeds a snapshot of the CMS content at build time (ADR-025); ISR refreshes it at runtime. If builds ever need to run without database access, the alternative is `dynamic = 'force-dynamic'` on the CMS-backed pages plus the 60 s cache, at the cost of the static-first architecture.
- Payload's REST API on `/api/payload/*` is public-read for published content (products, globals except the admin-only verification group). Rate limiting for that surface is Payload's default (500 requests / 15 min per IP, `rateLimit` option); revisit if scrapers show up in the logs.
- ~~No e-mail adapter in the CMS~~: closed; `@payloadcms/email-resend` is wired when `RESEND_*` is set (health says `email: console` until then), so the login page's «نسيت كلمة المرور» sends from the day the keys exist.
- Home product strip: Dhia's two-swatch card behaviour (ADR-035) stops at the listing and related cards; the strip keeps its expand-on-hover panels because a hover-preview swatch inside an expanding panel would be two hover behaviours in one element and would put the card island on the home route. Revisit only if Dhia names the strip.
- Designer colour choice: the home designer shows one colour per product (ADR-036); the product page's «جرّب تصميمك عليه» link could carry the chosen colour into the designer if colour returns later.
- Phase 2b candidates recorded here rather than built: login Turnstile (ADR-027), IndexNow ping and CDN purge from the publish hooks (BRD 9.6), scheduled publish and live preview (BRD 9.3), the remaining collections/globals of BRD 9.4 (pages, home, faqs, testimonials, integrations, redirects) and a weekly `pg_dump` to S3 (BRD 9.2).

## CI (ADR-045, 2026-09-15)

- The S3 job's server log carries about 1,300 `upstream image response failed for
  http://localhost:9000/b7r-media/media/<file> 404` lines per run (since before PR #15): the
  URLs the site builds for CMS media and the keys the objects are stored under disagree in the
  MinIO job, and no test asserts an image response there, so the job does not prove that CMS
  media is served through the optimizer from S3 (ADR-029). Find the key/URL disagreement, fix
  it, then one assertion in the S3 subset (`products.spec.ts`: the product image answers 200
  with an image content type) so it cannot regress silently.
- The admin suite (the `cms` project, 24 tests) runs twice per CI event: in the quality job
  against local-disk media and in the S3 job against MinIO, the storage production uses.
  Dropping it from the quality job saves about 3 minutes of the 24; Dhia's call (the quality
  job's run is the one with Playwright's project ordering).

## Admin panel (ADR-039, 2026-09-13)

- Payload's edit-view chrome has axe gaps that are its engine's, not the shell's (unnamed
  drag handles and popup buttons, an unlabelled date input, the tabs list): report upstream and
  re-check on the next Payload minor; the admin e2e scopes its audit to our surfaces meanwhile.
  Two upstream em dashes sit in the same bucket (the upload meta line, the pagination
  ellipsis); `pnpm check:dash` covers our sources, not `node_modules`.
- ~~The content-locale switcher offers `en` although no English content is live yet.~~ Closed
  by Level 5 (ADR-043): the English values are seeded and every collection reads per locale.

## Blog (ADR-041, 2026-09-14)

- Tag pages (`/blog/tag/{slug}`) once tags carry enough posts to be worth a listing.
- Server-side search with Arabic stemming if the corpus outgrows the embedded index (a few
  hundred posts); until then the island folds hamza forms and diacritics only.
- A post's `contentUpdatedAt` could be set automatically when the body changes on a
  published post; today an editor sets it and the freshness job sets it on a regeneration.
- A lenient preview for a half-filled block: today a draft whose block fails the content
  contract renders the error page under preview (the public site must never render it); a
  preview could skip the broken block with a notice instead.
- Dashboard widgets not built: drafts waiting to publish and scheduled publishes (Dhia chose
  not to), the last backup date (the weekly workflow could post a status the dashboard reads).
- Live preview (a side panel that updates as you type) stays deferred; the preview button is
  what Dhia asked for.
- Search Console topic suggestions (Level 4c): queries the site ranks for on page two become
  `ai-topics` with `source: searchConsole`; the backlog and the pipeline are ready for them.
- Image generation behind `Provider.image?` once a vendor is chosen; `imageMode: generate` is
  refused until then.
- The freshness pass could also re-run the review on unchanged posts and flag a score drop
  after a rules change; today it reacts to the facts sheet only.
