# Implementation Plan: Phase 1c — Pages, SEO layer, cutover readiness

**Branch**: `phase/1c-pages-seo` | **Date**: 2026-09-13 | **Spec**: `specs/003-phase-1c-pages-seo/spec.md`

## Summary

Ship every remaining Level 1 route on the shell and primitives from 1a/1b, plus the full SEO
layer (metadata, JSON-LD, sitemap, robots, IndexNow, OG images, manifest), the redirect map
with 410s, security headers, the contact form + API, and the cutover documentation. Stop at
the Dhia gate: everything that needs credentials, real content or DNS is listed with an owner.

## Technical Context

Stack unchanged. New deps (exact pins looked up at install): `@marsidev/react-turnstile`
(Turnstile widget), `react-markdown` + `remark-gfm` (legal bodies; server-rendered, no client
JS), `@radix-ui/react-select` (contact inquiry select), `zod` already present. `next/og`
`ImageResponse` for product OG images (edge-free: Node runtime, static at build).

## Constitution Check

| # | Gate | Pass? |
|---|---|---|
| I | RTL/logical | Yes — new components use logical utilities; gallery/size-chart digits in `<bdi dir="ltr">` |
| II | Static | Yes — every route static (`generateStaticParams` for products/posts); only islands: gallery, contact form, product sticky bar, FAQ accordions, share buttons, blog hub filter (query string read client-side, list server-rendered) |
| III | Copy | Yes — §4.8–4.17, Appendix A/B/D already in `content/`; blog bodies added as `sample: true` content, listed for Dhia; verbatim test extended |
| IV | Budgets | Yes — LHCI on five URLs; budgets e2e on product, contact, post |
| V | Tokens | Yes |
| VI | No fabrication | Yes — sample posts marked `sample: true`, no numbers outside §1.1; placeholder testimonials rule unchanged |
| VII | Modules | `modules/products`, `modules/pages`, `modules/blog`, `modules/forms/contact`, `modules/core/seo/*` |
| VIII | ADRs | ADR-016 (CSP without nonces), ADR-017 (410s via proxy.ts), ADR-018 (blog bodies authored with ux-araby, flagged), ADR-019 (Turnstile optional in dev) |
| IX | Tests | unit: redirects map, JSON-LD builders, contact schema, sitemap entries, reading-time; e2e per spec FR-004 |
| X | No attribution | Yes |

## Approach

### A. Products — `modules/products/`
- `ProductCard` (server): `Card hoverable` + `next/image` 4:5 front; back photo cross-fades on
  hover via CSS (`group-hover:opacity-100`) when present; colour dots from product data;
  sizes summary; whole card `<Link>`; `data-track="product_card"`.
- `/products/page.tsx`: H1 + lead, grid, ribbon; `ItemList` + `BreadcrumbList` JSON-LD.
- `/products/[slug]/page.tsx` + `generateStaticParams`: `Breadcrumbs` (nav + `BreadcrumbList`);
  `Gallery` island (main 1:1 image, thumbnails per colour front/back, swatches, ArrowLeft/Right
  keys, `aria-roledescription="carousel"`, «صورة {n} من {total}»); content column (H1, short
  description, price block via `SarAmount` — profit line `text-success`, footnote, CTAs);
  `SpecList` (`<dl>`), `SizeChart` (`<table>` with `<caption>`, cm, digits LTR), `RelatedProducts`
  (three `ProductCard`s); `ProductStickyBar` island (mobile, uses `--bottom-dock` like the
  designer) ; `product_view` tracked on mount; `Product` + `Offer` JSON-LD; `opengraph-image.tsx`.

### B. Pages — `modules/pages/`
- `how-it-works`: five alternating step rows (3D icons, `Reveal`), profit block (three tiles,
  «−» «=» glyphs as decorative spans, example line with `SarAmount` ×3), mini FAQ (accordion
  reusing home items 2/3/4 via `homeFaq`), ribbon; `WebPage` + `BreadcrumbList`.
- `about`: story block, decorative banner (`hanging-tshirt-mockup.jpg`, 21:9, `alt=""`),
  three cards (Target/Eye/Heart), Misk block, location line with `MapPin`, ribbon.
- `faq`: groups from Appendix D as H2 + accordion each; sticky group nav (desktop) with
  `scroll-padding` already set; bottom WhatsApp line; no FAQPage schema.
- `legal/[slug]`: `Prose` + markdown renderer (server; H2s get ids for the on-this-page list),
  updated line, `WebPage` JSON-LD.

### C. Contact — `modules/forms/contact/`
- `ContactForm` (client): fields per §4.11, `Select` (Radix, restyled) for inquiry type,
  zod schema shared with the API, inline errors under fields (`aria-describedby`,
  `aria-invalid`), honeypot, `Turnstile` island (renders only with a site key; invisible mode),
  submit → «جارٍ الإرسال» spinner → success card (Check icon, §4.11 text, WhatsApp secondary) or
  failure text above the button with values kept. Tracks `contact_submit{inquiry}`.
