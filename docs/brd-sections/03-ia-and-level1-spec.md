## 5. Information architecture, URLs, redirects

### 5.1 Route map (Level 1)

Arabic lives at the root; English lives under `/en/` (Level 5, ADR-043): the same route map with the prefix, `<html lang="en" dir="ltr">`, English copy and English CMS content, no browser-language detection (a reader chooses with the switch in the header). A page that has no English twin is absent from `/en` (404, no hreflang); `/en/blog` waits for 5b. Slugs are lowercase Latin with hyphens (shareable on WhatsApp without percent-encoding). No trailing slashes; `/path/` redirects 308 to `/path`.

| Route | Page | Indexable | Notes |
|---|---|---|---|
| `/` | Home | yes | §6.4 |
| `/products` | Products listing | yes | §6.5 |
| `/products/tee-essential` · `/products/tee-oversize` · `/products/hoodie` · `/products/baby-onesie` · `/products/tote-bag` | Product detail | yes | §6.6 |
| `/how-it-works` | How it works | yes | §6.7 |
| `/about` | About | yes | §6.8 |
| `/contact` | Contact + booking | yes | §6.9 |
| `/faq` | Full FAQ | yes | §6.10 |
| `/blog` | Blog index (placeholder in L1) | yes | §6.11 |
| `/blog/{slug}` | Post (3 samples in L1) | yes | §6.11 |
| `/terms` · `/shipping` · `/privacy` | Legal | yes | §6.12 |
| `/404` (not-found) | 404 | no | §6.13, returns HTTP 404 |
| `/sitemap.xml`, `/robots.txt`, `/{INDEXNOW_KEY}.txt`, `/manifest.webmanifest`, favicon set | Machine files | | §7 |
| `POST /api/contact`, `POST /api/newsletter`, `GET /api/health` | API | no | §6.9, §6.14, §8.6 |

Hub slugs for the blog (used as filters in L1, as routes in L3): `getting-started`, `pod-basics`, `salla-zid-shopify`, `design`, `pricing-profit`, `seasons`.

### 5.2 Redirects from the old WordPress site (301 unless stated)

| Old URL | New |
|---|---|
| `/about/` | `/about` |
| `/showcase/` | `/products` |
| `/contact/` | `/contact` |
| `/terms-conditions/` | `/terms` |
| `/shipping/` | `/shipping` |
| `/privacy-policy/` | `/privacy` |
| `/blog/` | `/blog` |
| `/home-2/` | `/` |
| `/team/`, `/our_services/`, `/under-construction/`, `/demo-design-system/`, `/specialists/*`, `/project/*`, `/project-category/*`, `/services/*`, `/category/*`, `/post001/` … `/post012/`, `/hello-world/`, `/feed/`, `/wp-content/*`, `/wp-admin/*`, `/wp-json/*`, `/wp-login.php`, `/xmlrpc.php` | **410 Gone** (static response, no redirect) |
| `www.b7r.sa/*` | `b7r.sa/*` (308, at the host level) |
| `http://*` | `https://*` (host level) |

Implement in `next.config.ts` `redirects()` plus a small middleware for the 410 list (Next redirects cannot emit 410). Keep the map in `src/lib/redirects.ts` so Level 2 can move it into the admin.

### 5.3 Navigation model

- Primary nav: 6 items (§4.3). Active state on the current route and on `/products/*` for المنتجات, `/blog/*` for المدونة.
- Header CTA and login link are not nav items.
- Footer nav: the same 6 plus the 4 policy links.
- Breadcrumbs on product pages and blog posts only.
- Internal linking rules: every page links to `/products` and to the register URL at least once (ribbon counts); product pages cross-link to the three other products; how-it-works links to FAQ; FAQ links to contact.

---

## 6. Level 1 specification

Each section below states purpose, layout (desktop ≥ 1024 px and mobile < 768 px; tablet interpolates), content references (§4), assets, behaviour and states, motion, accessibility, and acceptance criteria. "Start" and "end" are logical directions: in RTL, start = right.

### 6.1 Global shell

- `<html lang="ar" dir="rtl">`, `<body>` with `--color-surface` background, base font 17 px.
- Order inside `<body>`: skip link → `<header>` → `<main id="content">` → `CtaRibbon` (rendered by each page just before the footer, except the 404 page) → `<footer>` → `WhatsAppWidget` → `ConsentBar` → analytics scripts.
- Fonts preloaded in `<head>` (§3.3). Viewport meta must allow zoom (`width=device-width, initial-scale=1`; never `maximum-scale=1`).
- Every page exports metadata (§7.3) and renders its JSON-LD (§7.4).

### 6.2 Header

**Purpose:** orientation and one clear action.

