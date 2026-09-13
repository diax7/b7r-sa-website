# Implementation Plan: Phase 1a — Foundation, design system, shell, hero, product strip, designer

**Branch**: `phase/1a-foundation` | **Date**: 2026-09-12 | **Spec**: `specs/001-phase-1a-foundation/spec.md`

**Input**: BRD §12.2 (scope + DoD), §3, §4, §6.1–6.4.3, §7.2–7.3 (only `/`), §8.

## Summary

Stand up the `b7r-website-v2` Next.js 16 app inside this folder with every guardrail from
§8.7–8.8 wired before features; encode the §3 design system as Tailwind 4 `@theme` tokens
and a small set of shared primitives; put all Level 1 copy into the zod-validated content
contract; build the global shell (header, footer, ribbon, waves, 404, health); build the
three home sections that Dhia judges the project on (hero carousel, hover-expand product
strip, react-konva designer + profit calculator); leave the other six home sections as
labelled placeholders. Serve on `http://localhost:3004` for the Dhia gate. No GitHub push,
no CranL deploy in this phase (Dhia's instruction); the Docker image is built and
smoke-tested locally instead.

## Technical Context

**Language/Version**: TypeScript 5.9.3 (strict + the seven §8.1 flags), Node ≥ 22 (24.14 on
the dev machine; `node:22-alpine` in Docker), pnpm 11, ESM.

**Primary Dependencies** (exact pins, looked up 2026-09-12): next 16.3.5, react 19.3.0,
react-dom 19.3.0, tailwindcss 4.3.3 + @tailwindcss/postcss 4.3.3, lucide-react 1.45.0,
konva 10.5.0, react-konva 19.2.7, zod 4.6.2, next-intl 4.14.4,
class-variance-authority 0.7.1, clsx 2.1.1, tailwind-merge 3.6.0, @radix-ui/react-slider
1.4.7, @radix-ui/react-dialog 1.1.23, @radix-ui/react-slot 1.3.3, sharp 0.35.4 (build scripts only, devDependency).

`motion` is NOT installed in 1a (its only use would be `useReducedMotion`; a 20-line
`lib/reduced-motion.ts` hook covers it); 1b adds it for the scroll-driven steps.

**Dev/Test**: oxlint 1.82.0, oxfmt 0.67.0, vitest 4.1.11 (4.x, not the day-old 5.0.0),
@vitejs/plugin-react 6.1.1, jsdom, @testing-library/react 16.3.3, fast-check 4.10.0,
@playwright/test 1.63.0, @axe-core/playwright 4.13.0, @lhci/cli 0.15.1, tsx 4.23.13, prek.

**Storage**: none (static content files).

**Testing**: Vitest unit (profit math, `SarAmount`, content schemas, print-area geometry,
rtl-check script); Playwright e2e (hero, menu, strip, designer, 404, axe); LHCI on `/`.

**Target Platform**: mid-range Android Chrome on 4G first; iOS Safari; desktop 1280/1536.

**Project Type**: web app (Next.js App Router, static rendering, standalone output).

**Performance Goals**: §7.8 budgets; LCP ≤ 2.5 s mobile; home JS ≤ 180 kB gzip without the
lazy designer chunk.

**Constraints**: RTL logical CSS only; copy verbatim from content files; no raw hex; light
mode only; reduced-motion variants everywhere; zero warnings.

**Scale/Scope**: 1 page + 404 + 1 API route this phase; ~15 shared components; 3 feature
sections; ~12 content files; ~8 unit test files; ~6 e2e specs.

## Constitution Check

| # | Gate (constitution v1.0.0) | Pass? |
|---|---|---|
| I | RTL/logical CSS only; `dir="rtl" lang="ar"` on `<html>`; mobile-first; Western digits | Yes — `check:rtl` script + oxlint; root layout owns `dir`/`lang` |
| II | Every public page static + server-rendered; client islands only where needed | Yes — `/` is static; islands: Header (scroll/menu state), Hero, ProductStrip (hint only; strip itself is CSS hover/focus), Designer |
| III | All copy from `src/content/*` verbatim per BRD §4; `SarAmount` for money | Yes — content files + schema test; aria microcopy in `messages/ar.json` |
| IV | Perf/a11y budgets wired as CI thresholds (LHCI, axe, bundle) | Yes — `lighthouserc.json`, axe in e2e, `next build` size check in e2e |
| V | Tokens only; one typeface; one radius family; reduced-motion variants | Yes — `@theme` in `globals.css`; oxlint `no-restricted-syntax` is not a hex detector, so `check:rtl` also greps for `#[0-9a-f]{3,6}` outside `globals.css`/SVG paths |
| VI | No fabricated content; placeholders labelled; no AI mention | Yes — testimonials not rendered in 1a; placeholder sections carry a dev-only label |
| VII | Feature under `src/modules/<name>/`; imports only core/components/content/lib | Yes — oxlint `no-restricted-imports` patterns |
| VIII | ADR per non-obvious choice; CTO review before and after | Yes — ADR-001..ADR-008 listed below; this plan is the "before" |
| IX | Tests for behaviour/edges/errors; all gates green with zero warnings | Yes — see Testing |
| X | No AI attribution in commits/PRs | Yes — commit template; author Dhia |

## Project Structure

### Documentation (this feature)

```text
specs/001-phase-1a-foundation/
├── spec.md
├── plan.md              # this file
├── tasks.md             # generated next
└── checklists/requirements.md
docs/
├── DECISIONS.md         # ADR-001 … ADR-008
├── IDEAS.md
└── RUNBOOK.md           # dev + docker run; deploy section stubbed until CranL
```

### Source Code (repository root)

The website lives at the repository root (this folder), not in a nested `b7r-website-v2/`
directory, because Dhia's folder *is* the repository. `resources/` stays as the asset source;
`scripts/prepare-assets.ts` copies/optimises into `public/`.

```text
.github/workflows/ci.yml
.oxlintrc.json · .oxfmtrc.json · prek.toml
next.config.ts · postcss.config.mjs · tsconfig.json · vitest.config.ts
playwright.config.ts · lighthouserc.json · Dockerfile · .dockerignore · .env.example
package.json · pnpm-lock.yaml · .npmrc (minimum-release-age, ignore-scripts)
public/
├── fonts/ITFRayatRound-{Light,Regular,Medium,Bold,Black}.woff2
├── images/logo/{logo,logo-white,icon,small-icon}.png
├── images/products/{slug}/{colour}-{front,back}.jpg   (1000×1000, re-encoded q82)
├── images/hero/{set-a,set-b}-desktop.jpg · {set-a,set-b}-mobile.jpg  (generated)
├── images/badges/{paypal,mastercard,visa,maestro,apple-pay,mada,sbc,moc,misk}.png
├── designs/sample-tasmeemak.png                         (generated, committed)
└── favicon.ico · icon.png · apple-icon.png
src/
├── app/
│   ├── layout.tsx            html dir/lang, font preloads, shell order (§6.1)
│   ├── page.tsx              home: Hero, ProductStrip, DesignerSection, placeholders, ribbon
│   ├── not-found.tsx         §4.15, no ribbon
│   ├── robots.ts             noindex guard (§7.2) — full rules land in 1c
│   ├── error.tsx · global-error.tsx
│   └── api/health/route.ts
├── modules/
│   ├── core/                 Header, MobileMenu, Footer, CtaRibbon, WaveDivider, SkipLink,
│   │                         PlaceholderSection, analytics/track.ts, seo/metadata.ts, index.ts
│   ├── home/                 Hero (HeroCarousel client + server shell), ProductStrip, index.ts
│   └── designer/             DesignerSection (server shell) · DesignerIsland (client, lazy)
│                             · canvas/DesignCanvas.tsx (react-konva) · controls/* · profit.ts
│                             (pure) · print-area.ts (pure) · use-designer-state.ts · index.ts
├── content/
│   ├── schema.ts · site.ts · navigation.ts · home.ts · products.ts · faq.ts
│   ├── testimonials.ts · integrations.ts · seo.ts · steps.ts · why-us.ts
│   ├── pages/{how-it-works,about,contact}.ts · legal/{terms,shipping,privacy}.md
│   └── blog/index.ts         (three sample entries: slug, title, hub only — no bodies; §4.13)
├── components/
│   ├── ui/                   slider.tsx · dialog.tsx (Radix, restyled)
│   └── shared/               button, chip, badge, card, section-header, container, section,
│                             icon (RTL-aware), sar-symbol, sar-amount, input, stepper,
│                             visually-hidden, reveal (scroll-reveal wrapper)
├── i18n/request.ts · messages/ar.json     (aria labels, menu labels, hints)
├── lib/                      env.ts · utm.ts · cn.ts · reduced-motion.ts · redirects.ts (map
│                             only; wiring in 1c)
└── styles/globals.css        @theme tokens, @font-face, base, utilities (.display, .lead …)
scripts/
├── prepare-assets.ts         copies resources → public, re-encodes product photos
├── hero-crops.ts             4:5 mobile crops centred on the product cluster (sharp)
├── generate-sample-design.ts renders «تصميمك هنا» 1200×600 transparent PNG via Playwright
└── check-rtl-classes.ts      §8.8 regex + hex-in-components check
tests/
├── profit.test.ts · sar-amount.test.tsx · content-schema.test.ts · print-area.test.ts
├── utm.test.ts · check-rtl.test.ts · env.test.ts
e2e/
├── home-hero.spec.ts · header-menu.spec.ts · product-strip.spec.ts · designer.spec.ts
├── not-found.spec.ts · a11y.spec.ts (axe on / and a 404) · budgets.spec.ts (JS size)
```

## Approach, section by section

### A. Tooling and guardrails (before any feature)

1. `pnpm init`; `.npmrc` with `minimum-release-age=1440`, `ignore-scripts=true` (sharp and
   playwright need `pnpm approve-builds` / `pnpm exec playwright install chromium`; documented
   in RUNBOOK). `pnpm audit --audit-level=moderate` after install.
2. `tsconfig.json` with the seven flags; `paths: { "@/*": ["./src/*"] }`.
3. `.oxlintrc.json`: plugins typescript, import, unicorn; rule `no-restricted-imports` with
   patterns forbidding `@/modules/(home|designer|products|pages|blog|forms)/*` from inside
   another feature module (implemented as per-module override globs), and forbidding relative
   `../` imports. `.oxfmtrc.json` defaults, 100 cols, single quotes.
4. `scripts/check-rtl-classes.ts`: scans `src/**/*.{ts,tsx,css}` for
   `\b(ml|mr|pl|pr|left|right|text-left|text-right|rounded-l|rounded-r|border-l|border-r)-`
   and `float-(left|right)`, tightened so bare classes are caught too: `\b(ml|mr|pl|pr|left|right|rounded-[lr]|
   border-[lr])(-|\b)` and `\btext-(left|right)\b`, `float-(left|right)`; plus CSS
   `margin-left|margin-right|padding-left|padding-right|left:|right:|text-align: (left|right)`;
   skips lines containing `rtl-allow`; also flags raw hex `#[0-9a-fA-F]{3,8}\b` (3/4/6/8
   chars) in `src/**/*.tsx` (allowed in `globals.css` and in `content/products.ts` colour
   swatches, which are data). Unit-tested with fixtures: `ml-4` fails, `text-left` fails,
   `rounded-l` fails, `ms-4` passes, `right-6 // rtl-allow` passes, `#0058B0` in tsx fails.
5. Vitest (jsdom + plugin-react), Playwright (`webServer: pnpm start` on :3004 against the
   built app; projects: Desktop Chrome 1280, Pixel 7 (Chromium), iPhone 15 (WebKit —
   `playwright install chromium webkit`)), LHCI (`lighthouserc.json`
   mobile preset, assertions Performance 0.9, Accessibility 0.95, Best Practices 0.95, SEO 1.0
   on `http://localhost:3004/`, `NEXT_PUBLIC_SITE_URL=https://b7r.sa` for the run).
6. `prek.toml` hooks: typecheck, lint, check:rtl on commit. `prek` installed via `uv tool
   install prek`.
7. `.github/workflows/ci.yml` per §8.7 (steps 1–8; step 9 omitted until CranL), actions
   pinned by SHA (looked up at write time), `persist-credentials: false`; linted locally with
   `actionlint` and `zizmor` since it cannot run on GitHub yet.
8. `docs/DECISIONS.md` with ADR-001 "Adopt the BRD" plus the ADRs below; `docs/IDEAS.md`;
   `docs/RUNBOOK.md`.
9. Dockerfile per §8.6; `.dockerignore`; `pnpm build` produces `.next/standalone`. Smoke:
   `docker build` + `curl /api/health`.

### B. Design system

- `globals.css`: `@import "tailwindcss"; @theme { --color-*, --radius-*, --shadow-*,
  --duration-*, --ease-*, --font-sans, --text-* }`; five `@font-face` rules with
  `font-display: swap`, `unicode-range` omitted (single family), and a fallback `@font-face`
  named "Rayat Fallback" with `src: local("Tahoma")` + `size-adjust`/`ascent-override`
  tuned by measuring against the woff2 (approximation documented; the goal is CLS ≤ 0.1);
  base rules (`html { dir }` not set in CSS; `body` 17 px, ≤ 360 px → 16 px); utilities
  `.display`, `.lead`, `.eyebrow`, `.measure` (max-width 38rem), `.section-pad`; focus ring
  `:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px }`; reduced
  motion global rule.
- Fonts: preload Regular + Bold in `layout.tsx` via `<link rel="preload" as="font"
  type="font/woff2" crossOrigin="anonymous">` (without `crossOrigin` fonts download twice);
  Medium loaded by `@font-face` on demand; Light/Black declared, used only where §3.3 says.
  Black (hero H1) is lazy per §3.3; the hero CLS e2e measures the swap — if the H1 swap alone
  exceeds ~0.05, preload Black on `/` and record an ADR.
- Primitives: `cva`-based `Button` (primary/secondary/ghost/link × md/lg, `trailingArrow`
  renders `<Icon name="ArrowRight" />` which mirrors under RTL, `loading` state), `Chip`,
  `Badge` (10 % rule), `Card`, `SectionHeader` (eyebrow + H2 + lead, start-aligned, `align`
  prop), `Container` (1280 / 24 / 16), `Section` (`tone="surface"|"ground"`, 96/64 rhythm),
  `Icon` (Lucide wrapper: `size=24 strokeWidth=1.75`, `mirror` auto for arrows/chevrons via a
  small map; renders `rtl:-scale-x-100` — a logical utility), `SarSymbol` (official SAMA path
  from the B7R app, `fill="currentColor"`, `height="1em"`, `aria-label="ريال سعودي"`),
  `SarAmount` (`<bdi dir="ltr">` + tabular-nums, integer/2-dp rule), `Input`, `Stepper`
  (+/− buttons, `aria-live` value), `Slider` (Radix, RTL: Radix Slider honours `dir`
  prop; we pass `dir="rtl"` so it advances right-to-left), `VisuallyHidden`, `Reveal`
  (IntersectionObserver fade-up 12 px / 400 ms once, stagger via CSS `--i`; disabled under
  reduced motion; hidden state applies only under `html.js` — an inline script in `<head>`
  adds the class — so JS-off and pre-hydration always show content; never wraps hero
  content). `WaveDivider` (§6.3.4 SVG drawn at two periods, 2880 × 48 viewBox, 2 paths, CSS
  `translateX` keyframes to −50 % over 20 s for a seamless loop, opposite directions,
  `prefers-reduced-motion` stops).

### C. Content contract

- `schema.ts`: zod v4 schemas for all §8.4 shapes; `Product` includes `printArea.canvas`
  fractions; `HeroSlide` includes `imageDesktop`/`imageMobile` paths; `PageSeo` for `/`
  only in use this phase but the file carries all routes.
- Content files hold every §4 string, including strings for sections built in 1b/1c
  (steps, why-us, FAQ, testimonials, integrations, pages, legal), so later phases only
  build components. Blog entries carry only what §4.13 provides (slug, title, hub,
  `sample: true`); bodies are written in 1c with `ux-araby`. **No new Arabic marketing prose
  is written in 1a.**
- `tests/content-schema.test.ts` imports every content module and `safeParse`s it; failure
  message names the file and path.
- `tests/content-verbatim.test.ts`: every string value in `content/home.ts`,
  `content/navigation.ts`, `content/site.ts`, `content/products.ts` must appear verbatim in
  `B7R-WEBSITE-MASTER-BRD.md` (after normalising whitespace) unless the field is tagged in a
  small `TODO_COPY` allowlist. Mechanically enforces §0.4.3.

### D. Shell

- `layout.tsx`: `<html lang="ar" dir="rtl">`, `<head>` font preloads + `content-language`
  meta, `<body>`: `SkipLink` → `<Header/>` → `<main id="content">{children}</main>` →
  (ribbon rendered by pages) → `<Footer/>`. Metadata base from `content/seo.ts` with
  `%s | بحر برنت` template; `robots` noindex unless `NEXT_PUBLIC_SITE_URL ===
  'https://b7r.sa'`. Viewport `width=device-width, initial-scale=1`.
- `Header` (client): an `IntersectionObserver` on a 24 px sentinel placed at the top of
  `<body>` toggles `data-scrolled` (no scroll listener); the sticky wrapper reserves
  `--header-h` (72 px desktop / 60 px mobile) so the inner shrink to 60 px does not shift
  layout; transparent on `/` at top (Header reads `usePathname()`). **Hero under the
  header:** on `/` the hero section is pulled up with `margin-block-start: calc(-1 *
  var(--header-h))` and `padding-block-start: var(--header-h)` so the transparent header
  sits over the photo, the hero still totals `100svh`, and the text column is offset below
  the header; e2e asserts the header's bounding box never intersects the H1 (§6.2). Active
  link underline via `::after` scaleX from start. Mobile burger: three spans, CSS transforms
  300 ms; the overlay is a Radix `Dialog` (`components/ui/dialog.tsx`, restyled, no default
  look): content is full-screen; a `Dialog.Close` rendered inside the Content at the burger's
  exact position shows the X state while the header burger is `visibility: hidden`, so the
  eye reads one morphing control and the close control lives inside the focus trap (no
  `onPointerDownOutside` double-toggle); `data-state` drives the slide/fade CSS, focus trap /
  Escape / scroll lock / focus restore come from Radix.
- `Footer` (server): 4 columns, badges row (payment PNGs at 28 px in white tiles; SBC/MoC
  from `cropped-lowres`; Misk logo + line), contact line with `<bdi>`, copyright with the
  build year. Newsletter form in 1a is visually complete with the submit button `disabled`
  (no fake success, no extra note); 1b wires `/api/newsletter`. Logged as ADR-005.
- `CtaRibbon` (server): primary band with `WaveDivider` top (`fill` = previous section's
  bg, passed as prop `topTone`) and bottom (navy); `utm_content={page}`.
- `not-found.tsx`: wave icon (`icon.png` through `next/image` at 64 px), H1, text, Button
  → `/`. No ribbon.
- `api/health/route.ts`: `{ ok: true, version, time }` where `version` is inlined at build
  from `package.json` via `next.config.ts` `env.APP_VERSION` (works under the standalone
  `node server.js`); `dynamic = 'force-dynamic'` is allowed here (API, not a page).
- `error.tsx` / `global-error.tsx`: same design as 404 with the WhatsApp link («تواصل معنا
  عبر واتساب», §4.3). Two strings are not in §4 and are written per §4.1 and tagged
  `TODO(copy)` for Dhia: H1 «حدث خطأ غير متوقع» and body «حاول تحديث الصفحة، أو راسلنا على
  واتساب.» Button reuses «العودة للرئيسية» (§4.15).

### E. Hero (§6.4.1)

- Server component `Hero` renders the full static markup for slide 1 (H1) and slides 2–4
  (`<p class="display">`) all in the DOM (visually only the active slide is shown); client
  `HeroCarousel` wraps it and manages `activeIndex`, `paused`, timers, swipe (pointer events
  on a surface with `touch-action: pan-y`, horizontal delta ≥ 40 px; in RTL swiping toward
  the start edge = forward), dots, pause button, `useReducedMotion` from
  `lib/reduced-motion.ts` to disable auto-advance.
- Images (ADR-006): slide 1 renders a `<picture>` built from `getImageProps` (desktop and
  mobile sources, `<source media="(min-width: 768px)">`), with `fetchPriority="high"
  loading="eager" decoding="async"` on the `<img>`. `getImageProps` does not emit a
  preload, so the Hero server component renders two `<link rel="preload" as="image"
  imageSrcSet imageSizes="100vw" fetchPriority="high">` with `media="(min-width: 768px)"`
  and `media="(max-width: 767px)"` (React 19 hoists them to `<head>`; browsers honour
  `media` on preload), so exactly one hero image is requested per viewport. E2E asserts
  one hero image request per project. Slides 2–4 render after first interaction or a 3 s
  idle timeout (`requestIdleCallback` fallback `setTimeout`).
- Overlay: start-side 45 % gradient white .92 → transparent (desktop); top 55 % → 75 %
  (mobile). Desktop `object-position: 20% 60%`, mobile `50% 70%`. Text column max-width
  560 px, start-aligned, vertically centred at 45 %.
- Chips: 3 `Chip`s with `Check` icon in an accent-tint circle; mobile: `overflow-x: auto`,
  `scroll-snap-type: x mandatory`, scrollbar hidden.
- Dots: `<button aria-label="الشريحة n من 4" aria-current>`, active elongated 24 px.
- Motion: image crossfade 700 ms (opacity, `will-change` only while transitioning); text
  fade-and-rise 12 px/400 ms starting 100 ms later; buttons/chips static. Reduced motion:
  instant swap.
- Height: `min-height: 100svh` (border-box) on every breakpoint — the `padding-block-start:
  var(--header-h)` from §D is what keeps the text clear of the header; no dependence on
  image load.

### F. Product strip (§6.4.2)

- Server component; each panel an `<a href="/products/{slug}">` whose accessible name is
  its visible name + price (no `aria-label` override); CSS handles expansion: panels are
  `flex: 1 1 0` and `a:hover, a:focus-visible { flex-grow: 2.6 }` (siblings shrink
  automatically), transition `flex-grow` 500 ms `--ease-expand`, image `scale(1.04)`, label opacity delayed 200 ms. `will-change` set only
  via `:hover` rule. Desktop height 520 px, gap 8 px, radius 13 px.
- Mobile (< 1024 px): `overflow-x: auto; scroll-snap-type: x mandatory; scroll-padding: 16px`,
  cards `78vw`, aspect 4:5, labels always visible. `StripHint` (tiny client island) shows
  «اسحب» once (localStorage flag `b7r_strip_hint`) and hides on first scroll.
- Images: `next/image` `sizes="(min-width:1024px) 20vw, 78vw"`, colours per §6.4.2.
- «تصفح كل المنتجات» secondary `Button` at the end of the header row.

### G. Designer + calculator (§6.4.3)

- `DesignerSection` (server): `SectionHeader` + a card containing a static fallback (the
  default mockup image + copy) and the mount point; `DesignerLoader` (client) uses
  `IntersectionObserver` (rootMargin 400 px) to `dynamic(() => import('./DesignerIsland'),
  { ssr: false })` — Konva lives only in that chunk.
- State in `use-designer-state.ts` (`useReducer`): product, colour (reset to first colour on
  product change per §6.4.3 defaults), design `{ url, kind, naturalW, naturalH }`, sellPrice
  (default suggested; **reset to the new product's suggested price on product change** so
  switching tee → hoodie never shows a spurious below-cost warning), dailySales (default 10). Deep link: on mount read
  `location.hash` for `#designer?product=` (also `?product=` search param) and dispatch;
  scroll into view.
- Controls: product `Chip`s with 32 px thumbnails (radio group semantics `role="radiogroup"`,
  arrow keys), colour swatches (radio group, 28 px, 2 px ring), dropzone (`<input
  type="file" accept=...>` + drag events, 10 MB check, MIME + extension check, inline
  error), sample button, collapsed row after design exists, pricing group (read-only base
  with `SarAmount`; `<input type="number" inputmode="numeric" dir="ltr">` bound to the
  Radix `Slider` min base, max base × 4, step 1; helper «السعر المقترح»), `Stepper` 1–100.
- Results card: tinted; `CountUp` (rAF 300 ms, disabled under reduced motion) runs only on
  committed changes (`onValueCommit`, input blur/Enter, stepper click, product change);
  during slider drag the figures update instantly; error state
  (sell < base) → warning + error colour; sell = base → 0 muted; footnote; CTA link.
- `profit.ts`: `perPiece(sell, base)`, `monthly(sell, base, daily)` = `(sell − base) × daily
  × 30`, integers; property test with fast-check; `clampSell(value, base)`.
- Canvas (`DesignCanvas.tsx`, react-konva): square `Stage` sized via `ResizeObserver` (max
  640), `pixelRatio` capped at 2; **two layers** (memory on mid-range Android): layer 1 =
  static mockup `Image` (`useImage` hook written locally — no `use-image` dependency),
  `listening={false}`, `cache()` after load; layer 2 = a `Group` with `clipFunc` rect =
  print area in stage pixels containing the design `Image` (`draggable`, `id="design"`),
  **the `Transformer` as a sibling of the clipped group** (attached to the design node so
  its anchors stay visible and hittable when the design sits partly outside the area;
  corner anchors, `keepRatio`, `rotationSnaps [0,90,180,270]`, `boundBoxFunc` min 40 px),
  and the dashed outline `Rect` visible on hover/drag. On product/colour change: crossfade via two mockup
  images tweened over 200 ms; design re-centred at 60 % of print-area width. `dragEnd` →
  if intersection area < 25 % of design bbox, tween back to the last valid position.
  Touch: Konva drag for one finger; `Konva.hitOnDragEnabled = true`; when a second touch
  begins, `stopDrag()` and switch to pinch handled with `touchmove` on the stage (distance
  ratio → scale about centre); `evt.preventDefault()` while over the design to stop page
  scroll. Wheel: scale ± 5 % per notch about the pointer. Double click/tap →
  re-centre.
- Print area: stage px = `{ x·S, y·S, w·S, h·S }`; unit test asserts aspect ≈ 0.737 ± 0.02
  for every product and that rectangles lie within (0,1).
- Sample design generated by `scripts/generate-sample-design.ts` (Playwright renders an HTML
  page with the woff2 Bold, `--color-primary` text, transparent background, 1200 × 600,
  `omitBackground: true`); committed to `public/designs/sample-tasmeemak.png`.
- Mobile: canvas first (square, full width), controls stacked; sticky bottom results bar
  (72 px) shown while the section intersects the viewport and the real results card does
  not (`IntersectionObserver` on both), with «ربحك الشهري التقديري» + CTA; the section gets
  `padding-block-end: 88px` on mobile so the bar never covers the CTA.
- Uploaded SVGs without `width`/`height` report `naturalWidth` 0 in some engines: fall back
  to the `viewBox` size, then to 600 × 300.
- Privacy: `URL.createObjectURL`, revoked on replace/reset; no fetch.
- Events: `track('designer_product_change' | 'designer_upload' | 'designer_sample' |
  'calculator_change' (debounced 800 ms) | 'cta_click', { location: 'designer' })`.

### H. Placeholders

`PlaceholderSection` (server) renders `<section aria-labelledby>` with the §4 H2 and, when
`NEXT_PUBLIC_SITE_URL !== 'https://b7r.sa'` (the same preview signal as the noindex guard,
so Dhia's `pnpm build && pnpm start` gate still shows it), a muted «يُبنى في المرحلة 1b»
label — one wording everywhere, never "قريباً". Backgrounds
alternate per §6.4 so the rhythm reads correctly even now.

## States handled

- Empty: designer never empty (sample design default); strip hint absent after first scroll.
- Loading: designer shell shows the static mockup until the island hydrates (no spinner);
  hero images 2–4 lazy; `Button loading` reserved for 1b forms.
- Error: invalid file → inline message; sell < base → warning; `error.tsx`/`global-error`.
- Permission: n/a.
- Edge: reduced motion everywhere; JS-off (server-rendered strings for all sections);
  360 px widths; keyboard for every control; `NEXT_PUBLIC_SITE_URL` unset → noindex.

## Testing

Unit (Vitest): `profit.test.ts` (examples + fast-check), `sar-amount.test.tsx` (integer/2-dp,
symbol order, `dir="ltr"`), `content-schema.test.ts`, `print-area.test.ts`, `utm.test.ts`,
`check-rtl.test.ts` (fixtures per §A.4), `env.test.ts` (the 1a required set is only `NEXT_PUBLIC_APP_URL` and
`NEXT_PUBLIC_WHATSAPP`; `NEXT_PUBLIC_SITE_URL` optional → noindex; missing required var
fails fast; the set grows in 1b/1c), `content-verbatim.test.ts`, `clampSell` edges (below
base → not clamped + warning flag; above ×4 → clamped), Stepper disabled at 1 / 100.

E2E (Playwright, built app on :3004, desktop + Pixel 7 + iPhone 15): hero (H1 count = 1,
dots/pause keyboard, reduced-motion no auto-advance via `emulateMedia`), header (shrink
without CLS via `layoutShift` PerformanceObserver script, mobile menu focus trap/Escape),
strip (5 links, focus expands on desktop, snap on mobile), designer (chunk not loaded before
scroll — assert via `page.on('request')`; sample visible; upload PNG fixture; drag moves
the node — read via `page.evaluate(() => Konva.stages[0].findOne('#design')
.getAbsolutePosition())` since Konva exposes `window.Konva` in production builds; snap-back
when < 25 % inside; values 89/45/10 → 44 / 13200; sell 40 → warning; deep link preselects
hoodie; invalid file error), hero with `javaScriptEnabled: false` (one H1, four slide
strings present), header bbox never intersects the H1, exactly one hero image request per
project, 404 status, axe on `/` and `/nope`, budgets (sum of `<script>` transfer sizes on
`/` ≤ 180 kB gzip excluding the designer chunk; each preloaded woff2 ≤ 40 kB; LCP image
≤ 220 kB; designer chunk not requested before scroll).

LHCI: mobile preset on `/`; assertions per §7.8.

## Judgment calls (ADRs to write)

- **ADR-001** Adopt the BRD v1.0 as the source of truth.
- **ADR-002** Repository root = this folder (no nested `b7r-website-v2/`); `resources/` kept
  in-repo as the asset source; `public/` derived by script.
- **ADR-003** next-intl in "without i18n routing" mode (single `ar` request config, no
  middleware/proxy); `en` later adds routing. Keeps Arabic at root with zero runtime cost.
- **ADR-004** TypeScript 5.9 (not 7.0 native) until Next.js declares TS 7 support; Vitest 4.1
  over the day-old 5.0.
- **ADR-005** Footer newsletter form rendered disabled in 1a (no fake success); enabled in 1b
  with the API.
- **ADR-006** Hero LCP image: `<picture>` from `getImageProps` + two media-gated
  `<link rel="preload" as="image">` rendered by the server component, so exactly one image
  loads per viewport and it is preloaded (`getImageProps` alone emits no preload).
- **ADR-007** Sample design rendered with Playwright/Chromium (correct Arabic shaping) rather
  than Pillow/sharp.
- **ADR-008** CranL deploy deferred (no GitHub yet per Dhia); Docker image verified locally.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Konva + react-konva (~150 kB) | BRD §6.4.3 mandates react-konva for drag/transform/clip | Plain CSS transforms lack a transformer with rotation snaps and clipping parity with the app; chunk is lazy so the home budget is unaffected |

## Open items for Dhia (do not block)

- Two `TODO(copy)` strings for `error.tsx` (listed in §D); no other new Arabic prose.
- Fallback font metrics (`size-adjust`) are approximations; measured CLS is the real gate.
