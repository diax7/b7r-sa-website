# Implementation Plan: Phase 1c: Pages, SEO layer, cutover readiness

**Branch**: `phase/1c-pages-seo` | **Date**: 2026-09-13 | **Spec**: `specs/003-phase-1c-pages-seo/spec.md`

## Summary

Ship every remaining Level 1 route on the shell and primitives from 1a/1b, plus the full SEO
layer (metadata, JSON-LD, sitemap, robots, IndexNow, OG images, manifest), the redirect map
with 410s, security headers, the contact form + API, and the cutover documentation. Stop at
the Dhia gate: everything that needs credentials, real content or DNS is listed with an owner.

## Technical Context

Stack unchanged. New deps (exact pins looked up at install): `marked` (legal and blog bodies
rendered on the server from Markdown; `marked.lexer` also feeds the on-this-page list, one
package, no transitive tree), `@radix-ui/react-select` (BRD 3.10 mandates Radix for Select).
No Turnstile wrapper package: the widget is ~40 lines (`turnstile.render` on the explicit
script) and only mounts on `/contact` with a site key. No `next/og`: Satori's Arabic shaping
is unreliable, so every OG image (default + five products) is rendered once by
`scripts/build-og.ts` with Playwright (already installed) from an HTML template using the real
ITF Rayat Round files, and committed under `public/og/` as static PNGs.

## Constitution Check

| # | Gate | Pass? |
|---|---|---|
| I | RTL/logical | Yes, new components use logical utilities; gallery/size-chart digits in `<bdi dir="ltr">` |
| II | Static | Yes, every route static (`generateStaticParams` for products/posts); only islands: gallery, contact form, product sticky bar, FAQ accordions, share buttons, blog hub filter (query string read client-side, list server-rendered) |
| III | Copy | Yes, §4.8–4.17, Appendix A/B/D already in `content/`; blog bodies added as `sample: true` content, listed for Dhia; verbatim test extended |
| IV | Budgets | Yes, LHCI on five URLs; budgets e2e on product, contact, post |
| V | Tokens | Yes |
| VI | No fabrication | Yes, sample posts marked `sample: true`, no numbers outside §1.1; placeholder testimonials rule unchanged |
| VII | Modules | `modules/products`, `modules/pages`, `modules/blog`, `modules/forms/contact`, `modules/core/seo/*` |
| VIII | ADRs | ADR-016 (CSP without nonces), ADR-017 (410s via proxy.ts), ADR-018 (blog bodies authored with ux-araby, flagged), ADR-019 (Turnstile optional in dev), ADR-020 (static OG PNGs via Playwright) |
| IX | Tests | unit: redirects map, JSON-LD builders, contact schema, sitemap entries, reading-time; e2e per spec FR-004 |
| X | No attribution | Yes |

## Approach

### A. Products: `modules/products/`
- `ProductCard` (server): `Card hoverable` + `next/image` 4:5 front; back photo cross-fades on
  hover via CSS (`group-hover:opacity-100`) when present; colour dots from product data;
  sizes summary; whole card `<Link>`; `data-track="product_card"`.
- `/products/page.tsx`: H1 + lead, grid, ribbon; `ItemList` + `BreadcrumbList` JSON-LD.
- `/products/[slug]/page.tsx` + `generateStaticParams`: `Breadcrumbs` (nav + `BreadcrumbList`);
  `Gallery` island (main 1:1 image, thumbnails per colour front/back, swatches, ArrowLeft/Right
  keys, `aria-roledescription="carousel"`, «صورة {n} من {total}» in an `aria-live="polite"`
  label so arrow moves are announced); content column (H1, short
  description, price block via `SarAmount`, profit line `text-success`, footnote, CTAs);
  `SpecList` (`<dl>`), `SizeChart` (`<table>` with `<caption>`, cm, digits LTR), `RelatedProducts`
  (three `ProductCard`s); `ProductStickyBar` island (mobile, uses `--bottom-dock` like the
  designer); `product_view` tracked on mount; `Product` + `Offer` JSON-LD; OG image from
  `public/og/products/{slug}.png` (built by `scripts/build-og.ts`).

### B. Pages: `modules/pages/`
- `how-it-works`: five alternating step rows (3D icons, `Reveal`), profit block (three tiles,
  «−» «=» glyphs as decorative spans, example line with `SarAmount` ×3), mini FAQ (accordion
  reusing home items 2/3/4 via `homeFaq`), ribbon; `WebPage` + `BreadcrumbList`.
- `about`: story block, decorative banner (`hanging-tshirt-mockup.jpg`, 21:9, `alt=""`),
  three cards (Target/Eye/Heart), Misk block, location line with `MapPin`, ribbon.
- `faq`: groups from Appendix D as H2 + accordion each; sticky group nav (desktop) with
  `scroll-padding` already set; bottom WhatsApp line; no FAQPage schema.
- `/terms`, `/shipping`, `/privacy` (three thin routes over one `LegalPage` component):
  `Prose` + `lib/markdown.ts` (`marked` on the server; H2s get `section-{n}` ids, Arabic
  slugs percent-encode into unreadable fragments, and `headings()` feeds the sticky
  `OnThisPage` list), updated line, `WebPage` JSON-LD. Markdown is trusted repo content; an
  IDEAS note records that Level 2 CMS Markdown must be sanitised before `dangerouslySetInnerHTML`.