**Desktop layout:** height 88 px at rest (*amended 2026-09-14, Dhia: "a little bit more down"; was 72*); container; three zones in a flex row: start = colour logo (height 36 px, links to `/`), centre = nav links (17 px Medium, gap 32 px), end = the language switch then the primary `Button` "ابدأ براندك مجانًا" (md size). *Amended 2026-09-14 (Dhia, ADR-044): no login link anywhere. The switch is an icon: the translate glyph in a 44 px ring, its accessible name from the copy bank, a CSS tooltip naming the target language in that language; it links the current page in the other language and follows client-side navigation; a page without a twin goes to its section's listing in the other language.* Background transparent over the hero's top edge on `/` only; elsewhere white.

**Sticky behaviour:** `position: sticky; top: 0; z-index: 50`. After the page scrolls more than 24 px, the header transitions over 200 ms to: height 60 px, background `rgba(255,255,255,.85)` with `backdrop-filter: blur(12px)`, bottom hairline `--shadow-header`, logo scales to 30 px. It never hides on scroll.

**Active link:** 2 px `--color-accent` underline offset 10 px, animated width 0 → 100% over 200 ms from the start edge.

**Mobile (< 1024 px):** height 72 px at rest (*amended 2026-09-14; was 60*); start = logo 28 px; end = burger button (44 × 44 target, three 2 px lines, 18 px wide). No CTA and no switch in the bar. Tapping the burger morphs the lines into an X over 300 ms (top and bottom lines rotate ±45° and meet in the middle, middle line fades; the X morphs back into the burger over 200 ms as the sheet closes) and opens a full-screen overlay: white background; a top bar mirroring the header (the logo at the start, the language switch and the X at the end); the 6 links at 28 px Bold stacked with a 40 ms staggered fade-and-rise, then a divider, then the primary CTA (lg, full width), then one row of icons: WhatsApp (green tint) and the three socials. *Amended 2026-09-14 (Dhia, ADR-044): no login button and no WhatsApp text line; the overlay fades in from above (opacity + 12 px translate down, 300 ms) instead of sliding from the start edge.* Body scroll is locked while open; Escape and the X close it; focus is trapped inside; focus returns to the burger on close. Reduced motion = opacity only, the X drawn at once.

**Acceptance:** keyboard reachable; header never overlaps the hero text; no layout shift when it shrinks (reserve height with a wrapper); Lighthouse tap targets pass.

### 6.3 Footer, CTA ribbon, waves

**6.3.1 CTA ribbon (component `CtaRibbon`, on every page before the footer):** full-bleed band, background `--color-primary`, white text, padding 72 px vertical (48 px mobile). Content centred: H2 (§4.4 ribbon), lead, then a white `Button` (primary text colour) "ابدأ براندك مجانًا". Top and bottom edges are `WaveDivider`s (§6.3.4) in the adjacent section's background colour so the band appears to sit between two gentle waves.

**6.3.2 Footer:** background `--color-navy`, text white at 90% opacity, links white, hover `--color-accent`. Top edge: a `WaveDivider` in the ribbon's primary blue so the ribbon flows into the footer. Layout desktop: 4 columns (logo + tagline + social icons 3 | روابط | السياسات | النشرة البريدية form). Second row: badges strip (payment logos at 28 px height in white rounded tiles, then SBC, Ministry of Commerce, then the Misk logo with its line), separated by a 1 px white/10% hairline. Third row: contact line and copyright. *Amended 2026-09-13 (Dhia): four social icons (X, Instagram, TikTok, WhatsApp) with the contact line (e-mail · phone) under them in the first column; the Misk logo without its line; the third row is the copyright alone, centred.* *Amended 2026-09-14 (Dhia, ADR-044): the white logo is 48 px (was 40). Below 1024 px: the brand block (logo, tagline, socials, contact line) spans the row and centres; روابط and السياسات share one row in two start-aligned columns; the newsletter spans the row; the badges wrap centred.*

**6.3.3 Newsletter form (footer):** email input (LTR) + button; POST `/api/newsletter`; inline success or error message (§4.5) with `aria-live`; honeypot field; disabled while submitting.

**6.3.4 WaveDivider:** an SVG path 1440 × 48 (viewBox), two overlapping wave paths at 100% and 60% opacity, `preserveAspectRatio="none"`, height 48 px desktop / 32 px mobile. Motion: the paths translate horizontally by one wavelength over 20 s, linear, infinite, in opposite directions for the two layers; amplitude must be subtle (≤ 12 px). Under reduced motion: static. The wave is the only place the sea motif animates. Do not add waves to any other section.

### 6.4 Homepage

Section order: Hero → Product strip → Interactive designer and profit → Three steps → Video → Why us → Testimonials → Integrations → FAQ → CTA ribbon → Footer. Backgrounds alternate: hero (photo) · surface · ground · surface · ground · surface · ground · surface · ground · ribbon · navy.

#### 6.4.1 Hero

**Purpose:** the promise in one glance, one action.

