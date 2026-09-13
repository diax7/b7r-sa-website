# Implementation Plan: Phase 1b — Rest of the home page

**Branch**: `phase/1b-home` | **Date**: 2026-09-13 | **Spec**: `specs/002-phase-1b-home/spec.md`

## Summary

Finish `/`: six sections replacing the placeholders, the WhatsApp widget, consent + analytics,
the newsletter API, and event wiring — all inside the JS budget that Phase 1a left with ~8 kB
of headroom, so every new interactive piece is either CSS-driven, a tiny island, or loaded on
intent. Investigate the simulated-LCP gate with a time box.

## Technical Context

Unchanged stack (Next 16.3.5, React 19.3, Tailwind 4.3). New deps (exact pins):
`@radix-ui/react-accordion 1.2.20` (FAQ), `resend 6.28.0` (server only),
`@next/third-parties 16.3.5` (GA4 after consent). **No `motion`** — see ADR-012.

## Constitution Check

| # | Gate | Pass? |
|---|---|---|
| I | RTL logical CSS | Yes; the widget's `right-6` is the sanctioned exception with `// rtl-allow` (BRD 6.15) |
| II | Static + islands only | Yes — sections are server components; islands: StepsProgress, VideoPlayer, Accordion (Radix), WhatsAppWidget, ConsentBar, AnalyticsBridge, NewsletterForm |
| III | Copy from content | Yes — all §4.4–4.7 strings already in `content/`; verbatim test extended to `pages.ts` widget/consent copy |
| IV | Budgets as gates | Yes — budgets e2e extended (JS on first paint still ≤ 180 kB with everything mounted) |
| V | Tokens/motion | Yes — count-ups/reveals/waves reducible; audit e2e |
| VI | No fabricated content | Yes — testimonials carry «نموذج» and vanish on the production host |
| VII | Modules | `modules/home/*` (steps, video, why-us, testimonials, integrations, faq), `modules/core/*` (widget, consent, analytics), `modules/forms/*` (newsletter) |
| VIII | ADRs + CTO | ADR-012 (no motion), ADR-013 (production-host rule for testimonials), ADR-014 (LCP outcome) |
| IX | Tests | unit: rate-limit, consent, newsletter schema, steps progress, testimonials rule; e2e: each spec scenario |
| X | No AI attribution | Yes |

## Approach

### A. Steps (§6.4.4) — `modules/home/steps/`
- `Steps` (server): `<section>` 300 vh on `lg` with a sticky 100 vh inner grid: start column =
  `<ol>` of three steps (badge, H3, text; server-rendered, readable without JS), end column =
  480 px accent-tint panel with the three 3D icons stacked (`next/image`, 160 px+), only the
  active one at opacity 1 / scale 1 (others 0 / 1.02). The link under the list.
- The **list layout is the default CSS** (icons 96 px at the start of each row, connector
  line, `aria-current="step"` on the active item). The pinned layout applies only under
  `html.js` at `lg` and not under reduced motion — so no-JS, reduced-motion and mobile share
  one branch and a no-JS desktop never scrolls through 300 vh of nothing.
- Pinned inner grid: `top: var(--header-h); height: calc(100vh - var(--header-h))` so the
  sticky header never covers the active step.
- `StepsProgress` (client, ~1 kB): an IntersectionObserver attaches a `passive` scroll
  listener only while the section intersects; each rAF frame reads
  `getBoundingClientRect()` (never a cached top) and computes progress =
  `−rect.top / (rect.height − viewport)` → active index at 0 / ⅓ / ⅔; writes `data-active`
  on the section and `--progress` for the 2 px accent line. `tests/steps-progress.test.ts`
  covers the mapping.
- Native scroll only; no scroll-jacking.