### C. Contact: `modules/forms/contact/`
- `ContactForm` (client): fields per §4.11, `Select` (Radix, restyled) for inquiry type,
  zod schema shared with the API, inline errors under fields (`aria-describedby`,
  `aria-invalid`), honeypot, `Turnstile` island (renders only with a site key; invisible
  mode; the token is obtained with `turnstile.execute()` at submit time, not on mount, so a
  long message never submits a stale ~300 s token; `expired-callback` resets), submit →
  «جارٍ الإرسال» spinner → success card (Check icon, §4.11 text, WhatsApp secondary) or
  failure text above the button with values kept. Tracks `contact_submit{inquiry}`.
- `POST /api/contact`: JSON + Origin → zod → honeypot 200 → rate limit (5/10 min/IP, own
  limiter) → Turnstile `siteverify` with `TURNSTILE_SECRET_KEY` when set (after the limiter
  so nobody can drive unbounded Cloudflare calls) → email transport.
  Email transport `lib/contact-transport.ts` (Resend `emails.send` to `CONTACT_TO`, from
  `RESEND_FROM`, `replyTo: email` so Dhia answers from the inbox; subject «رسالة جديدة من
  الموقع: {inquiryType}»; LTR-safe phone/email in the body; «رد عبر واتساب» link when the phone
  is Saudi) with the same live/mock/off + health reporting as the newsletter
  (`contact: live | mock | off`, `turnstile: on | off`). `lib/phone.ts` `normaliseSaudiPhone`
  (`05XXXXXXXX` / `5XXXXXXXX` / `+9665…` / `009665…` → `9665XXXXXXXX`, else `null`) with a
  unit test; it drives both the zod phone rule and the WhatsApp link.
- Booking card: `BOOKING_URL` (server env → rendered `href`, `target="_blank"
  rel="noopener"`) else WhatsApp with «مرحباً، أرغب بحجز استشارة مجانية.».

### D. Blog placeholder: `modules/blog/`
- `content/blog/posts/*.md` (three sample bodies, frontmatter-free: title etc. stay in
  `content/blog/index.ts` with `excerpt`, `cover` from lifestyle mockups, `publishedAt`,
  `readingMinutes` computed by a tested helper, `takeaways[3]`, `author`). Written with the
  `ux-araby` skill under §4.1 rules, facts only from §1.1; `sample: true`.
- `/blog/page.tsx`: hub chips (links with `?hub=`; server reads `searchParams` → static per
  hub is not required; keep the page static and filter client-side in a tiny island reading
  `location.search`, list server-rendered fully so crawlers see all three), post cards,
  newsletter block (`NewsletterForm tone="light"`).
- `/blog/[slug]/page.tsx`: template per §6.11; `ShareButtons` island (wa.me, x.com intent,
  copy link with a transient «تم النسخ»?، no: §4.1 forbids «تم»; use «نُسخ الرابط» as
  `TODO(copy)`), related by hub, author card, `BlogPosting` JSON-LD.

### E. SEO layer: `modules/core/seo/`
- `metadata.ts` extended: `buildMetadata(route, overrides)`, product/post variants, OG types,
  verification tokens from `lib/env-server.ts`; `robots` unchanged rule.
- `json-ld.ts`: typed builders (`onlineStore`, `webSite`, `breadcrumbs`, `itemList`,
  `product`, `webPage`, `blogPosting`) + `JsonLd` component; unit test asserts required
  fields per type and valid JSON.
- `app/sitemap.ts`, `app/robots.ts` (full §7.2), `app/manifest.ts`,
  `app/indexnow/[key]/route.ts` → serves `/indexnow/{INDEXNOW_KEY}.txt` and `notFound()` for
  any other name (no root-level dynamic segment: a root catch-all would soft-404 every unknown
  URL); `lib/indexnow.ts` posts `{ host, key, keyLocation, urlList }` with `keyLocation` set
  to that path; `scripts/indexnow.ts` (diff two sitemap XMLs → POST changed URLs); CI step on
  `main` guarded (no-op until CranL). BRD §7.6 amended for the key location.
- `scripts/build-og.ts` → `public/og/default.png` + `public/og/products/{slug}.png`:
  Playwright renders an HTML template (white, colour logo, tagline, five product photos;
  product variant = photo + «يبدأ من {price}» with `SarSymbol`) at 1200×630 using the
  self-hosted font files; PNGs are committed, the script is `pnpm og` and re-run on demand.
  `tests/og-images.test.ts` asserts `public/og/products/{slug}.png` exists for every product
  so a new product cannot ship without its image. BRD §7.3 amended (static PNGs, ADR-020).

### F. Redirects, headers: `src/lib/redirects.ts`, `next.config.ts`, `src/proxy.ts`
- `redirects.ts`: typed map for §5.2. Sources are written **without** the trailing slash
  (Next matches both forms and answers `/about/` with its own 308 to `/about` before custom
  redirects run); 301 entries, `/en` exact then `/en/:path*` → 302 to the Arabic path, and
  the 410 pattern list. `next.config.ts` `redirects()` from the map; `redirects.spec.ts`
  asserts first-hop status ∈ {301, 308} (302 for `/en`) plus the final URL.