**Layout desktop:** section `min-height: calc(100svh - header)`, full-bleed up to the photo's own width. *Amended 2026-09-17 (Dhia, ADR-051): the desktop photo is 1920 × 1080 and is never shown larger than its pixels; on a viewport wider than 1920 px the hero is a card of that width, centred under the header on the page's white, with the large radius, its height capped at 1080 px; the `sizes` of the desktop rendition say so, so the browser never fetches an upscaled candidate.* Background: the slide image, `object-fit: cover`, `object-position: 20% 60%` in Arabic and `80% 60%` in English (keeps the product cluster in view; each language has its own photos, see Slides). A legibility overlay on the start 45% of the width (the right in Arabic, the left in English): linear gradient from the overlay colour at 92% opacity at the start edge to transparent. *Amended 2026-09-14 (Dhia, ADR-044): the overlay is an admin setting, `hero.overlay`: a switch (off shows the photo as it is) and a `#rrggbb` colour (white by default), one setting for both languages.* Text column: inside the container, start-aligned, max-width 560 px (600 px in English), vertically centred at 45% of the section height. Stack: Display headline (§4.4 slide table, `--color-text`; in English 56 px, leading 1.12, tracking -0.02 em, so every headline is two rows and every subline one at 1280 px), 16 px gap, subline (lead size, `--color-text-muted`), 32 px gap, button row (primary lg button + secondary text link with a mirrored arrow, gap 24 px), 12 px gap, microcopy (small, muted), 32 px gap, proof chips row (0 to 6 `Chip`s with `Check` icons in accent tint; the row is omitted when the language has none; the rows are shared by both languages, the text is per language). Slide dots sit at the bottom-start of the section, 24 px from the edges: 4 dots, active dot elongated to 24 px in `--color-primary`, inactive 8 px at 40% opacity. A pause/play control (icon button) sits next to the dots.

**Layout mobile:** `min-height: 100svh`. Image uses the mobile 4:5 asset, `object-position: 50% 70%`, and a stronger overlay from the top: `rgba(255,255,255,.96)` for the top 55% fading to transparent at 75%. Text sits in the top half: Display at its minimum size, subline, primary button full width, secondary link centred below, microcopy, chips as a horizontally scrolling row with snap and no visible scrollbar. Dots centred at the bottom.

**Slides:** 4 entries `{ id, headline, subline, imageDesktop, imageMobile, alt }` from `content/home.ts`; the photos are per language (ADR-044): the English document mirrors the layout, so its photos are mirrored compositions (calm area at the left, under the copy). Placeholders: slides 1 and 3 use `hero-set-A-black-b7r-merch.png`, slides 2 and 4 use `hero-set-B-blue-tasmeemak.png`; mobile variants are centre-crops generated at build (`scripts/hero-crops.ts`), and the English placeholders are the same crops flipped (`public/images/hero-en/`, the printed wordmark reads backwards on them) until Dhia supplies final photos in both compositions. The final photos must follow §3.9.

**Behaviour:** auto-advance every 6 s; crossfade 700 ms (image opacity) while the headline and subline fade-and-rise (12 px, 400 ms) 100 ms after the image starts; buttons and chips do not move. Pauses on hover, focus within, and touch; resumes on leave. Swipe left/right on touch changes the slide (in RTL, swiping toward the start edge goes forward). Dots are buttons. The first slide's headline is the page's only `<h1>`; other slides' headlines are `<p class="display">` so the document keeps one H1. Reduced motion: no auto-advance, instant slide switch, dots still work.

**Performance:** the first slide's desktop and mobile images are LCP candidates: `preload` with responsive `imagesrcset`; other slides lazy-load after first interaction or 3 s idle. The section's height must not depend on image load (no CLS).

**Acceptance:** LCP ≤ 2.5 s on 4G mobile emulation; headline legible on both placeholder sets; dots and pause control keyboard operable; no H1 duplication; all four slides render with their exact §4.4 strings.

#### 6.4.2 Product strip (hover-expand)

**Purpose:** show the range in one glance, invite exploration.

**Reference:** `resources/layout-examples/product-strip-hover-expand.png`.

**Layout desktop:** `SectionHeader` (§4.4) start-aligned with the "تصفح كل المنتجات" secondary button at the end of the same row. Below: a flex row, height 520 px, gap 8 px, 5 panels each `flex: 1 1 0`, `border-radius: 13px`, overflow hidden, background `--color-ground`. Each panel contains the product's front photo (`object-fit: cover`, `object-position: center`) and, at the bottom-start, a label group that is invisible at rest: product name (H4 white on a subtle bottom scrim) and the price pill "يبدأ من {SarAmount}" (white pill, primary text). On hover or focus, the panel grows to `flex: 2.6` over 500 ms with `--ease-expand`, the photo scales from 1.0 to 1.04, and the label group fades in 200 ms after the expand starts. Siblings shrink proportionally. The whole panel is a link to the product page. Order (start → end): تيشيرت أساسي · هودي · تيشيرت أوفرسايز · حقيبة قماشية · بربتوز أطفال.

