# B7R Print (بحر برنت)، Marketing Website Master BRD

**Version:** 1.0 · **Date:** 2026-09-12 · **Owner:** Dhia (founder) · **Prepared with:** Claude · **Status:** Approved for implementation, Level 1 first

> This is the single source of truth for building the new **b7r.sa** marketing website. It is written for AI coding agents and human engineers. Every string that must appear on screen is given in Arabic verbatim in §4. Do not invent copy, prices, promises, or products beyond what this document states. When something is genuinely undefined, follow the "Decision rules for agents" in §0.5, then record the decision in `docs/DECISIONS.md` of the repository.

---

## Table of contents

0. How to use this document (agents read this first)
1. Business context and positioning
2. Audience and jobs to be done
3. Brand and design system
4. Voice, terminology, and the copy bank
5. Information architecture, URLs, redirects
6. Level 1 specification: pages, sections, components, behaviour
7. SEO and AI-search visibility requirements
8. Technical architecture, repository, hosting, quality gates
9. Level 2: admin dashboard (Payload CMS)
10. Level 3: blog and automated content engine
11. Level 4: inbox, bookings, newsletter, analytics
12. Phases, definitions of done, launch checklist, future blocks
13. Appendices (product data, legal texts, FAQ, redirect map, topic backlog, references)

---

## 0. How to use this document

### 0.1 What you are building

A fast, premium, Arabic-first (RTL) marketing website for **بحر برنت / B7R Print**, a Saudi print-on-demand platform. The site's only job is to make merchants understand the product in seconds and click through to register on the app at **https://b7r.app**. The site does not sell to end customers, does not take orders, and does not hold accounts. Level 1 is the public website. Levels 2–4 add an admin panel, an automated blog, and operational tools, in that order.

### 0.2 Reading order

1. §0 (this section), §1, §2: ten minutes, for context.
2. §3 and §4: the design system and every word of copy. Non-negotiable.
3. §5 and §6: what to build in Level 1, page by page, section by section.
4. §7 and §8: how it must be built (SEO, stack, repo, hosting, quality gates).
5. §12: the phase you are on, its definition of done, and the review process.
6. §9–§11 only when you reach Levels 2–4.
7. Appendices whenever §6 references them.

The `resources/` folder next to this file holds every asset. Its `README.md` maps each path. `docs/research/01–06` are the evidence behind this document; consult them when a requirement needs justification, never to override this document. `docs/00-decisions-log.md` records why each decision was taken.

### 0.3 Method: Spec Kit + CTO cycle, per phase

- Initialise the repository with GitHub Spec Kit: `uv tool install specify-cli`, then `specify init . --integration claude`. Run `/speckit.constitution` once with the principles in §8.9.
- For **each phase** in §12: `/speckit.specify` (paste the relevant §6 or §9–§11 text as the feature description) → `/speckit.clarify` → `/speckit.plan` (paste §8 as the tech constraints) → `/speckit.checklist` → `/speckit.tasks` → `/speckit.analyze` → `/speckit.implement` → `/speckit.converge`.
- Wrap each phase with the **cto-cycle** skill: CTO review of the plan before implementation, CTO review of the code after, fix findings, then advance. Advance autonomously between phases except where §12 says Dhia reviews first (Phase 1a).
- Skills that are welcome during implementation: `frontend-design`, `ui-ux-pro-max` (design, ui-styling, banner-design), `ux-araby` for any new Arabic string, `design-review` and `qa` before closing a phase, `setup-playwright` for end-to-end tests. Use them to raise quality, never to change decisions made here.

### 0.4 Non-negotiables (violating any of these fails review)