### B. Video (§6.4.5) — `modules/home/video/`
- `VideoSection` (server) + `VideoPlayer` (client island, mounted near-viewport): poster
  `<Image>` + 72 px play button; on click renders `<video controls playsInline
  preload="none">` and calls `.play()` (user gesture; no `autoPlay`), tracks `video_play`.
  The `<video>` exists in the DOM only after play — axe's `video-caption` rule is critical and
  the clip has no captions yet; captions/intro card go to BRD Appendix G item 8 for Dhia.
  E2E asserts `controls` present and `play()` attempted; the "is playing" assertion runs only
  on WebKit (Playwright's Chromium ships without H.264). Poster: `public/video/printer-marketing-poster.jpg` produced
  by `prepare-assets` from `lifestyle-mockups/dtg-printer-stock.png` (BRD fallback; ffmpeg
  is not available here — RUNBOOK notes how to regenerate a real frame later). MP4 copied to
  `public/video/`.

### C. Why us / Testimonials / Integrations / FAQ — `modules/home/*`
- `WhyUs` (server): three `Card hoverable` with 56 px accent-tint icon circle.
- `Testimonials` (server): `shouldRenderTestimonials(entries, isProductionSite)` (pure,
  tested) → omitted when production host && all placeholders; cards with quote glyph, Light
  quote, a neutral accent-tint avatar circle for placeholders (no initials from «اسم التاجر»),
  «نموذج» `Badge tone="muted"`, `data-placeholder`; mobile snap carousel.
- `Integrations` (server): tiles with logos from `public/images/integrations/*.svg` (copied
  from the app repo into `resources/brand/integrations/`; monochrome where the official
  colours clash), name, `Badge tone="success"` «متاح الآن», `aria-label` «ربط متجر {platform}».
- `HomeFaq` (server shell: questions and answers server-rendered as `<details>`-free static
  markup for crawlers) + `components/ui/accordion.tsx` (Radix, restyled: hairline rows,
  chevron rotate 180°, 200 ms height via `--radix-accordion-content-height` keyframes,
  instant under reduced motion), mounted near-viewport through the shared loader (§G).
  `onValueChange` → `track('faq_open', { question })`.

### D. WhatsApp widget (§6.15) — `modules/core/whatsapp-widget.tsx` (client, lazy)
- Mounted from the layout via `dynamic(..., { ssr: false })` after a 1.5 s timer (so it is
  never in the first-paint JS); scale-in 200 ms; accent dot pulses once at 6 s
  (`sessionStorage` flag). Popup 320 px / `calc(100vw − 32px)`; Escape + outside click close;
  focus moves into the popup and back. Physical position `right-6 bottom-6` with the
  `rtl-allow` comment. Button uses `WhatsAppIcon`.
- **Mobile bottom edge (three fixed elements):** a `--bottom-dock` CSS variable on `<html>`
  is set to `72px` by the designer island while its sticky results bar is visible (and reset
  on hide); the widget sits at `bottom: calc(24px + var(--bottom-dock, 0px))` and the
  consent card at `bottom: calc(88px + var(--bottom-dock, 0px))` on mobile, so nothing
  overlaps the monthly figure or the CTA. `whatsapp.spec.ts` covers the lifted state.

### E. Consent + analytics (§6.16)
- `lib/consent.ts`: `readConsent()`/`writeConsent(value)` (cookie `b7r_consent`, 180 days,
  `SameSite=Lax`, `Secure` on https), pure helpers tested with jsdom.
- `layout.tsx`: inline `beforeInteractive` script defining `dataLayer`/`gtag` and calling
  `gtag('consent','default',{all denied})`; Umami `<Script strategy="afterInteractive">` when
  `NEXT_PUBLIC_UMAMI_SRC`/`_ID` are set; `<AnalyticsBridge>`; `<ConsentBar>` (lazy after
  800 ms, only when no cookie).
- `ConsentBar` (client): card at bottom-end, max 420 px, radius 13, shadow-popover; «موافق» →
  write cookie, `gtag('consent','update',{analytics_storage:'granted'})`, mount
  `<GoogleAnalytics gaId>` from `@next/third-parties/google`; «رفض» → write cookie, unmount.
  Mobile: full width with 88 px bottom clearance.
- `AnalyticsBridge` (client, ~1 kB) **owns the granted-on-reload path**: on mount it reads
  the cookie; `granted` → `gtag('consent','update',{analytics_storage:'granted'})` and mount
  `<GoogleAnalytics>`; the bar only handles the first decision. Registers sinks — Umami
  (`window.umami?.track`) always, GA4 (`gtag('event', …)`) when granted; delegated `click`
  listener on `document` that reads `data-track`/`data-location` and detects outbound links
  with `hostname === 'b7r.app' || hostname.endsWith('.b7r.app')` for `outbound_app_click`
  (Umami's tracker uses `sendBeacon`/keepalive, verified at implementation; if not, the click
  handler uses `fetch(..., { keepalive: true })`). Existing inline `onClick={() => track(...)}`
  calls are removed in favour of the data attributes (one path).
- The consent bar renders only when `NEXT_PUBLIC_GA_ID` is set (nothing to consent to
  otherwise). CI sets dummy `NEXT_PUBLIC_GA_ID=G-TEST00000` and `NEXT_PUBLIC_UMAMI_SRC`/
  `_ID` pointing at a local no-op script so LHCI and the budgets e2e measure the production
  shape and `consent.spec.ts` exercises the real path.
- Env: `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_UMAMI_SRC`, `NEXT_PUBLIC_UMAMI_ID` optional in 1b
  (features no-op when unset); required-in-production list grows in 1c.

### F. Newsletter (§6.14) — `modules/forms/newsletter/`
- `NewsletterForm` (client): email input (LTR), honeypot `website` (visually hidden,
  `tabIndex=-1`, `autoComplete="off"`), submit; states idle/submitting/success/error with
  `aria-live="polite"`; replaces the disabled footer form.
- `app/api/newsletter/route.ts`: `POST` requires `Content-Type: application/json` and an
  `Origin` that is absent or matches the request host (else `403`) → zod → honeypot filled →
  `200 { ok: true }` (no side effect) → `rateLimit(ip, 5, 10 min)` → `429` → transport
  `subscribe(email)`; duplicate → `ok: true` only when Resend answers 4xx with its
  already-exists error `name` (unit-tested against the SDK's error shape), never on 5xx;
  unconfigured → `503 { ok:false, error:'not_configured' }`; other failure → `500`. No
  email is logged. **Client IP = the last `x-forwarded-for` entry** (the one appended by the
  trusted CranL proxy; the first is client-controlled), then `x-real-ip`, then `unknown`;
  documented beside the single-instance note.
- Responses map to copy: `400` → «أدخل بريداً إلكترونياً صحيحاً.» (BRD 4.5); `429`/`503`/`500`
  → one `TODO(copy)` string per §0.5, «تعذّر الاشتراك الآن، حاول لاحقاً.», listed for Dhia
  (Appendix G) and in `TODO_COPY`.
- `lib/rate-limit.ts`: in-memory sliding window keyed by IP with periodic pruning; unit
  tested with fake timers; comment on the single-instance assumption.
- `lib/env-server.ts`: `RESEND_API_KEY`, `RESEND_AUDIENCE_ID` read lazily on the server;
  both it and `lib/newsletter-transport.ts` `import 'server-only'` so a client import fails
  the build (contact-form vars arrive in 1c).
- `lib/newsletter-transport.ts`: `live` (Resend `contacts.create({ audienceId })`), `mock`
  (in-memory set, e2e only) or `off`. **Mock is active only when `NEWSLETTER_TRANSPORT=mock`
  AND `RESEND_API_KEY` is unset**; `GET /api/health` reports `newsletter: 'live' | 'mock' |
  'off'` so a mocked production is visible at a glance. (Not keyed on `isProductionSite` or
  `NODE_ENV`: CI's e2e runs the production build with the production origin.)

### G. Layout, budget, LCP
- `page.tsx`: hero → strip → designer → Steps → Video → WhyUs → Testimonials →
  Integrations → HomeFaq → ribbon, tones per §6.4; `PlaceholderSection` deleted.
- `Reveal` applied to section headers and card groups (stagger 60 ms).
- One mount helper instead of four bespoke loaders: `modules/core/lazy-mount.tsx` exports
  `NearViewport` (IntersectionObserver, `rootMargin`) and `AfterDelay` (timer) wrappers that
  render `children` (a `dynamic(..., { ssr:false })` island) only when due; the 1a
  `DesignerLoader` is refactored onto `NearViewport`. FAQ accordion and video use
  `NearViewport`; widget (1.5 s) and consent (0.8 s) use `AfterDelay`.
- Budget: Radix Accordion is ~5–6 kB gzip, so it and the video island are near-viewport;
  first-paint JS stays ≤ 180 kB with everything configured (CI dummy env). Re-measure; e2e
  budget assertion unchanged.
- LCP time box (≤ 1 h): (1) measure the chunk graph and the hero island's own weight;
  (2) confirm whether the LCP element is the H1 or the image under simulation and whether a
  smaller hero island moves it; (3) record the result in ADR-014 — met, or the measured
  floor with the reason. (`optimizePackageImports` for lucide is already Next's default; a
  server `Header` cannot know the pathname for active/transparent state — both dropped.)

### H. Tests
- Unit: `rate-limit.test.ts` (window, pruning, per-IP), `consent.test.ts`,
  `newsletter-schema.test.ts`, `steps-progress.test.ts`, `testimonials-rule.test.ts`,
  `track-bridge.test.ts` (delegated click → event, outbound detection).
- E2E: `steps.spec.ts` (active step at scroll fractions, JS-off order, reduced-motion list),
  `video.spec.ts`, `home-sections.spec.ts` (why-us strings, testimonials badges on preview,
  integrations tiles, accordion single-open + aria), `whatsapp.spec.ts` (link, position,
  Escape), `consent.spec.ts` (no GA before, GA after موافق, none after رفض, cookie, no bar
  on reload, Umami tag when configured), `newsletter.spec.ts` — **single project
  (`desktop-chrome`), `mode: 'serial'`, each test
  sends its own `x-forwarded-for` so the in-memory limiter sees distinct clients; the 429
  test is last and spends exactly its own 6 requests** (success via mock transport, invalid,
  honeypot, origin/content-type 403, rate limit 429), `consent.spec.ts` also covers "cookie
  granted → GA request on load, no bar", `whatsapp.spec.ts` covers the lifted position while
  the designer's results bar is visible, `reduced-motion.spec.ts`, budgets extended.
- Testimonials production rule: e2e runs against the preview build; the production-host
  omission is covered by the unit rule test plus a build-time check in `lh.sh` (grep the
  HTML for `data-placeholder` = 0).

## Judgment calls (ADRs)
- **ADR-012** No `motion` in 1b either: steps progress is a 1 kB rAF hook + CSS; BRD §3.7
  allows "CSS transitions"; keeps the budget. BRD §8.1 amended via `docs/brd-sections`.
- **ADR-013** "Production build" for the testimonials rule = production host
  (`NEXT_PUBLIC_SITE_URL === https://b7r.sa`), the same signal as noindex and placeholders,
  rather than `NODE_ENV` + branch (a CranL preview is `NODE_ENV=production` and must still
  show the «نموذج» cards). BRD §6.4.7 amended via `docs/brd-sections`.
- **ADR-014** LCP investigation outcome (written after measuring).
- **ADR-015** Newsletter mock transport for tests (`NEWSLETTER_TRANSPORT=mock`), so the
  success path is e2e-tested without a Resend key.

## Open items for Dhia (do not block)
- Resend API key + audience id, GA4 id, Umami src/id to put in `.env.local` when available.
- Real poster frame for the video (needs ffmpeg or a still from Dhia); captions or an intro
  card for the clip (Appendix G item 8) — without captions the `<video>` fails axe's
  `video-caption` rule, which is why it mounts only after play.
- One new string: «تعذّر الاشتراك الآن، حاول لاحقاً.» for newsletter 429/5xx (`TODO(copy)`).