**Layout mobile:** horizontal snap carousel: cards 78vw wide, 4:5, gap 12 px, scroll padding 16 px, labels always visible, no hover. Show a subtle "اسحب" hint only on first visit (dismisses on scroll).

**Photos:** `resources/products/{slug}/{colour}-front.jpg`; use black for the tees and hoodie, white for the onesie, beige for the tote, so the strip alternates dark/light.

**Acceptance:** panels are real links with product names as accessible text; expansion works with keyboard focus; no jank (transform and flex-basis only; `will-change` on hover only); images sized with `sizes="(min-width:1024px) 20vw, 78vw"`.

#### 6.4.3 Interactive designer and profit calculator

**Purpose:** let the visitor feel the product and the money in under a minute. This is the section Dhia called the most important. Build it as its own module (`modules/designer`), fully client-side, no uploads to any server, no login, no saving.

**Layout desktop:** `SectionHeader`. Then a two-column card (surface, radius 20 px, hairline border, padding 32 px): **start column (40%) = controls**, **end column (60%) = canvas** (amended 2026-09-13: controls 46 %, canvas 54 %, canvas max 600 px, tighter gaps). Mobile: canvas first (full width, square), controls below as four stacked groups; the results card is sticky at the bottom of the viewport while the section is in view (height 72 px, shows ربحك الشهري التقديري and the CTA).

**Controls (top to bottom, each group has its §4.4 label):**
1. **المنتج**: 5 `Chip`s with 32 px product thumbnails and names; single select; default تيشيرت أساسي.
2. **اللون**: swatches (28 px circles with a 2 px ring on selection) for the selected product's colours (tees and hoodie: white, black; onesie: white; tote: beige). Default: white for tees and hoodie, so the sample design is visible. *Amended 2026-09-13 (ADR-036): no colour control, every product shows in white, the tote in beige.*
3. **التصميم**: a dashed dropzone (radius 13 px) with an `Upload` icon and the button "ارفع تصميمك" + helper text; accepts `image/png, image/jpeg, image/svg+xml, image/webp`, max 10 MB, drag-and-drop and click; below it the ghost button "جرّب تصميماً جاهزاً". After a design exists, the dropzone collapses to a 56 px row with the thumbnail, "غيّر التصميم" and "إعادة الضبط". Invalid files show the §4.4 file error inline. *Amended 2026-09-13 (ADR-036): the printable area on the mockup is the upload target, empty, it shows «اضغط لرفع شعارك أو صورتك» with the helper text and opens the picker on click or keyboard (drag-and-drop anywhere on the mockup); a placed design gets a 44 px «×» («إزالة التصميم») that clears it; the canvas starts empty and «جرّب تصميماً جاهزاً» under it places the sample. The print-area outline and the handles show only while a mouse pointer is inside the canvas or the design is selected by a tap; otherwise the mockup is a clean preview. The dropzone, its collapsed row and «غيّر التصميم» / «إعادة الضبط» are gone. Amended again 2026-09-13 (Dhia): no sample design and no «جرّب تصميماً جاهزاً»، the canvas fills only by upload; the «التسعير» legend and the «تقدير لا يشمل الشحن والضريبة» footnote are removed from the calculator.*
4. **التسعير**: read-only row "التكلفة من بحر" with `SarAmount base`; "سعر البيع في متجرك" numeric input (LTR digits, `SarSymbol` prefix) bound to a `Slider` (min = base, max = base × 4, step 1, default = suggested price from Appendix A) with the helper "السعر المقترح {SarAmount}"; "مبيعات يومية" `Stepper` (min 1, max 100, default 10).

**Results card (below the controls, tinted `--color-accent-tint`):** two figures with labels "ربحك لكل قطعة" = sell − base, "ربحك الشهري التقديري" = (sell − base) × dailySales × 30, both `SarAmount`, integers, count-up 300 ms on change; when sell < base show the warning in `--color-error` and render the figures in error colour; when sell = base show 0 in muted colour. Footnote. Then the section CTA "ابدأ بيع هذا المنتج" (primary lg, full width of the column) linking to the register URL with `utm_campaign=designer&product={slug}`.

**Canvas (react-konva):** a square `Stage` sized to the column (max 640 px), background `--color-ground`, radius 20 px via a wrapping div. Layers: (1) product mockup `Image` = the selected product and colour's front photo, `object-fit: contain`; (2) a `Group` clipped to the **print area** rectangle; inside it the design `Image`, `draggable`, with a `Transformer` (corner anchors only, keep ratio, rotation enabled with snap at 0/90/180/270, min size 40 px); (3) an outline `Rect` of the print area (1.5 px dashed `--color-accent`, 60% opacity) visible while hovering the canvas or dragging, hidden otherwise. On product or colour change, the mockup swaps with a 200 ms crossfade and the design is re-centred and scaled to 60% of the print-area width. Double-tap or double-click re-centres. Touch: one finger drags, two fingers pinch-scale. Wheel over the design scales it (Ctrl not required). Bounds: the design may be dragged partially outside the area (it is clipped), but at least 25% of it must remain inside; snap back otherwise.

