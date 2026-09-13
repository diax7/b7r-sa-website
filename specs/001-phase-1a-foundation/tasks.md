# Tasks: Phase 1a — Foundation, design system, shell, hero, product strip, designer

**Input**: `plan.md` (CTO GO 92/100, 2026-09-12), `spec.md`. **Branch**: `phase/1a-foundation`.

Tasks are dependency-ordered. `[P]` = parallelisable with its neighbours. Each task names the
files it touches and the check that proves it.

## Phase A — Tooling and guardrails

- [x] T001 `package.json`, `.npmrc`, `pnpm-workspace.yaml`: pinned deps, scripts, overrides, audit ignores. Check: `pnpm audit --audit-level=moderate` clean.
- [x] T002 `tsconfig.json` (seven strict flags, `@/*`), `next.config.ts` (standalone, `APP_VERSION`, image formats), `postcss.config.mjs`.
- [x] T003 `.oxlintrc.json` (typescript/import/unicorn/react/nextjs/jsx-a11y, module-boundary `no-restricted-imports`), `.oxfmtrc.json`.
- [x] T004 `scripts/check-rtl-classes.ts` + `tests/check-rtl.test.ts` (fixtures per plan §A.4). Check: 25 tests green.
- [x] T005 `vitest.config.ts`, `playwright.config.ts` (3 projects, :3004), `lighthouserc.json` (§7.8 thresholds).
- [x] T006 `prek.toml`, `.env.example`, `.env.local`.
- [x] T007 `src/lib/env.ts` (zod; 1a required: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_WHATSAPP`; `NEXT_PUBLIC_SITE_URL` optional) + `tests/env.test.ts`.
- [x] T008 `.github/workflows/ci.yml` (§8.7 steps 1–8, SHA-pinned actions, `persist-credentials: false`); run `actionlint` + `zizmor` locally.
- [x] T009 `Dockerfile`, `.dockerignore` (§8.6). Check at the end: `docker build` + `curl :3000/api/health`.
- [x] T010 `docs/DECISIONS.md` (ADR-001…008), `docs/IDEAS.md`, `docs/RUNBOOK.md`; copy BRD to `docs/`.
- [x] T011 `pnpm exec playwright install chromium webkit`; `uv tool install prek`; `prek install`.

## Phase B — Assets

- [x] T012 `scripts/prepare-assets.ts`: fonts → `public/fonts`; logos → `public/images/logo`; product photos → `public/images/products/{slug}/` (sharp, jpg q82); badges → `public/images/badges`; icons-3d → `public/images/icons-3d`; favicon set from `icon.png`.
- [x] T013 `scripts/hero-crops.ts`: desktop (1920 wide, 16:9 pad/crop) and mobile (1080 × 1350, 4:5 centred on the product cluster) variants of both placeholder sets → `public/images/hero/`.
- [x] T014 `scripts/generate-sample-design.ts` (Playwright renders «تصميمك هنا», 1200 × 600, transparent, Bold, primary) → `public/designs/sample-tasmeemak.png`. Commit the PNG.

## Phase C — Design system

- [x] T015 `src/styles/globals.css`: `@import "tailwindcss"`, `@theme` tokens (§3.2–3.7), five `@font-face` + fallback with `size-adjust`, base (`body` 17/16 px, measure), utilities (`.display .lead .eyebrow .measure`), focus ring, `html.js .reveal`, reduced-motion global.
- [x] T016 `src/lib/cn.ts`, `src/lib/utm.ts` (+ `tests/utm.test.ts`), `src/lib/reduced-motion.ts`.
- [x] T017 [P] `components/shared/`: `container`, `section`, `section-header`, `visually-hidden`, `icon` (RTL-aware Lucide wrapper), `button` (cva; 4 variants × 2 sizes; trailing arrow; loading), `chip`, `badge`, `card`, `input`, `stepper`.
- [x] T018 [P] `components/shared/sar-symbol.tsx`, `sar-amount.tsx` + `tests/sar-amount.test.tsx` (symbol left, `bdi dir=ltr`, integer vs 2-dp, tabular nums).
- [x] T019 [P] `components/ui/slider.tsx` (Radix, `dir="rtl"`, restyled), `components/ui/dialog.tsx` (Radix, restyled, no default look).
- [x] T020 `components/shared/reveal.tsx` (IO, once, stagger, `html.js` gate, reduced motion).

## Phase D — Content contract

- [x] T021 `src/content/schema.ts` (all §8.4 shapes, zod v4).
- [x] T022 [P] `src/content/site.ts`, `navigation.ts`, `seo.ts`, `home.ts` (hero slides, strip order, designer strings, ribbon), `products.ts` (Appendix A + print areas), `steps.ts`, `why-us.ts`, `faq.ts` (Appendix D + home selection), `testimonials.ts` (3 placeholders), `integrations.ts`, `pages/*.ts`, `legal/*.md`, `blog/index.ts` (3 entries, no bodies).
- [x] T023 `src/messages/ar.json` + `src/i18n/request.ts` (next-intl without routing) — aria labels, menu labels, hints, error page `TODO(copy)` strings.
- [x] T024 `tests/content-schema.test.ts`, `tests/content-verbatim.test.ts` (against the BRD, `TODO_COPY` allowlist).

## Phase E — Shell

- [x] T025 `src/app/layout.tsx` (html dir/lang, font preloads with `crossOrigin`, `html.js` inline script, skip link, header, main, footer), `src/app/robots.ts` (noindex guard), `modules/core/seo/metadata.ts`.
- [x] T026 `modules/core/header/*`: `Header` (client; IO sentinel; shrink; transparent on `/`), `MobileMenu` (Radix Dialog; burger morph; `Dialog.Close` at burger position; staggered links; CTA; login; WhatsApp line; socials).
- [x] T027 `modules/core/wave-divider.tsx` (two-period SVG, 20 s loop, reduced motion static).
- [x] T028 `modules/core/cta-ribbon.tsx` (`topTone`, `page` for utm), `modules/core/footer.tsx` (4 columns, badges, newsletter disabled, contact `<bdi>`, copyright).
- [x] T029 `modules/core/placeholder-section.tsx` (gated on `NEXT_PUBLIC_SITE_URL`), `modules/core/analytics/track.ts` (no-op sink with typed event names), `modules/core/index.ts`.
- [x] T030 `src/app/not-found.tsx`, `error.tsx`, `global-error.tsx`, `api/health/route.ts`.

## Phase F — Home sections

- [x] T031 `modules/home/hero/*`: server `Hero` (static markup for 4 slides, `<picture>` + two media-gated preload links for slide 1, overlay, chips, dots markup) + client `HeroCarousel` (auto-advance 6 s, crossfade 700 ms, text rise, pause on hover/focus/touch, swipe with `touch-action: pan-y`, dots, pause button, lazy slides 2–4, reduced motion). Hero pulled under the header (`margin-block-start`/`padding-block-start` `--header-h`, `min-height: 100svh`).
- [x] T032 `modules/home/product-strip/*`: server strip (5 links, CSS `flex-grow` expand, labels, images with `sizes`), mobile snap carousel, `StripHint` island (localStorage, dismiss on scroll).
- [x] T033 `src/app/page.tsx`: hero → strip → designer → 6 placeholders → ribbon; alternating tones; metadata from `content/seo.ts`.

## Phase G — Designer

- [x] T034 `modules/designer/profit.ts` (`perPiece`, `monthly`, `clampSell`) + `tests/profit.test.ts` (examples + fast-check property over 1 000 inputs + clamp edges).
- [x] T035 `modules/designer/print-area.ts` (fractions → stage px; `insideRatio`; recentre at 60 %) + `tests/print-area.test.ts` (aspect ≈ 0.737 ± 0.02, within (0,1)).
- [x] T036 `modules/designer/use-designer-state.ts` (reducer; product change resets colour + sell price; deep link parse).
- [x] T037 `modules/designer/controls/*`: product chips (radiogroup), colour swatches (radiogroup), dropzone (file validation, drag-and-drop, sample, replace/reset, error), pricing (input + Slider + helper), stepper, results card (`CountUp` on commit), CTA.
- [x] T038 `modules/designer/canvas/design-canvas.tsx` (react-konva; two layers; clipped group; Transformer sibling; outline; crossfade on swap; recentre; snap-back < 25 %; wheel; pinch; dblclick; `pixelRatio ≤ 2`; `useImage` local hook).
- [x] T039 `modules/designer/designer-island.tsx` (client composition + sticky mobile results bar), `designer-loader.tsx` (IO → `dynamic(..., { ssr: false })`), `designer-section.tsx` (server shell with static mockup), `index.ts`.

## Phase H — Verification

- [x] T040 `e2e/home-hero.spec.ts` (one H1, four strings JS-off, dots/pause keyboard, reduced motion, one hero image request per project, header bbox ∩ H1 = ∅, CLS on shrink).
- [x] T041 `e2e/header-menu.spec.ts` (desktop links + CTA, mobile menu open/close/Escape/focus restore/scroll lock).
- [x] T042 `e2e/product-strip.spec.ts` (5 links, focus expands on desktop, snap on mobile).
- [x] T043 `e2e/designer.spec.ts` (chunk lazy, sample visible, values 89/45/10 → 44/13200, sell 40 warning, upload fixture, drag via `window.Konva`, snap-back, deep link, invalid file).
- [x] T044 `e2e/not-found.spec.ts`, `e2e/a11y.spec.ts` (axe), `e2e/budgets.spec.ts` (JS ≤ 180 kB gzip, woff2 ≤ 40 kB, LCP image ≤ 220 kB, designer chunk not before scroll).
- [x] T045 Run all gates: `typecheck`, `lint`, `format:check`, `check:rtl`, `test`, `build`, `e2e`, `lhci`. Fix to zero warnings.
- [x] T046 `design-review` skill pass on hero, strip, designer (zero AI-slop findings); fix findings.
- [x] T047 Docker build + health smoke.
- [ ] T048 CTO code review (cto-cycle step 7) → fixes → ≥ 90 GO. Commit on `phase/1a-foundation`.
- [ ] T049 Hand `http://localhost:3004` to Dhia (Dhia gate). Stop.
