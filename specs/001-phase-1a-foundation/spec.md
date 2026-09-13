# Feature Specification: Phase 1a — Foundation, design system, shell, hero, product strip, designer

**Feature Branch**: `phase/1a-foundation`

**Created**: 2026-09-12

**Status**: Draft

**Input**: BRD §12.2 Phase 1a scope, built from §3 (design system), §4 (copy), §6.1–6.3
(shell), §6.4.1–6.4.3 (hero, product strip, designer), §8 (architecture, gates).

**Source of truth**: `B7R-WEBSITE-MASTER-BRD.md`. This spec restates only what is needed to
plan and test; every string, number, and token is taken from the BRD verbatim and is not
repeated here unless it defines an acceptance test.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A merchant lands on the home page and understands the promise (Priority: P1)

A Saudi merchant opens `b7r.sa` on a mid-range Android phone. Within the first viewport they
read the headline «علامتك التجارية تبدأ من قطعة واحدة», the subline, see one primary action
«ابدأ براندك مجانًا», the secondary link «استكشف المنتجات», the microcopy about the 30 SAR
credit, and three proof chips. The hero rotates through 4 slides every 6 s with a crossfade,
pauses on hover/touch/focus, and can be paused, swiped, and dot-navigated.

**Why this priority**: it is the promise in one glance and the LCP element; everything else
depends on it rendering fast and correctly in RTL.

**Independent Test**: load `/` with JS disabled: slide 1 headline is the only `<h1>`, all four
slides' strings exist in the HTML; with JS: dots and pause control work by keyboard, slide
changes on swipe, auto-advance stops under `prefers-reduced-motion`.

**Acceptance Scenarios**:

1. **Given** `/` on a 375 px viewport, **When** the page loads, **Then** the hero occupies
   `100svh`, the headline is legible over the placeholder photo, the primary button is full
   width, chips scroll horizontally with snap, and LCP ≤ 2.5 s under 4G throttling.
2. **Given** the hero on desktop, **When** 6 s pass, **Then** the image crossfades over
   700 ms and the headline/subline fade-and-rise; buttons and chips do not move.
3. **Given** `prefers-reduced-motion: reduce`, **When** the page is idle, **Then** no
   auto-advance occurs and dots still switch slides instantly.
4. **Given** keyboard focus inside the hero, **When** Tab reaches the dots, **Then** each dot
   is a button with aria-label «الشريحة {n} من 4» and the pause button toggles its label.

---

### User Story 2 - The merchant explores the five products (Priority: P1)

Below the hero the merchant sees «بحر من المنتجات» and a strip of five product panels
(order: تيشيرت أساسي · هودي · تيشيرت أوفرسايز · حقيبة قماشية · بربتوز أطفال). On desktop,
hovering or focusing a panel expands it (flex 1 → 2.6 over 500 ms) revealing the name and
«يبدأ من {price}». On mobile the strip is a snap carousel with labels always visible.

**Independent Test**: all five panels are links to `/products/{slug}` with the product name
as accessible text; keyboard focus expands; no layout jank (transform/flex-basis only).

**Acceptance Scenarios**:

1. **Given** desktop, **When** a panel receives hover or focus, **Then** it grows, siblings
   shrink proportionally, the photo scales to 1.04, and the label fades in after 200 ms.
2. **Given** mobile, **When** the strip renders, **Then** cards are 78vw wide, 4:5, snap on
   scroll, labels visible, and a «اسحب» hint shows once and dismisses on scroll.
3. **Given** any viewport, **When** images load, **Then** each uses
   `sizes="(min-width:1024px) 20vw, 78vw"` and the tee/hoodie panels show black, the onesie
   white, the tote beige.

---

### User Story 3 - The merchant tries a design and computes profit (Priority: P1)

In «شاهد تصميمك واحسب ربحك» the merchant picks a product chip, a colour swatch, uploads a PNG
(or taps «جرّب تصميماً جاهزاً»), drags and resizes it inside the visible print area on the
product photo, sets a selling price with a slider or numeric input, sets daily sales with a
stepper, and reads «ربحك لكل قطعة» and «ربحك الشهري التقديري». The CTA «ابدأ بيع هذا المنتج»
links to the register URL with `utm_campaign=designer&product={slug}`.

**Independent Test**: unit tests on the pure profit function for random inputs; e2e upload +
drag + value assertions on desktop and mobile emulation; keyboard changes product, colour,
price, and sales.

**Acceptance Scenarios**:

1. **Given** first render, **When** the section hydrates, **Then** the canvas shows the
   default product (تيشيرت أساسي, white) with the sample design «تصميمك هنا» centred at 60 %
   of the print-area width; the canvas is never empty; no layout shift occurs.
