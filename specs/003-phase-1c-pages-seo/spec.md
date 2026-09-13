# Feature Specification: Phase 1c — Pages, SEO layer, cutover readiness

**Feature Branch**: `phase/1c-pages-seo` · **Created**: 2026-09-13 · **Status**: Draft

**Input**: BRD §12.2 Phase 1c: products listing and detail (§6.5–6.6), how it works (§6.7),
about (§6.8), contact with the working form and booking card (§6.9), FAQ page (§6.10), blog
placeholder with three sample posts (§6.11), legal pages (§6.12), redirects and 410s (§5.2),
sitemap (§7.5), robots (§7.2), IndexNow (§7.6), metadata and JSON-LD for every page
(§7.3–7.4), OG images, manifest and icons, security headers (§8.10), RUNBOOK. Copy §4.8–4.17,
Appendix A/B/D.

**DoD (BRD §12.2)**: all of §6.18; Search Console and Bing verification tokens in place;
launch checklist §12.4 items 1–12 complete; Dhia approves; DNS cutover; post-cutover checks.
Items needing Dhia or credentials (real testimonials, app flags, final photos, Resend domain,
Turnstile keys, GA verification, tokens, DNS) are listed as open items — this phase builds
everything the code side can and stops at the Dhia gate for cutover.

## User Scenarios & Testing

### US1 — Products (P1)
`/products`: H1 + lead, grid of 5 `ProductCard`s (3/2/1 columns), 4:5 front photo, name,
«يبدأ من {price}», colour dots, sizes summary; whole card a link; hover lifts 2 px and swaps
to the back view when one exists; then the ribbon. `/products/{slug}`: breadcrumbs; gallery
(1:1 main + thumbnails front/back per colour, swatches switch both, keyboard arrows move);
H1, short description, price block (three lines, profit in success colour), footnote, primary
CTA (`utm_campaign=product&utm_content={slug}`), «جرّب تصميمك عليه» → `/#designer?product=`;
sections الوصف / المواصفات / جدول المقاسات / منتجات أخرى (3 cards); mobile sticky bottom bar
with «يبدأ من» + CTA; JSON-LD `Product` + `Offer` + `BreadcrumbList`; `product_view` event.

### US2 — How it works, About, FAQ (P2)
Per §6.7, §6.8, §6.10 with §4.9, §4.10, Appendix D. FAQ groups as H2 accordions with a
sticky in-page group nav on desktop; mini FAQ on how-it-works reuses home items 2, 3, 4;
about renders the Misk block with the logo and the decorative hanging-tee banner.

### US3 — Contact (P1)
Form per §4.11/§6.9 with zod client validation, `aria-invalid`, honeypot `website`, Turnstile
rendered when `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set, `POST /api/contact` (zod, honeypot 200,
Turnstile server verification when configured, 5/10 min/IP, Resend email to `CONTACT_TO`,
`contact_submit` event, no message bodies in logs). Contact cards (WhatsApp, email, phone,
follow) and the booking card («احجز موعدك» → `BOOKING_URL` in a new tab or WhatsApp with the
§4.11 message). Mobile order: cards, booking, form.

### US4 — Blog placeholder (P3)
`/blog` index with hub chips (`?hub=` filter), 3 sample post cards; `/blog/{slug}` template
(breadcrumbs, H1, meta line, cover, «أهم النقاط», body with H2 questions, in-post CTA after the
second H2, related 2, share WhatsApp/X/copy, author card) with `BlogPosting` JSON-LD. Sample
bodies (200–300 words each, §4.1, no claims beyond §1.1) are written with `ux-araby` and
listed for Dhia's review; marked `sample: true`.

### US5 — Legal pages (P2)
`/terms`, `/shipping`, `/privacy`: Appendix B markdown rendered with numbered H2s, updated
line, sticky on-this-page list on desktop, `WebPage` + `BreadcrumbList` JSON-LD.

### US6 — Machine files and redirects (P1)
`sitemap.xml` (all indexable routes, `lastModified` from content `updatedAt`, product image
entries), `robots.txt` (§7.2 full rules with the answer-engine allow list; `Disallow: /` on
non-production hosts), `/{INDEXNOW_KEY}.txt` served when the key is set, `manifest.webmanifest`
(§7.3), favicon set. §5.2 redirects in `next.config.ts` from `src/lib/redirects.ts`; the 410
list served by `proxy.ts` (Next 16's middleware) with a static 410 body; `/en/*` → 302 to the
Arabic route; trailing slashes → 308. `Content-Language: ar` header on every page.

### US7 — Metadata, OG, JSON-LD (P1)
Every route: title/description from `content/seo.ts` (product/post titles from their data),
canonical, Open Graph (`website` / `product` / `article`), Twitter card, verification metas
from env. `public/og/default.png` generated once by `scripts/build-og.ts` (white, colour logo,
tagline, five product photos); product OG via `opengraph-image.tsx` (`ImageResponse`, ITF
Rayat Round Bold, photo + «يبدأ من {price}»); posts use the cover. JSON-LD per §7.4 table with
a unit test on required fields; home gets `OnlineStore` + `WebSite`.

### US8 — Security headers and hygiene (P1)
§8.10 headers via `next.config.ts` `headers()`: HSTS, nosniff, referrer policy, permissions
policy, `X-Frame-Options: DENY`, and a CSP allowing self, GTM, Turnstile, the Umami origin,
GA connect endpoints, `data:`/`blob:` images. Nonces are deferred (ADR) because Next's static
rendering cannot vary a nonce per response without dynamic rendering — `'unsafe-inline'` for
scripts as the BRD's CSP already lists.

### US9 — Cutover readiness (P2)
`docs/RUNBOOK.md` deploy/rollback/cutover sections; `docs/LAUNCH-CHECKLIST.md` with §12.4
items and who owns each; IndexNow GitHub Actions step (`scripts/indexnow.ts`) guarded on
`main` + healthy deploy; `.env.example` complete; `lib/env.ts` production-required set final.

## Requirements
- FR-001 Routes and status codes per §5.1; 404 stays; `/api/contact` added.
- FR-002 Content: `content/products.ts` already complete; `content/pages.ts` (how-it-works,
  about, contact, faq page) already present; blog sample bodies added to `content/blog/`.
- FR-003 Components: `ProductCard`, `Gallery`, `SpecList`, `SizeChart`, `Breadcrumbs`,
  `ContactForm`, `Select`, `Textarea`, `Turnstile`, legal `Markdown` renderer, `OnThisPage`,
  `ShareButtons`, `Prose`.
- FR-004 E2E: navigation across every route with status + H1; redirects (every §5.2 entry);
  410s; sitemap/robots content; JSON-LD parse per page; contact form validation, honeypot,
  success (mock transport), failure; product gallery keyboard; blog hub filter; axe on every
  route; budgets on `/products/tee-essential`, `/contact`, one post.
- FR-005 Lighthouse CI on `/`, `/products`, `/products/tee-essential`, `/contact`,
  `/blog/{sample}` per §8.7 with §7.8 thresholds.

## Success Criteria
- SC-001 §6.18 items 1–12 pass (item 7 contact part with the mock transport locally; live with
  keys); item 3 on the five LHCI URLs.
- SC-002 Every §5.2 old URL resolves to the right target/status in e2e.
- SC-003 Rich Results / schema validity: JSON parse + required-field unit tests for every type.
- SC-004 Launch checklist items 1–12 marked done or assigned to Dhia with what is needed.

## Out of scope
DNS cutover, GitHub push, CranL deploy (Dhia), Level 2+.