1. **Arabic is the base language and the page direction is RTL from `<html dir="rtl" lang="ar">`.** No physical-direction CSS (`left/right`, `ml-/mr-`, `pl-/pr-`, `text-left/right`); use logical properties and Tailwind logical utilities (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start/end`). Icons that imply direction (arrows, chevrons) are mirrored in RTL.
2. **Every page is server-rendered static HTML** with all content, links, and JSON-LD in the initial response. Interactive islands are client components inside server-rendered pages.
3. **Copy is verbatim from §4.** Agents do not write new Arabic marketing copy. If a string is missing, use the fallback rule in §0.5 and log it.
4. **Prices, delivery promise, product list, and integrations are exactly as stated:** 5 products; base prices 45/55/95/35/30 SAR shown as "يبدأ من"; delivery anywhere in Saudi Arabia within a maximum of 5 days; Salla, Zid, Shopify shown as available; 30 SAR welcome credit. Never add "coming soon" to products or integrations.
5. **The riyal symbol is the official Saudi Central Bank glyph as an inline SVG component, always placed to the left of the digits.** Never the text "ر.س" or "SAR" as a currency marker next to numbers, and never a font glyph. Plain-prose "30 ريالاً" inside a sentence is allowed only where §4 writes it that way.
6. **Western digits (0-9), Gregorian dates.** No Arabic-Indic digits, no Hijri.
7. **Light mode only.** No dark-mode toggle.
8. **No mention of AI anywhere on the public site**, Level 3 included.
9. **No fabricated testimonials.** The testimonials section renders sample cards clearly labelled "نموذج" until real ones are entered; production launch requires real ones (§12.4).
10. **Performance budgets are gates, not goals:** LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 at p75 on mobile; Lighthouse mobile Performance ≥ 90, Accessibility ≥ 95, SEO = 100 on every indexable page.
11. **Respect `prefers-reduced-motion`:** every animation has a reduced or static variant.
12. **No AI attribution in commits or PRs.** Commits are authored by Dhia's account; no "Co-Authored-By" trailers naming an AI, no "Generated with" lines.

### 0.5 Decision rules for agents

- If a visual detail is unspecified: choose the **quieter** option (less motion, less colour, less text) that stays consistent with §3.
- If a string is missing: reuse an existing string from §4 with the same intent; if none exists, write one in فصحى مبسطة following §4.1, mark it `TODO(copy)` in a code comment, and list it in the PR description for Dhia's review.
- If a technical choice is unspecified: prefer the boring, well-documented option already used in this document or in the B7R app (Next.js, Tailwind, shadcn/ui, Lucide, Resend, Turnstile).
- Never add features outside the current phase. Write the idea in `docs/IDEAS.md` instead.
- When this document conflicts with a research file in `docs/research`, this document wins. When it conflicts with reality (an asset is missing, a service is unavailable), stop and report; do not improvise around a missing asset by fabricating one.

### 0.6 Definitions

| Term | Meaning |
|---|---|
| Merchant / التاجر | The site's visitor and the app's user: someone who wants to sell printed products under their own brand. |
| End customer / العميل | The merchant's buyer. Never a target of this site. |
| Base cost / التكلفة الأساسية | What B7R charges the merchant per piece. Shown as "يبدأ من". |
| Selling price / سعر البيع | What the merchant charges in their own store. The merchant decides. |
| Profit / الربح | Selling price − base cost. Shipping and VAT are excluded from all site estimates. |
| The app | https://b7r.app, the SaaS where merchants register, design, connect stores, and manage orders. |
| Level / Phase | Level = a scope tier (1–4). Phase = a deliverable slice of a level with its own plan and review. |

---

## 1. Business context and positioning

### 1.1 What B7R is

B7R (بحر برنت, "Bahr Print"; بحر means sea, hence the wave logo) is a vertically integrated print-on-demand fulfilment platform based in Jeddah, Saudi Arabia. Merchants register on the app, upload designs onto blank products, publish them to their online stores (Salla, Zid, Shopify), and when a customer buys, the order flows to B7R automatically. B7R debits the merchant's prepaid wallet for the base cost plus shipping, then prints, packs, and ships **under the merchant's brand**. B7R is invisible to the end customer. Merchant profit = selling price − base cost − shipping. B7R earns its margin inside the base cost.

Facts the site relies on (verified against the app codebase on 2026-09-12; see `docs/research/01`):

| Fact | Value |
|---|---|
| Products | 5: تيشيرت أساسي, تيشيرت أوفرسايز, هودي, بربتوز أطفال, حقيبة قماشية |
| Base costs (SAR) | 45 · 55 · 95 · 35 · 30 |
| Suggested selling prices used on the site (SAR) | 89 · 119 · 189 · 69 · 65 |
| Print area | Front, 28 × 38 cm |
| Store integrations shown | Salla, Zid, Shopify, presented as available now (decision D-02; the app's Zid/Shopify flags must be ON at launch) |
| Welcome credit | 30 SAR, credited to the wallet after email verification |
| Delivery | Anywhere in Saudi Arabia, maximum 5 days from order receipt, printing included |
| Production location | Jeddah |
| Carrier | SMSA through the OTO aggregator (home delivery and branch pickup) |
| Payment logos to show | PayPal, Mastercard, Visa, Maestro, Apple Pay, mada, from `resources/brand/trust-badges/payment-methods/` |
| Trust badges | Saudi Business Center, Ministry of Commerce, Misk Foundation (Launchpad cohort 9, 2026) |
| Contact | WhatsApp and phone 0501699572 (`https://wa.me/966501699572`), contact@b7r.sa |
| Social | x.com/b7rprint · instagram.com/b7rprint · tiktok.com/@b7rprint |
| Legal entity | B7R Print Company, Jeddah. CR number not displayed for now. |
| App URLs | Register `https://b7r.app/register` · Login `https://b7r.app/login` |

### 1.2 Positioning statement

**For** Saudi creators, influencers, students, and existing Salla/Zid merchants who want to sell branded products without capital, stock, or logistics, **B7R** is the local print-on-demand platform that prints in Jeddah and delivers anywhere in the Kingdom within five days under the merchant's own brand, **unlike** Printful or Printify, which ship from abroad in two to four weeks with customs fees and no Salla or Zid integration.

Headline promise (hero slide 1): **علامتك التجارية تبدأ من قطعة واحدة**.

### 1.3 The three proof points every page reinforces

1. **بدون مخاطرة**: zero capital, zero stock, no minimum order, 30 SAR to start with.
2. **كل شيء تلقائي**: connect Salla, Zid, or Shopify in one click; orders sync and get fulfilled with no manual step.
3. **جودة محلية وسريعة**: printed in Jeddah, delivered anywhere in Saudi Arabia within 5 days, shipped under the merchant's brand.

### 1.4 Competitive landscape in one paragraph

Global players (Printful, Printify, Gelato) win on catalog size and polished profit-calculator UX but cannot serve a Saudi customer quickly or cheaply and do not integrate with Salla or Zid. The Saudi field is thin: one small POD app in the Salla store with zero reviews, and print shops that require quotes and minimums. Nobody in Saudi POD publishes prices. This site borrows the best UX from the global sites (profit calculator, explicit profit equation, numbered steps, integrations wall, short copy) and leads with local speed, published prices, and white-label proof. Details: `docs/research/03` and `06`.

### 1.5 Success metrics for the site

| Metric | Target, first 90 days after launch |
|---|---|
| Click-through to `b7r.app/register` | ≥ 8% of sessions |
| Mobile Lighthouse Performance | ≥ 90 on every indexable page |
| Sitemap pages indexed with zero errors in Search Console | 100% |
| Organic and AI-assistant referral sessions | Growing month over month (GA4 "AI Assistant" channel plus custom channel group, §7.7) |
| Contact-form submissions and WhatsApp clicks | Tracked as events; baseline established |

---

## 2. Audience and jobs to be done

### 2.1 Personas (Arabic-speaking, Saudi-based, mobile-first)

| Persona | Who | What they want from the site | Entry path on the site |
|---|---|---|---|
| **صاحب متجر سلة أو زد** | Already sells online (cafés, perfumers, gyms, fashion); wants merch without stock | Confirm the integration is real and one-click; see prices and delivery time | Integrations section → كيف نعمل → register |
| **المؤثر / صانع المحتوى** | Has an audience on Snapchat, TikTok, Instagram; wants a merch line | See the products, how a design looks on them, what they'd earn | Product strip → interactive mockup and profit → register |
| **المبتدئ** | Student or side-income seeker who searched "مشروع بدون رأس مال" | Understand the model in 30 seconds; feel it is safe and free | Hero → why us → FAQ → register; later the blog |
| **الشركات والجهات** (secondary) | Uniforms, events, corporate gifts | Know there is no minimum and someone to talk to | Contact page → WhatsApp or booking |

### 2.2 Objections the site must answer (evidence in `docs/research/06`)

| Objection | Where it is answered |
|---|---|
| "كم أحتاج أبدأ؟" | Hero chips, FAQ, CTA ribbon (30 SAR credit, no card) |
| "الطباعة بتكون رديئة؟" | Product pages (fabric weight in grams, print area in cm), video section, why-us |
| "يوصل متأخر؟" | Hero slide 3, why-us, FAQ, shipping page (5 days max) |
| "لازم أطلب كمية؟" | Why-us: بدون حد أدنى |
| "يعرف عميلي إنكم أنتم اللي طبعتوا؟" | FAQ, steps, product page (باسم متجرك) |
| "كم أربح فعلياً؟" | Interactive profit section, product page suggested price |
| "هل هم شركة حقيقية؟" | Footer badges (SBC, Ministry of Commerce, Misk), about page, real contact channels |

### 2.3 Device and network assumptions

Design for a mid-range Android phone on 4G first, then iPhone Safari, then desktop. Assume an Arabic keyboard, WhatsApp as the default contact channel, and that most visitors arrive from Instagram, TikTok, Snapchat, Google, or a Salla app-store listing.

---

## 3. Brand and design system

The site must feel premium, calm, and Saudi. Think of the restraint of Apple's product pages and Linear's marketing site, applied to an Arabic brand whose identity is the sea. White space does the work. One typeface, three blues, one radius, near-invisible shadows, and motion that you notice only when it is gone.

### 3.1 Brand essence and logo rules

- **Name:** Arabic بحر برنت, Latin B7R Print. In running Arabic text write بحر برنت. In UI, the logo lockup already contains both.
- **Motif:** the wave. It appears in the logo, the CTA ribbon edges, and the footer edge (§6.3). Nowhere else. Do not scatter wave shapes across sections.
- **Logo files:** `resources/brand/logo/logo.png` (colour, on white or off-white), `logo-white.png` (on the primary or dark blue), `icon.png` (favicon, app icon, avatar in the WhatsApp widget), `small-icon.png` (16–32 px contexts). PNG only for now; export at 1x and 2x. Never recolour, stretch, rotate, outline, or add shadows or gradients to the logo.
- **Clear space:** at least the height of the "7" glyph on all sides. Minimum width 120 px for the lockup, 24 px for the icon.

### 3.2 Colour tokens

All three brand blues are sampled from `logo.png`. Two darker shades are derived from the same hue for hover states and dark surfaces. Define them as CSS custom properties in `@theme` (Tailwind 4) and never use raw hex in components.

| Token | Hex | Use |
|---|---|---|
| `--color-primary` | `#0058B0` | Buttons, links, active nav underline, key numbers, section eyebrows |
| `--color-primary-hover` | `#004A94` | Hover and pressed states of primary elements (derived, same hue) |
| `--color-primary-dark` | `#1858A8` | Secondary blue from the logo: dark blue text on light tints, icon strokes on white |
| `--color-navy` | `#0A2F5E` | Footer background, dark ribbon variant, hero text on light photos when extra contrast is needed (derived) |
| `--color-accent` | `#0098E0` | The light blue. Accent only: highlighted words in headings, icon fills inside tint circles, focus rings, active step indicator, wave shapes. **Not for body text on white** (contrast 3.5:1). Allowed for text at ≥ 24 px bold or on navy/primary backgrounds. |
| `--color-accent-tint` | `#E6F5FC` | 10% tint of the accent: icon circles, chip backgrounds, table header rows |
| `--color-ground` | `#F6F8FB` | Page background for alternating sections (very light cool grey) |
| `--color-surface` | `#FFFFFF` | Cards, header, panels |
| `--color-text` | `#14181F` | Body and headings |
| `--color-text-muted` | `#5B6470` | Secondary text, captions, placeholders (4.6:1 on white) |
| `--color-border` | `#E5E9EF` | Hairlines, card borders, input borders |
| `--color-success` | `#15803D` | Form success, positive profit; 4.7:1 on `ground`, 5:1 on `surface` (AA for the profit line) |
| `--color-warning` | `#F59E0B` | Non-blocking warnings |
| `--color-error` | `#D90000` | Validation errors, negative profit |
| `--color-whatsapp` | `#25D366` | The WhatsApp widget button only |

Rules: primary text on white and white text on primary both pass AA. Never place accent-coloured small text on white. Never introduce purple, pink, teal, magenta, orange, or gradients between hues. A single flat colour per surface. The only permitted gradient is a white-to-transparent overlay on hero photos for legibility (§6.4.1). *Amended 2026-09-17 (Dhia, ADR-054): one more, between the brand's own two blues: the main call-to-action buttons' sheen (`Button` variants `shiny` and, on the primary ribbon, `inverseShiny`), on only when the admin's site-wide "Shiny buttons" switch (Site settings → Brand) is ticked.*

### 3.3 Typography

- **Family:** ITF Rayat Round, self-hosted from `resources/brand/fonts/web/ITFRayatRound-{Light,Regular,Medium,Bold,Black}.woff2`. B7R holds the web licence. Serve only from b7r.sa. Fallback stack: `"ITF Rayat Round", system-ui, -apple-system, "Segoe UI", Tahoma, sans-serif`.
- **Loading:** `@font-face` with `font-display: swap` and `size-adjust` on the fallback to keep CLS ≤ 0.1. The served files are subsets of the licensed woff2 (Arabic, Basic Latin, punctuation; ≈ 27 kB each, `scripts/subset-fonts.sh`). Preload the weights painted above the fold: Regular and Medium on every page, plus Black on the home page (hero H1) and Bold on pages whose H1 is Bold. Light loads lazily. (Amended 2026-09-13, ADR-010: measured mobile Lighthouse 82 → 90.)
- **Weights and roles:** Black 900 hero display only · Bold 700 H1–H3 · Medium 500 H4, nav, buttons, labels, chips · Regular 400 body · Light 300 large pull-quotes only.
- **Scale (fluid, `clamp()`):**

| Role | Size | Line height | Weight |
|---|---|---|---|
| Display (hero H1) | clamp(40px, 6vw, 72px) | 1.15 | 900 |
| H1 (page titles) | clamp(32px, 4.5vw, 52px) | 1.2 | 700 |
| H2 (section titles) | clamp(28px, 3.5vw, 40px) | 1.2 | 700 |
| H3 | clamp(22px, 2.5vw, 28px) | 1.3 | 700 |
| H4 | 20px | 1.4 | 500 |
| Lead paragraph | clamp(17px, 1.6vw, 20px) | 1.7 | 400 |
| Body | 17px (16px on ≤ 360 px screens) | 1.75 | 400 |
| Small | 15px | 1.6 | 400 |
| Caption / eyebrow | 13px, eyebrow in Medium and primary colour | 1.5 | 500 |
| Button | 16px (md), 17px (lg) | 1 | 500 |

- **Arabic setting rules:** no letter-spacing changes, no all-caps equivalents, no justified text, `text-align: start`. Max measure 60–65 Arabic characters per line (`max-width: 38rem` for body blocks). Headings may break on natural word boundaries only; never hyphenate. Numbers inside Arabic sentences are wrapped in `<bdi>` or `<span dir="ltr">` when they carry symbols (prices, phone numbers, emails, URLs).
- **Latin text** (brand names such as Salla, Zid, Shopify, PayPal, WhatsApp): keep Latin where §4 keeps it; otherwise use the Arabic name given in §4.2.

### 3.4 Spacing, layout, grid

- Base unit 4 px. Component spacing uses 8, 12, 16, 24, 32, 48, 64, 96.
- Container: max-width 1280 px, side padding 24 px (16 px below 640 px). Content max-width for text-heavy pages (legal, blog posts): 760 px.
- Section vertical rhythm: 96 px top and bottom on desktop, 64 px on mobile. Adjacent sections alternate `surface` and `ground` backgrounds; never two `ground` sections in a row.
- Grid: 12 columns, 24 px gutters on desktop; single column below 768 px; two columns for cards between 768 and 1024 px.
- Breakpoints (Tailwind defaults): sm 640, md 768, lg 1024, xl 1280. Mobile-first.

### 3.5 Radius

One family. `--radius: 13px` (0.8rem) for buttons, inputs, cards, chips' containers, dialogs, the video frame, product cards. `--radius-lg: 20px` for large media containers only (hero slide cards on mobile, the interactive canvas frame). `--radius-pill: 999px` for chips, tags, and the WhatsApp button. `--radius-inner: 6px` for elements nested inside a 13 px surface (thumbnails inside cards, swatches). Do not mix radii within one component.

### 3.6 Shadows and borders

Shadows are nearly invisible and cool-toned. Prefer a 1 px `--color-border` hairline over a shadow for resting cards.

```
--shadow-card:       0 1px 2px rgba(20,24,31,.06), 0 1px 3px rgba(20,24,31,.04);
--shadow-card-hover: 0 4px 12px rgba(20,24,31,.08);
--shadow-popover:    0 8px 24px rgba(20,24,31,.12);
--shadow-header:     0 1px 0 rgba(20,24,31,.06);
```

### 3.7 Motion

Motion is a signal, not decoration. Defaults:

| Token | Value |
|---|---|
| `--duration-fast` | 150 ms (hover colour, focus) |
| `--duration-base` | 200 ms (buttons, chips, accordion) |
| `--duration-slow` | 300 ms (menu, dialogs, burger morph) |
| `--duration-slower` | 500 ms (product strip expand, hero crossfade 700 ms) |
| `--ease-standard` | cubic-bezier(.4, 0, .2, 1) |
| `--ease-exit` | cubic-bezier(.4, 0, 1, 1) |
| `--ease-expand` | cubic-bezier(.2, .8, .2, 1) (product strip only) |

Scroll-reveal: elements fade up 12 px over 400 ms, once, when 20% visible, staggered 60 ms inside a group. *Amended 2026-09-18 (Dhia, ADR-055): every `Section` reveals by default, on every page, present and future (`reveal={false}` opts out: the hero, a section holding a fixed child); a grid marks `data-reveal-stagger` and its children stagger; one inline observer at the end of the body arms them, hides only what is below the fold (the first paint and the LCP are never touched) and reveals as they enter; nothing hides without JavaScript or under reduced motion.* No parallax, no scroll-jacking, no bouncing, no continuous background animations except the wave shapes (§6.3.4), which move slowly (20 s loop) and stop under reduced motion. Number changes (profit calculator) count up over 300 ms. Use the `motion` library (the successor of framer-motion) or CSS transitions; keep bundle impact minimal.

Under `prefers-reduced-motion: reduce`: disable auto-advance, parallax-like effects, waves, stagger, and count-ups; keep opacity transitions ≤ 150 ms.

Amended 2026-09-13 (ADR-037): the marketing video in §6.4.5 is the second continuous animation, a muted, decorative loop mounted near the viewport with the poster under reduced motion and Save-Data. The how-it-works journey (§6.7) fills its path with a CSS scroll-driven progress line, full and static where unsupported and under reduced motion (`animation: none`: scroll-driven progress ignores the global 0.01 ms duration).

### 3.8 Iconography and illustration

- UI icons: **Lucide** (`lucide-react`), 24 px, 1.75 px stroke, colour inherits. Directional icons (`ArrowLeft/Right`, `ChevronLeft/Right`) must be mirrored in RTL: use the RTL-aware wrapper component `Icon` that flips `ArrowRight` to `ArrowLeft` when `dir="rtl"`, or use `ArrowUpRight`-style icons that need no flip.
- Feature illustrations: the six 3D icons in `resources/icons-3d/` (blue background). Use them large (≥ 160 px) in the steps section and how-it-works page. Crop the square blue background into a rounded 20 px container; do not place them on the primary blue (same colour, no contrast).
- No emoji in UI, with one exception: the WhatsApp widget greeting may contain 👋.
- No raster icons, no icon fonts, no icon packs mixed with Lucide.

### 3.9 Imagery rules

- **Product photos:** `resources/products/*` on a neutral light-grey studio background; always show the front view in cards, front and back on the product page.
- **Hero photos:** real people wearing the products, neutral white or light-grey studio set, product cluster occupying the lower and left 60% of the frame, the right 40% calm enough to carry text. Current files in `resources/hero/examples/` are AI-generated placeholders; treat them as stand-ins with the exact same composition rules. Desktop 16:9 at ≥ 1920 px wide; mobile 4:5 at ≥ 1080 px wide (crop from the same shot centred on the product cluster).
- **Lifestyle mockups** (`resources/lifestyle-mockups/`): decorative only, allowed on the about page, blog posts, and the how-it-works page. Never presented as sellable products.
- **Alt text** is meaningful Arabic ("تيشيرت أساسي أسود، الواجهة الأمامية"). Decorative images get `alt=""`.
- **Formats:** serve AVIF/WebP through `next/image` with `sizes` on every image; hero LCP image gets `preload`.

### 3.10 Component inventory (build these once, reuse everywhere)

`Button` (variants primary, secondary [white with primary border], ghost, link, shiny and inverseShiny [the sheen, ADR-054, the site-wide admin switch]; sizes md 44 px, lg 52 px; optional trailing arrow icon mirrored in RTL; loading state) · `Chip` (pill, optional check icon) · `Badge` (tint background, 10% colour rule: `bg-{color}/10 text-{color} border-{color}/20`) · `Card` · `SectionHeader` (eyebrow + H2 + lead, start-aligned) · `Accordion` (single-open, chevron rotates, `aria-expanded`) · `Input`, `Textarea`, `Select`, `Stepper` (numeric with +/−), `Slider` · `Dialog` · `Toast` · `SarAmount` (§3.11) · `ProductCard` · `WaveDivider` · `CtaRibbon` · `WhatsAppWidget` · `ConsentBar` · `VideoPlayer` · `Breadcrumbs` · `Icon` (RTL-aware Lucide wrapper) · `Container`, `Section`.

Use shadcn/ui primitives (Radix) for Accordion, Dialog, Select, Slider, Toast, and Tabs; restyle them to these tokens. Do not ship shadcn's default look.

### 3.11 Money, numbers, and the riyal symbol

- `SarSymbol`: an inline SVG of the official Saudi Central Bank riyal symbol, `fill="currentColor"`, `height="0.85em"` (amended 2026-09-13, ADR-038: a touch smaller than the digits), `aria-label="ريال سعودي"`. Source the official path from the Saudi Central Bank's published symbol package (or trace it from the official SVG); do not use a Unicode character or a font.
- `SarAmount value={89}` renders `<bdi dir="ltr"><SarSymbol/> 89</bdi>` with the symbol **always to the left of the digits**, a thin space between, digits in tabular figures. Integers render without decimals; non-integers with two decimals. Amended 2026-09-13 (ADR-038): every displayed number, amounts, the calculator's figures, stats, carries thousands separators (`13,200`) through one `formatNumber` helper; form inputs never receive grouped strings.
- Prose that spells the currency ("30 ريالاً") is used only where §4 spells it out; everywhere numbers appear as amounts (cards, calculator, tables) use `SarAmount`.
- Phone numbers, emails, and URLs are rendered LTR inside `<bdi>`.

### 3.12 RTL implementation rules

1. `dir="rtl" lang="ar"` on `<html>`; never on `<body>`, never via CSS `direction`.
2. Only logical CSS: `margin-inline-*`, `padding-inline-*`, `inset-inline-*`, `border-inline-*`, `text-align: start|end`. Tailwind: `ms- me- ps- pe- start- end- text-start text-end rounded-s rounded-e`. A lint rule (§8.8) forbids the physical utilities.
3. Flex and grid follow the document direction automatically; do not add `flex-row-reverse` to "fix" RTL.
4. Carousels, sliders, and progress bars advance from right to left. Dot indicators start at the right.
5. Form inputs are RTL; email, URL, phone, and code inputs use `dir="ltr"` with `text-align: start` so the caret sits correctly.
6. Mirrored icons: arrows, chevrons, "external link", "undo/redo". Not mirrored: checkmarks, play, close, search, WhatsApp, social logos.
7. Shadows and gradients that imply light direction stay symmetric.
8. Test every page in Chrome Android and iOS Safari with an Arabic UI; look for stray LTR punctuation at line ends, misplaced parentheses, and numbers split across lines.

### 3.13 Accessibility baseline

WCAG 2.2 AA. Visible focus ring: 2 px `--color-accent` with 2 px offset. Touch targets ≥ 44 × 44 px. A skip link "تخطَّ إلى المحتوى" as the first focusable element. Landmarks (`header`, `nav`, `main`, `footer`). Accordion, dialog, carousel, and menu follow WAI-ARIA patterns. Colour is never the only carrier of meaning. All motion honours reduced motion. Videos have a poster and controls. Forms label every field; errors are announced with `aria-live="polite"`.

### 3.14 Don'ts (the "AI-generated look" checklist)

No hue gradients, no glassmorphism, no glow, no neon, no rainbow text, no oversized emoji, no three-column icon grids with identical generic icons, no Latin filler placeholder text anywhere, no centred long paragraphs, no more than one accent colour, no stock "your logo here" mockups, no decorative blobs, no parallax hero, no auto-playing sound, no cookie walls, no pop-ups on entry, no fake urgency counters, no fake reviews.

---

## 4. Voice, terminology, and the copy bank

Writing rule (Dhia, 2026-09-13, ADR-040): no em dashes in any copy, search title or description, admin string or e-mail. Arabic uses «،» or a colon; English a comma, a colon or a new sentence. `pnpm check:dash` enforces it.

Every user-visible string in Level 1 is here. Copy it exactly, including punctuation. Strings in `{braces}` are variables. Where a string depends on a product, see Appendix A.

**Reading this section:** where a line reads `Title: text`, the colon is markdown structure separating a heading from its body text; it is never rendered on screen. The middle dot `·` between list items likewise means "separate elements", not a character to display. Arabic on-screen copy never contains an em dash (§4.1).

### 4.1 Voice and writing rules (for the rare new string)

- Register: **فصحى مبسطة** with a light, warm Saudi tone. Direct, numeric, confident. Entrepreneur to entrepreneur.
- Verbs first for actions ("ارفع تصميمك"), nominal phrases for headings and labels ("منطقة الطباعة").
- Never: قم بـ / القيام بـ, تم + مصدر, يرجى on routine instructions, بنجاح after obvious success, الخاص بك, هناك at sentence start, بشكل + adjective, English-order sentences, slashes for alternatives (use أو), decorative punctuation, em dashes.
- Gender: masculine imperative addressed to the merchant. Consistent everywhere.
- Numbers: Western digits. Currency amounts through `SarAmount`; in prose "30 ريالاً" where written so.
- Arabic comma «،» inside Arabic sentences. Question mark «؟». No exclamation marks except in the 404 page and the WhatsApp greeting.
- Length: buttons 1–3 words, titles 2–6 words, lead lines ≤ 15 words, FAQ answers ≤ 35 words.

### 4.2 Terminology (one term per concept)

| Concept | Use | Do not use |
|---|---|---|
| The service | الطباعة عند الطلب (in SEO text also "طباعة حسب الطلب" once per page) | برنت أون ديماند, طباعة تحت الطلب |
| The company | بحر برنت, or بحر in short friendly mentions | B7R alone in Arabic prose |
| The merchant's site | متجرك | موقعك, المتجر الإلكتروني الخاص بك |
| Platforms | سلة · زد · شوبيفاي | Salla/Zid/Shopify in Arabic prose (logos may show Latin) |
| Products | تيشيرت أساسي · تيشيرت أوفرسايز · هودي · بربتوز أطفال · حقيبة قماشية | قميص, سترة, شنطة |
| Money | التكلفة (من بحر) · سعر البيع · ربحك · المحفظة · رصيد ترحيبي | السعر الأساسي, الرسوم |
| Brand | براندك (CTA only, per Dhia) · علامتك التجارية (prose) | ماركتك |
| Register | أنشئ حسابك / ابدأ براندك مجاناً | سجّل الآن (allowed only in the ribbon lead) |
| Delivery | التوصيل, نوصّل | الشحن as the customer-facing verb (use شحن for the act B7R does) |

### 4.3 Global elements

**Navigation (in order, RTL start to end):** الرئيسية · المنتجات · كيف نعمل · من نحن · المدونة · تواصل معنا
**Header CTA:** ابدأ براندك مجاناً → `https://b7r.app/register?utm_source=b7r.sa&utm_medium=website&utm_campaign=header`
**Header secondary:** none. *Amended 2026-09-14 (Dhia, ADR-044): the login link is gone from the header, the menu and the CMS; the language switch (an icon, §6.2) sits before the CTA.*
**Skip link:** تخطَّ إلى المحتوى
**Menu button labels (aria):** فتح القائمة / إغلاق القائمة
**WhatsApp line (the error pages; the menu shows the icon, §6.2):** تواصل معنا عبر واتساب

### 4.4 Homepage

**Hero slides (image + headline + subline; 4 slides):**

| # | Headline (H1 on slide 1; H2-styled display on others) | Subline |
|---|---|---|
| 1 | علامتك التجارية تبدأ من قطعة واحدة | صمّمها وبِعها، ونحن نطبع ونشحن باسمك. |
| 2 | بدون رأس مال، بدون مخزون | نطبع فقط عند وصول الطلب، وتربح من أول قطعة. |
| 3 | من جدة إلى كل المملكة خلال 5 أيام | إنتاج محلي وشحن سريع، بدون جمارك ولا انتظار. |
| 4 | متجرك في سلة أو زد؟ اربطه بضغطة | الطلبات تصلنا تلقائياً، وتوصل عميلك باسم متجرك. |

**Hero primary CTA:** ابدأ براندك مجاناً → register URL with `utm_campaign=hero`
**Hero secondary CTA (text link with mirrored arrow):** استكشف المنتجات → `/products`
**Hero microcopy under the buttons:** رصيد ترحيبي 30 ريالاً، بدون بطاقة *(2026-09-13, Dhia: not shown in the hero any more; the line stays in the CMS for the About facts band)*
**Hero proof chips (0 to 6, with check icons; the seed ships 3):** مجاني 100% · بدون حد أدنى للطلبات · توصيل لكل المملكة خلال 5 أيام
**Slide indicator aria:** الشريحة {n} من 4 · **Pause aria:** إيقاف التبديل التلقائي / استئناف التبديل التلقائي

**Product strip section**
- Eyebrow: المنتجات
- H2: بحر من المنتجات
- Lead: بِعها في متجرك بدون أي مخزون.
- Card hover label: `{productName}` and price pill: يبدأ من `{SarAmount base}`
- Button: تصفح كل المنتجات → `/products`

**Interactive mockup and profit section**
- Eyebrow: جرّب بنفسك
- H2: شاهد تصميمك واحسب ربحك
- Lead: ارفع تصميمك، حرّكه على المنتج، وحدّد سعرك.
- Group labels: المنتج · اللون · التصميم · التسعير *(2026-09-13: «التسعير» no longer shown)*
- Upload button: ارفع تصميمك
- Upload helper: none (Dhia, 2026-09-14: the accepted types are not listed; a wrong file gets the error line)
- Sample design button: جرّب تصميماً جاهزاً *(removed 2026-09-13)*
- Replace design: غيّر التصميم
- Reset: إعادة الضبط
- Canvas hint (shown once, dismisses on first drag): اسحب التصميم لتحريكه، واستخدم الزوايا لتغيير الحجم.
- Base cost label: التكلفة من بحر
- Selling price label: سعر البيع في متجرك
- Recommended price helper: السعر المقترح `{SarAmount suggested}`
- Daily sales label: مبيعات يومية
- Result labels: ربحك لكل قطعة · ربحك الشهري التقديري
- Negative-profit warning: سعر البيع أقل من التكلفة. ارفع السعر لتربح.
- Footnote: تقدير لا يشمل الشحن والضريبة. *(removed 2026-09-13)*
- Section CTA: ابدأ بيع هذا المنتج → register URL with `utm_campaign=designer&product={slug}`
- File error: الملف غير مدعوم أو أكبر من 10 ميجابايت.

**Three steps section**
- Eyebrow: كيف نعمل
- H2: ثلاث خطوات وتبدأ
- Steps:
  1. صمّم منتجك: ارفع تصميمك وشاهده على المنتج فوراً.
  2. اربط متجرك: سلة أو زد أو شوبيفاي بضغطة واحدة.
  3. نطبع ونشحن: كل طلب يصلنا تلقائياً ويوصل عميلك باسم متجرك.
- Link under the steps: اعرف أكثر عن طريقة العمل → `/how-it-works`

**Video section**
- H2: شاهد كيف نطبع طلبك
- Lead: من ملف التصميم إلى الطرد الجاهز، كل شيء يحدث عندنا في جدة.
- Play button aria: تشغيل الفيديو

**Why us section**
- Eyebrow: لماذا بحر
- H2: لماذا يختارنا التجار؟
- Cards:
  1. بدون مخاطرة: صفر رأس مال، صفر مخزون، بدون حد أدنى للطلبات.
  2. كل شيء تلقائي: الطلبات تتزامن من متجرك وتُنفّذ بدون تدخل منك.
  3. جودة محلية وسريعة: طباعة في جدة وتوصيل لكل المملكة خلال 5 أيام.

**Testimonials section**
- Eyebrow: آراء التجار
- H2: تجار بدأوا معنا
- Sample cards (render only while `testimonials.placeholder = true`; each card carries a visible tag **نموذج** and the whole section is hidden in production until real content exists):
  1. «نموذج»: "ربطت متجري في سلة خلال دقائق، وأول طلب وصل عميلي خلال أربعة أيام.": اسم التاجر، اسم المتجر
  2. «نموذج»: "بدأت بدون أي مخزون، والآن عندي 12 تصميماً تبيع كل أسبوع.": اسم التاجر، اسم المتجر
  3. «نموذج»: "جودة الطباعة أفضل مما توقعت، والتغليف باسم متجري.": اسم التاجر، اسم المتجر

**Integrations section**
- H2: اربط متجرك بضغطة واحدة
- Lead: الطلبات تتزامن تلقائياً من متجرك إلى بحر.
- Tiles: سلة · زد · شوبيفاي, each with the tag متاح الآن
- Tile aria: ربط متجر {platform}

**FAQ section (5)**
- H2: الأسئلة الشائعة
- Items:
  1. كم أحتاج لأبدأ؟: لا شيء. تسجّل مجاناً وتحصل على 30 ريالاً رصيداً ترحيبياً.
  2. كيف أربح؟: تحدّد سعر البيع في متجرك. عند كل طلب نخصم تكلفة المنتج والشحن من محفظتك، والباقي ربحك.
  3. هل يعرف عميلي أن الطباعة من بحر برنت؟: لا. الطرد وبوليصة الشحن باسم متجرك فقط.
  4. كم يستغرق التوصيل؟: 5 أيام كحد أقصى لأي مدينة في السعودية.
  5. ما المتاجر التي أقدر أربطها؟: سلة وزد وشوبيفاي، والربط مجاني.
- Link: كل الأسئلة → `/faq`

**CTA ribbon (on every page, before the footer)**
- H2: ابدأ اليوم واحصل على 30 ريالاً رصيداً ترحيبياً
- Lead: سجّل مجاناً بدون بطاقة، وأطلق أول منتج خلال دقائق.
- Button: ابدأ براندك مجاناً → register URL with `utm_campaign=ribbon&utm_content={page}`

### 4.5 Footer

- Tagline under the white logo: منصة الطباعة عند الطلب في السعودية
- Column 1 title: روابط; items: الرئيسية · المنتجات · كيف نعمل · من نحن · المدونة · تواصل معنا
- Column 2 title: السياسات; items: الشروط والأحكام · الشحن والتوصيل · سياسة الخصوصية · الأسئلة الشائعة
- Column 3 title: النشرة البريدية; label: اشترك ليصلك الجديد; placeholder: name@example.com; button: اشترك; success: اشتركت. سنرسل لك الجديد فقط.; error: أدخل بريداً إلكترونياً صحيحاً.
- Contact line: contact@b7r.sa · 0501699572 (both LTR inside `<bdi>`; the number links to `tel:+966501699572`)
- Social aria labels: بحر برنت على X · بحر برنت على إنستغرام · بحر برنت على تيك توك · بحر برنت على واتساب
- Badges row caption (visually hidden, aria): وسائل الدفع وجهات التوثيق
- Misk line next to the Misk logo: خريجو برنامج Misk Launchpad، الدفعة 9، 2026 *(removed 2026-09-13; the logo stays)*
- Copyright: © {year} بحر برنت. جميع الحقوق محفوظة.

### 4.6 WhatsApp widget

- Floating button aria: تواصل معنا عبر واتساب
- Popup header title: بحر برنت; subtitle: فريق الدعم
- Greeting bubble: أهلاً 👋 كيف نقدر نساعدك؟
- Action button: ابدأ المحادثة
- Prefilled message: مرحباً، أرغب بمعرفة المزيد عن بحر برنت.
- Close aria: إغلاق

### 4.7 Consent bar

- Text: نستخدم ملفات تعريف الارتباط لتحسين تجربتك وقياس أداء الموقع.
- Buttons: موافق · رفض
- Link: سياسة الخصوصية → `/privacy`

### 4.8 Products pages

**Listing `/products`**
- H1: المنتجات
- Lead: منتجات بجودة عالية، تُطبع عند الطلب وتُشحن باسم متجرك.
- Card: `{name}` · يبدأ من `{SarAmount base}` · colour dots · sizes summary (e.g. S – 2XL)

**Detail `/products/{slug}`**
- Breadcrumb: الرئيسية › المنتجات › `{name}`
- H1: `{name}`
- Price block: التكلفة تبدأ من `{SarAmount base}` · سعر بيع مقترح `{SarAmount suggested}` · ربحك التقديري `{SarAmount suggested − base}` لكل قطعة
- Price footnote: تقدير لا يشمل الشحن والضريبة. أنت تحدّد سعر البيع. *(removed 2026-09-13)*
- Primary CTA: ابدأ بيع هذا المنتج → register URL with `utm_campaign=product&utm_content={slug}`
- Secondary link: جرّب تصميمك عليه → `/#designer?product={slug}`
- Section titles: الوصف · المواصفات · جدول المقاسات · منتجات أخرى *(2026-09-13: «الوصف» has no section of its own; the full description sits under the product name)*
- Spec labels: الخامة · الوزن · المقاسات · الألوان · منطقة الطباعة · طريقة الطباعة
- Print method value (all products): طباعة رقمية عالية الجودة
- Print area value: الواجهة الأمامية، 28 × 38 سم
- Size chart headers: المقاس · الطول · عرض الصدر · طول الكم (cm; see Appendix A)
- Size chart unit line (visible above the table, *2026-09-18*): القياسات بالسنتيمتر
- Colour switch aria: اللون {colour}
- Gallery aria: صورة {n} من {total}

### 4.9 How it works page `/how-it-works`

- H1: كيف تعمل الطباعة عند الطلب مع بحر؟
- Lead: نموذج عمل يتيح لك بيع منتجات مخصصة دون أن تطبعها أو تخزنها.
- Steps (5, each with a 3D icon):
  1. أنشئ حسابك مجاناً: سجّل خلال دقيقة واحصل على 30 ريالاً رصيداً ترحيبياً.
  2. اختر منتجك وصمّمه: ارفع تصميمك وشاهده على المنتج مباشرة، وحدّد سعر البيع.
  3. اربط متجرك: سلة أو زد أو شوبيفاي، بربط آمن وبدون مشاركة أي بيانات حساسة.
  4. انشر المنتج بضغطة: يُزامَن الاسم والصور والخيارات والسعر إلى متجرك تلقائياً.
  5. نطبع ونغلّف ونشحن: كل طلب يصلنا فور شرائه، نخصم التكلفة من محفظتك، ونشحنه باسم متجرك خلال 5 أيام كحد أقصى.
- Profit block title: كيف تُحسب أرباحك؟
- Equation tiles: سعر البيع − التكلفة الأساسية = ربحك
- Equation example line: مثال: تيشيرت تبيعه بـ 89 وتكلفته 45، ربحك 44 لكل قطعة. (render the three numbers with `SarAmount`)
- Mini FAQ: reuse homepage FAQ items 2, 3, 4.
- CTA ribbon as usual.

### 4.10 About page `/about`

- H1: من نحن
- Story title: حكاية بدأت بتحدٍّ وتحوّلت إلى فرصة
- Story: وُلدت بحر برنت من تجربة مصمم حاول إطلاق علامته التجارية، فاصطدم بتكاليف مرتفعة وتعقيدات لوجستية عطّلت حلمه. تحوّل التحدي إلى فرصة لبناء حل محلي يفتح الباب لكل مبدع ورائد أعمال ليطلق منتجاته بأقل التكاليف. اليوم، بحر برنت منصة سعودية متكاملة تمكّن المؤثرين والمصممين وأصحاب الأفكار من تحويل إبداعاتهم إلى منتجات حقيقية تصل إلى عملائهم بسهولة واحترافية.
- Cards:
  - رسالتنا: تمكين أي شخص من إطلاق علامته التجارية بسهولة، عبر خدمة محلية للطباعة عند الطلب تشمل المنتجات والطباعة والتغليف والشحن، مع ربط ذكي بمتجره.
  - رؤيتنا: أن نكون الشريك الأول للمبدعين ورواد الأعمال في السعودية والخليج لإطلاق منتجاتهم المطبوعة، وأن نسهم في اقتصاد إبداعي مستدام يقوم على حلول تقنية محلية.
  - قيمنا: الإبداع الذي يحوّل الأفكار إلى منتجات، والتمكين الذي يمنح كل مبدع بداية بلا مخاطرة، والجودة التي نلتزم بها في الطباعة والتغليف.
- Misk block title: خريجو برنامج Misk Launchpad
- Misk block text: بحر برنت من خريجي الدفعة التاسعة (2026) من برنامج Misk Launchpad، برنامج ما قبل التسريع من مؤسسة محمد بن سلمان «مسك».
- Location line: نطبع ونشحن من جدة إلى كل مدن المملكة.

### 4.11 Contact page `/contact`

- H1: تواصل معنا
- Lead: تاجر، شريك، أو مستثمر؟ نرد على الجميع.
- Form labels: الاسم · رقم الجوال · البريد الإلكتروني · نوع الاستفسار · رسالتك
- Placeholders: (name) اسمك الكامل · (phone) 05XXXXXXXX · (email) name@example.com · (message) اكتب رسالتك هنا
- Inquiry options: تاجر · شراكة · استثمار · أخرى
- Submit: أرسل الرسالة
- Sending state: جارٍ الإرسال
- Success: وصلتنا رسالتك. سنرد عليك قريباً.
- Failure: تعذّر الإرسال. حاول مرة أخرى أو راسلنا على واتساب.
- Validation: أدخل اسمك · أدخل رقم جوال صحيح · أدخل بريداً إلكترونياً صحيحاً · اختر نوع الاستفسار · اكتب رسالتك
- Contact cards: واتساب; راسلنا مباشرة · البريد الإلكتروني: contact@b7r.sa · الهاتف: 0501699572 · تابعنا: (social icons)
- Booking card title: احجز استشارة مجانية
- Booking card text: 30 دقيقة نجاوب فيها على أسئلتك ونساعدك تبدأ.
- Booking button: احجز موعدك (opens `bookingUrl`; if unset, opens WhatsApp with the message: مرحباً، أرغب بحجز استشارة مجانية.)

### 4.12 FAQ page `/faq`

- H1: الأسئلة الشائعة
- Lead: كل ما تحتاج معرفته قبل أن تبدأ.
- Groups and items: Appendix D.
- Bottom line: لم تجد إجابتك؟ راسلنا على واتساب.

### 4.13 Blog `/blog` (Level 1 placeholder)

- H1: مدونة بحر
- Lead: أدلة عملية لبدء براندك وبيع منتجاتك المطبوعة في السعودية.
- Hub names (6): البداية · أساسيات الطباعة عند الطلب · سلة وزد وشوبيفاي · التصميم · التسعير والربح · المواسم
- Post meta: كتبه {author} · {date} · {n} دقائق قراءة (*amended 2026-09-18: `{author}` is the name on the post's author record, the same name the author card, the feed and the JSON-LD carry; it read «ضياء» as a fixed word before*)
- Key takeaways box title: أهم النقاط
- Related title: مقالات ذات صلة
- Share: شارك
- In-post CTA block: title ابدأ براندك اليوم; text بدون رأس مال وبدون مخزون.: button ابدأ براندك مجاناً
- Placeholder posts (3, marked as samples in the CMS data, real content to come in Level 3):
  1. كيف تبدأ براند ملابس في السعودية بدون مصنع وبدون مخزون
  2. ما هي الطباعة عند الطلب؟ شرح مبسط بالأمثلة السعودية
  3. كيف تسعّر تيشيرت مطبوع في السعودية؟

### 4.14 Legal pages

- Titles: الشروط والأحكام · الشحن والتوصيل · سياسة الخصوصية
- Updated line: آخر تحديث: {date}
- Bodies: Appendix B, verbatim.

### 4.15 404 page

- H1: الصفحة غير موجودة
- Text: يبدو أن الرابط تغيّر أو حُذف.
- Button: العودة للرئيسية

### 4.16 SEO titles and descriptions (Arabic; the brand suffix is added by the template as « | بحر برنت»)

The English titles and descriptions (suffix ` | B7R Print`) are the `seo` rows of Appendix I and the English `seo-defaults` values the seed writes (Level 5, ADR-043).

| Page | `<title>` (without suffix) | Meta description |
|---|---|---|
| Home | بحر برنت: منصة الطباعة عند الطلب في السعودية | ابدأ براندك بدون رأس مال أو مخزون. صمّم منتجاتك، اربط متجرك في سلة أو زد أو شوبيفاي، ونحن نطبع في جدة ونشحن باسمك خلال 5 أيام. |
| Products | منتجات الطباعة عند الطلب | تيشيرتات، هودي، بربتوز أطفال، وحقائب قماشية تُطبع عند الطلب وتُشحن باسم متجرك. الأسعار تبدأ من 30 ريالاً. |
| Product (each) | {name} للطباعة عند الطلب | {short description}. التكلفة تبدأ من {base} ريالاً، بدون حد أدنى، وشحن باسم متجرك. |
| How it works | كيف تعمل الطباعة عند الطلب مع بحر | خمس خطوات من إنشاء الحساب إلى وصول الطلب لعميلك: صمّم، اربط متجرك، انشر، ونحن نطبع ونشحن باسمك. |
| About | من نحن | قصة بحر برنت، أول منصة سعودية للطباعة عند الطلب، من خريجي برنامج Misk Launchpad. |
| Contact | تواصل معنا | راسلنا على واتساب أو البريد، أو احجز استشارة مجانية لمدة 30 دقيقة. |
| FAQ | الأسئلة الشائعة عن الطباعة عند الطلب | إجابات مباشرة عن التكلفة والربح والتوصيل وربط المتاجر مع بحر برنت. |
| Blog | مدونة بحر | أدلة عملية لبدء براندك وبيع المنتجات المطبوعة في السعودية: التسعير والربح وربط متجرك بسلة وزد وشوبيفاي. |
| Terms | الشروط والأحكام | شروط استخدام منصة بحر برنت: التسجيل والطلبات والأسعار والدفع وحقوق التصاميم والإلغاء. |
| Shipping | الشحن والتوصيل | سياسة الشحن والتوصيل في بحر برنت داخل المملكة: التوصيل خلال 5 أيام، ومحاولات التسليم، والتعويض خلال 10 أيام من الاستلام. |
| Privacy | سياسة الخصوصية | كيف نجمع بياناتك ونستخدمها ونحميها في بحر برنت، ومدة الاحتفاظ بها، وحقوقك عليها. |
| Compare (Printful) | بحر برنت مقابل Printful لمتجر سعودي | مقارنة بالأرقام: الطباعة في جدة والتوصيل خلال 5 أيام مقابل الشحن من الخارج خلال أسابيع؛ الأسعار بالريال وربط سلة وزد. |

### 4.17 Transactional emails (Level 1, sent through Resend)

- Contact notification to contact@b7r.sa: subject: رسالة جديدة من الموقع: {inquiryType}; body lists all fields, LTR-safe formatting for phone and email, plus a "رد عبر واتساب" link if the phone is Saudi.
- Newsletter: no welcome email in Level 1; the address is added to a Resend audience named "b7r.sa newsletter".

### 4.18 The compare page `/compare-printful` (ADR-050, approved by Dhia 2026-09-16)

A comparison with Printful for a Saudi merchant, one `compare` block. The claims about Printful were read on its public pages on 2026-09-16 and are named on the page as text; the page links nowhere outside (§7.9). B7R’s side repeats §1.1 in words; when those facts change, the rows change the same day.

| Field | Arabic |
|---|---|
| Title (H1) | بحر برنت مقابل Printful: أيهما أنسب لمتجر سعودي؟ |
| Lead | مقارنة بالأرقام لتاجر يبيع في السعودية: من أين تُطبع القطعة، متى تصل، وكم تكلّف. |
| Intro | الجدول يقارن ما يهم التاجر السعودي أولاً: مكان الطباعة، مدة التوصيل، الحد الأدنى، السعر بالريال، وربط المتجر. أرقام بحر برنت من الموقع نفسه؛ أرقام Printful من صفحاته العامة بتاريخ القراءة المذكور أسفل الجدول. |
| Our column | بحر برنت |
| Their column | Printful |
| Row: أين تُطبع القطعة | جدة · خارج المملكة، بحسب المنتج |
| Row: مدة التوصيل إلى الرياض أو جدة | حتى 5 أيام من استلام الطلب، شاملة الطباعة · من أسبوعين إلى أربعة أسابيع، شحناً دولياً |
| Row: الرسوم الجمركية على عميلك | لا شيء: الشحن داخل المملكة · قد تُفرض عند الوصول ويدفعها المستلم |
| Row: الحد الأدنى للطلب | قطعة واحدة · قطعة واحدة |
| Row: تكلفة تيشيرت أساسي مطبوع | تبدأ من 45 ريالاً، السعر معلن · بالدولار، يُضاف إليها الشحن الدولي والضريبة عند الوصول |
| Row: ربط المتجر | سلة وزد وشوبيفاي بضغطة · شوبيفاي ومتاجر عالمية؛ لا تطبيق لسلة أو زد |
| Row: الفاتورة وضريبة القيمة المضافة | فاتورة سعودية بضريبة القيمة المضافة · فاتورة أجنبية بلا ضريبة سعودية |
| Row: لغة الدعم | العربية على واتساب · بلا دعم عربي |
| Best for 1 | تاجراً على سلة أو زد تريد أن يصل الطلب لعميلك خلال أيام لا أسابيع |
| Best for 2 | تبدأ براندك بقطعة واحدة بلا مخزون ولا رأس مال |
| Best for 3 | تريد فاتورة سعودية وسعراً بالريال معلناً قبل أن تبيع |
| Not best for 1 | تبيع خارج السعودية أساساً، أو تريد كتالوجاً من مئات المنتجات |
| Not best for 2 | تحتاج طلبية كبيرة بمئات القطع بسعر الجملة |
| Closing | الخلاصة: لتاجر يبيع داخل السعودية، بحر برنت يطبع في جدة ويوصّل خلال 5 أيام باسمك وبفاتورة سعودية؛ Printful خيار لمن يبيع للخارج أو يريد كتالوجاً أوسع. جرّب بقطعة واحدة ورصيد ترحيبي 30 ريالاً. |

The rows are written as "criterion | ours · theirs"; each cell is one string on the page.

The block’s fixed words (`content/copy/ar.ts`, `compare`):

| Key | Arabic |
|---|---|
| `caption` | مقارنة بين {ours} و{theirs} |
| `criterion` | المعيار |
| `bestFor` | الأنسب لك {ours} إذا كنت |
| `notBestFor` | ليس {ours} الأنسب إذا كنت |
| `asOf` | قُرئت صفحات {theirs} في |
| `asOfTail` | ؛ الأرقام تتغير، وتاريخ القراءة يبقى صادقاً. |

SEO row (§4.16): route `/compare-printful`, title «بحر برنت مقابل Printful لمتجر سعودي», description «مقارنة بالأرقام: الطباعة في جدة والتوصيل خلال 5 أيام مقابل الشحن من الخارج خلال أسابيع؛ الأسعار بالريال وربط سلة وزد.».

---

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

**Desktop layout:** height 88 px at rest (*amended 2026-09-14, Dhia: "a little bit more down"; was 72*); container; three zones in a flex row: start = colour logo (height 36 px, links to `/`), centre = nav links (17 px Medium, gap 32 px), end = the language switch then the primary `Button` "ابدأ براندك مجاناً" (md size). *Amended 2026-09-14 (Dhia, ADR-044): no login link anywhere. The switch is an icon: the translate glyph in a 44 px ring, its accessible name from the copy bank, a CSS tooltip naming the target language in that language; it links the current page in the other language and follows client-side navigation; a page without a twin goes to its section's listing in the other language.* Background transparent over the hero's top edge on `/` only; elsewhere white.

**Sticky behaviour:** `position: sticky; top: 0; z-index: 50`. *Amended 2026-09-17 (Dhia, ADR-053, "the island"): after the page scrolls more than 24 px the full-width bar settles, over 720 ms on a soft curve, into a capsule 12 px below the top edge with the brand's 13 px corner (the buttons' corner, not a pill): 880 px wide at most on desktop (the viewport minus 24 px on phones), 64 px tall (58 on phones), solid white with a hairline border and a blue-tinted shadow (`--shadow-island`), never a blur; the logo to 36 px, the links to 16 px with a 24 px gap. On phones the capsule holds the logo, the button and the burger. The previous rule (60 px, `rgba(255,255,255,.85)`, `backdrop-filter: blur(12px)`) is withdrawn.* It never hides on scroll.

**Active link:** 2 px `--color-accent` underline offset 10 px, animated width 0 → 100% over 200 ms from the start edge.

**Mobile (< 1024 px):** height 72 px at rest (*amended 2026-09-14; was 60*); start = logo 28 px; end = the compact CTA (40 px, *amended 2026-09-17, ADR-053*) then the burger button (44 × 44 target, three 2 px lines, 18 px wide). No switch in the bar. Tapping the burger morphs the lines into an X over 300 ms (top and bottom lines rotate ±45° and meet in the middle, middle line fades; the X morphs back into the burger over 200 ms as the sheet closes) and opens a full-screen overlay: white background; a top bar mirroring the header (the logo at the start, the language switch and the X at the end); the 6 links at 28 px Bold stacked with a 40 ms staggered fade-and-rise, then a divider, then the primary CTA (lg, full width), then one row of icons: WhatsApp (green tint) and the three socials. *Amended 2026-09-14 (Dhia, ADR-044): no login button and no WhatsApp text line; the overlay fades in from above (opacity + 12 px translate down, 300 ms) instead of sliding from the start edge.* Body scroll is locked while open; Escape and the X close it; focus is trapped inside; focus returns to the burger on close. Reduced motion = opacity only, the X drawn at once.

**Acceptance:** keyboard reachable; header never overlaps the hero text; no layout shift when it shrinks (reserve height with a wrapper); Lighthouse tap targets pass.

### 6.3 Footer, CTA ribbon, waves

**6.3.1 CTA ribbon (component `CtaRibbon`, on every page before the footer):** full-bleed band, background `--color-primary`, white text, padding 72 px vertical (48 px mobile). Content centred: H2 (§4.4 ribbon), lead, then a white `Button` (primary text colour) "ابدأ براندك مجاناً". Top and bottom edges are `WaveDivider`s (§6.3.4) in the adjacent section's background colour so the band appears to sit between two gentle waves.

**6.3.2 Footer:** background `--color-navy`, text white at 90% opacity, links white, hover `--color-accent`. Top edge: a `WaveDivider` in the ribbon's primary blue so the ribbon flows into the footer. Layout desktop: 4 columns (logo + tagline + social icons 3 | روابط | السياسات | النشرة البريدية form). Second row: badges strip (payment logos at 28 px height in white rounded tiles, then SBC, Ministry of Commerce, then the Misk logo with its line), separated by a 1 px white/10% hairline. Third row: contact line and copyright. *Amended 2026-09-13 (Dhia): four social icons (X, Instagram, TikTok, WhatsApp) with the contact line (e-mail · phone) under them in the first column; the Misk logo without its line; the third row is the copyright alone, centred.* *Amended 2026-09-14 (Dhia, ADR-044): the white logo is 48 px (was 40). Below 1024 px: the brand block (logo, tagline, socials, contact line) spans the row and centres; روابط and السياسات share one row in two start-aligned columns; the newsletter spans the row; the badges wrap centred.*

**6.3.3 Newsletter form (footer):** email input (LTR) + button; POST `/api/newsletter`; inline success or error message (§4.5) with `aria-live`; honeypot field; disabled while submitting.

**6.3.4 WaveDivider:** an SVG path 1440 × 48 (viewBox), two overlapping wave paths at 100% and 60% opacity, `preserveAspectRatio="none"`, height 48 px desktop / 32 px mobile. Motion: the paths translate horizontally by one wavelength over 20 s, linear, infinite, in opposite directions for the two layers; amplitude must be subtle (≤ 12 px). Under reduced motion: static. The wave is the only place the sea motif animates. Do not add waves to any other section.

### 6.4 Homepage

Section order: Hero → Product strip → Interactive designer and profit → Three steps → Video → Why us → Testimonials → Integrations → FAQ → CTA ribbon → Footer. Backgrounds alternate: hero (photo) · surface · ground · surface · ground · surface · ground · surface · ground · ribbon · navy.

#### 6.4.1 Hero

**Purpose:** the promise in one glance, one action.

**Layout desktop:** section `min-height: calc(100svh - header)`, full-bleed up to the photo's own width. *Amended 2026-09-17 (Dhia, ADR-051): the hero never grows wider than its photo (1920 px); on a wider viewport it stays centred with the page's white on both sides and nothing else changes; the `sizes` of the desktop rendition say so, so the browser never fetches an upscaled candidate.* Background: the slide image, `object-fit: cover`, `object-position: 20% 60%` in Arabic and `80% 60%` in English (keeps the product cluster in view; each language has its own photos, see Slides). A legibility overlay on the start 45% of the width (the right in Arabic, the left in English): linear gradient from the overlay colour at 92% opacity at the start edge to transparent. *Amended 2026-09-14 (Dhia, ADR-044): the overlay is an admin setting, `hero.overlay`: a switch (off shows the photo as it is) and a `#rrggbb` colour (white by default), one setting for both languages.* Text column: inside the container, start-aligned, max-width 560 px (600 px in English), vertically centred at 45% of the section height. Stack: Display headline (§4.4 slide table, `--color-text`; in English 56 px, leading 1.12, tracking -0.02 em, so every headline is two rows and every subline one at 1280 px), 16 px gap, subline (lead size, `--color-text-muted`), 32 px gap, button row (primary lg button + secondary text link with a mirrored arrow, gap 24 px), 12 px gap, microcopy (small, muted), 32 px gap, proof chips row (0 to 6 `Chip`s with `Check` icons in accent tint; the row is omitted when the language has none; the rows are shared by both languages, the text is per language). Slide dots sit at the bottom-start of the section, 24 px from the edges: 4 dots, active dot elongated to 24 px in `--color-primary`, inactive 8 px at 40% opacity. A pause/play control (icon button) sits next to the dots.

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

**API `POST /api/contact`:** validates with the same zod schema; rejects if the honeypot is filled (returns 200 to fool bots); verifies Turnstile server-side when configured; rate-limits 5 requests per IP per 10 minutes (in-memory map; note the single-instance assumption); sends the email through Resend (§4.17) to the contact address in the site settings (amended 2026-09-17, ADR-052); returns `{ ok: true }` or `{ ok: false, error }` with 400/429/500. Never logs message bodies in production.

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

---

## 7. SEO and AI-search visibility requirements

Principle (from `docs/research/04`): there is no separate "AI SEO". Answer engines cite pages that are indexed, server-rendered, clearly structured, fresh, and mentioned elsewhere. Everything below is a build requirement for Level 1 unless marked L2/L3.

### 7.1 Rendering and crawlability

1. Every indexable route is statically rendered at build (Next.js App Router, no `dynamic = 'force-dynamic'`), with all text, links, images (with `alt`), and JSON-LD in the initial HTML. Client components only for the designer, carousels, accordions, forms, widgets.
2. No content behind client-side fetches. No infinite scroll.
3. `Content-Language` response header on every page (set in `next.config.ts` `headers()`): `ar` on the Arabic document, `en` on `/en` and `/en/*`; plus `<meta http-equiv="content-language">` with the same value (amended in Level 5, ADR-043).
4. Canonical URL on every page: `https://b7r.sa{path}` without trailing slash and without query strings (the designer deep-link query is ignored by canonical).
5. hreflang (Level 5, ADR-043): `ar`, `en`, and `x-default → ar`, self-referencing, emitted from `sitemap.ts` alternates and `<link rel="alternate">`, only on a page that exists in both languages (the presence gate: the document's title has a value in the locale). A page with one language carries no pair.
6. Trailing slashes: `trailingSlash: false`; `www` and `http` redirect at the host.

### 7.2 robots.txt (`app/robots.ts`)

```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /*?hub=
Disallow: /*&utm_

User-agent: OAI-SearchBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: Claude-SearchBot
Allow: /
User-agent: Claude-User
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Bingbot
Allow: /
User-agent: Applebot
Allow: /

Sitemap: https://b7r.sa/sitemap.xml
```

Training crawlers (`GPTBot`, `ClaudeBot`, `Google-Extended`, `CCBot`, `Meta-ExternalAgent`, `Amazonbot`, `Applebot-Extended`) are not blocked (decision C-08). Any CDN or WAF rule (CranL, Cloudflare later) must not challenge the search and retrieval bots above. If `NEXT_PUBLIC_SITE_URL` is not `https://b7r.sa`, `robots.ts` returns `Disallow: /` and every page gets `noindex` (protects preview deployments).

### 7.3 Metadata per page (`generateMetadata`)

- `title` from §4.16 with the template `%s | بحر برنت`; the home page uses the full title without the template.
- `description` from §4.16 (≤ 155 characters).
- `alternates.canonical` under the locale's prefix (`/products/hoodie`, `/en/products/hoodie`); `alternates.languages` `{ ar, en, x-default }` when the twin exists (Level 5, ADR-043).
- Open Graph: `type` (`website` everywhere except `article` on posts; `product` is not an `og:type` the previews read and Next's typed metadata does not emit it, so product pages use `website` and the `Product` JSON-LD carries the commerce data, amended in Phase 1c), `locale: ar_SA` (`en_US` on `/en`, with `og:locale:alternate` for the twin), `siteName: بحر برنت` (`B7R Print` on `/en`), `title`, `description`, `images` (1200 × 630). Default OG image: designed once (`public/og/default.png`): white background, the colour logo, the tagline منصة الطباعة عند الطلب في السعودية, and a row of the five product photos; product pages use `public/og/products/{slug}.png` with the product photo and "يبدأ من {price}"; posts use the cover. All OG images are static PNGs rendered once by `scripts/build-og.ts` (`pnpm og`) with Playwright and the self-hosted ITF Rayat Round files, because Satori (`next/og`) does not shape Arabic (ADR-020, amended in Phase 1c).
- Twitter card `summary_large_image`, `site: @b7rprint`.
- `robots: { index, follow, 'max-image-preview': 'large' }`; `noindex` on 404 and on any non-production host.
- Icons: `favicon.ico` (32), `icon.svg` if available else PNG 192/512, `apple-touch-icon` 180, `manifest.webmanifest` (name "بحر برنت", `lang: ar`, `dir: rtl`, `theme_color: #0058B0`, `background_color: #FFFFFF`, display `browser`; one manifest per origin, in the default language, ADR-043).
- Verification meta tags from the SEO settings in the admin (`verification.google`, `verification.bing`; amended 2026-09-17, ADR-052).

### 7.4 Structured data (JSON-LD, rendered in the page component, one `<script type="application/ld+json">` per page)

| Page | Types |
|---|---|
| Home | `OnlineStore` (name بحر برنت, alternateName B7R Print, url, logo ≥ 112 px, `sameAs` [X, Instagram, TikTok], `address` {addressLocality: جدة, addressRegion: منطقة مكة المكرمة, addressCountry: SA}, `contactPoint` {telephone +966501699572, contactType "customer support", availableLanguage ar}, `hasMerchantReturnPolicy` per Appendix B (no returns on custom goods; reprint or refund on B7R error within 10 days), `hasShippingService`/`shippingDetails` {shippingDestination SA, transitTime max 5 days}) + `WebSite` (name, alternateName, url) |
| Products listing | `ItemList` of the five product URLs + `BreadcrumbList` |
| Product | `Product` (name, description, image[], brand "بحر برنت", material, `offers`: `Offer` {price = base cost, priceCurrency "SAR", availability InStock, url, `priceSpecification` note "تكلفة للتاجر"}) + `BreadcrumbList` |
| How it works, About, Contact, Legal, the compare page | `WebPage` + `BreadcrumbList` (no HowTo: rich results discontinued) |
| FAQ | `WebPage` + `BreadcrumbList` + `FAQPage` (the visible questions, in order; ADR-050, amended 2026-09-16) |
| Blog post | `BlogPosting` (headline, description, image, datePublished, dateModified, inLanguage ar, author `Person` {name ضياء, url /about}, publisher `Organization`) + `BreadcrumbList` |

`inLanguage` follows the document's locale, `contactPoint.availableLanguage` and `WebSite.inLanguage` list both languages (Level 5, ADR-043). Validate with Google's Rich Results Test and the Schema.org validator in CI where possible (at least a JSON parse + required-fields unit test).

### 7.5 Sitemap (`app/sitemap.ts`)

All indexable routes of both languages with `lastModified` (ISO 8601 with time; from the content file's `updatedAt` field, updated only on real content changes), `changeFrequency` omitted (ignored by engines), image entries for product pages (`images: [...]`), and `alternates.languages` on every URL whose twin exists (`ar`, `en`, `x-default`; Level 5, ADR-043). Excludes 404, API, query-string variants and a language a document does not have. Submitted to Google Search Console and Bing Webmaster Tools at launch (§12.4).

### 7.6 IndexNow

The key is served at `/indexnow/{INDEXNOW_KEY}.txt` by `app/indexnow/[key]/route.ts` (any other name is a plain 404; a root-level catch-all would soft-404 every unknown URL, amended in Phase 1c). A small utility `lib/indexnow.ts` posts `{ host, key, keyLocation, urlList }` to `https://api.indexnow.org/indexnow` with `keyLocation` pointing at that path. In Level 1 it runs from a GitHub Actions step after a production deploy with the list of changed routes (diff of `sitemap.xml` before/after). Level 2 moves it to a publish hook.

### 7.7 Measurement setup

- Google Search Console: domain property for `b7r.sa` verified by DNS TXT; sitemap submitted; keep "Search generative AI control" on Include.
- Bing Webmaster Tools: verified; sitemap submitted; IndexNow enabled.
- GA4: property `G-JPB02M7C49` (existing). Add a custom channel group "AI Assistants" above Referral with the session-source regex `^(chatgpt\.com|chat\.openai\.com|perplexity\.ai|www\.perplexity\.ai|claude\.ai|gemini\.google\.com|copilot\.microsoft\.com|deepseek\.com|grok\.com|x\.ai|meta\.ai|you\.com|poe\.com)$`. Mark `cta_click`, `outbound_app_click`, `contact_submit`, `whatsapp_click` as key events.
- Umami: website added under `umami.b7r.app`; the same events sent with `umami.track`.
- Quarterly manual check: run 20 Arabic buyer prompts (from Appendix E) in ChatGPT, Gemini, Perplexity, Copilot, and Google AI Mode; log whether b7r.sa is cited. *Amended 2026-09-16 (ADR-049): replaced by the citation ledger, a weekly run through the AI connections recorded in the admin (§10.4).*

### 7.8 Performance and asset budgets

| Budget | Value |
|---|---|
| JS shipped to the home page (gzip) | ≤ 180 kB total; designer chunk lazy-loaded on scroll into view |
| Fonts | Preloaded woff2 files ≤ 40 kB each (3 on the home page: Regular, Medium, Black); others lazy |
| LCP image | ≤ 220 kB AVIF/WebP at 1920 w; responsive `srcset` 640–2560 |
| Third-party scripts | Umami ≤ 5 kB; GA only after consent; Turnstile only on `/contact` |
| Lighthouse CI thresholds | Performance 90, Accessibility 95, Best Practices 95, SEO 100 (mobile, throttled) |

### 7.9 Content requirements that affect ranking (Level 1)

- One `<h1>` per page, semantic H2/H3 hierarchy, headings in Arabic.
- Every page ≥ 150 words of real Arabic text excluding nav/footer (home reaches this through the sections; legal pages through their bodies).
- Both phrasings appear naturally: "الطباعة عند الطلب" (primary) and "طباعة حسب الطلب" once in the home meta description or how-it-works intro.
- Internal links as in §5.3. External links only to b7r.app, the social profiles, and Misk (nofollow not needed). *The compare page (ADR-050) names its sources as text and links nowhere outside.*
- Visible publish and update dates on posts and legal pages, matching JSON-LD.
- Author identity: ضياء, مؤسس بحر برنت, linked to `/about` (Level 3 adds an author page).

### 7.10 Explicitly not done

`FAQPage`/`HowTo`/`SearchAction` schema, `Speakable`, Google Business Profile (no customer-facing premises), `LocalBusiness` schema (use `OnlineStore`).

*Amended 2026-09-16 (ADR-050, project 4): `FAQPage` is done after all, on the FAQ page only and in both languages, generated from the page's own FAQ section so it never drifts from the visible questions; Google dropped the rich result, the answer engines read the schema. `HowTo`, `SearchAction`, `Speakable`, Google Business Profile and `LocalBusiness` stay out.*

*Amended 2026-09-14 (Level 5c, ADR-043): `llms.txt` is done after all, one per language (`/llms.txt`, `/en/llms.txt`), generated from the CMS (site settings, the SEO defaults' titles and descriptions, the pages, the catalogue with cost and suggested price, the published posts with excerpts) and regenerated with the listings on publish. The measured effect is still thin; the cost is one route per language.*

---

## 8. Technical architecture, repository, hosting, quality gates

### 8.1 Stack (pin exact versions at project start; look up the current stable release, never assume)

| Layer | Choice | Notes |
|---|---|---|
| Runtime | Node 22 LTS, pnpm, ESM (`"type": "module"`) | `pnpm config set minimumReleaseAge 1440`, `ignore-scripts true`, `pnpm audit --audit-level=moderate` before adding deps |
| Framework | Next.js 16.x App Router, React 19, TypeScript 5.x strict | `output: 'standalone'` for Docker; static rendering for all pages |
| Styling | Tailwind CSS 4.x (CSS-first `@theme` tokens from §3), shadcn/ui primitives restyled | Logical utilities only; the lint in §8.8 enforces it |
| Icons | `lucide-react` | RTL-aware `Icon` wrapper |
| Motion | CSS transitions and keyframes, plus small scroll/intersection hooks (`lib/reduced-motion.ts`, `modules/home/steps/steps-progress.tsx`); `motion` (React) only if a later phase needs what CSS cannot do (amended 2026-09-13, ADR-012: keeps the home page inside the JS budget) | Respect reduced motion via `useReducedMotion` |
| Canvas | `konva` + `react-konva` | Designer only; loaded lazily |
| Validation | `zod` | Content contract, forms, API bodies |
| Email | `resend` SDK | Contact notification, newsletter audience |
| Anti-spam | Cloudflare Turnstile (`@marsidev/react-turnstile` or a thin wrapper) + honeypot + rate limit | Turnstile keys optional in dev |
| i18n | `next-intl` installed with a single locale `ar` and routing prepared for `en` (`localePrefix: 'as-needed'`, default `ar` at root) | UI microcopy in `messages/ar.json`; page copy in typed content files |
| Analytics | Umami script; GA4 via `@next/third-parties/google` after consent | §6.16 |
| Testing | Vitest (unit), Playwright (e2e), Lighthouse CI (`@lhci/cli`), axe (`@axe-core/playwright`) | §8.7 |
| Lint/format | oxlint (typescript, import, unicorn plugins) + oxfmt; a custom RTL class check script | Zero warnings policy |
| CI | GitHub Actions, actions pinned by SHA with version comments, `persist-credentials: false` | §8.7 |
| Hosting | CranL (https://cranl.com), Docker deploy from GitHub, Saudi Arabia region | §8.6 |

`tsconfig.json` must enable: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `verbatimModuleSyntax`, `isolatedModules`. Absolute imports only via `@/…`.

### 8.2 Repository

- Name `b7r-website-v2`, private, GitHub, default branch `main`. `main` deploys to production. No staging (decision D-54); review happens on pull requests with local runs and the CI report.
- Branch per phase: `phase/1a-foundation`, `phase/1b-home`, `phase/1c-pages-seo`, `phase/2a-…`. One PR per phase; squash merge; PR description lists the DoD items with evidence (screenshots, Lighthouse report link, test output). Never push to `main` directly.
- Conventional commits, imperative, ≤ 72 chars subject. No AI attribution trailers (§0.4.12).
- `docs/` in the repo holds a copy of this BRD, `DECISIONS.md` (ADR log, one entry per non-obvious choice), `IDEAS.md`, `RUNBOOK.md` (deploy, env vars, rollback), and `docs/research/` copied from this package.
- Spec Kit lives in `.specify/`; feature folders per phase.

### 8.3 Folder structure (modular monolith; the "blocks connected to a core" Dhia asked for)

```
b7r-website-v2/
├─ .specify/                       # Spec Kit
├─ .github/workflows/ci.yml        # §8.7
├─ docs/                           # BRD copy, DECISIONS.md, IDEAS.md, RUNBOOK.md, research/
├─ public/
│  ├─ fonts/                       # ITFRayatRound-*.woff2
│  ├─ images/products/{slug}/      # optimised copies of resources/products
│  ├─ images/hero/                 # desktop + mobile variants
│  ├─ images/icons-3d/             # six icons
│  ├─ images/badges/               # payment + trust + misk
│  ├─ images/lifestyle/            # the few decorative images actually used
│  ├─ designs/sample-tasmeemak.png
│  ├─ video/printer-marketing.mp4 · printer-marketing-poster.jpg
│  ├─ og/default.png
│  └─ {INDEXNOW_KEY}.txt
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx                # html dir/lang, fonts, shell (§6.1)
│  │  ├─ page.tsx                  # home (§6.4)
│  │  ├─ products/page.tsx · products/[slug]/page.tsx · products/[slug]/opengraph-image.tsx
│  │  ├─ how-it-works/ · about/ · contact/ · faq/ · blog/ · blog/[slug]/ · terms/ · shipping/ · privacy/
│  │  ├─ not-found.tsx · sitemap.ts · robots.ts · manifest.ts
│  │  └─ api/contact/route.ts · api/newsletter/route.ts · api/health/route.ts
│  ├─ modules/                     # feature blocks; each exports only from index.ts
│  │  ├─ core/        tokens, shell components (Header, Footer, CtaRibbon, WaveDivider, ConsentBar, WhatsAppWidget), analytics, seo helpers
│  │  ├─ home/        Hero, ProductStrip, Steps, VideoSection, WhyUs, Testimonials, Integrations, HomeFaq
│  │  ├─ designer/    DesignerSection, canvas, print-area config, profit math (pure, tested)
│  │  ├─ products/    ProductCard, gallery, spec list, size chart, product data access
│  │  ├─ pages/       how-it-works, about, faq, legal renderers
│  │  ├─ blog/        post list, post template, sample data (L3 swaps the data source)
│  │  └─ forms/       ContactForm, NewsletterForm, server validation, resend, turnstile, rate-limit
│  ├─ content/                     # THE CONTENT CONTRACT (mirrors L2 collections 1:1)
│  │  ├─ schema.ts                 # zod schemas + TS types
│  │  ├─ site.ts                   # SiteSettings: contact, social, offer (30), delivery promise, bookingUrl
│  │  ├─ navigation.ts · home.ts · products.ts · faq.ts · testimonials.ts · integrations.ts
│  │  ├─ pages/{how-it-works,about,contact}.ts · legal/{terms,shipping,privacy}.md · blog/{slug}.ts
│  │  └─ seo.ts                    # per-route titles/descriptions (§4.16)
│  ├─ components/ui/               # shadcn primitives, restyled
│  ├─ components/shared/           # Button, SarAmount, SarSymbol, Icon, Section, Container, Badge, Chip
│  ├─ i18n/ (routing.ts, request.ts) · messages/ar.json
│  ├─ lib/ (redirects.ts, indexnow.ts, utm.ts, track.ts, consent.ts, rate-limit.ts)
│  └─ styles/globals.css           # @theme tokens (§3.2–3.7), @font-face, base styles
├─ tests/ (unit) · e2e/ (Playwright) · scripts/ (generate-sample-design, video-poster, hero-crops, check-rtl-classes, build-og)
├─ Dockerfile · .dockerignore · next.config.ts · lighthouserc.json · playwright.config.ts · vitest.config.ts · package.json · pnpm-lock.yaml
```

Module rules: `modules/x` imports from `components/*`, `content/*`, `lib/*`, and `modules/core` only, never from another feature module's internals (enforce with `no-restricted-imports`). Pages compose modules. The `content/` folder is the only place copy lives; components receive content as props.

### 8.4 The content contract (Level 1 → Level 2 bridge)

`content/schema.ts` defines, with zod, exactly the shapes Level 2 will store in Payload collections of the same names:

- `SiteSettings` { brandName, tagline, contact { phone, whatsapp, email }, social { x, instagram, tiktok }, offer { welcomeCredit: 30 }, delivery { maxDays: 5, origin: "جدة" }, bookingUrl?: string }
- `NavItem` { label, href, matchPrefix? }
- `HeroSlide` { id, headline, subline, imageDesktop, imageMobile, alt }
- `Product` { slug, name, shortDescription, description, baseCost, suggestedPrice, colors[{ slug, name, hex, images{front, back?} }], sizes[{ label, measurements? }], material, weightGrams, printArea { label, widthCm: 28, heightCm: 38, canvas { x, y, w, h } }, printMethodLabel, sortOrder }
- `Step` { order, title, text, icon }
- `WhyUsItem` { icon, title, text }
- `Testimonial` { quote, name, store, avatar?, placeholder: boolean }
- `Integration` { slug, name, logo, status: "available" }
- `FaqItem` { group, question, answer }
- `PageSeo` { route, title, description, ogImage? }
- `LegalPage` { slug, title, updatedAt, body(markdown) }
- `BlogPost` { slug, title, excerpt, hub, cover, publishedAt, updatedAt, readingMinutes, takeaways[3], body(markdown), author, sample: boolean }

A unit test parses every content file against its schema; the build fails on drift. Level 2's migration script reads these files and seeds the CMS.

### 8.5 Environment variables

*Amended 2026-09-17 (Dhia, ADR-052): the environment holds what is technical (origins, the database, the storage, the API keys, the runtime switches). Everything a person at B7R changes lives in the admin: the WhatsApp number and the contact address (site settings, Contact), the booking link (site settings, Numbers), the analytics ids (site settings, Analytics), the search engine verification tokens (SEO settings). The English-off switch and the backups are gone.*

| Name | Purpose | Required in prod |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://b7r.sa`; anything else triggers noindex | yes |
| `PAYLOAD_PUBLIC_SERVER_URL` | Payload's origin, the same as the site's | yes |
| `NEXT_PUBLIC_APP_URL` | The merchant app; defaults to `https://b7r.app` | no |
| `DATABASE_URL`, `PAYLOAD_SECRET` | Postgres; the session and key-encryption secret (32+ characters) | yes |
| `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` (`S3_PUBLIC_URL` when a CDN fronts the bucket) | Media | yes |
| `RESEND_API_KEY`, `RESEND_AUDIENCE_ID` | E-mail (the contact form, the newsletter, the admin's password reset) | yes |
| `RESEND_FROM` | The sender on the verified domain; defaults to `بحر برنت <no-reply@b7r.sa>` | no |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | The forms' anti-spam and the admin login gate (ADR-034) | yes |
| `INDEXNOW_KEY` | Optional; derived from `PAYLOAD_SECRET` when unset | no |
| `B7R_RUNTIME` | `production` only in the production app: the start-up assertion (ADR-021) | yes |
| `AI_CONTENT_ENABLED` | The content engine's kill switch (`false` stops every run) | no |

Secrets never reach the client; only `NEXT_PUBLIC_*` do. `.env.example` lists all with comments. Validated at startup (`lib/env.ts`, `lib/env-server.ts`) and fails fast.

### 8.6 Hosting on CranL and deployment

- **Build:** multi-stage `Dockerfile` (deps → build → runner on `node:22-alpine`, non-root user, `HOSTNAME=0.0.0.0`, `PORT=3000`, copies `.next/standalone`, `.next/static`, `public`). Image size target ≤ 250 MB.
- **CranL app:** connect the GitHub repo, deploy on push to `main`, Dockerfile build, region **Saudi Arabia**, custom domain `b7r.sa` with automatic SSL, `www.b7r.sa` redirecting to the apex, env vars from §8.5, health check `GET /api/health` → `{ ok: true, version }`. Enable CranL's CDN zone for `/_next/static/*`, `/images/*`, `/fonts/*`, `/video/*` if available; otherwise rely on Next's cache headers (`public, max-age=31536000, immutable` for hashed assets).
- **Rollback:** redeploy the previous image from CranL's deployment list; document in `RUNBOOK.md`.
- **Cutover (§12.4):** keep WordPress live at Hostinger until Level 1 is approved; then point `b7r.sa` DNS to CranL; verify redirects and TLS; keep the old host for 14 days as a fallback, then cancel.
- **Level 2 additions:** a CranL managed Postgres and an S3 bucket in the same project (§9.2).

### 8.7 CI pipeline (`.github/workflows/ci.yml`, on every pull request; `main` by hand)

1. `pnpm install --frozen-lockfile`
2. `pnpm typecheck` (`tsc --noEmit`)
3. `pnpm lint` (oxlint) and `pnpm format:check` (oxfmt)
4. `pnpm check:rtl` (script fails on physical-direction Tailwind classes or CSS properties outside an allowlist file)
5. `pnpm test` (Vitest: profit math, redirects map, `SarAmount` formatting, content schemas, JSON-LD required fields, rate limiter)
6. `pnpm build`
7. `pnpm e2e` (Playwright against the built app: navigation, mobile menu, hero controls, designer upload and drag, calculator values, contact form validation + honeypot, newsletter, WhatsApp link, consent bar behaviour, 404 status, five redirects, axe scan on each page with zero serious violations)
8. `pnpm lhci` (Lighthouse CI, mobile preset, thresholds from §7.8 on `/`, `/products`, `/products/tee-essential`, `/contact`, `/blog/{sample}`); the report is uploaded as an artifact and linked in the PR.
9. No CI event runs on `main` (ADR-045): `scripts/merge-pr.sh <number> [subject]` checks that the branch's remote head contains `origin/main` and that every check on it is green, then squash-merges; `gh workflow run ci.yml --ref main` runs `main` by hand. The deploy workflow's own `push` trigger builds the image (§8.6); IndexNow runs in-process on the production runtime (ADR-033).

Zero warnings policy: any warning from any step is fixed or suppressed inline with a justification comment.

### 8.8 Guardrails to set up in Phase 1a before writing features

- The RTL class check (`scripts/check-rtl-classes.ts`): scans `src/**` for `\b(ml|mr|pl|pr|left|right|text-left|text-right|rounded-l|rounded-r|border-l|border-r)-` and `float-(left|right)`; the only allowed exception is the WhatsApp widget's `right-6` with an `// rtl-allow` comment.
- oxlint with `typescript`, `import`, `unicorn` plugins; `no-restricted-imports` for module boundaries.
- A `content` schema test.
- Playwright and Lighthouse CI scaffolds with the real thresholds, even if the first pages are stubs.
- `prek` git hooks (`prek install`): typecheck + lint + rtl check on commit.
- `docs/DECISIONS.md` created with ADR-001 "Adopt this BRD".

### 8.9 Constitution principles (paste into `/speckit.constitution`)

1. Arabic-first, RTL-first, mobile-first; logical CSS only.
2. Static, server-rendered HTML for every public page; client islands only where interaction requires them.
3. Copy comes from the content contract, never from components.
4. Performance and accessibility budgets are CI gates.
5. One typeface, three blues, one radius; motion is subtle and reducible.
6. No fabricated content: no fake reviews, numbers, or promises.
7. Modular monolith: features are blocks under `modules/`, composed by pages, sharing only `core`.
8. Every non-obvious decision gets an ADR; every phase gets a CTO review before and after.
9. Zero warnings; tests cover behaviour, edges, and errors; verify before claiming done.
10. No AI attribution in commits or PRs; Dhia is the author of record.

### 8.10 Security headers and hygiene

- Headers: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera, microphone, geolocation off), `X-Frame-Options: DENY` (except Level 4 pages that embed Cal.com use `frame-src` in CSP instead), and a CSP with `default-src 'self'`; `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://challenges.cloudflare.com {UMAMI_ORIGIN}`; `style-src 'self' 'unsafe-inline'` (required: `next/image fill`, the reveal and hero primitives emit inline `style` attributes, amended in Phase 1c); `img-src 'self' data: blob: https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com`; `connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://region1.google-analytics.com https://www.googletagmanager.com {UMAMI_ORIGIN}` (the tag manager host on both since 2026-09-16: Google's tag reports through pixels and fetches on it, as its documented policy asks); `frame-src https://challenges.cloudflare.com`; `font-src 'self'`; `media-src 'self'`; `object-src 'none'`; `base-uri 'self'`; `form-action 'self'`; `frame-ancestors 'none'`. No nonces: every page is static, so a per-response nonce is impossible without dynamic rendering, and a nonce next to `'unsafe-inline'` would switch the latter off in CSP3 browsers and break the inline script gtag injects (ADR-016). An e2e (`e2e/csp.spec.ts`) asserts zero `securitypolicyviolation` events on home load, a designer upload, consent → GA, and a contact submit.
- Dependencies: pinned exact versions; `pnpm audit` in CI weekly (Dependabot with 7-day cooldown, grouped updates).
- API routes: zod validation, honeypot, rate limit, no PII in logs, generic error messages to clients.
- Uploads in the designer never leave the browser.

### 8.11 Observability

`/api/health` returns build version and time. Errors: Next.js `error.tsx` and `global-error.tsx` with the brand 404-style design and a WhatsApp link. Level 2 adds GlitchTip (Sentry SDK) as the B7R app does. CranL's live analytics cover request-level monitoring.

---

## 9. Level 2: admin dashboard (Payload CMS)

### 9.1 Goal

Give Dhia and an editor a WordPress-like, Arabic, right-to-left admin at `https://b7r.sa/admin` to change every piece of site content and configuration without a deploy, while the public site stays static and fast. Since Level 5 (ADR-043) every localised field carries an Arabic and an English value (the panel's locale switch); a document is on the English site once its title has an English value, and the English site exists once the site settings (brand name and the menu's CTA label, ADR-046) have theirs. Payload CMS 3 runs inside the same Next.js app (decision from `docs/research/05`: MIT licence, Arabic RTL admin, built-in drafts, scheduled publishing, jobs queue, custom admin views).

### 9.2 Infrastructure additions

- CranL managed **Postgres** in the same project; connection string in `DATABASE_URL`. The platform's automated snapshots are the backup (amended 2026-09-17, Dhia: no backup job, no backup bucket, no restore rehearsal in CI).
- CranL **S3 bucket** for media through `@payloadcms/storage-s3`; public read for images; served through the CDN zone. Original uploads are kept; Payload generates sizes (thumbnail 400, card 800, hero 1920, og 1200 × 630) with focal-point cropping.
- New env vars: `DATABASE_URL`, `PAYLOAD_SECRET` (≥ 32 random bytes), `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `PAYLOAD_PUBLIC_SERVER_URL` (+ `S3_PUBLIC_URL` when objects are served from a host other than the endpoint). All of them join the production-required set asserted at start (§8.5); `PAYLOAD_PUBLIC_SERVER_URL` must equal the site origin.
- Migrations are SQL files under `src/migrations/` run by the deploy workflow before the image is built and again by Payload at start-up; they are additive so the running image keeps serving during a release. Because every page is prerendered from the database, `next build` needs `DATABASE_URL` and `PAYLOAD_SECRET`: the image is built in GitHub Actions with BuildKit secrets and pushed to GHCR, and CranL pulls it (amended 2026-09-13, ADR-025).
- `/api/health` reports `db` (`ok` when `select 1` answers within 2 s) and `media` (`s3` | `local`) as fields; `ok` stays the liveness signal so a database blip never restarts the container.

### 9.3 Payload setup

- Routes: admin UI at `/admin`, REST at `/api/payload/*` (rename from the default `/api` to avoid clashing with the site's API routes), GraphQL disabled.
- Admin locale: `ar` from `@payloadcms/translations`, `rtl: true`; the admin's document title "لوحة بحر برنت"; the logo and favicon replaced with the brand icon. Amended 2026-09-13 (ADR-039, `specs/007-admin-ui/`): the panel is dark only on Payload's greys with the brand font, radii and accent; the sidebar, header, account menu, login and dashboard are rebuilt on shadcn/ui primitives with an icon for every collection and global; every collection and global carries an Arabic description; the rules live in `docs/ADMIN-DESIGN-SYSTEM.md` and `.claude/rules/admin-ui.md`. Amended again 2026-09-13 (Dhia's review, ADR-039): the panel's UI language is English for everyone (`i18n.supportedLanguages: { en }`, title "B7R Print Admin"); the content locale stays Arabic-first, and every text control follows the direction of its own text (`unicode-bidi: plaintext`), so Arabic content reads right-to-left inside the left-to-right panel. Collapsed on a desktop the sidebar is an icon rail, the header carries a search box and a "View website" link, and colour has one meaning each (blue action, green publish, red delete, amber careful).
- Users collection with roles `admin` and `editor`:
  - **admin**: everything, including users, settings, redirects, deleting.
  - **editor**: create/edit/publish content collections (pages, products, FAQ, testimonials, blog); no users, no site settings, no redirects, no deletes of published items.
- Auth hardening: email + password (min 8 chars since 2026-09-17 at Dhia's instruction, was 12; checked against a breached-password list where feasible), login lockout after 5 failures for 15 minutes, Turnstile on the login form, session cookie `SameSite=Lax; Secure; HttpOnly`, admin routes `noindex` and excluded from the sitemap, `X-Robots-Tag: noindex` header on `/admin*`. 2FA is a later block (§12.6). Delivered in Phase 2a (ADR-027, ADR-028): the 12-character minimum and the Have I Been Pwned range check on every password write (fail-open with a warning when the service is down), the lockout, 8-hour sessions, and an admin header set on `/admin*` and `/api/payload/*` (`X-Robots-Tag: noindex, nofollow`, `Cache-Control: private, no-store`, a CSP without analytics origins). The Gravatar avatar is off. The login Turnstile ships in Phase 2b (delivered 2026-09-13 as a verified gate cookie, ADR-034; the password-reset e-mail goes through Resend when configured).
- Localisation: field-level `localized: true` on all text fields with locales `['ar', 'en']`, default `ar`, English left empty until the English phase.
- Drafts and versions on Pages, Products, Posts; autosave; scheduled publish via Payload's jobs queue; live preview for Pages and Posts pointing at the public route. Phase 2a delivers drafts, versions (25 per document) and autosave on Products; scheduled publish and live preview come with Pages in 2b. Amended 2026-09-13 (ADR-031): 2b phase 2 delivers drafts, versions and autosave on Pages and the `home` global; scheduled publish lands with the jobs in 2b phase 3; live preview is deferred (docs/IDEAS.md) because it needs draft rendering on the public routes, which the ISR + `revalidatePath` pipeline does not offer.

### 9.4 Collections and Globals (1:1 with the content contract in §8.4)

| Payload | Kind | Fields (summary) | Replaces |
|---|---|---|---|
| `site-settings` | Global | brand, contact, social, offer.welcomeCredit, delivery.maxDays, delivery.origin, bookingUrl, badges (media[]), consent text | `content/site.ts` |
| `navigation` | Global | header items[], footer columns[], ctaLabel | `content/navigation.ts` |
| | | Amended 2026-09-15 (ADR-046): folded into `site-settings` as its `menu` group (primary[6], policies[4], ctaLabel, skipLinkLabel, menuOpenLabel, menuCloseLabel); the `Navigation` contract in `content/schema.ts` is read from there; the `navigation` global and its tables are gone (migration `20260915_143152`). | |
| `home` | Global | heroSlides[] (media desktop/mobile, headline, subline), productStripOrder[], designerDefaults, steps[], video (media, poster, heading, lead), whyUs[], integrationsIntro, faqSelection (5 relationship), ribbon | `content/home.ts` |
| | | Amended 2026-09-13 (ADR-031, as shipped): groups `hero` (4 slides: headline, subline, desktop and mobile media; CTAs, microcopy, 3 chips), `productStrip` (copy + 5 product relationships), `designer` (eyebrow, title, lead, sample, cta), `steps` (copy, link, 3 items with media icons), `video` (copy; the file ships with the site), `whyUs` (3 items, icon select), `testimonials`, `integrations`, `faq` (copy + link; the entries are the `faqs` rows flagged `showOnHome`), `ribbon`; `enabled` on every group but hero, productStrip, designer and ribbon; drafts + autosave; interface strings (aria, hints, input labels, validation) stay in `src/messages/ar.json`. | `content/seed/home.ts` (seed) |
| `seo-defaults` | Global | titleTemplate, the routes' titles and descriptions, verification tokens (admin-only); the default Open Graph image is the rendered file per language (`pnpm og`, ADR-043) | `content/seo.ts` |
| `products` | Collection | slug, name, shortDescription, description (rich text), baseCost, suggestedPrice, colors[] (name, hex, front media, back media), sizes[], material, weightGrams, printArea (fixed 28×38 + canvas fractions), printMethodLabel, sortOrder, seo (plugin) | `content/products.ts` |
| `pages` | Collection | slug (how-it-works, about, contact, faq, terms, shipping, privacy), title, lead, blocks[] (richText, steps, cards, miskCredential, contactCards, bookingCard, legalBody with updatedAt), seo | `content/pages/*`, `content/legal/*` |
| | | Amended 2026-09-13 (ADR-031, as shipped): blocks `richText`, `story` (heading, text, line, photo, facts-band switch), `cards` (icon, title, text, art), `steps`, `profitEquation`, `faqList` (all groups or a slice of the home entries, link, closing line), `miskCredential`, `contact` (the cards' titles and the booking card; the form is interface copy in code), `legalBody` (Markdown + date), `mediaBanner`; `seo` group (title ≤ 70, description ≤ 160, share image) instead of `plugin-seo`; the seven slugs are reserved (route folders in code, no rename, no delete) and other published pages are served by `/[slug]`; unknown top-level URLs get the global 404 through the proxy (ADR-032). | `content/seed/pages.ts`, `content/seed/legal/*.md` (seed) |
| `faqs` | Collection | group, question, answer, order, showOnHome, homeOrder (1–5; a sixth `showOnHome` is refused, ADR-031) | `content/seed/faq.ts` (seed) |
| `testimonials` | Collection | quote, name, store, avatar, placeholder (default false), order | `content/testimonials.ts` |
| `integrations` | Collection | platform (salla \| zid \| shopify, selects the brand SVG that ships with the code, ADR-031), name, nameLatin, order | `content/seed/integrations.ts` (seed) |
| `media` | Collection | upload with alt (required, Arabic), focal point, credit | `public/images/*` |
| `redirects` | Collection (plugin) | from, to, type 301/308/410 | `lib/redirects.ts` |
| `users` | Collection | email, role, name | |
| `posts`, `categories`, `authors` | Collections | Level 3 (§10) | `content/blog/*` |

Official plugins: `@payloadcms/plugin-seo` (title/description/OG fields with Arabic length hints and a preview), `@payloadcms/plugin-redirects`, `@payloadcms/plugin-form-builder` (Level 4), `@payloadcms/plugin-search` (Level 3), `@payloadcms/storage-s3`. Amended 2026-09-13 (ADR-031): `plugin-seo` is not used; each page carries a `seo` group with the same limits.

Field rules: every text field shows its §4 default as the initial value after migration; numeric fields for money are integers in SAR; `suggestedPrice` must be ≥ `baseCost` (validation); `delivery.maxDays` is an integer; `offer.welcomeCredit` is an integer displayed everywhere from this single value.

### 9.5 Editing experience

- The home page is a Global with fixed sections (order not editable; Dhia wanted a designed page, not a page builder). Each section's fields are editable; each section has an `enabled` toggle except hero, product strip, designer, and ribbon.
- Other pages use a small block set (rich text, cards, steps, media banner) so new pages can be assembled in Level 2 without code (for example a future `/creators` landing).
- Rich text is Lexical with headings H2/H3, lists, links, images, and a "CTA block" custom node; RTL editing verified. Amended 2026-09-13 (ADR-031): shipped without the CTA node, no seeded page needs one; docs/IDEAS.md holds it.
- Product prices, the welcome credit, and the delivery days each carry a help text reminding the editor that they must match the app (no API sync, decision D-41).
- Media library requires Arabic alt text on upload.

### 9.6 Publish pipeline

On publish or update of any content: Payload `afterChange` hook → `revalidateTag('content')` and `revalidatePath` for affected routes → regenerate `sitemap.xml` (dynamic route reading from Payload with a 1-hour cache) → enqueue an IndexNow ping for the changed URLs (job) → clear the CDN zone for those paths if CranL exposes a purge API. Static pages stay static: the site reads content at build and via ISR (`revalidate` tags), never per-request from the database.

Amended 2026-09-13 (Phase 2a, ADR-030): tag-based revalidation is not used. Every public page and the metadata routes carry `revalidate = 60` (ISR), the data layer reads Payload directly with per-render deduplication (published documents only), and the `afterChange` / `afterDelete` hooks call `revalidatePath` on the product's page and the routes that list it (home, listing, sitemap), and on every static route for a global. `/products/[slug]` accepts unknown params so a product published in the admin gets its page on first request. A publish is live at once; draft autosaves change nothing. The IndexNow ping and the CDN purge stay planned for 2b.

Amended 2026-09-13 (Phase 2b, ADR-033): the jobs queue runs in-process on a one-minute cron (never during the build; the run endpoint answers nobody); scheduled publish is on for the home page, pages, products and testimonials, and a publish from a job falls back to the 60 s timer for regeneration; the IndexNow ping is a queued job with three retries, sent only on the production runtime (`B7R_RUNTIME=production`) with a key; admin-added redirects resolve in the `/[slug]` route (308/307) and join the proxy allowlist (ADR-032).

### 9.7 Migration from Level 1 content files

`scripts/migrate-content.ts`: reads `content/*` (already schema-validated), uploads referenced images to the media collection with their alt text, and creates documents. Idempotent (upserts by slug). After migration, the content files are deleted and `content/schema.ts` becomes the typed client for Payload's generated types. Level 1 pages are refactored to read from Payload through a thin data layer (`modules/*/data.ts`) with `unstable_cache` tags; components do not change.

Amended 2026-09-13 (Phase 2a, ADR-026, ADR-029): the migrated files move to `src/content/seed/*` and stay as fixtures (schema-validated, BRD-verbatim tested, the static fallback for the error page and the 410 body). The script is create-only: it refuses a non-empty database without `--force` and never overwrites a document the CMS holds; media files are named `{product}-{colour}-{side}.jpg` and matched by filename. The data layer is `src/lib/cms/*` (Local API, published Arabic documents, zod-parsed into the §8.4 contract, deduplicated per render). Media is served through Next's image optimizer, never from the storage URL directly, so the site CSP keeps `img-src 'self'` and the designer canvas stays untainted.

### 9.8 Acceptance (Level 2)

1. Dhia logs in at `/admin` (English UI, Arabic content in its fields, ADR-039 amendment), edits the hero headline, publishes, and sees the change on b7r.sa within 60 seconds without a deploy.
2. Editor role cannot see users or settings and cannot delete published items.
3. All Level 1 acceptance criteria (§6.18) still pass; Lighthouse scores unchanged (content is still static at request time).
4. Migration script runs clean on an empty database and is idempotent on a second run.
5. IndexNow and revalidation hooks fire on publish (visible in job logs).
6. Backups exist and a restore has been rehearsed once (documented in `RUNBOOK.md`).

Amended 2026-09-13 (Phase 2b, ADR-034): (1) proven by `e2e/admin.spec.ts` (a home publish is on `/` at once); (2) proven for users, settings, redirects, published products/pages/testimonials and live FAQ entries; (4) `scripts/ci/seed-check.sh` every CI run; (5) IndexNow is a queued job on the production runtime, revalidation runs from every publish hook; (6) the weekly `Backup` workflow writes to a private bucket and CI rehearses a restore on every run (`scripts/ci/restore-check.sh`), the once-off rehearsal from a CranL snapshot remains a launch step. The login Turnstile is a verified gate cookie rather than a token per attempt (ADR-034).

---

## 10. Level 3: blog and automated content engine

### 10.1 Blog (CMS-backed)

**Data model:** `posts` (title, slug, excerpt, hub relationship, tags[], cover media, takeaways[3], body rich text with the CTA block, author relationship, publishedAt, updatedAt (meaningful only), readingMinutes computed, status, `origin: manual | ai`, seo), `categories` (the six hubs with slug, name, description, hero copy for the hub page, defaultCover), `authors` (name ضياء, role مؤسس بحر برنت, bio, photo, sameAs[]), `tags`.

**Routes:** `/blog` (hubs strip, featured post, latest grid, pagination `?page=`), `/blog/category/{hub}` (hub page: H1, description, posts), `/blog/{slug}` (template from §6.11), `/author/dhia` (ProfilePage schema), `/feed.xml` (RSS 2.0, full text of the latest 20), sitemap entries with real `lastmod`. Search via `plugin-search` on `/blog?q=`.

**Templates:** unchanged from Level 1 plus: table of contents from H2s (desktop side rail), estimated reading time, "updated" date when `updatedAt` > `publishedAt`, related posts by hub then tags, previous/next within the hub.

**Editorial rules enforced in the CMS:** title ≤ 70 characters, excerpt ≤ 160, exactly three takeaways, at least two internal links (validated on publish), cover alt text required, no external links to competitors (soft warning), no Latin-script paragraphs (warning).

*Amended 2026-09-14 (ADR-041, as shipped): the body is Lexical rich text (h2/h3, lists, links, blockquote, uploads; no tables); `readingMinutes` is computed on save; `updatedAt` is the field `contentUpdatedAt`, set by an editor or the freshness job; `origin` is `manual | ai | ai-edited`. Pagination is `/blog/page/{n}` and `/blog/category/{hub}/page/{n}` rather than `?page=`, and search is a client-side island over an embedded index rather than `plugin-search`, so every blog route prerenders (Constitution II). An em dash in the text is a third soft warning. `tags` are optional; related posts fall back to the hub, then recency.*

*Amended 2026-09-14 (Level 5b, ADR-043): the blog exists in English under `/en/blog`, `/en/blog/category/{hub}`, `/en/author/{slug}` and `/en/feed.xml` from the same documents; a post, hub or author with an English value is on the English site, one without is not. Editorial rules apply per language: the "Latin-script paragraphs" warning on the Arabic version, an "Arabic-script paragraphs" warning on the English one; reading time at 150 words a minute for Arabic and 200 for English; `readingMinutes` and `warnings` per language. The engine (§10.2) writes Arabic until 5c.*

### 10.2 Automated content engine

Dhia's decision (D-44): **fully automatic publishing with no human approval step.** The engine therefore carries every safety net that a human would otherwise provide. It is a module (`modules/ai-content`) with its own admin screens, and it never appears on the public site in any form (no "generated by" labels, no AI author).

#### 10.2.1 `ai-settings` Global (admin role only)

| Group | Fields |
|---|---|
| Providers | `activeProvider` (openai · deepseek · anthropic · google), `models` per provider (free-text model id, never hardcoded in code), API keys per provider stored encrypted with Payload's `encrypt`/`decrypt` and masked in the UI |
| Cadence | `enabled` (kill switch), `postsPerDay` (default 1; help text: "التوصية المدعومة بالدراسات: 8–16 مقالة شهرياً؛ الجودة قبل الكمية"), `publishHourRiyadh` (default 09:00), `maxPostsPerMonth` cap (default 31), `dailyCostCapUsd` |
| Language and style | `language` (ar only in this phase), `styleGuide` (long text, pre-filled from §4.1 and Appendix E), `systemPrompt` (versioned), `bannedPhrases` (pre-filled: قم بـ, تم , يرجى, بنجاح, الخاص بك, هناك …), `bannedClaims` (free-text list, pre-filled: any delivery promise other than 5 days, any product not in the catalog, any price not in the catalog, any claim about Printful/Printify beyond public facts, "أفضل في السعودية", guarantees of income) |
| Facts sheet | Read-only view generated from `site-settings` + `products` + `integrations` (prices, delivery, offer, integrations, contact). The engine injects it into every prompt and validates drafts against it. |
| Images | `imageMode` (generate · stock · hubDefault), `imageProvider` + key, `imageStyle` prompt suffix ("no text, no letters, no logos, flat studio light, brand blue accents"), `stockProvider` (pexels) + key |
| Quality | `qualityThreshold` (0–100, default 80), `maxRevisionPasses` (default 1), `minWords` 800, `maxWords` 1600 |
| Notifications | `notifyEmail` (Dhia), `weeklyDigest` on, `failureAlerts` on |

*Amended 2026-09-14 (ADR-042, as shipped): providers are `openai · deepseek · anthropic · google` plus a `mock` for tests only (`AI_CONTENT_MOCK=1`, refused in production); keys are encrypted with Payload's `encrypt` and read back masked; the settings carry per-provider cost rates (an estimate) and `reviewFirstRuns` (the first posts of a live provider land as drafts). `imageMode: generate` is refused until an image provider is wired; `hubDefault` and `stock` (Pexels) ship. The facts sheet is a read-only tab built live from the site settings, the products and the integrations.*

*Amended 2026-09-14 (Level 5c, ADR-043): the "Language and style" group is localised. `language` is no longer a setting: each topic names its language (§10.2.2), and the admin edits the style guide, system prompt, banned phrases and banned claims of each language under the panel's locale control (English pre-filled from the code defaults). The facts sheet renders in both languages.*

*Amended 2026-09-15 (ADR-047): the Providers group is gone. Keys live in the `connections` collection (Admin group, admins only): one row per AI account with its kind (`openai`, `anthropic`, `google`, `deepseek`, an OpenAI-compatible endpoint with its `https://` address, `mock` for tests), model id, encrypted key, rates, a monthly limit in USD, a switch, a "Test connection" action that records its outcome on the row, and two derived numbers read from the runs log (spent and runs this month, Riyadh). The engine settings' Cadence group holds one `connection` relationship; a run is refused with no connection, an off connection, or a connection whose month's spend reached its limit, in addition to the caps above. `ai-runs` records the connection of each run.*

#### 10.2.2 `ai-topics` Collection

Fields: title, `language` (ar · en, default ar; the post is written and published in it, Level 5c), hub, primaryKeyword, secondaryKeywords[], intent (informational · commercial · seasonal), priority (1–5), preferredPublishWindow (for seasonal topics, e.g. National Day: publish six weeks before 23 September), status (backlog · scheduled · generating · published · failed · rejected), source (seed · manual · searchConsole), notes, resulting post relationship, lastError. The backlog is seeded from Appendix E on migration. Dhia can add topics manually; Level 4 adds Search Console-driven suggestions.

*Amended 2026-09-14 (ADR-042): `preferredPublishWindow` is a pair of dates (`windowStart`, `windowEnd`); a topic outside its window is not picked. Bulk add from CSV above the list; "Generate now" in the edit view.*

#### 10.2.3 `ai-runs` Collection (audit log)

One document per pipeline execution: topic, provider/model, each step's input hash, output summary, review score and rubric breakdown, tokens and estimated cost, duration, final status, post id, error. Retained 12 months.

*Amended 2026-09-14 (ADR-042): each run row also keeps the outline (the freshness job regenerates from it), the step log with an input hash over the brief and the outline, and `kind` (`generate | freshness`); each engine post keeps the facts sheet's numbers of the day (`factsBaseline`; drift is a number that was on the sheet and is not any more); cost is an estimate from tokens and the settings' rates. The schedules (hourly tick, weekly freshness, weekly digest with the twelve-month sweep) are Payload job schedules on the `ai` queue.*

#### 10.2.4 Pipeline (Payload Jobs workflow `generatePost`, tasks are retryable, each ≤ 120 s)

1. **pickTopic**: highest-priority `backlog` topic whose window is open; skip if a published post already covers the same primary keyword or has ≥ 60% title token overlap (dedupe); set `generating`.
2. **brief**: build the brief = facts sheet + hub description + primary/secondary keywords + intent + three "answer-first" questions the post must answer + internal link targets (`/products/*`, `/how-it-works`, `/faq`, related posts by hub).
3. **outline**: H2s phrased as questions, each with a one-sentence direct answer; the first H2 answers the primary keyword; a "أهم النقاط" list of three; one CTA block position after the second H2.
4. **draft**: Arabic, 800–1600 words, فصحى مبسطة with the §4.1 rules, short paragraphs, lists and tables where useful, at least one concrete example with real SAR numbers from the facts sheet, no first-person plural claims outside the facts sheet, no mention of AI, no Latin paragraphs, no em dashes, author voice "ضياء، مؤسس بحر برنت" only in the byline.
5. **selfReview**: a second model call grades the draft on a 100-point rubric: factual consistency with the facts sheet (30; any number or claim not in the sheet costs points; a numeric regex extracts all numbers with ريال/يوم/منتج context and compares), Arabic quality and banned phrases (25), structure and answer-first compliance (20), usefulness and specificity to Saudi merchants (15), length and formatting (10). If score < threshold, one revision pass with the critique; if still below, mark topic `failed`, log, alert Dhia, stop.
6. **image**: per `imageMode`: generate a 16:9 cover with a prompt built from the topic + `imageStyle` (never Arabic or any text in the image), or fetch one Pexels photo by an English keyword derived from the topic (store attribution and URL), or use the hub's default cover. Generate Arabic alt text.
7. **seo**: title ≤ 60 chars containing the primary keyword, meta description ≤ 155, Latin slug transliterated from the primary keyword (≤ 40 chars, unique), OG image = cover, `inLanguage: ar`.
8. **publish**: create the post (`origin: ai`, author ضياء, hub, tags), status published at the scheduled slot; run the editorial validations from §10.1 (internal links, takeaways, alt text); revalidate; IndexNow; sitemap; RSS.
9. **notify**: append to the weekly digest; immediate email on failure or when the cost cap is hit.

Scheduling: `GET /api/jobs/run?token=…` (constant-time token check) is called hourly by CranL's scheduler or by cron-job.org as the B7R app does; the handler runs due jobs, respecting `postsPerDay`, `maxPostsPerMonth`, `dailyCostCapUsd`, and the kill switch. A **freshness job** runs weekly: for the ten posts with the most Search Console clicks (Level 4) or, before that, the ten oldest published, re-run `selfReview` against the current facts sheet; if prices or promises changed, regenerate the affected paragraphs, set a real `updatedAt`, and revalidate.

*Amended 2026-09-14 (ADR-042, as shipped): the nine tasks are inline tasks of one workflow on the `ai` queue, each retried on its own; the model writes Markdown that is converted to the post editor's Lexical tree; the review merges the rubric with deterministic checks and refuses an em dash or an AI mention outright; the CTA is placed by the template (§6.11), not by the outline; step 6 uses the hub's default cover or a stock photo (generation deferred); scheduling runs on Payload's in-process job schedules (ADR-033) rather than an external hourly call, in 3c.*

#### 10.2.5 Guardrails (all mandatory)

- Kill switch in settings and a `AI_CONTENT_ENABLED` env override.
- Per-day and per-month caps; cost cap; provider timeouts; exponential backoff; no infinite retries.
- Dedupe against existing posts; never republish the same topic within 12 months.
- Facts-sheet validation; banned-claims scan; banned-phrases scan; no external links except b7r.app and government/official sources from an allowlist.
- One-click **unpublish** and **regenerate** buttons on every AI post in the admin; edits by an editor mark the post `origin: ai-edited` and exempt it from the freshness job.
- Every post carries the human byline (ضياء) and no AI disclosure (decision D-47). The `ai-runs` log is the internal audit trail.
- Research caveat recorded in the admin help text: unreviewed high-volume AI publishing risks Google's scaled-content policy; keep cadence moderate and quality gates strict (`docs/research/04` §5).

*Amended 2026-09-14 (ADR-042): the daily and monthly caps count runs started in the period, so a second runner or a restart cannot publish twice; `pickTopic` is a compare-and-set; `reviewFirstRuns` holds a live provider's first posts as drafts; external links are filtered to b7r.app, b7r.sa and `.gov.sa` hosts.*

#### 10.2.6 Provider layer

Vercel AI SDK provider registry: `openai`, `deepseek`, optional `anthropic` and `google`. Model ids are settings strings. Image generation through the same SDK where the provider supports it, otherwise a thin REST client. All calls server-side in jobs; nothing in the browser.

*Amended 2026-09-14 (ADR-042): the Vercel AI SDK with `openai`, `deepseek`, `anthropic` and `google`; image generation waits behind the provider interface.*

#### 10.2.7 Admin screens

"المحتوى الآلي" group: الإعدادات (the Global), المواضيع (backlog table with bulk add from CSV and a "توليد الآن" action), السجل (runs with scores and costs), لوحة المتابعة (posts this month, average score, failures, cost to date, next scheduled slot).

*Amended 2026-09-14 (ADR-042): the group is "AI content" with Engine settings, Topics and Runs; the monitoring numbers (posts this month, average score, failures, cost, next slot, latest runs) are a card on the dashboard for admins rather than a separate view. Amended 2026-09-15 (ADR-046): the three entries are the "Content engine" section inside the Blog group of the reshaped sidebar (Site · Catalogue · Blog · Visibility · Admin), in the Blog hue.*

*Amended 2026-09-16 (ADR-048): the dashboard carries a "Traffic, last 7 days" card for admins: landings by group (AI assistants, search, social, other sites, direct), the top channel and the crawler reads, from the site's own count (§11.4).*

### 10.4 The visibility score (ADR-049, 2026-09-16)

An admin page under Visibility and a dashboard card: how compliant the site is with SEO and GEO, as a percentage overall and per section, each item done, next or missing with a guide that links to the field that fixes it. Computed from the content on every open (never stored; the nightly snapshot keeps the history), with outside signals counting in the number (Dhia's decision) and a site-only percentage beside it.

| Section (weight) | Items (weight) |
|---|---|
| Identity (15) | English tagline (4) · profiles as https links (4) · About in both languages (3) · every author with a bio, a photo and a profile link (4) |
| Crawl access (20) | the production address (5) · IndexNow (3) · Search Console connected and tested (4) · Bing connected and tested (3) · every published document in English (5) |
| Extractability (30) | emitted titles ≤ 70 and descriptions ≤ 155 on every page (6) · English alt on every photo in use (4) · every post opens with a 40 to 80-word answer (6) · a question H2 on every post (4) · at least five FAQ entries per language (3) · FAQPage JSON-LD (4) · a compare page (3) |
| Corroboration (10) | the five-box off-site checklist (10) |
| Measurement (10) | landings in 30 days (3) · five prompts per language (3) · a ledger run in 14 days (4) |
| Outside signals (15) | PageSpeed mobile ≥ 90 by the median of three nights (6) · impressions (3) · a category term in the top ten queries (2) · the cited-rate ≥ 50% (4) |

What the site guarantees by construction (required fields, publish rules, the generated files) is listed as facts and earns no points. A rule over documents is pro-rata. The site-only percentage leaves out the four outside items and the two verifications. The services and the ledger follow in the same project (§11.4).

*Amended 2026-09-16 (ADR-049, PR 3b): the outside services are Connection rows (Google Search Console by a service account key file, Bing Webmaster Tools by its API key, PageSpeed Insights with or without a key), one enabled per kind, each with a Test. A nightly pull (04:00 Riyadh) writes one snapshot per service and the day's score into `metrics` ("Snapshots" under the Score page), one row per day and source, a second pull the same day replacing it; "Pull now" on the page and `pnpm visibility:pull` run it by hand. The page shows the latest snapshot per service with its date and "up N points since <date>".*

*Amended 2026-09-16 (ADR-049, PR 3c): the citation ledger. `prompts` (the buyer questions, fifteen seeded, editable) and `citations` (read-only rows) under the Score page; every Monday every enabled AI connection is asked every enabled prompt with the vendor's web search on, one `citation` run per connection in the engine's runs (outside the daily cost cap, inside the connection's monthly limit); the page shows the cited-rate and linked-rate per engine over four weeks, the per-prompt table, the excerpts, the competitors named most and, for a prompt no engine names B7R on, the page to improve. "Run now" starts a batch.*

### 10.3 Acceptance (Level 3)

1. Manual posts: an editor writes, previews, schedules, and publishes a post; hub pages, RSS, sitemap, IndexNow, and related posts update.
2. Automatic posts: with `postsPerDay = 1`, the engine publishes one post per day for five consecutive days from the seeded backlog, each scoring ≥ 80, each with three takeaways, internal links, a cover with Arabic alt text, no banned phrases, and numbers matching the facts sheet (verified by tests with a mocked provider and by one live run per provider).
3. Changing `site-settings.delivery.maxDays` and running the freshness job updates affected posts and their `updatedAt`.
4. Kill switch stops the next scheduled run within one hour; the failure path emails Dhia.
5. No public page, feed, or schema mentions AI.

---

## 11. Level 4: inbox, bookings, newsletter, analytics

### 11.1 Inbox

- `form-submissions` (from `@payloadcms/plugin-form-builder` or a custom collection fed by `/api/contact`): name, phone, email, inquiryType, message, source page, UTM, created, `status` (جديد · قيد المتابعة · تمت المعالجة), assignee, internal notes. List view with filters and quick actions: "رد عبر واتساب" (opens `wa.me` with the phone and a greeting), "رد بالبريد" (`mailto:`), mark handled.
- `bookings`: mirrored from Cal.com webhooks (§11.2): name, email, phone, start/end (Asia/Riyadh), meeting type, status (booked · rescheduled · cancelled · completed), Cal.com uid, notes.
- Both appear on an "البريد الوارد" dashboard view with counts of new items; optional daily email summary to Dhia.

### 11.2 Bookings (Cal.com)

- Dhia creates a hosted Cal.com account with one event type: **استشارة مجانية، 30 دقيقة** (Riyadh timezone, Arabic description, WhatsApp/phone question in the booking form). The event URL goes into `site-settings.bookingUrl`.
- Site: the contact page's booking card becomes an inline Cal.com embed (`@calcom/embed-react`, Arabic locale if available, brand colour `#0058B0`), plus a dedicated `/book` page with the same embed and the §4.11 copy. The CSP `frame-src` allows `app.cal.com`.
- Webhook `POST /api/webhooks/cal` (secret in `CAL_WEBHOOK_SECRET`, signature verified) upserts `bookings`; sends Dhia a notification email; adds the booker to the inbox.
- Fallback: if `bookingUrl` is empty, the WhatsApp behaviour from §6.9 remains.

### 11.3 Newsletter

- `subscribers` collection synced from the Resend audience (webhook or nightly sync): email, source page, created, status. Export CSV. Unsubscribe link handled by Resend.
- Admin can send a campaign later (out of scope now; keep the audience clean).

### 11.4 Analytics in the admin

- **Umami** first: the admin dashboard embeds Umami's share URL or calls its API (`/api/websites/{id}/stats`) for the last 7/30 days: visitors, page views, top pages, referrers, events (`cta_click`, `whatsapp_click`, `contact_submit`, `outbound_app_click`).
- **GA4** second: Analytics Data API via a Google service account (`GOOGLE_SERVICE_ACCOUNT_JSON` env, base64) for sessions by channel (including "AI Assistants"), key events, landing pages.
- **Search Console** third: Search Analytics API with the same service account (added as a property user): clicks, impressions, CTR, position by page and query; the top queries feed `ai-topics` suggestions (source `searchConsole`).
- A nightly job caches results into a `metrics` collection; the admin "التحليلات" view renders charts (recharts) from the cache so the admin never waits on Google APIs.

*Amended 2026-09-16 (ADR-048, Dhia's decision): the referrer part of the Umami pull is replaced by the site's own counter: a `traffic` collection of daily rows (day, kind, source, page, hits) fed by a first-party landing beacon and by the proxy's count of known AI and search crawlers; the channel (ChatGPT, Gemini, Claude, Perplexity, Copilot, Google, Bing, the social networks, other sites, direct) is derived at read. Nothing identifies a visitor. Shown on the dashboard card and, next, on a Traffic page under Visibility. Umami's visitors and page views stay "if ever"; GA4 stays for consented sessions; Search Console, Bing and PageSpeed come with the visibility score.*

*Amended 2026-09-16 (ADR-049, PR 3b): Search Console is connected by a service account's key file pasted into a Connection row (no `GOOGLE_SERVICE_ACCOUNT_JSON` variable), Bing Webmaster Tools by its key and PageSpeed Insights with or without one; the nightly job pulls them into `metrics` (one row per day and source) together with the day's visibility score, and the Score page reads the snapshots; there is no separate "التحليلات" view or charts. The top Search Console queries create `ai-topics` suggestions (`source: searchConsole`) as written. GA4 is dropped: Search Console and the site's own counter answer the same questions.*

### 11.5 Acceptance (Level 4)

1. A contact submission and a Cal.com booking both appear in the inbox within a minute, with working reply actions.
2. `/book` and the contact page embed Cal.com and record a real test booking.
3. Newsletter subscribers list matches the Resend audience.
4. Analytics view shows Umami, GA4, and Search Console numbers for the last 30 days from the cache; Search Console queries create at least five suggested topics.

---

## 12. Phases, definitions of done, launch checklist, future blocks

### 12.1 How phases run

Each phase = one Spec Kit feature (`specify` → `plan` → `tasks` → `implement` → `converge`) wrapped by the cto-cycle skill (plan review, implementation, code review, fixes). One PR per phase. The PR description lists every DoD item with evidence. The next phase starts only when the previous PR is merged, except where a **Dhia gate** is marked: there, stop and wait for Dhia's explicit approval.

### 12.2 Level 1 phases

**Phase 1a: Foundation, design system, shell, hero, product strip, designer** (Dhia gate at the end)

Scope: repository, tooling, CI, guardrails (§8.7–8.8); tokens and `globals.css`; fonts; shared components (§3.10); content contract and Level 1 content files (§8.4, §4); header, footer, CTA ribbon, wave divider; the home page with the hero (§6.4.1), product strip (§6.4.2), and the interactive designer with profit calculator (§6.4.3); remaining home sections rendered as clearly marked empty placeholders; 404; `/api/health`; Dockerfile; first CranL deploy on a temporary CranL domain (not yet b7r.sa; `NEXT_PUBLIC_SITE_URL` unset so the site is noindex).

DoD: §6.18 items 4, 5 (for the built sections), 6, 10, 12; Lighthouse mobile ≥ 90 on `/`; the three built sections pixel-reviewed by the `design-review` skill with zero "AI slop" findings; Dhia reviews the deployed URL and approves. **This phase is what Dhia uses to judge whether the agent continues.**

**Phase 1b: Rest of the home page**

Scope: steps (§6.4.4), video (§6.4.5), why us, testimonials (placeholder mode), integrations, home FAQ, WhatsApp widget (§6.15), consent bar and analytics (§6.16), newsletter (§6.14), events.

DoD: §6.18 items 7 (newsletter part), 8, 9, 10, 11, 12; Lighthouse and CWV budgets on `/` with everything enabled; reduced-motion audit; e2e for the widget, consent, and newsletter.

**Phase 1c: Pages, SEO layer, cutover**

Scope: products listing and detail pages, how-it-works, about, contact with the working form and booking card, FAQ page, blog placeholder with three sample posts, legal pages, redirects and 410s, sitemap, robots, IndexNow, metadata and JSON-LD for every page, OG images, manifest and icons, security headers, RUNBOOK.

DoD: all of §6.18; Search Console and Bing verification tokens in place; launch checklist §12.4 items 1–12 complete; Dhia approves; DNS cutover executed; post-cutover checks (§12.4 items 13–18) pass.

### 12.3 Levels 2–4 phases

| Phase | Scope | DoD |
|---|---|---|
| 2a | Payload install in the same app; Postgres and S3 on CranL; users and roles; `site-settings`, `navigation`, `seo-defaults`, `products`, `media`; migration script; the site reads products and settings from Payload via cached data layer | §9.8 items 1, 2, 3 (for migrated parts), 4 |
| 2b | `home` Global, `pages` with blocks, `faqs`, `testimonials`, `integrations`, `redirects` plugin, SEO plugin, revalidation + IndexNow hooks, backups, admin Arabic polish, content files removed | §9.8 all |
| 3a | Blog collections, hub and author routes, RSS, search, templates upgrade, editorial validations | §10.3 item 1, 5 |
| 3b | `ai-settings`, `ai-topics`, `ai-runs`, provider layer, pipeline tasks with mocked-provider tests, admin screens | §10.3 items 2 (mocked), 4, 5 |
| 3c | Live provider runs, scheduling endpoint, freshness job, seeded backlog, first ten automatic posts, monitoring and digest | §10.3 all |
| | *Amended 2026-09-14 (ADR-042): shipped as Payload schedules on the in-process runner (no endpoint), the freshness pass on a facts baseline per run, the digest and the retention sweep, the thirty-topic backlog with windows, ten mock posts on the review server. The live run per provider (§10.3 item 2) waits for Dhia's keys: add a key in Engine settings, pick the provider, press "Generate now"; the first three posts land as drafts.* | |
| 4a | Inbox collections and dashboard, subscribers sync | §11.5 items 1 (contact part), 3 |
| 4b | Cal.com embed, `/book`, webhook, bookings | §11.5 items 1 (booking part), 2 |
| 4c | Metrics job, analytics view, Search Console topic suggestions | §11.5 item 4 |
| 5a | The English site at `/en/` (`specs/009-level-5-english/`, ADR-043): second root layout, per-locale copy banks, locale reads with the presence gate, hreflang and sitemap alternates, the switch, English forms and e-mails, English CMS content and legal drafts in the seed | Every public page except the blog answers in English with the same static behaviour, budgets and accessibility; the Arabic site unchanged |
| 5b | The blog in English: `/en/blog`, hubs, authors, pagination, search, feed, translation pairs; the three Level 1 posts in English | `/en/blog/*` per locale; `BLOG_ENGLISH_PENDING` removed |
| 5c | The engine in English: `ai-topics.language`, prompts and checks per locale, a 15-topic English backlog; `llms.txt` | English posts from the backlog under the same guardrails |

### 12.4 Launch checklist (Level 1 go-live on b7r.sa)

Before cutover:
1. Three real testimonials entered and `placeholder` removed, or the section disabled by Dhia's written decision.
2. The app's Zid and Shopify integrations are enabled so the site's "متاح الآن" is true (Dhia confirms).
3. Final hero photos delivered and cropped, or Dhia accepts the placeholders for launch.
4. Resend domain `b7r.sa` verified (SPF, DKIM, DMARC); a test contact email received at contact@b7r.sa.
5. Turnstile keys set; a bot submission is blocked; a human submission passes.
6. GA4 consent flow verified in DebugView; Umami receiving events.
7. `INDEXNOW_KEY` file live; Google and Bing verification tokens set.
8. OG default image and product OG images render correctly in WhatsApp, X, and LinkedIn previews.
9. Favicon set and manifest validated.
10. All §5.2 redirects tested against the live old URLs list.
11. Lighthouse CI green on the production build; axe zero serious issues.
12. RTL QA on iOS Safari and Chrome Android completed with screenshots attached to the PR.

Cutover:
13. DNS `b7r.sa` A/CNAME to CranL; `www` redirect; TLS valid.
14. Old Hostinger site kept for 14 days, then cancelled.

After cutover (same day):
15. Search Console: domain property verified, sitemap submitted, "Search generative AI control" on Include, request indexing for the home page.
16. Bing Webmaster Tools: verified, sitemap submitted, IndexNow ping sent for all URLs.
17. Crawl the live site with a link checker: zero 404s, zero mixed content.
18. Verify `robots.txt`, `sitemap.xml`, canonical tags, and JSON-LD on the live domain with Google's Rich Results Test.

### 12.5 Documentation upkeep rule

This BRD is a living document. When a feature changes, the agent updates the relevant section in `docs/brd-sections/`, rebuilds the master file, and records an ADR. Appendix I (the English copy bank) is generated from `src/content/copy/en.ts` by `pnpm copy:appendix` before the rebuild; it is never edited by hand. When a phase completes, its DoD evidence is linked from `docs/DECISIONS.md`. The BRD never lags the code by more than one merged PR.

### 12.6 Future blocks (reserved, not built until Dhia schedules them)

Salla and Zid landing pages (`/salla`, `/zid`) with app-store deep links · Comparison page "بحر مقابل Printful وPrintify" · Seasonal calendar hub · Creators landing (`/creators`) · Business landing (`/business`) · 2FA for admin · GlitchTip error tracking · Product-level Merchant Center feed · Newsletter campaigns · Case studies collection · Live order ticker on product pages (once volume exists) · WebMCP readiness.

---

## 13. Appendices

### Appendix A: Product data (the only source for product content)

Common to all: print area الواجهة الأمامية 28 × 38 سم; print method label طباعة رقمية عالية الجودة; photos in `resources/products/{slug}/`; all prices in SAR, integers, displayed with `SarAmount`.

| slug | name | baseCost | suggestedPrice | colours (slug · name · hex) | sizes | material | weightGrams |
|---|---|---|---|---|---|---|---|
| `tee-essential` | تيشيرت أساسي | 45 | 89 | white · أبيض · #FFFFFF; black · أسود · #000000 | S, M, L, XL, 2XL | قطن ناعم عالي الجودة | 180 |
| `tee-oversize` | تيشيرت أوفرسايز | 55 | 119 | white · أبيض · #FFFFFF; black · أسود · #000000 | S, M, L, XL, 2XL | قطن ثقيل متين بقصة واسعة | 240 |
| `hoodie` | هودي | 95 | 189 | white · أبيض · #FFFFFF; black · أسود · #000000 | S, M, L, XL | قماش فاخر ببطانة ناعمة، مع فتحات للإبهام | 520 |
| `baby-onesie` | بربتوز أطفال | 35 | 69 | white · أبيض · #FFFFFF | 0–3M, 3–6M, 6–12M, 12–18M | قطن ناعم مناسب لبشرة الرضيع | 80 |
| `tote-bag` | حقيبة قماشية | 30 | 65 | beige · بيج · #F5F5DC | مقاس واحد | كانفاس عالي الجودة بمقابض قوية | 220 |

**Short descriptions (cards, meta):**
- تيشيرت أساسي: تيشيرت كلاسيكي بياقة دائرية وقصة منتظمة، قطن ناعم بوزن 180 غم.
- تيشيرت أوفرسايز: قصة واسعة وأكتاف منسدلة، قماش ثقيل بوزن 240 غم يناسب تصاميم الشارع.
- هودي: هودي دافئ بفتحات للإبهام، قماش فاخر ببطانة ناعمة بوزن 520 غم.
- بربتوز أطفال: قطعة واحدة ناعمة على بشرة الرضيع، بفتحات مرنة لسهولة اللبس.
- حقيبة قماشية: كانفاس متين بمساحة واسعة للطباعة ومقابض تتحمل الاستخدام اليومي.

**Full descriptions (product page "الوصف"):**
- تيشيرت أساسي: تيشيرت كلاسيكي بياقة دائرية وقصة منتظمة تناسب الجميع. مصنوع من نسيج قطني ناعم وعالي الجودة يوفر راحة مثالية طوال اليوم، وهو الخيار الأول للبراندات التي تبحث عن قطعة أساسية تدوم طويلاً وتتحمل الاستخدام المتكرر.
- تيشيرت أوفرسايز: يتميز هذا التيشيرت بقصة واسعة وأكتاف منسدلة ليعطي مظهراً عصرياً وجريئاً. القماش ثقيل ومتين ليناسب أزياء الشارع، مما يوفر مساحة واسعة ومسطحة تسمح بتصاميم إبداعية كبيرة الحجم بجودة احترافية.
- هودي: هودي دافئ وعصري مزود بفتحات عند نهاية الأكمام لإدخال الإبهام، مما يساعد في ثبات الأكمام ويوفر تدفئة إضافية لليدين. مصنوع من قماش فاخر ببطانة ناعمة، مما يجعله خياراً ممتازاً للمجموعات الشتوية والملابس الرياضية.
- بربتوز أطفال: ملابس أطفال قطعة واحدة مصممة بعناية لتكون ناعمة جداً على بشرة الرضيع الحساسة. يتميز بفتحات مرنة لسهولة اللبس والخلع، ونستخدم فيه تقنيات طباعة تضمن بقاء الألوان زاهية وسلامة التصميم حتى بعد دورات غسيل متعددة.
- حقيبة قماشية: حقيبة قماشية عملية ومتينة مصنوعة من الكانفاس عالي الجودة، مصممة لتكون رفيقاً يومياً مثالياً للتسوق أو العمل. تتميز بمساحة واسعة تسمح بطباعة تصاميم فنية كبيرة وواضحة، مع مقابض قوية تتحمل الاستخدام المستمر والأوزان المختلفة.

**Size charts (cm):**

Adult tees and hoodie (the app uses one table for all adult sizes; Dhia to confirm oversize and hoodie figures before launch):

| المقاس | الطول | عرض الصدر | طول الكم |
|---|---|---|---|
| S | 68 | 88 | 20 |
| M | 71 | 96 | 21 |
| L | 74 | 104 | 22 |
| XL | 77 | 112 | 23 |
| 2XL | 80 | 120 | 24 |

Baby onesie:

| المقاس | عرض الصدر | الطول |
|---|---|---|
| 0–3M | 22 | 38 |
| 3–6M | 24 | 42 |
| 6–12M | 26 | 46 |
| 12–18M | 28 | 50 |

Tote bag: مقاس واحد (no chart; show "مقاس واحد" in the specs).

**Designer canvas print-area fractions:** §6.4.3 table.

### Appendix B: Legal texts (verbatim for `/terms`, `/shipping`, `/privacy`)

These are the current b7r.sa policies with the corrections Dhia approved: draft placeholders removed, delivery aligned to 5 days, one complaint window of 10 days from receipt, GCC "coming soon" removed, spelling fixed. They remain B7R's texts to have reviewed by a lawyer; the site shows them as-is.

#### B.1 الشروط والأحكام

باستخدامك منصة بحر برنت، فإنك توافق على الالتزام بهذه الأحكام والشروط، وكل ما يُضاف إليها من تحديثات لاحقاً.

**1. التعاريف والطرفان**
- بحر برنت أو المزود: المنصة التي تُشغّل خدمة الطباعة عند الطلب.
- العميل أو المستخدم: الشخص الذي يستخدم المنصة.
- الطلب: المنتج الذي يُطلب تنفيذه (الطباعة والتغليف والشحن).
- المنصة: الموقع الإلكتروني وواجهة المستخدم ولوحة التحكم والتكامل التقني.

**2. التسجيل والاستخدام**
- المستخدم ملزم بإدخال بيانات صحيحة ومحدّثة (الاسم، البريد الإلكتروني، رقم الجوال، ومتجره إن وجد).
- المستخدم يتحمّل مسؤولية صحة التصاميم والملفات التي يرفعها.
- لا يجوز استخدام المنصة لأغراض مخالفة للنظام أو انتهاك حقوق الملكية الفكرية.
- إذا تبيّن أن التصميم ينتهك حقوق الغير، يحق لبحر برنت رفض الطلب أو حذفه أو طلب تعديله.

**3. الطلبات والتنفيذ**
- يُنفَّذ الطلب بعد تأكيد الدفع من رصيد المحفظة.
- مدد التسليم المعلنة تقديرية وقد تتأثر بعوامل الشحن أو الظروف اللوجستية.
- بحر برنت غير مسؤولة عن التأخير الناتج عن شركة الشحن أو ظروف خارجة عن إرادتها.
- في حالات التلف أو الضرر أثناء الشحن، يقدّم العميل شكوى مع الصور خلال 10 أيام من الاستلام.

**4. الأسعار والدفع**
- الأسعار المعروضة تشمل تكلفة المنتج والطباعة، وتُضاف رسوم الشحن حسب شركة الشحن المختارة.
- تُحسب الضرائب والرسوم وفق الأنظمة المعمول بها في المملكة العربية السعودية.
- يدفع العميل عبر وسائل الدفع الإلكترونية المعتمدة في المنصة.
- في حال فشل الدفع أو إلغاء الطلب، يُعاد المبلغ وفق سياسة الإلغاء المذكورة أدناه.

**5. حقوق الملكية الفكرية**
- تبقى التصاميم التي يرفعها العميل ملكاً له، ويمنح بحر برنت ترخيصاً مؤقتاً لاستخدامها لتنفيذ الطلب فقط، دون حق إعادة الاستخدام التجاري أو التوزيع الخارجي إلا باتفاق منفصل.
- لا تستخدم بحر برنت تصاميم العميل في التسويق أو الإعلانات بدون موافقته.
- يضمن المستخدم أن التصاميم التي يرفعها لا تنتهك حقوق الغير (علامات تجارية، حقوق نشر، شعارات محمية).

**6. الإلغاء والاسترجاع**
- لأن المنتجات تُصنع حسب الطلب، لا تُقبل الإرجاعات أو التعديلات بعد بدء التنفيذ، إلا في حالات عيب التصنيع أو الخطأ من جهتنا.
- في حال وجود عيب أو خطأ واضح، يقدّم العميل طلباً خلال 10 أيام من الاستلام مع الصور والمستندات اللازمة، ويُقيَّم الطلب ويُتخذ القرار (إعادة الطباعة أو الاسترداد).
- لا يُسترد مبلغ الشحن ما لم يكن الخطأ من طرف بحر برنت.

**7. المسؤولية والتعويض**
- تبذل بحر برنت أقصى جهدها لتوفير الخدمة، لكنها لا تضمن خلوّها من الأخطاء أو الانقطاعات التقنية.
- بحر برنت غير مسؤولة عن أي ضرر غير مباشر أو خسائر متوقعة أو فقدان أرباح بسبب استخدام المنصة بشكل خاطئ.
- يتعهد المستخدم بتعويض بحر برنت عن أي مطالبة نظامية أو ضرر ينشأ بسبب استخدامه للمنصة أو التصاميم المنتهكة.

**8. النظام المعمول به والاختصاص القضائي**
- تخضع هذه الأحكام لأنظمة المملكة العربية السعودية، بما يتوافق مع نظام التجارة الإلكترونية.
- يُحال أي نزاع ينشأ عن هذه الاتفاقية إلى المحاكم السعودية المختصة.

**9. التعديلات على الأحكام**
- يحق لبحر برنت تعديل هذه الأحكام أو تحديثها في أي وقت، وتُعلن التحديثات على الموقع.
- استمرار استخدام المنصة بعد التعديلات يعني الموافقة على الشروط الجديدة.

#### B.2 الشحن والتوصيل

في بحر برنت نلتزم بتوصيل منتجاتك لعملائك بسرعة وأمان، بتجربة احترافية من لحظة الطباعة حتى الاستلام.

**1. مناطق الخدمة**
- نوصّل الطلبات إلى جميع مدن ومناطق المملكة العربية السعودية.

**2. مدة التوصيل**
- يصل الطلب خلال 5 أيام كحد أقصى من استلامه، شاملةً مدة الطباعة.
- قد تختلف المدة في الظروف الاستثنائية مثل العطل الرسمية أو الضغط على شركات الشحن.

**3. شركات الشحن والتتبع**
- نتعاون مع شركات شحن محلية موثوقة لضمان سرعة التوصيل.
- عند شحن الطلب، يحصل العميل على رقم تتبع لمتابعة حالة الشحنة مباشرة.

**4. تكاليف الشحن**
- تُحسب تكلفة الشحن تلقائياً عند إنشاء الطلب وتظهر بوضوح قبل الخصم من المحفظة.
- نقدّم أسعاراً تفضيلية بفضل شراكاتنا مع شركات التوصيل.
- قد تختلف الرسوم حسب شركة الشحن المختارة وطريقة التوصيل.

**5. محاولات التوصيل**
- لكل شحنة 3 محاولات توصيل من شركة الشحن.
- إذا لم يستلم العميل الطلب بعد هذه المحاولات، يُلغى الطلب ولا يُعوَّض عن قيمته.
- العميل مسؤول عن إدخال عنوان صحيح ورقم جوال فعّال لضمان نجاح التوصيل.

**6. سياسة الإرجاع والتعويض**
- جميع منتجاتنا تُنفَّذ حسب الطلب، لذلك لا نقبل الإرجاع أو الاستبدال بعد تنفيذ الطلب.
- نعوّض أو نعيد الطباعة فقط إذا كان الخطأ من طرفنا، مثل عيب في الطباعة أو تلف في المنتج.
- في حال وجود خطأ من طرفنا: نعيد الطباعة والشحن مجاناً، أو نعيد المبلغ المدفوع حسب الحالة.
- يجب رفع الشكوى خلال 10 أيام من استلام الطلب، مع صور توضح المشكلة.

#### B.3 سياسة الخصوصية

نلتزم في بحر برنت بحماية خصوصيتك وضمان أمن بياناتك الشخصية. توضح هذه السياسة كيف نجمع بياناتك ونستخدمها ونحتفظ بها ونشاركها عند استخدامك المنصة والخدمات.

**1. التعاريف والمجال**
- البيانات الشخصية: أي معلومات تُمكّن من التعرف عليك كفرد (مثل الاسم والبريد الإلكتروني ورقم الجوال والعنوان).
- المنصة أو الخدمة: الموقع الإلكتروني ولوحة التحكم والتطبيقات وأي خدمة نقدمها تتعلق بالطباعة عند الطلب.
- تنطبق هذه السياسة على تعاملنا مع بيانات مستخدمي المنصة من داخل المملكة وخارجها، وفق نظام حماية البيانات الشخصية في المملكة العربية السعودية.

**2. البيانات التي نجمعها**
- بيانات تقدمها بنفسك: الاسم، البريد الإلكتروني، رقم الجوال، اسم المتجر، التصاميم، وغيرها من البيانات التي تدخلها في حسابك أو في نماذج التواصل.
- بيانات تلقائية: عنوان IP، نوع المتصفح، نظام التشغيل، الصفحات التي تزورها، تاريخ الدخول ووقته، وسجلات الاستخدام.
- ملفات تعريف الارتباط وتقنيات القياس: نستخدم أدوات تحليل لقياس أداء الموقع، ولا تُفعَّل ملفات تعريف الارتباط الخاصة بالتحليلات إلا بموافقتك من شريط الموافقة.

**3. استخدام البيانات**
- تقديم الخدمة وتنفيذ الطلبات (الطباعة والتغليف والشحن).
- التواصل معك بخصوص الطلبات ودعم العملاء والتحديثات.
- تحسين المنصة وتحليل الاستخدام وتطوير المنتجات.
- إرسال عروض تسويقية بشرط موافقتك، مع إمكانية إلغاء الاشتراك في أي وقت.

**4. مشاركة البيانات مع أطراف ثالثة**
- قد نشارك بياناتك مع مقدمي خدمات مثل شركات الشحن أو الدفع أو البريد الإلكتروني بالقدر اللازم لتنفيذ الخدمة.
- لا نبيع بياناتك لأطراف خارجية أبداً.

**5. الاحتفاظ بالبيانات**
- نحتفظ ببياناتك للمدة اللازمة لتحقيق الأغراض التي جُمعت من أجلها أو وفق المتطلبات النظامية.
- عندما تصبح البيانات غير ضرورية، نحذفها أو نخفي هويتها بشكل آمن.

**6. أمان البيانات**
- نتخذ إجراءات تقنية وإدارية لحماية بياناتك من الوصول غير المصرح به أو التعديل أو الكشف.
- لا نكشف بياناتك الشخصية إلا لمن يحق له نظاماً أو إذا طلبتها الجهات المختصة.
- في حال حدوث خرق أمني، نبلغك وفق متطلبات النظام.

**7. حقوقك**
- الوصول إلى بياناتك ومعرفة ما نحتفظ به.
- طلب تصحيح البيانات أو إكمالها إذا كانت غير دقيقة.
- طلب حذف بياناتك عند انتهاء الغرض أو إذا سحبت موافقتك.
- للتواصل بخصوص بياناتك: contact@b7r.sa

**8. التغييرات على السياسة**
- يحق لنا تعديل هذه السياسة في أي وقت، ونعلن التحديثات على الموقع، وإذا كانت جوهرية نبلغك بها مباشرة أو عبر إشعار بارز في المنصة.
- استمرار استخدامك للمنصة بعد التغييرات يعني موافقتك على السياسة الجديدة.

### Appendix C: Redirect map

See §5.2. Keep the machine-readable version in `src/lib/redirects.ts` and a test that asserts every entry.

### Appendix D: Full FAQ (`/faq`, grouped)

**البداية**
1. كم أحتاج لأبدأ؟، لا شيء. تسجّل مجاناً وتحصل على 30 ريالاً رصيداً ترحيبياً.
2. هل أحتاج سجلاً تجارياً؟، تقدر تبدأ بحساب مجاني. لربط متجرك واستلام الطلبات نطلب توثيق هويتك مع سجل تجاري أو وثيقة عمل حر.
3. هل أحتاج تصاميم جاهزة؟، ارفع تصميمك بصيغة PNG أو JPG أو SVG. وإن لم يكن عندك تصميم، ابدأ بنص أو شعار بسيط.

**الأسعار والربح**
4. كيف أربح؟، تحدّد سعر البيع في متجرك. عند كل طلب نخصم تكلفة المنتج والشحن من محفظتك، والباقي ربحك.
5. كم تكلفة المنتجات؟، تبدأ من 30 ريالاً للحقيبة القماشية و45 ريالاً للتيشيرت. كل الأسعار في صفحة المنتجات.
6. ما هي المحفظة؟، رصيد مسبق الدفع تُخصم منه تكلفة كل طلب. تعبّئها بالتحويل البنكي، والحد الأدنى 10 ريالات.
7. هل هناك اشتراك شهري أو حد أدنى للطلبات؟، لا. لا اشتراك ولا حد أدنى، تدفع تكلفة الطلب فقط.

**الطلبات والتوصيل**
8. كم يستغرق التوصيل؟، 5 أيام كحد أقصى لأي مدينة في السعودية.
9. من يدفع الشحن؟، تُخصم رسوم شحن الطلب من محفظتك حسب شركة الشحن، وتحدّد أنت ما تُحمّله لعميلك في متجرك.
10. هل يعرف عميلي أن الطباعة من بحر برنت؟، لا. الطرد وبوليصة الشحن باسم متجرك فقط.
11. ماذا لو وصل المنتج معيباً؟، إذا كان الخطأ منا نعيد الطباعة والشحن مجاناً أو نرد المبلغ، بشرط إبلاغنا خلال 10 أيام من الاستلام مع صور.

**المتاجر والربط**
12. ما المتاجر التي أقدر أربطها؟، سلة وزد وشوبيفاي، والربط مجاني.
13. كيف أربط متجري؟، بتفويض آمن من داخل متجرك بضغطة واحدة، بدون مشاركة أي بيانات حساسة.
14. هل أقدر أربط أكثر من متجر؟، نعم، اربط أكثر من متجر على أكثر من منصة من الحساب نفسه.

**الجودة والدعم**
15. ما طريقة الطباعة؟، طباعة رقمية عالية الجودة بألوان ثابتة تتحمل الغسيل المتكرر.
16. كيف أتواصل معكم؟، عبر واتساب على 0501699572 أو البريد contact@b7r.sa.

### Appendix E: Content backlog and keyword map (seeds `ai-topics` in Level 3; informs sample posts in Level 1)

**Hubs and primary keywords**

| Hub (slug) | Primary Arabic keyword | Secondary keywords | Intent |
|---|---|---|---|
| البداية (`getting-started`) | بيع تيشيرتات بدون رأس مال | مشروع بدون مخزون، مشروع من البيت، كيف أبدأ براند ملابس | Informational |
| أساسيات الطباعة عند الطلب (`pod-basics`) | ما هي الطباعة عند الطلب | الطباعة حسب الطلب مقابل الدروبشيبينغ، طباعة تيشيرت حسب الطلب | Informational |
| سلة وزد وشوبيفاي (`salla-zid-shopify`) | طباعة حسب الطلب لمتاجر سلة | ربط متجر سلة بالطباعة، تطبيق زد طباعة، دروبشيبينغ سلة | Transactional |
| التصميم (`design`) | تصميم تيشيرت بالخط العربي | مقاس ملف الطباعة، DPI للطباعة، أفكار تصاميم تيشيرتات | Informational |
| التسعير والربح (`pricing-profit`) | تسعير التيشيرت المطبوع | هامش ربح الطباعة عند الطلب، حاسبة الربح، تكلفة الشحن داخل المملكة | Informational-commercial |
| المواسم (`seasons`) | تيشيرت اليوم الوطني | تيشيرت يوم التأسيس، هدايا رمضان مخصصة، توزيعات العودة للمدارس، ميرش موسم الرياض | Seasonal transactional |

**Seed topics (30)**
1. كيف تبدأ براند ملابس في السعودية بدون مصنع وبدون مخزون (2026)
2. بيع تيشيرتات بدون رأس مال: الخطوات من التصميم لأول طلب
3. مشروع بدون مخزون من البيت: 7 أفكار تناسب السعودية
4. سجل تجاري أم وثيقة عمل حر؟ ما تحتاجه لمتجر ملابس مطبوعة
5. توثيق متجرك في المركز السعودي للأعمال خطوة بخطوة
6. ما هي الطباعة عند الطلب؟ شرح مبسط بالأمثلة السعودية
7. الطباعة حسب الطلب مقابل الدروبشيبينغ: أيهما أنسب لك؟
8. تقنيات الطباعة على الملابس: أي طريقة تناسب تصميمك؟
9. كم يستغرق وصول الطلب؟ مقارنة الطباعة الخارجية بالطباعة المحلية في السعودية
10. لماذا تفشل متاجر التيشيرتات؟ أخطاء الجودة والمقاسات والتسعير
11. ربط متجر سلة بالطباعة عند الطلب في 10 دقائق
12. ربط متجر زد بالطباعة عند الطلب
13. إعداد خيارات المقاس واللون في سلة لمنتجات مطبوعة
14. أفضل تطبيقات سلة لمتاجر الملابس والهدايا
15. كيف تضيف تخصيصاً بالاسم على منتجاتك في سلة
16. مقاسات ملفات الطباعة: الدقة والخلفية الشفافة والألوان
17. 20 فكرة تصميم تيشيرت بالخط العربي
18. تصاميم تنجح في السعودية: القهوة والصقور والديوانية والجامعات
19. حقوق الملكية: ما الذي لا يجوز طباعته على المنتجات
20. كيف تسعّر تيشيرتاً مطبوعاً في السعودية (مع حاسبة هامش الربح)
21. تكلفة الشحن داخل المملكة وتأثيرها على السعر النهائي
22. الضريبة والفاتورة الإلكترونية لمتاجر الطباعة عند الطلب
23. متى تنتقل من الطباعة عند الطلب إلى الطباعة بالجملة؟
24. تيشيرتات اليوم الوطني: جهّز متجرك قبل 23 سبتمبر بستة أسابيع
25. يوم التأسيس (22 فبراير): أفكار تصاميم السدو والبشت بدون مخزون
26. هدايا رمضان والعيد المخصصة: التوقيت والتصاميم الأعلى طلباً
27. العودة للمدارس: توزيعات وتيشيرتات المدارس والجامعات
28. موسم الرياض: كيف تبيع ميرش الفعاليات بدون مخالفة الحقوق
29. حفلات التخرج: تيشيرتات وأكواب بالاسم (مايو ويونيو)
30. الجمعة البيضاء ويوم العلم (11 مارس): تقويم مواسم البيع للمتاجر المطبوعة

**English seed topics (15, Level 5c, ADR-043; aimed at the English prompts of §7.7; the first, second and eleventh are covered by the Level 1 posts in English and seed as published)**
1. How to start a clothing brand in Saudi Arabia with no factory and no stock
2. Print on demand in Saudi Arabia: how it works, what it costs, who it suits
3. Print on demand vs dropshipping in the Gulf: which one fits your store?
4. Local print on demand vs Printful and Printify for Saudi customers: delivery, customs, cost
5. How long does delivery take? Local printing in Jeddah vs shipping from abroad
6. Connect a Shopify store to print on demand in Saudi Arabia
7. What are Salla and Zid? A guide for founders selling into Saudi Arabia
8. Print file requirements for on-demand apparel: size, resolution, transparent background
9. Designs that sell in Saudi Arabia: Arabic calligraphy, coffee, falcons and city pride
10. Intellectual property for merch sellers in Saudi Arabia: what you cannot print
11. How to price a printed t-shirt in Saudi Arabia: cost, shipping, VAT and margin
12. VAT and e-invoicing for a print-on-demand store in Saudi Arabia
13. Creator merch in Saudi Arabia: launch a line for your audience with no inventory
14. Saudi National Day merch: prepare your store six weeks before 23 September (window 15 June to 10 August)
15. Ramadan and Eid gifts on demand: timing and the designs that sell (window 1 December 2026 to 9 January 2027)

Seasonal windows: National Day topics publish by 10 August; Founding Day by 5 January; Ramadan by 30 days before Ramadan; back-to-school by 1 August; graduation by 15 April; Riyadh Season by 1 September; White Friday by 1 November.

**Manual prompt set for AI-engine visibility checks (run quarterly):** كيف أبدأ مشروع طباعة عند الطلب في السعودية · أفضل منصة طباعة عند الطلب في السعودية · بديل Printful في السعودية · كيف أربط متجر سلة بالطباعة عند الطلب · كم تكلفة طباعة تيشيرت في السعودية · مشروع بدون رأس مال ولا مخزون في السعودية · print on demand Saudi Arabia · Printful alternative Saudi Arabia · custom t-shirt printing Jeddah · طباعة تيشيرت جدة.

### Appendix F: Research references (in `docs/research/`)

| File | Content | Use it for |
|---|---|---|
| `01-b7r-app-source-of-truth.md` | Facts from the B7R app codebase: products, prices, wallet, shipping, integrations, tokens, copy | Any question about what the product really does |
| `02-b7r-sa-current-site-audit.md` | The old site's structure, copy, SEO state, design | Redirects, reused copy, what to avoid |
| `03-competitor-teardown-printful-printify-gelato.md` | Section-by-section teardown and patterns to adapt | UX references for calculator, steps, integrations |
| `04-seo-and-ai-search-visibility.md` | Current search and AI-engine evidence and checklist | Justification for §7 and the content engine limits |
| `05-open-source-reuse-and-stack.md` | Verified library versions, licences, hosting facts | §8–§11 technology choices |
| `06-saudi-market-and-keywords.md` | Market, competitors, keyword map, personas, trust signals | Positioning, Appendix E, FAQ tone |

Decision history: `docs/00-decisions-log.md` (rounds 1–4 with Dhia, 2026-09-12).

### Appendix G: Open items to confirm with Dhia (do not block Level 1; flag in the PR)

1. Complaint window read as "within 10 days of receipt" (Dhia wrote "5–10 days").
2. Oversize and hoodie size charts currently reuse the essential tee table from the app seed.
3. Zid and Shopify must be enabled in the app before the site says "متاح الآن".
4. Final hero photographs (four, per §3.9) to replace the AI placeholders.
5. Three real testimonials.
6. Cal.com account and `bookingUrl`.
7. Higher-resolution Saudi Business Center and Ministry of Commerce badge files; a logo SVG.
9. Confirm the ITF Rayat Round web licence permits subsetting the woff2 files (the site serves subsets, ADR-010); if not, serve the original files and re-measure.
10. Review the agent-written aria/microcopy strings in `src/messages/ar.json` and the `TODO(copy)` strings in `src/content/pages.ts`: the two error-page strings and «تعذّر الاشتراك الآن، حاول لاحقاً.» (newsletter 429/5xx).
8. Whether the video needs an intro title card or Arabic captions (none specified). Note: without a captions track the `<video>` element fails axe's `video-caption` rule (WCAG 1.2.2), so it mounts only after the visitor presses play until captions exist.
11. Phase 1c `TODO(copy)` strings: the 410 page title «هذه الصفحة أُزيلت» (`src/content/pages.ts`), the blog «الكل» chip, «لا مقالات في هذا القسم بعد.» and «نُسخ الرابط» (`src/content/blog/index.ts`), and the new aria strings in `src/messages/ar.json` (gallery, breadcrumbs, FAQ group nav, on-this-page, share). The reading-time meta line inflects the noun by count (دقيقة قراءة · دقيقتا قراءة · {n} دقائق قراءة · {n} دقيقة قراءة); §4.13's template is the 3–10 form.
12. The three sample blog posts (bodies in `src/content/seed/blog/*.md`, excerpts and takeaways in `src/content/seed/blog.ts`) are agent-written under §4.1 with facts from §1.1 only (ADR-018); since Level 3 they live in the CMS as published posts with `origin: ai` (ADR-041), each now carrying two internal links, and still await Dhia's read.
13. About banner: §6.8 names `hanging-tshirt-mockup.jpg`, but that file carries the vendor's "Free t-shirt mockup" sample print, so the site uses `hanging-tshirt-mockup-2.jpg` (same subject, real design). Blog covers use `designer-at-desk-stock.jpg`, `hodie2.jpg` and `totebag1.jpg`. Swap when final photography exists.
14. `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set to Cloudflare's public always-pass test key in `.env.local` and CI so the widget island renders in tests; production needs the real pair (§12.4 item 5).
15. Product OG images use `og:type website` (see §7.3 amendment); confirm in WhatsApp/X previews at cutover (§12.4 item 8).
16. Three sample testimonials (`src/content/testimonials.ts`) were written by the agent on Dhia's instruction (ADR-023) and stay `placeholder: true`; to show them on b7r.sa set `placeholder: false` (they are not real merchants' words, §3.14) or replace them with real entries (§12.4 item 1).

18. Level 3 blog copy (2026-09-14, ADR-041, `TODO(copy)`): the six hub descriptions and leads and the author bio in `src/content/seed/blog.ts` (editable in the admin after the seed), the cover alt texts in `scripts/migrate-content.ts`, and the template strings in `src/content/blog/index.ts` («في هذا المقال», «حُدّث», «المقال السابق», «المقال التالي», «أحدث مقال», «أحدث المقالات», the search box and pagination labels, «كل ما كتبه {name}»).

19. Level 5c (2026-09-14, ADR-043): the `llms.txt` sentences in both copy banks (`llms` in `src/content/copy/ar.ts` and `en.ts`: the intro paragraph, the section headings, the product line), the English style guide, system prompt, banned phrases and banned claims of the engine (`src/modules/ai-content/prompts/defaults.ts`, editable in Engine settings under the English locale), and the fifteen English topics of Appendix E.

17. Design edits 2026-09-13 (`src/content/home.ts`, `TODO(copy)`): the designer's upload prompt «اضغط لرفع شعارك أو صورتك» and the remove control «إزالة التصميم» (ADR-036), and the product gallery's toggle name «اقلب الصورة» (`src/messages/ar.json`, ADR-035). These three also belong to the 2b `home` global seed. The designer now starts with an empty print area; the pre-placed sample of the earlier build is a one-line switch (`initialState.design`) if Dhia prefers it.

### Appendix H: Glossary of Arabic UI terms used in code comments and admin labels

| Arabic | English (code) |
|---|---|
| الرئيسية | home |
| المنتجات | products |
| كيف نعمل | how-it-works |
| من نحن | about |
| المدونة | blog |
| تواصل معنا | contact |
| الأسئلة الشائعة | faq |
| الشروط والأحكام | terms |
| الشحن والتوصيل | shipping |
| سياسة الخصوصية | privacy |
| التكلفة | baseCost |
| سعر البيع | sellingPrice |
| الربح | profit |
| رصيد ترحيبي | welcomeCredit |
| المحفظة | wallet |
| منطقة الطباعة | printArea |
| ابدأ براندك مجاناً | ctaPrimary |

---

*End of document. Build the single master file with `docs/build-brd.py`; the sections in `docs/brd-sections/` are the editable source.*

---

## 14. Appendix I: The English copy bank (Level 5, ADR-043)

Every interface string of the English site, key for key with the Arabic bank of §4 (`src/content/copy/en.ts`, written to this table by `pnpm copy:appendix`); `tests/content-verbatim.test.ts` checks the code against this table. Brand in English: "B7R Print". The CMS content in English (products, pages, FAQ, home, settings) is seeded content owed Dhia's read (Appendix G pattern). Placeholders in braces are filled by the code.

| Key | English |
|---|---|
| `a11y.skipToContent` | Skip to content |
| `a11y.mainNavigation` | Main navigation |
| `a11y.footerNavigation` | Footer links |
| `a11y.homeLink` | B7R Print, home |
| `a11y.close` | Close |
| `a11y.loading` | Loading |
| `a11y.switchLanguage` | Switch to the Arabic site |
| `hero.carouselLabel` | Featured slides |
| `hero.slideIndicator` | Slide {n} of {total} |
| `hero.pause` | Pause the slideshow |
| `hero.resume` | Resume the slideshow |
| `designer.canvasLabel` | Design preview on the product |
| `designer.productGroupLabel` | Choose a product |
| `designer.colorGroupLabel` | Choose a colour |
| `designer.colorOption` | Colour {color} |
| `designer.sellPriceInput` | Selling price in SAR |
| `designer.sellPriceSlider` | Selling price |
| `designer.dailySalesDecrement` | Fewer daily sales |
| `designer.dailySalesIncrement` | More daily sales |
| `designer.designThumbnail` | Current design |
| `designer.dropzoneLabel` | Upload your design file |
| `designer.productGroup` | Product |
| `designer.uploadPrompt` | Tap to upload your logo or image |
| `designer.remove` | Remove the design |
| `designer.canvasHint` | Drag the design to move it; use the corners to resize. |
| `designer.baseCost` | Cost from B7R |
| `designer.sellPrice` | Selling price in your store |
| `designer.suggestedPrice` | Suggested price |
| `designer.dailySales` | Daily sales |
| `designer.perPiece` | Your profit per piece |
| `designer.monthly` | Your estimated monthly profit |
| `designer.negativeWarning` | The selling price is below the cost. Raise it to make a profit. |
| `designer.fileError` | The file is not supported or is larger than 10 MB. |
| `designer.mockupAlt` | {product} {color}, front view |
| `strip.label` | Available products |
| `strip.swipeHint` | Swipe |
| `gallery.label` | Product photos |
| `gallery.flip` | Flip the photo |
| `gallery.front` | Front view |
| `gallery.back` | Back view |
| `breadcrumbs.label` | Page path |
| `compare.caption` | {ours} compared with {theirs} |
| `compare.criterion` | Criterion |
| `compare.bestFor` | {ours} is best for you if |
| `compare.notBestFor` | {ours} is not the best fit if |
| `compare.asOf` | {theirs}'s pages were read on |
| `compare.asOfTail` | ; the numbers change, the read date stays true. |
| `faq.groupsNav` | Question groups |
| `faq.groups.البداية` | Getting started |
| `faq.groups.الأسعار والربح` | Prices and profit |
| `faq.groups.الطلبات والتوصيل` | Orders and delivery |
| `faq.groups.المتاجر والربط` | Stores and connections |
| `faq.groups.الجودة والدعم` | Quality and support |
| `legal.onThisPage` | On this page |
| `legal.updatedPrefix` | Last updated: |
| `share.whatsapp` | Share on WhatsApp |
| `share.x` | Share on X |
| `share.copy` | Copy the link |
| `testimonials.placeholderTag` | Sample |
| `integrations.availableTag` | Available now |
| `integrations.tileAria` | Connect a {platform} store |
| `productsPage.title` | Products |
| `productsPage.lead` | Quality products, printed on demand and shipped under your store name. |
| `productsPage.pricePrefix` | From |
| `productsPage.breadcrumbHome` | Home |
| `productsPage.priceBlock.cost` | Cost from |
| `productsPage.priceBlock.suggested` | Suggested selling price |
| `productsPage.priceBlock.profit` | Your estimated profit |
| `productsPage.priceBlock.perPiece` | per piece |
| `productsPage.primaryCta` | Start selling this product |
| `productsPage.secondaryLink` | Try your design on it |
| `productsPage.sections.specs` | Specifications |
| `productsPage.sections.sizeChart` | Size chart |
| `productsPage.sections.related` | Other products |
| `productsPage.specLabels.material` | Material |
| `productsPage.specLabels.weight` | Weight |
| `productsPage.specLabels.sizes` | Sizes |
| `productsPage.specLabels.colors` | Colours |
| `productsPage.specLabels.printArea` | Print area |
| `productsPage.specLabels.printMethod` | Print method |
| `productsPage.weightUnit` | g |
| `productsPage.listSeparator` | `, ` |
| `productsPage.sizeChartHeaders.size` | Size |
| `productsPage.sizeChartHeaders.length` | Length |
| `productsPage.sizeChartHeaders.chest` | Chest width |
| `productsPage.sizeChartHeaders.sleeve` | Sleeve |
| `productsPage.sizeChartUnit` | Measurements in cm |
| `productsPage.colorSwitchAria` | Colour {colour} |
| `contactForm.labels.name` | Name |
| `contactForm.labels.phone` | Mobile number |
| `contactForm.labels.email` | Email |
| `contactForm.labels.inquiry` | Inquiry type |
| `contactForm.labels.message` | Your message |
| `contactForm.placeholders.name` | Your full name |
| `contactForm.placeholders.phone` | 05XXXXXXXX |
| `contactForm.placeholders.email` | name@example.com |
| `contactForm.placeholders.message` | Write your message here |
| `contactForm.inquiryOptions` | Merchant · Partnership · Investment · Other |
| `contactForm.submit` | Send the message |
| `contactForm.sending` | Sending |
| `contactForm.success` | We received your message. We will reply soon. |
| `contactForm.successWhatsapp` | Message us on WhatsApp |
| `contactForm.failure` | The message could not be sent. Try again or message us on WhatsApp. |
| `contactForm.validation.name` | Enter your name |
| `contactForm.validation.phone` | Enter a valid mobile number |
| `contactForm.validation.email` | Enter a valid email address |
| `contactForm.validation.inquiry` | Choose the inquiry type |
| `contactForm.validation.message` | Write your message |
| `contactEmail.subject` | New message from the website: {inquiryType} |
| `contactEmail.replyOnWhatsapp` | Reply on WhatsApp |
| `notFoundPage.title` | Page not found |
| `notFoundPage.text` | The link seems to have changed or been removed. |
| `notFoundPage.button` | Back to the home page |
| `footer.linksTitle` | Links |
| `footer.policiesTitle` | Policies |
| `footer.newsletterTitle` | Newsletter |
| `footer.newsletterLabel` | Subscribe for what is new |
| `footer.newsletterPlaceholder` | name@example.com |
| `footer.newsletterButton` | Subscribe |
| `footer.newsletterSuccess` | Subscribed. We will only send you what is new. |
| `footer.newsletterError` | Enter a valid email address. |
| `footer.newsletterUnavailable` | Subscriptions are unavailable right now; try again later. |
| `footer.socialAria.x` | B7R Print on X |
| `footer.socialAria.instagram` | B7R Print on Instagram |
| `footer.socialAria.tiktok` | B7R Print on TikTok |
| `footer.socialAria.whatsapp` | B7R Print on WhatsApp |
| `footer.badgesCaption` | Payment methods and verification bodies |
| `footer.copyright` | © {year} B7R Print. All rights reserved. |
| `draftBar.label` | Draft preview: what you see here is not published yet. |
| `draftBar.exit` | Exit the preview |
| `whatsappWidget.buttonAria` | Chat with us on WhatsApp |
| `whatsappWidget.title` | B7R Print |
| `whatsappWidget.subtitle` | Support team |
| `whatsappWidget.greeting` | Hi 👋 How can we help? |
| `whatsappWidget.action` | Start a chat |
| `whatsappWidget.prefilled` | Hello, I would like to know more about B7R Print. |
| `whatsappWidget.closeAria` | Close |
| `consent.text` | We use cookies to improve your experience and measure how the site performs. |
| `consent.accept` | Accept |
| `consent.reject` | Decline |
| `consent.link` | Privacy policy |
| `errorPage.title` | Something went wrong |
| `errorPage.text` | Try refreshing the page, or message us on WhatsApp. |
| `errorPage.button` | Back to the home page |
| `errorPage.whatsapp` | Chat with us on WhatsApp |
| `gonePage.title` | This page was removed |
| `gonePage.text` | The link seems to have changed or been removed. |
| `gonePage.button` | Back to the home page |
| `blog.title` | The B7R blog |
| `blog.lead` | Practical guides to starting your brand and selling printed products in Saudi Arabia. |
| `blog.metaTemplate` | By {author} · {date} · {n} min read |
| `blog.takeawaysTitle` | Key takeaways |
| `blog.relatedTitle` | Related articles |
| `blog.share` | Share |
| `blog.inPostCta.title` | Start your brand today |
| `blog.inPostCta.text` | No capital, no stock. |
| `blog.inPostCta.button` | Start your brand for free |
| `blog.author.name` | Dhia |
| `blog.author.role` | Founder of B7R Print |
| `blog.allHubs` | All |
| `blog.emptyHub` | No articles in this section yet. |
| `blog.emptyAuthor` | No articles yet. |
| `blog.copied` | Link copied |
| `blog.toc` | In this article |
| `blog.updatedPrefix` | Updated |
| `blog.previousPost` | Previous article |
| `blog.nextPost` | Next article |
| `blog.featured` | Latest article |
| `blog.latest` | Latest articles |
| `blog.search.label` | Search the blog |
| `blog.search.placeholder` | Type a word from a title |
| `blog.search.results` | Search results |
| `blog.search.empty` | No results. Try another word. |
| `blog.search.clear` | Clear |
| `blog.pagination.label` | Blog pages |
| `blog.pagination.page` | Page {n} |
| `blog.pagination.previous` | Newer |
| `blog.pagination.next` | Older |
| `blog.hubIntro` | Every article in {hub} |
| `blog.authorIntro` | Everything written by {name} |
| `blog.authorPosts` | Articles |
| `seo.titleTemplate` | %s \| B7R Print |
| `seo.product.title` | {name} for print on demand |
| `seo.product.description` | {short description}. Cost from SAR {base}, no minimum order, shipped under your store name. |
| `seo.merchantCostNote` | Merchant cost |
| `readingTime.one` | 1 min read |
| `readingTime.two` | 2 min read |
| `readingTime.few` | {n} min read |
| `readingTime.many` | {n} min read |
| `media.videoPosterAlt` | A digital printer printing a design on a black T-shirt |
| `media.trustBadges.saudiBusinessCenter` | Saudi Business Center |
| `media.trustBadges.ministryOfCommerce` | Ministry of Commerce |
| `media.trustBadges.misk` | Misk Foundation |
| `media.sarAria` | Saudi riyal |
| `llms.intro` | {brand} is a print-on-demand platform in Saudi Arabia: a merchant sells their design in their Salla, Zid or Shopify store, and we print the piece in {origin} and ship it under the store's name within {days} days at most inside the Kingdom. No stock and no minimum; the account is free with SAR {credit} of welcome credit. |
| `llms.pages` | Pages |
| `llms.products` | Products (merchant cost and suggested price in Saudi riyals) |
| `llms.productLine` | {description} Cost SAR {cost}, suggested price SAR {price}. |
| `llms.blog` | Blog |
| `llms.otherLanguages` | Other languages |
| `llms.otherLanguage` | Arabic version |
| `dateLocale` | en-GB |