- `lib/security-headers.ts` → `headers()`: HSTS (`max-age=63072000; includeSubDomains;
  preload`, RUNBOOK notes that `preload` commits every future `*.b7r.sa` subdomain to HTTPS
  before Dhia submits to the list), nosniff, `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `X-Frame-Options: DENY`, and
  the full CSP: `default-src 'self'`; `script-src 'self' 'unsafe-inline'
  https://www.googletagmanager.com https://challenges.cloudflare.com {UMAMI_ORIGIN}`;
  `style-src 'self' 'unsafe-inline'` (required: `next/image fill`, `Reveal`, the hero and the
  dock all emit inline `style`); `img-src 'self' data: blob: https://www.google-analytics.com
  https://*.google-analytics.com`; `connect-src 'self' https://*.google-analytics.com
  https://*.analytics.google.com https://region1.google-analytics.com {UMAMI_ORIGIN}`;
  `frame-src https://challenges.cloudflare.com`; `font-src 'self'`; `media-src 'self'`;
  `object-src 'none'`; `base-uri 'self'`; `form-action 'self'`; `frame-ancestors 'none'`.
  `Content-Language: ar` only on page routes (`source: '/((?!api|_next).*)'`). Unit test on
  the header builder; **`csp.spec.ts`** installs a `securitypolicyviolation` listener and
  asserts zero violations across: home load, designer upload (blob:), consent accept → GA
  load, contact submit with the Turnstile stub. BRD §8.10 amended via `docs/brd-sections`.
- `src/proxy.ts` (Next 16): `config.matcher` limited to the 410 patterns so the proxy never
  runs on pages or `_next/static`; returns the static 410 body (`text/html; charset=utf-8`,
  `<html lang="ar" dir="rtl">`, `Cache-Control: public, max-age=86400`, Arabic «هذه الصفحة
  أُزيلت»، `TODO(copy)`). Unit test on the matcher.
- ADR-016: CSP without nonces (static pages; `'unsafe-inline'` as the BRD's own CSP lists; a
  nonce next to `'unsafe-inline'` would disable the latter in CSP3 browsers and break GA's
  injected inline script).

### G. Cutover readiness
- `docs/RUNBOOK.md` deploy, env matrix, rollback, cutover steps; `docs/LAUNCH-CHECKLIST.md`
  (§12.4 with owner/status); `.env.example` final. Production-required set (BRD §8.5:
  SITE_URL, APP_URL, WHATSAPP, GA, UMAMI, RESEND_*, CONTACT_TO, INDEXNOW_KEY, verification
  tokens) is checked by `lib/env-server.ts` `assertProductionEnv()` from
  `instrumentation.ts` `register()`, server start, not build, and only when
  `B7R_RUNTIME=production`, a signal set solely in the CranL app (RUNBOOK). CI keeps building
  and serving with the production origin for the noindex/robots checks without tripping it;
  `NEXT_PUBLIC_SITE_URL` stays the preview/noindex signal only. `/api/health` reports every
  server integration as `live | mock | off` so a misconfigured deploy is visible.

## Tests
Unit: `redirects.test.ts` (every §5.2 entry + 410 matcher), `json-ld.test.ts`,
`contact-schema.test.ts`, `phone.test.ts`, `sitemap.test.ts`, `reading-time.test.ts`,
`security-headers.test.ts`, `og-images.test.ts`, `env-server.test.ts` (production set).
E2E: `routes.spec.ts` (status + H1 + one JSON-LD script per route), `redirects.spec.ts`
(first-hop status + final URL), `products.spec.ts` (grid, gallery keyboard, sticky bar,
JSON-LD Product), `contact.spec.ts` (validation, honeypot, success via mock, failure, 429
last; **one project, serial, per-run `x-forwarded-for` IPs**, the newsletter lesson),
`blog.spec.ts` (hub filter, share copy), `legal.spec.ts` (on-this-page),
`machine-files.spec.ts` (sitemap/robots/manifest/indexnow key route + 404 for other names),
`csp.spec.ts` (zero `securitypolicyviolation`), axe on every route, budgets on
product/contact/post; LHCI five URLs.

## Judgment calls (ADRs)
- ADR-016 CSP without nonces (static rendering).
- ADR-017 410s in `proxy.ts` (Next redirects cannot emit 410; BRD §5.2).
- ADR-018 Blog sample bodies authored with `ux-araby`, `sample: true`, listed for Dhia.
- ADR-019 Turnstile optional: absent site key → form works without the widget; absent secret →
  API skips verification but health reports `turnstile: off`.
- ADR-020 OG images are static PNGs built with Playwright (Satori cannot shape Arabic
  reliably; the images change only when products or the tagline change).

## Open items for Dhia (do not block)
Everything in §12.4 items 1–8, 10 credentials; blog bodies review; `TODO(copy)` strings:
410 page text, «نُسخ الرابط».
