# Architecture decision records

One entry per non-obvious choice (constitution VIII). Newest at the bottom. Dates absolute.

## ADR-001 — Adopt the BRD v1.0 as the single source of truth (2026-09-12)

`B7R-WEBSITE-MASTER-BRD.md` (copied to `docs/`) governs scope, copy, design tokens, stack, and
gates. When code, research, or this log disagree with it, the BRD wins and is amended through
`docs/brd-sections/` + `docs/build-brd.py`. The constitution in `.specify/memory/constitution.md`
restates its §8.9 principles as CI/review gates.

## ADR-002 — Repository root is this folder; `resources/` stays in-repo (2026-09-12)

The BRD's tree shows a `b7r-website-v2/` root; Dhia's working folder *is* the repository, so the
app lives at the root. `resources/` (fonts, photos, logos) is the asset source of truth and is
committed; `scripts/prepare-assets.ts` derives `public/` from it. `resources/source-files/`
(PSDs, zips) is git-ignored.

## ADR-003 — next-intl without i18n routing (2026-09-12)

Level 1 is Arabic-only at the root. `next-intl` is configured in "without routing" mode (a single
`getRequestConfig` returning `ar`; no middleware/proxy, no `[locale]` segment), which keeps
Arabic at `/` with zero runtime cost and gives UI microcopy a typed home (`messages/ar.json`).
The English phase adds routing with `localePrefix: 'as-needed'` and `/en`.

## ADR-004 — TypeScript 5.9, Vitest 4.1 (2026-09-12)

TypeScript 7.0 (native port) shipped days before this project started and Next.js has not yet
declared support; the BRD says 5.x. Vitest 5.0.0 was one day old; 4.1.x is used. Both are
revisited when the ecosystem catches up.

## ADR-005 — Footer newsletter form is rendered disabled in Phase 1a (2026-09-12)

`/api/newsletter` is Phase 1b scope. Rendering the form with a fake success would breach
constitution VI; hiding it would misrepresent the footer design at the Dhia gate. The form is
visually complete with the submit button `disabled`; 1b enables it.

## ADR-006 — Hero LCP image: `<picture>` + two media-gated preloads (2026-09-12)

`next/image`'s `priority` emits a preload, but two `<Image>`s (desktop/mobile) hidden by CSS
would both be fetched. `getImageProps` builds a `<picture>` with one `<source>` per breakpoint
but emits no preload at all. The Hero server component therefore renders the `<picture>` and
two `<link rel="preload" as="image" imagesrcset … media=…>` elements (hoisted to `<head>` by
React 19); browsers honour `media` on preloads, so exactly one image is fetched and preloaded
per viewport. E2E asserts one hero image request per project.

## ADR-007 — Sample design rendered with Playwright/Chromium (2026-09-12)

Pillow cannot shape Arabic without libraqm and sharp's SVG text depends on system fonts. The
`scripts/generate-sample-design.ts` script renders «تصميمك هنا» in ITF Rayat Round Bold through
headless Chromium (already a dev dependency for e2e) to a transparent 1200 × 600 PNG, committed
to `public/designs/sample-tasmeemak.png`.

## ADR-008 — CranL deploy deferred; Docker image verified locally (2026-09-12)

Dhia asked that nothing be pushed to GitHub until the Phase 1a design is approved. CranL deploys
from GitHub, so the "first CranL deploy" item of §12.2 waits for that approval. The Dockerfile is
built and smoke-tested locally (`GET /api/health`) instead.

## ADR-009 — `motion` deferred to Phase 1b (2026-09-12)

Phase 1a's only use would be `useReducedMotion`; a 20-line hook in `lib/reduced-motion.ts`
covers it and keeps the home-page JS budget (§7.8) untouched. 1b adds `motion` for the
scroll-driven steps section, where the BRD calls for it.

## ADR-010 — Subset fonts; preload Medium globally and Black on the home page (2026-09-13)

BRD 3.3 preloads Regular and Bold only and calls Black lazy. Measured: Medium (nav, buttons,
labels) and Black (the hero H1, the LCP element) are painted above the fold on every first
view, so both were fetched at highest priority anyway, one round trip later. Preloading them
and subsetting all five files (37 kB → 27 kB each; Arabic + Basic Latin + punctuation) moved
mobile Lighthouse Performance from 82 to 90 and LCP under DevTools throttling to 2.1 s. Bold
is not painted above the fold on `/` (H2s only), so it is no longer preloaded there; pages
whose H1 is Bold preload it themselves. BRD 3.3 and 7.8 amended accordingly.
Lighthouse's simulated LCP stays at 3.4–3.6 s (removing Bold from the preload set changed
nothing measurable) because Lantern charges every resource that starts before first paint —
all JS chunks included — to the LCP path. `lighthouserc.json` now asserts LCP ≤ 2.5 s and
CLS ≤ 0.1 as the constitution requires, so CI will be red on LCP until the simulated value
drops; tracked as a Phase 1b task (reduce initial JS: hero island slimming, no new eager
scripts). The category gate (Performance ≥ 90) and the DevTools-throttled LCP (2.1 s) pass.

## ADR-011 — Mobile menu sheet loads on first intent (2026-09-13)

The Radix Dialog (focus trap, scroll lock, portal) costs ~15 kB gzip and is used only after a
tap on the burger. The burger itself is a plain server-rendered button; the sheet chunk is
fetched on pointer/touch/focus and mounted open on click. Keeps the home page's initial JS
under the 180 kB budget with headroom for Phase 1b's widgets.