**Print area per product** (fractions of the 1000 × 1000 photo; aspect fixed at 28:38 ≈ 0.737; agents may tune position ± 0.03 so the rectangle sits on the garment body, never on the background):

| slug | x | y | w | h |
|---|---|---|---|---|
| tee-essential | 0.345 | 0.27 | 0.31 | 0.42 |
| tee-oversize | 0.345 | 0.28 | 0.31 | 0.42 |
| hoodie | 0.39 | 0.33 | 0.22 | 0.30 |
| baby-onesie | 0.375 | 0.27 | 0.25 | 0.34 |
| tote-bag | 0.3375 | 0.42 | 0.325 | 0.44 |

**Sample design:** *removed 2026-09-13 (Dhia), there is no sample design; the canvas starts empty and fills only by upload.*

**Deep link:** `/#designer?product=hoodie` (from product pages) scrolls to the section and preselects the product.

**Privacy:** uploaded files stay in memory (`URL.createObjectURL`), are revoked on replace, and are never sent anywhere. State a one-line note under the dropzone only if a reviewer asks; otherwise keep the UI clean.

**Analytics events:** `designer_product_change`, `designer_upload`, `calculator_change` (debounced 800 ms, with product and sell price), `cta_click{location:"designer"}`.

**Acceptance:** works on iOS Safari and Chrome Android with touch; no layout shift when the design loads; 60 fps drag on a mid-range phone (Konva layer caching for the mockup); keyboard users can change product, colour, price, and sales; the numbers match the formula exactly for random inputs (unit-tested); the section is server-rendered as a shell with the client island hydrating (`dynamic(() => import(...), { ssr: false })` for the Konva part only).

#### 6.4.4 Three steps (scroll-driven)

**Purpose:** explain the model in three verbs.

**Layout desktop:** the section is 300vh tall with a sticky inner container of 100vh. Two columns: **start = the three steps** stacked vertically (number badge 40 px circle, H3 title, subline; inactive steps at 40% opacity, active at 100% with the badge filled `--color-primary` and a 2 px accent progress line growing beside the list); **end = an illustration panel** (radius 20 px, `--color-accent-tint` background, 480 px square) showing the 3D icon of the active step: `tee-plus-create-product.jpg` → `laptop-link-connect-store.jpg` → `printer-print.jpg`. Scroll progress across the 300vh maps to steps 0–1–2 at 0–33–66%; the icon crossfades 300 ms with a 1.02 → 1.0 scale. The link "اعرف أكثر عن طريقة العمل" sits under the steps.

**Layout mobile:** no pinning. A vertical list: for each step a row with the 3D icon (96 px, radius 13 px) at the start and the text at the end; a thin vertical connector line between rows.

**Reduced motion:** desktop renders the mobile list layout.

**Acceptance:** scroll-jacking is not used (native scroll only); the steps are readable without JavaScript (server-rendered list); the sticky pin releases cleanly at the section end.

#### 6.4.5 Video

**Layout:** centred `SectionHeader` (H2 + lead from §4.4). Below: a 16:9 `VideoPlayer` in a radius 20 px frame with a hairline border, max-width 960 px, poster image (a frame extracted from the video at build via `scripts/video-poster.ts`; if extraction is impossible in the build environment use `lifestyle-mockups/dtg-printer-stock.png`), a centred 72 px play button (white circle, primary play icon, shadow-popover). Click: the `<video>` (`preload="none"`, `playsinline`, `controls` after start) plays with sound. No autoplay anywhere, no loop. Source `public/video/printer-marketing.mp4`. Track `video_play`.

