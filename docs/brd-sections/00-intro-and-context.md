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