2. **Given** sell = 89, base = 45, daily = 10, **When** values are read, **Then** per-piece =
   44 and monthly = 13 200, rendered with `SarAmount`, counting up over 300 ms.
3. **Given** sell < base, **When** the results render, **Then** the warning «سعر البيع أقل من
   التكلفة. ارفع السعر لتربح.» appears in error colour and figures are in error colour;
   sell = base renders 0 in muted colour.
4. **Given** a file that is not PNG/JPG/SVG/WebP or exceeds 10 MB, **When** dropped or
   selected, **Then** «الملف غير مدعوم أو أكبر من 10 ميجابايت.» appears inline and the
   previous design is kept.
5. **Given** a design dragged mostly outside the print area, **When** released with < 25 %
   inside, **Then** it snaps back so ≥ 25 % is inside; the design is clipped to the area.
6. **Given** product or colour changes, **When** the mockup swaps, **Then** a 200 ms crossfade
   plays and the design re-centres at 60 % width; double-tap/click re-centres.
7. **Given** `/#designer?product=hoodie`, **When** the page opens, **Then** the section is
   scrolled into view and هودي is preselected.
8. **Given** an upload, **When** inspected in devtools, **Then** no network request carries
   the file; object URLs are revoked on replace.
9. **Given** mobile, **When** the section is in view, **Then** a sticky 72 px results bar
   shows «ربحك الشهري التقديري» and the CTA.

---

### User Story 4 - The merchant navigates and reaches the app (Priority: P2)

The header shows the logo, six nav links, «تسجيل الدخول», and «ابدأ براندك مجانًا» (desktop);
on mobile a burger that morphs to X and opens a full-screen overlay with the links, CTA,
login, WhatsApp line, and social icons. The header sticks, shrinks after 24 px of scroll, and
never hides. Every page ends with the CTA ribbon between two waves and the navy footer with
links, policies, newsletter form (UI only in 1a), contact line, badges, and copyright.

**Independent Test**: keyboard reaches every control; overlay traps focus, closes on Escape,
returns focus to the burger; body scroll locked while open; no CLS on header shrink.

**Acceptance Scenarios**:

1. **Given** desktop `/`, **When** the page is at the top, **Then** the header is
   transparent over the hero; **When** scrolled > 24 px, **Then** it becomes 60 px tall with
   an 85 % white blur background, hairline, and 30 px logo, over 200 ms, with no layout shift.
2. **Given** mobile, **When** the burger is tapped, **Then** lines morph to an X over 300 ms
   and the overlay slides from the start edge with the 6 links at 28 px Bold staggered 40 ms.
3. **Given** any page, **When** the footer renders, **Then** the wave divider sits above the
   ribbon and between the ribbon and the footer; waves move on a 20 s loop and stop under
   reduced motion.
4. **Given** an unknown URL, **When** requested, **Then** HTTP 404 with the §4.15 page and no
   ribbon.

---

### User Story 5 - The engineer runs the gates (Priority: P2)

`pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm check:rtl`, `pnpm test`,
`pnpm build`, `pnpm e2e`, and `pnpm lhci` all pass with zero warnings; prek hooks run
typecheck + lint + rtl on commit; `docs/DECISIONS.md` has ADR-001; the Docker image builds
and serves `/api/health` → `{ ok: true, version }`.

**Acceptance Scenarios**:

1. **Given** a file with `ml-4`, **When** `pnpm check:rtl` runs, **Then** it fails naming the
   file and line; the WhatsApp `right-6 // rtl-allow` exception passes.
2. **Given** a content file with a wrong shape, **When** `pnpm test` runs, **Then** the schema
   test fails naming the file.
3. **Given** `pnpm lhci` on `/` mobile, **Then** Performance ≥ 90, Accessibility ≥ 95, Best
   Practices ≥ 95, SEO = 100 (SEO measured with `NEXT_PUBLIC_SITE_URL=https://b7r.sa` so the
   noindex guard does not apply).

### Edge Cases

- Fonts fail to load → fallback stack with `size-adjust` keeps CLS ≤ 0.1.
- JS disabled → hero slide 1, product strip (static row), designer shell with a static
  mockup image and copy, header links, footer all readable.
- Hero image fails → section height is fixed by `min-height`; text remains legible on the
  `--color-ground` background.
- Very long product names on 360 px → labels wrap inside panels without overflow.
- Slider min = base; input typed below base → warning; input above base × 4 → clamped to max.
- Stepper at 1 and 100 → decrement/increment buttons disabled respectively.
- Uploaded SVG with external references → rendered through an `<img>` into the canvas, never
  inlined into the DOM.