Amended 2026-09-13 (ADR-037, Dhia's design review): the section is a full-width frame with the server-rendered poster, the H2 + lead and the register CTA over a fixed scrim, and a **muted looping** `<video>` (`preload="none"`, `playsinline`, no controls, `aria-hidden`) mounted near the viewport by a small island; under `prefers-reduced-motion`, Save-Data, or a refused `play()` the poster stays. No `video_play` event.

#### 6.4.6 Why us

**Layout:** `SectionHeader`. Three `Card`s in a row (single column on mobile): 56 px icon circle (accent tint background, Lucide icon in `--color-primary`: `ShieldCheck` for بدون مخاطرة, `Workflow` for كل شيء تلقائي, `Zap` for جودة محلية وسريعة), H3 title, one-line text (§4.4). Cards have hairline borders, no shadow at rest, `--shadow-card-hover` on hover with a 2 px lift.

#### 6.4.7 Testimonials

**Layout:** `SectionHeader`. Three `Card`s: large quote glyph in accent tint, the quote (lead size, Light weight), then avatar (48 px circle or store logo) + name (Medium) + store (muted). Mobile: snap carousel. Source `content/testimonials.ts` with `placeholder: true` on the sample entries. **Rendering rule:** when every entry is a placeholder, render each card with a visible «نموذج» badge and add the `data-placeholder` attribute; on the production host (`NEXT_PUBLIC_SITE_URL` = `https://b7r.sa`, the same signal as the noindex guard; amended 2026-09-13, ADR-013, a CranL preview is also `NODE_ENV=production` and must still show the sample cards) the whole section is omitted until at least one non-placeholder entry exists. The launch checklist (§12.4) requires three real entries.

#### 6.4.8 Integrations

**Layout:** `SectionHeader` centred. A row of three tiles (surface, hairline, radius 13 px, padding 24 px): each tile shows the official platform logo (SVG, 40 px tall, monochrome allowed if the official colours clash; source the official brand assets from each platform's brand page; the B7R app repo also holds `platform-icons/{salla,zid,shopify}.svg`), the Arabic name, and the "متاح الآن" `Badge` in success colours. Tiles are not links in Level 1. Mobile: three tiles in a row still fit at ≥ 360 px; otherwise wrap.

#### 6.4.9 FAQ (homepage)

**Layout:** two-column on desktop: start = `SectionHeader` with the "كل الأسئلة" link; end = `Accordion` with the five items (§4.4). Single-open; chevron rotates 180°; content height animates 200 ms; each answer ≤ 35 words. Mobile: stacked. Track `faq_open{question}`.

### 6.5 Products listing `/products`

H1 + lead (§4.8). Grid of 5 `ProductCard`s (3 columns desktop, 2 tablet, 1 mobile): photo 4:5 (front, black or beige as in §6.4.2), name (H3), price "يبدأ من {SarAmount}", colour dots, sizes summary. Amended 2026-09-13 (ADR-035): the card shows the first two colour swatches (44 px targets); hovering a swatch previews that colour, clicking makes it the active colour; hovering the card flips to the back of the active colour. Whole card is a link; hover lifts 2 px and swaps the photo to the back view over 300 ms if one exists. Then the CTA ribbon.

### 6.6 Product detail `/products/{slug}`

**Layout desktop:** breadcrumbs; two columns: start = content, end = gallery. Gallery: main image 1:1 (radius 20 px) with thumbnails below (front/back for each colour); colour swatches switch both; keyboard arrows move between images. *Amended 2026-09-13 (ADR-035): one photo of the active colour that shows the back on hover, tap or arrow keys, a visible front/back toggle under it, then the colour swatches, no thumbnails, no counter; description, specs and the size chart share one section side by side from `md`. Amended again 2026-09-13 (Dhia): the full description replaces the short one under the H1, the price footnote is gone, and the details section holds only المواصفات and جدول المقاسات.* Content: H1, short description (one paragraph from Appendix A), price block (three lines from §4.8 with `SarAmount`, the profit line in success colour), footnote, primary CTA (lg) + secondary link to the designer, then sections: الوصف (full description), المواصفات (definition list: الخامة, الوزن, المقاسات, الألوان, منطقة الطباعة, طريقة الطباعة), جدول المقاسات (table; cm; LTR digits in RTL cells), منتجات أخرى (3 `ProductCard`s). Then the ribbon.

**Mobile:** gallery first, then content; sticky bottom bar with price "يبدأ من" and the CTA.

**Data:** Appendix A. JSON-LD `Product` + `Offer` (§7.4). Track `product_view{slug}`.

### 6.7 How it works `/how-it-works`

H1 + lead. Five step rows alternating image side (3D icons: `tee-plus-create-product`, `laptop-link-connect-store`, `bag-and-parcel-order`, `printer-print`, `truck-delivery`; icon on the end side for odd rows, start side for even rows; mobile stacks icon above text). Then the profit block: title, three tiles joined by "−" and "=" glyphs (mirrored order is natural in RTL: سعر البيع on the start), example line with `SarAmount`. Then the mini FAQ (3 items) and the ribbon.

Amended 2026-09-13 (Dhia's design review): the five steps are one connected journey, numbered 3D icons in circular frames on a path that runs across the top from `lg` and down the start side on phones, with a progress line that fills as the track scrolls through the viewport (a CSS view timeline named on the track; full and static where unsupported and under reduced motion); the profit block is a highlighted card whose tiles stack on phones. Copy unchanged.

### 6.8 About `/about`

H1. Story block (title + paragraph, max-width 760 px). Three cards (رسالتنا, رؤيتنا, قيمنا) with Lucide icons `Target`, `Eye`, `Heart`. Misk credential block: a surface card with the Misk logo (`brand/trust-badges/misk-foundation-logo.png`, 200 px wide, on white) at the start and the title + text at the end. Location line with a `MapPin` icon. One lifestyle image is allowed (`lifestyle-mockups/hanging-tshirt-mockup.jpg`) as a decorative banner between the story and the cards, 21:9, radius 20 px. Then the ribbon.

Amended 2026-09-13 (Dhia's design review, same copy): the lifestyle photo sits beside the story in a two-column header with the delivery origin as a chip over it and the location line under the story; a navy facts band follows with the welcome credit (`SarAmount`) and the three why-us pairs from §4.4 (title over text), labelled by the why-us section title; the three cards carry the 3D icons as art in a staggered grid; the MISK credential sits on an accent-tint card; then the ribbon.

### 6.9 Contact `/contact`

**Layout desktop:** H1 + lead. Two columns: start = the form card; end = contact cards stacked (واتساب with a green icon and link to `wa.me/966501699572?text=…`, البريد الإلكتروني `mailto:`, الهاتف `tel:`, تابعنا with the three icons) and the booking card. Mobile: contact cards first (WhatsApp is the fastest path), then the booking card, then the form.

**Form:** fields per §4.11; `Select` for the inquiry type; client validation with zod, messages from §4.11 under the fields, `aria-invalid`; honeypot input (visually hidden, named `website`); Cloudflare Turnstile widget rendered above the submit button when `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set (invisible mode); submit posts JSON to `POST /api/contact`. Button shows "جارٍ الإرسال" with a spinner while pending; on success replace the form body with a success card (check icon, §4.11 text, a "راسلنا على واتساب" secondary link); on failure show the failure text above the button and keep the input values.

**API `POST /api/contact`:** validates with the same zod schema; rejects if the honeypot is filled (returns 200 to fool bots); verifies Turnstile server-side when configured; rate-limits 5 requests per IP per 10 minutes (in-memory map; note the single-instance assumption); sends the email through Resend (§4.17) to `CONTACT_TO`; returns `{ ok: true }` or `{ ok: false, error }` with 400/429/500. Never logs message bodies in production.

**Booking card:** button opens `BOOKING_URL` in a new tab when set; otherwise opens WhatsApp with the §4.11 prefilled message. Level 4 replaces this with an inline Cal.com embed.

Amended 2026-09-13 (ADR-031): the section is the `contact` block of the contact page in the CMS (card titles and the booking card are content; the form's strings stay in code) and sits on the surface tone like the first section of every page.

### 6.10 FAQ `/faq`

H1 + lead. Groups as H2s (Appendix D) each with an `Accordion`. A sticky in-page group nav on desktop (start column). Bottom line with the WhatsApp link. JSON-LD: none (FAQ rich results are discontinued; keep the content only).

### 6.11 Blog `/blog` and `/blog/{slug}` (placeholder in Level 1)

*Since Level 5b (ADR-043) the same templates render the English blog under `/en/blog` from the documents' English values; see §10.1.*

**Index:** H1 + lead; a row of hub `Chip`s (6, filter only, `?hub=` query, no separate pages yet); a grid of post cards (cover 16:9, hub chip, title, excerpt, meta). Three sample posts from `content/blog/*.ts` marked `sample: true`; their body is short (200–300 words each, written in Arabic by the agent following §4.1, on the three §4.13 topics, factual, no claims beyond §1.1). Newsletter block at the end (same component as the footer).

**Post template:** breadcrumbs; H1; meta line; cover; "أهم النقاط" box (3 bullets); body with H2 questions, short paragraphs, lists; the in-post CTA block after the second H2; related posts (2); share buttons (WhatsApp, X, copy link); author card (ضياء, one line: مؤسس بحر برنت). JSON-LD `BlogPosting` (§7.4). Content max-width 760 px.

Level 3 replaces the data source with the CMS and adds hub routes; the templates stay.

*Amended 2026-09-14 (ADR-041, as shipped): the index shows the newest post as a wide featured card, then the grid; the hub chips are links to the hub pages (no `?hub=` filter); the search is a client island over an embedded index; pagination is `/blog/page/{n}`. The post template adds a table of contents from the H2s (a side rail from 1024 px, a folded list under the takeaways below it), the "updated" date when `contentUpdatedAt` is later than the publish day, previous/next within the hub, and the author card links to `/author/{slug}`. The in-post CTA stays where the template puts it: after the second H2.*

### 6.12 Legal pages

Single-column text pages (max-width 760 px), H1, updated line, then the Appendix B body rendered from Markdown with H2 numbering preserved. A sticky "on this page" list of H2s on desktop.

### 6.13 404

Centred: the wave icon, H1, text, primary button to `/`. Returns HTTP 404. No ribbon.

### 6.14 Newsletter

Component `NewsletterForm` used in the footer and blog. `POST /api/newsletter` validates the email, rejects honeypot, rate-limits 5/10 min/IP, adds the contact to the Resend audience `RESEND_AUDIENCE_ID`, returns `{ ok }`. Duplicate emails return `ok: true` (idempotent). Track `newsletter_submit`.

### 6.15 WhatsApp widget

**Purpose:** always-available human contact, styled to the brand, not a bare icon.

**Button:** fixed at bottom **right** (Dhia's explicit choice, even in RTL): `inset-block-end: 24px; right: 24px` (this is the one intentional physical property; comment it), *amended 2026-09-13 (ADR-038): bottom **left**, i.e. the inline end of this RTL site (`inset-inline-end: 24px`, a logical property; the physical exception is retired); the panel opens above the button inside the same fixed dock, so the button never moves*, 56 px circle, `--color-whatsapp` background, white WhatsApp glyph (official logo shape), `--shadow-popover`, scale 1.05 on hover. On first page load it appears after 1.5 s with a 200 ms scale-in. A small unread-style dot (accent) pulses once 6 s after load, once per session.

**Popup (click):** a 320 px card anchored above the button (right-aligned), radius 13 px, `--shadow-popover`: header in `--color-primary` with the B7R icon (36 px), title "بحر برنت", subtitle "فريق الدعم", a close X; body on `--color-ground` with one chat bubble (white, radius 13 px with a small tail at the start) containing the greeting; footer with the primary button "ابدأ المحادثة" (full width, WhatsApp green) that opens `https://wa.me/966501699572?text={encoded prefilled message}` in a new tab. Open/close animates 200 ms (opacity + 8 px rise). Escape closes; clicking outside closes. On mobile the popup is `calc(100vw - 32px)` wide. Track `whatsapp_click{location:"widget"}`.

**Do not** show a reply-time promise, hours, or an online indicator.

### 6.16 Consent bar and analytics

- **Umami** loads on every page (script from `NEXT_PUBLIC_UMAMI_SRC` with `data-website-id`), cookieless, no consent needed.
- **GA4** (`NEXT_PUBLIC_GA_ID`) loads only after consent. Implement Consent Mode v2: an inline `beforeInteractive` script sets `gtag('consent','default',{ analytics_storage:'denied', ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied' })`; on "موافق" set a first-party cookie `b7r_consent=granted` (180 days), call `gtag('consent','update',{ analytics_storage:'granted' })` and inject the GA script via `@next/third-parties`; on "رفض" set `b7r_consent=denied` and never load GA. On later visits respect the cookie; no bar.
- **ConsentBar:** small card fixed at the bottom **end** (in RTL the end edge is the left, so it never collides with the WhatsApp button, which sits at the physical right), `inset-block-end: 24px; inset-inline-end: 24px`, max-width 420 px, radius 13 px, shadow-popover, text (§4.7) + two buttons (موافق primary md, رفض ghost md) + the privacy link. Appears 800 ms after load with a 200 ms rise. Never blocks scrolling or content. On mobile it is full-width and sits above the WhatsApp button with 88 px bottom clearance.
- **Landing beacon (ADR-048, 2026-09-16):** one first-party POST when a visitor lands from another site or from nowhere (the page, the referrer, `utm_source`; nothing on a move between our pages, nothing on a reload; no cookie, no storage, no identifier, no IP stored) feeds the site's own traffic count in the admin. Cookieless, no consent needed.
- **Event helper:** `track(name, props)` sends to Umami always and to GA4 when granted. Events: `cta_click{location}`, `whatsapp_click{location}`, `designer_*`, `calculator_change`, `contact_submit`, `newsletter_submit`, `product_view`, `faq_open`, `outbound_app_click` (any link to b7r.app). (`video_play` retired 2026-09-13, ADR-037.)

### 6.17 Mobile rules summary

- Everything usable one-handed: primary actions within the bottom 60% of the viewport where possible; sticky CTAs on product pages and the designer.
- No hover-only information; every hover reveal has a tap or always-visible equivalent.
- Carousels use native scroll-snap; no custom scroll libraries.
- Minimum body 16 px on ≤ 360 px screens; touch targets 44 px; no horizontal page scroll (only within carousels).
- Test matrix: iPhone SE (375), iPhone 15 (393), Pixel 7 (412), Galaxy A-series (360), iPad (768/1024), desktop 1280 and 1536.

### 6.18 Level 1 acceptance criteria (summary; the phase DoDs in §12 reference this list)

1. All routes in §5.1 exist, return the right status, and use the exact §4 copy.
2. Redirect map in §5.2 works (automated test hits every old URL).
3. Lighthouse mobile on `/`, `/products`, one product page, `/contact`, one post: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO = 100.
4. Core Web Vitals lab values within budgets; no CLS from fonts, header shrink, images, or the consent bar.
5. RTL audit passes on iOS Safari and Chrome Android: no stray punctuation, no mirrored WhatsApp logo, arrows point the right way, numbers do not split.
6. Designer works with touch and keyboard; calculator formula unit tests pass; sample design loads by default.
7. Contact form sends a real email through Resend; newsletter adds a contact; both survive honeypot and rate-limit tests.
8. WhatsApp widget opens the correct `wa.me` link with the prefilled message on desktop and mobile.
9. Consent bar gates GA4; Umami records page views without consent.
10. Every image has Arabic alt text or `alt=""`; every icon-only button has an aria-label.
11. Testimonials section renders placeholders only in non-production builds.
12. `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm e2e`, and the RTL class lint all pass in CI.