- `POST /api/contact`: same order as the newsletter route (JSON + Origin → zod → honeypot →
  Turnstile verify with `TURNSTILE_SECRET_KEY` when set → rate limit → email transport).
  Email transport `lib/contact-transport.ts` (Resend `emails.send` to `CONTACT_TO`, from
  `RESEND_FROM`; subject «رسالة جديدة من الموقع: {inquiryType}»; LTR-safe phone/email in the
  body; «رد عبر واتساب» link when the phone is Saudi) with the same live/mock/off + health
  reporting as the newsletter (`contact: live | mock | off`).
- Booking card: `BOOKING_URL` (server env → rendered `href`, `target=_blank`) else WhatsApp
  with «مرحباً، أرغب بحجز استشارة مجانية.».

### D. Blog placeholder — `modules/blog/`
- `content/blog/posts/*.md` (three sample bodies, frontmatter-free: title etc. stay in
  `content/blog/index.ts` with `excerpt`, `cover` from lifestyle mockups, `publishedAt`,
  `readingMinutes` computed by a tested helper, `takeaways[3]`, `author`). Written with the
  `ux-araby` skill under §4.1 rules, facts only from §1.1; `sample: true`.
- `/blog/page.tsx`: hub chips (links with `?hub=`; server reads `searchParams` → static per
  hub is not required; keep the page static and filter client-side in a tiny island reading
  `location.search`, list server-rendered fully so crawlers see all three), post cards,
  newsletter block (`NewsletterForm tone="light"`).
- `/blog/[slug]/page.tsx`: template per §6.11; `ShareButtons` island (wa.me, x.com intent,
  copy link with a transient «تم النسخ»? — no: §4.1 forbids «تم»; use «نُسخ الرابط» as
  `TODO(copy)`), related by hub, author card, `BlogPosting` JSON-LD.

### E. SEO layer — `modules/core/seo/`
- `metadata.ts` extended: `buildMetadata(route, overrides)`, product/post variants, OG types,
  verification tokens from `lib/env-server.ts`; `robots` unchanged rule.
- `json-ld.ts`: typed builders (`onlineStore`, `webSite`, `breadcrumbs`, `itemList`,
  `product`, `webPage`, `blogPosting`) + `JsonLd` component; unit test asserts required
  fields per type and valid JSON.
- `app/sitemap.ts`, `app/robots.ts` (full §7.2), `app/manifest.ts`, `app/[indexnow]/route.ts`
  → served as `/{INDEXNOW_KEY}.txt` from env; `lib/indexnow.ts` + `scripts/indexnow.ts` (diff
  two sitemap XMLs → POST changed URLs); CI step on `main` guarded (no-op until CranL).
- `scripts/build-og.ts` → `public/og/default.png` (sharp composite: logo, tagline via
  Playwright text render like the sample design, five product photos).

### F. Redirects, headers — `src/lib/redirects.ts`, `next.config.ts`, `src/proxy.ts`
- `redirects.ts`: typed map for §5.2 (301 entries, `/en/*` 302 → same path, 410 patterns).
  `next.config.ts` `redirects()` from the map; `headers()` from `lib/security-headers.ts`
  (HSTS, nosniff, referrer, permissions, XFO, CSP with the Umami origin from env,
  `Content-Language: ar`); `trailingSlash: false` already.
- `src/proxy.ts` (Next 16): matches the 410 patterns and returns a static 410 page (Arabic
  «هذه الصفحة أُزيلت» — `TODO(copy)`); everything else passes. Unit test on the matcher.
- ADR-016: CSP without nonces (static pages; `'unsafe-inline'` as the BRD's own CSP lists).

### G. Cutover readiness
- `docs/RUNBOOK.md` deploy, env matrix, rollback, cutover steps; `docs/LAUNCH-CHECKLIST.md`
  (§12.4 with owner/status); `.env.example` final; `lib/env.ts` prod-required set:
  SITE_URL, APP_URL, WHATSAPP, GA, UMAMI, RESEND_*, CONTACT_TO, INDEXNOW_KEY, verification
  tokens — validated at startup only when `NEXT_PUBLIC_SITE_URL === https://b7r.sa`.

## Tests
Unit: `redirects.test.ts` (every §5.2 entry + 410 matcher), `json-ld.test.ts`,
`contact-schema.test.ts`, `sitemap.test.ts`, `reading-time.test.ts`, `security-headers.test.ts`.
E2E: `routes.spec.ts` (status + H1 + one JSON-LD script per route), `redirects.spec.ts`,
`products.spec.ts` (grid, gallery keyboard, sticky bar, JSON-LD Product), `contact.spec.ts`
(validation, honeypot, success via mock, failure), `blog.spec.ts` (hub filter, share copy),
`legal.spec.ts` (on-this-page), `machine-files.spec.ts` (sitemap/robots/manifest/indexnow),
axe on every route, budgets on product/contact/post; LHCI five URLs.

## Judgment calls (ADRs)
- ADR-016 CSP without nonces (static rendering).
- ADR-017 410s in `proxy.ts` (Next redirects cannot emit 410; BRD §5.2).
- ADR-018 Blog sample bodies authored with `ux-araby`, `sample: true`, listed for Dhia.
- ADR-019 Turnstile optional: absent site key → form works without the widget; absent secret →
  API skips verification but health reports `turnstile: off`.

## Open items for Dhia (do not block)
Everything in §12.4 items 1–8, 10 credentials; blog bodies review; `TODO(copy)` strings:
410 page text, «نُسخ الرابط».