- Two-finger pinch on the canvas must not scroll the page while over the design.
- `/#designer?product=unknown` → default product, no error.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Root layout sets `<html lang="ar" dir="rtl">`, preloads Regular and Bold
  woff2, orders `skip link → header → main#content → CtaRibbon → footer`.
- **FR-002**: All tokens from §3.2–3.7 exist as CSS custom properties in `@theme`; no raw hex
  in components.
- **FR-003**: Shared components from §3.10 needed by this phase exist and are restyled to the
  tokens: `Button`, `Chip`, `Badge`, `Card`, `SectionHeader`, `Container`, `Section`,
  `Icon`, `SarSymbol`, `SarAmount`, `Input`, `Slider`, `Stepper`, `WaveDivider`,
  `CtaRibbon`. (`Accordion`, `Dialog`, `Select`, `Toast`, `Textarea`, `VideoPlayer`,
  `Breadcrumbs`, `WhatsAppWidget`, `ConsentBar`, `ProductCard` are built in 1b/1c when
  first used.)
- **FR-004**: `content/schema.ts` defines every §8.4 shape with zod; `content/*.ts` files
  hold all Level 1 copy from §4 and Appendix A; a Vitest test parses each against its
  schema.
- **FR-005**: Header, mobile menu, footer, ribbon, and wave behave as §6.2–6.3.
- **FR-006**: Hero behaves as §6.4.1, including preload of the first slide's desktop and
  mobile images with responsive `imagesrcset`, lazy other slides.
- **FR-007**: Product strip behaves as §6.4.2.
- **FR-008**: Designer behaves as §6.4.3; the Konva part loads via `dynamic(..., { ssr:
  false })` on scroll into view; profit math is a pure, unit-tested function.
- **FR-009**: Remaining home sections (steps, video, why us, testimonials, integrations,
  FAQ) render as clearly marked placeholder `<section>`s with their §4 H2 only and a muted
  «يُبنى في المرحلة 1b» developer label, shown whenever `NEXT_PUBLIC_SITE_URL` is not
  `https://b7r.sa` (the preview signal), removed in 1b.
- **FR-010**: `not-found.tsx` returns 404 with §4.15 copy; `GET /api/health` returns
  `{ ok: true, version, time }`.
- **FR-011**: `scripts/check-rtl-classes.ts`, oxlint config with module-boundary rules,
  Vitest, Playwright + axe, Lighthouse CI config with §7.8 thresholds, prek hooks, CI
  workflow, Dockerfile, `.env.example`, `lib/env.ts` all exist and work.
- **FR-012**: Metadata for `/` from §4.16; `robots` returns `Disallow: /` and pages carry
  `noindex` when `NEXT_PUBLIC_SITE_URL !== 'https://b7r.sa'` (§7.2).
- **FR-013**: `track(name, props)` helper exists as a no-op sink until 1b wires Umami/GA4;
  hero/designer/strip emit the §6.4.3 events through it.

### Key Entities

- **SiteSettings, NavItem, HeroSlide, Product, Step, WhyUsItem, Testimonial, Integration,
  FaqItem, PageSeo, LegalPage, BlogPost** — as §8.4. Phase 1a populates all files so that
  1b/1c only add pages, not content.
- **PrintArea** — `{ x, y, w, h }` fractions per product (§6.4.3 table), aspect 28:38.
- **DesignerState** — `{ productSlug, colorSlug, design: { src, kind: 'sample' | 'upload' },
  sellPrice, dailySales }`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Lighthouse mobile on `/`: Performance ≥ 90, Accessibility ≥ 95, Best Practices
  ≥ 95, SEO = 100.
- **SC-002**: Lab CWV on `/` (mobile, throttled): LCP ≤ 2.5 s, CLS ≤ 0.1, INP ≤ 200 ms.
- **SC-003**: Home JS ≤ 180 kB gzip excluding the lazily loaded designer chunk; the designer
  chunk loads only when the section approaches the viewport.
- **SC-004**: Profit function passes a property-based test over 1 000 random inputs.
- **SC-005**: axe reports zero serious/critical violations on `/` and `/404`.
- **SC-006**: `pnpm check:rtl` passes with exactly one allowed exception file.
- **SC-007**: `design-review` skill reports zero "AI slop" findings on hero, strip, designer.
- **SC-008**: Dhia reviews `http://localhost:3004` and approves (Dhia gate).

## Out of scope (Phase 1b/1c)

Steps animation, video, why-us, testimonials, integrations, FAQ accordion, WhatsApp widget,
consent bar, analytics scripts, newsletter API, contact page and API, product pages, SEO
layer beyond `/` metadata and the noindex guard, sitemap, redirects, OG images, CranL deploy
(deferred until Dhia approves pushing to GitHub).
