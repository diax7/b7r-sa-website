# B7R Marketing Site — Discovery Decisions Log

> Running log of decisions made during the interview sessions between Dhia and Claude. This is NOT the BRD. The BRD will be written only after Dhia's green light and will cite this log. Dates are absolute.

## Round 1 — 2026-09-12 (answered by Dhia)

| # | Topic | Decision | Notes |
|---|---|---|---|
| D-01 | Products | Show **all** products that exist in `resources/B7R Products` and in the platform. No "coming soon" badges on products. | Product list and base prices for mug, cap, pin, phone case still needed (see O-01). |
| D-02 | Integrations | Show **Salla, Zid, Shopify** as available now. | Claude flagged once: app code has Zid/Shopify flags seeded OFF with "coming soon" badges. Dhia's call stands; verify flags are ON before launch so the app matches the site. |
| D-03 | Welcome credit | **30 SAR**, stated on the site. Lives as a site setting so it never goes stale. | App setting `wallet_settings.welcome_bonus_amount` is the source. |
| D-04 | Public pricing | Publish platform prices, phrased as **"يبدأ من"** (starts from). | Use the same base costs the platform charges. |
| D-05 | Delivery promise | **Delivery across all of Saudi Arabia within a maximum of 5 days.** Claude phrases it. | Assumption to confirm: 5 days counted from order receipt to the customer's door (O-05). |
| D-06 | Font | **ITF Rayat Round**, web licence already owned. | Need the licensed **webfont kit (WOFF2)** in resources; desktop OTFs must not be converted (licence). See O-07. |
| D-07 | Colors | Primary = logo's regular/dark blue; **light blue as accent** for selected elements/words. | Sampled from `logo.png`: dark blue `#1858A8`, royal blue `#0058B0`, light blue `#0098E0`. Old site orange accent dropped. |
| D-08 | Interactive section | Keep simple: no login, no saving. Pick product + color, upload image, drag/scale inside the real print area (28 × 38 cm front zone), see cost / sell price / estimated profit, CTA to app. | |
| D-09 | Language | **Phase 1 = Arabic only.** English added next phase. Architecture must be locale-ready from day one (Arabic at root `/`, `/en/` reserved). | |
| D-10 | Hosting | Dhia's own platform, spelled "CRANL" in his notes (Vercel/Railway-like), same platform that hosts the B7R app. | Name/URL to confirm (O-08). Requirement: Docker image + Postgres service. |
| D-11 | Blog editor | Named editor/reviewer: **DHIA**. | Author page + bio line to define (O-10). |
| D-12 | Payment logos | Use the provided `resources/payment-2.png` (PayPal, Mastercard, Visa, Maestro, Apple Pay, mada). | |
| D-13 | Registration number | Not shown for now (company is registered; number not ready). | Old footer's SBC + Ministry of Commerce badges: keep or drop? (O-09) |
| D-14 | WhatsApp | Same number as calls: **0501699572** → `https://wa.me/966501699572`. | |
| D-15 | Video section | Add a homepage section like Printful's: text above, video below. Keep if it works, remove later if not. | Video file: `resources/Professional_Printer_Marketing_Photo.mp4`. Placement and heading to decide (O-03). |
| D-16 | Hero photos | Current hero images are AI-generated placeholders; Dhia will design final ones later. **Four hero photos**, each paired with its own headline + subline. | BRD will specify image specs (aspect, safe zones, color mood) so the final photos drop in. |

## Decisions Claude made on Dhia's behalf (reversible, stated for visibility)

| # | Decision | Reason |
|---|---|---|
| C-01 | Arabic lives at the root URL (`/`, `/products`, …), not `/ar/`. English later at `/en/…`. | Keeps SEO continuity with existing b7r.sa URLs; x-default → Arabic. |
| C-02 | 301 redirect map from old WordPress URLs (`/about/`, `/showcase/`, `/contact/`, `/terms-conditions/`, `/shipping/`, `/privacy-policy/`, `/blog/`) to new routes; all ~45 theme-demo URLs → 410 Gone. | Preserve the little link equity that exists; kill junk. |
| C-03 | SAR is shown with the official Saudi Central Bank riyal symbol as an inline SVG component, never as text "ر.س" or "SAR", symbol placed before the digits. | Matches the app's rule and the Saudi standard. |
| C-04 | Western digits (0-9) everywhere, Gregorian dates. | Matches the app; what Saudi users type and read online. |
| C-05 | Header: sticky, shrinks and gains a subtle blur on scroll; burger morphs to X on mobile. | Dhia asked for "fixed header that comes with me" + premium micro-animations. |
| C-06 | Hero rotation every 6 seconds with crossfade, pauses on hover/touch, respects `prefers-reduced-motion`. | Dhia said 5 or 10; 6 balances reading time and pace. |
| C-07 | No `FAQPage` / `HowTo` schema effort; FAQ content stays on page in Q&A format. `OnlineStore`, `WebSite`, `BreadcrumbList`, `Product/Offer` (SAR), `BlogPosting` schema are in. | Google removed FAQ/HowTo rich results (see research 04). |
| C-08 | robots.txt allows `OAI-SearchBot`, `Claude-SearchBot`, `Claude-User`, `PerplexityBot`, `Bingbot`, `Applebot`; training bots allowed too (no visibility upside to blocking). | Research 04 §3a. |
| C-09 | Blog level: 8–16 reviewed posts/month in topic hubs, named editor, review queue. Not daily unreviewed. | Google scaled-content-abuse policy; research 04 §5. Dhia to confirm in round 3. |

## Brand tokens captured so far

| Token | Value | Source |
|---|---|---|
| Blue / primary | `#0058B0` | logo.png (40.7% of logo pixels) |
| Blue / dark | `#1858A8` | logo.png (25.8%) |
| Blue / accent (light) | `#0098E0` | logo.png (33.2%) |
| Font | ITF Rayat Round (Light 300, Regular 400, Medium 500, Bold 700, Black 900) | resources/B7R Brand/Font |
| Radius | 13 px (0.8rem) family, one radius per page | B7R app convention |
| Mode | Light only for the marketing site | Dhia |

## Round 2 — 2026-09-12 (answered by Dhia)

| # | Topic | Decision | Notes |
|---|---|---|---|
| D-17 | Product list | **Exactly 5 products** in production: تيشيرت أساسي 45, تيشيرت أوفرسايز 55, هودي 95, بربتوز أطفال 35, حقيبة قماشية 30 (base cost, SAR). Homepage hover strip shows all 5. | Mug/cap/pin/phone-case mockups in resources are not products (confirm O-17). |
| D-18 | Calculator defaults | Default selling prices: tee 89, oversize 119, hoodie 189, baby 69, tote 65. Profit = sell − base. Default sales 10/day, shown as monthly. | |
| D-19 | Hero copy | Four pairs approved (see round 2 message; copied into BRD verbatim). | |
| D-20 | CTA labels | Main CTA: **"ابدأ براندك مجانًا"**. Other buttons use context-fitting labels, not one repeated label. | Secondary hero: "استكشف المنتجات". |
| D-21 | Three steps | صمّم منتجك / اربط متجرك / نطبع ونشحن with approved sublines. | |
| D-22 | Why us | First three: بدون مخاطرة · كل شيء تلقائي · جودة محلية وسريعة. **Do not mention DTG.** | Third subline: "طباعة في جدة وتوصيل لكل المملكة خلال 5 أيام". |
| D-23 | Homepage FAQ | Five questions approved as drafted. | |
| D-24 | كيف نعمل | Own page + homepage section. | |
| D-25 | Video section | After the three steps. Heading "شاهد كيف نطبع طلبك". Muted, play button, no autoplay on mobile. | |
| D-26 | Delivery wording | 5 days max counted from order receipt, including printing. "نوصّل لكل مدن المملكة خلال 5 أيام كحد أقصى". | |
| D-27 | About page | No founder block. Add that B7R graduated from **Misk Launchpad** (Misk Foundation's pre-accelerator). | Present as a credential badge with Misk logo; cohort/year and logo file needed (O-18). |
| D-28 | Contact page | Form present and live from day 1 (email via Resend to contact@b7r.sa, WhatsApp fallback if key missing). **Plus a "book a meeting" option on the contact page.** | Meeting booking via hosted Cal.com embed; account details needed (O-19). |
| D-29 | Level 1 architecture | Option A: no database; typed content files shaped like the future CMS schema. Payload CMS arrives at level 2. | |
| D-30 | Hosting | **CranL** (https://cranl.com): PaaS, deploy from GitHub on push, managed Postgres/Redis, S3 buckets, CDN zones, Saudi Arabia region. | Requirement: Dockerfile-based Next.js standalone build; Postgres service at level 2. |
| D-31 | Font files | Convert the provided OTFs to WOFF2 (Dhia confirms the licence covers it). Subset Arabic + Latin, `font-display: swap`, preload the primary weight. | |
| D-32 | Footer badges | Keep Saudi Business Center + Ministry of Commerce badges next to the payment logos. | |

## Round 3 — 2026-09-12 (answered by Dhia)

| # | Topic | Decision | Notes |
|---|---|---|---|
| D-33 | Products (final) | The products are exactly those in b7r.app today: 5 products. No mug for now. Mug/cap/pin/case mockups are not listed products. | |
| D-34 | Logo format | PNG for now (no SVG). | Agents use `logo.png` / `logo white.png` / `icon.png`; export 1x/2x sizes. |
| D-35 | Analytics | Reuse GA4 `G-JPB02M7C49` + self-hosted Umami (umami.b7r.app). | GA4 behind Consent Mode v2 with a minimal Arabic consent bar; Umami cookieless, no consent needed. |
| D-36 | Misk Launchpad | Graduated **cohort 9, 2026**. Logo saved at `resources/Trust badges/misk-logo-light-1024x588.png` (full-colour Misk Foundation logo on transparent background; suits light backgrounds). | Show on About page as a credential line + small footer badge. Wording proposal: "خريجو الدفعة التاسعة من برنامج Misk Launchpad، مؤسسة محمد بن سلمان «مسك»". |
| D-37 | Meetings | No Cal.com account yet; Dhia will create it later. One meeting type: **30-minute free استشارة**. | Site keeps a `bookingUrl` setting; until set, "احجز استشارة مجانية" opens WhatsApp with a prefilled message. |
| D-38 | Admin roles | Admin + Editor. | |
| D-39 | Admin scope | The level-2 edit list from round 3 Q7 approved. | |
| D-40 | Floating WhatsApp widget | Always-visible floating WhatsApp contact on the **bottom-right** (Dhia's explicit choice, even in RTL). Not a plain icon: a polished chat-style popup with greeting, status line, and a "start chat" action that opens wa.me with a prefilled message. | UX reference: `react-floating-whatsapp` (MIT) chat-box pattern; build our own component styled to brand, RTL-correct. |
| D-41 | Price sync | No API sync with b7r.app. Prices edited manually in the site admin. | |
| D-42 | Admin language | Arabic, RTL. | |
| D-43 | Blog hubs | Six categories approved: البداية · أساسيات الطباعة عند الطلب · سلة وزد وشوبيفاي · التصميم · التسعير والربح · المواسم. | |
| D-44 | AI publishing mode | **Option B: fully automatic publishing, no human approval step.** Dhia's decision after Claude's one-time pushback. | Mitigations to spec: configurable cadence (default daily per original brief; research recommends ≤16/month), automated quality gates (self-review pass, duplicate-topic check, minimum quality score, banned-claims list, internal links, original image), kill switch, one-click unpublish, editor name "ضياء" on posts. |
| D-45 | AI providers | OpenAI and DeepSeek, switchable in admin; keys stored encrypted. | Architecture stays provider-agnostic (Vercel AI SDK registry). |
| D-46 | Post images | AI-generated illustrative covers without Arabic text baked in, plus real product photos; stock only as fallback. | |
| D-47 | AI disclosure | **No mention of AI anywhere on the site.** | |
| D-48 | Topic sourcing | Seed backlog from research keyword map + 30 topics; manual topics; Search Console feed later. | |
| D-49 | Newsletter | Yes, email signup on the blog (and footer). | Level 1: store contacts in Resend Audiences (no DB); level 2 mirrors into the admin. |
| D-50 | Inbox | Contact submissions + bookings in one admin list with status and one-click WhatsApp/email reply. | |
| D-51 | Admin analytics | Order: Umami → GA4 → Search Console. | |
| D-52 | Testimonials | **Add a testimonials section to the homepage in level 1.** | Content needed from Dhia (O-21). |
| D-53 | Repository | New **private** GitHub repo; feature branches per phase + PRs; never push to main. | Repo name to confirm (O-22). |
| D-54 | Staging | **No staging environment.** | Reviews happen on PR branches locally / CranL preview if available; production deploy from main. |
| D-55 | Cutover | WordPress stays until level 1 approved, then DNS → CranL with redirect map. | |
| D-56 | Method | Spec Kit full flow per phase + cto-cycle review before/after each phase. | |

## Open items for Round 4 (final sweep)

| # | Question | Status |
|---|---|---|
| O-21 | Testimonials content: 3 real quotes (name, store, quote, photo/logo), or clearly marked placeholders to replace before launch. | open |
| O-22 | GitHub repo name. | open |
| O-23 | Print zones: front only (28×38 cm) or front + back for tee/hoodie? Photos include back views. | open |
| O-24 | Legal pages: keep the current b7r.sa policies with fixes, and confirm the complaint window (7 vs 10 days). | open |
| O-25 | Consent bar for GA4: accept a minimal Arabic consent bar, or drop GA4 and rely on Umami alone. | open |
| O-26 | Contact form fields and the "type of inquiry" options. | open |

## Round 4 — 2026-09-12 (answered by Dhia)

| # | Topic | Decision | Notes |
|---|---|---|---|
| D-57 | Testimonials content | Dhia asked for invented testimonials. **Claude declined to write fabricated testimonials presented as genuine** (deceptive advertising; Saudi E-Commerce Law prohibits misleading claims). Agreed path: the section ships with clearly labelled **sample placeholders** ("نموذج") that render only while a `testimonials.enabled` flag is false in preview, and the launch checklist blocks go-live until 3 real quotes are entered. | Fast way to get real ones: ask the first connected Salla merchant(s) for one sentence on WhatsApp. |
| D-58 | Repository | **`b7r-website-v2`**, private. | |
| D-59 | Print zones (interactive) | Claude's call: **front zone only** in the interactive section (28 × 38 cm). Product detail pages show front and back photos. | Keeps the section simple; it is for viewing, not ordering. |
| D-60 | Complaint window | Dhia: "5–10 days is right". Interpreted as: complaints accepted **within 10 days of receipt** (the wider window already in the shipping policy). | Flag for Dhia to correct if he meant something else. |
| D-61 | GCC mention | Drop the "GCC coming soon" line from the shipping policy. | |
| D-62 | Consent bar | Keep GA4 with a **small, easy** Arabic consent bar (Consent Mode v2, default denied, one tap). Umami runs without consent. | |
| D-63 | Contact form | Fields: name, phone, email, inquiry type (تاجر / شراكة / استثمار / أخرى), message → contact@b7r.sa. | |
| D-64 | Email provider | Reuse the existing Resend account and b7r.sa sending domain. | |
| D-65 | WhatsApp widget copy | **No reply-time promise.** Greeting only. | Status line omitted. |
| D-66 | Social links | X, Instagram, TikTok at `b7rprint` only. | |
| D-67 | About page | Keep story, mission, vision, values (tightened) + Misk credential. | |
| D-68 | Video | `resources/Professional_Printer_Marketing_Photo.mp4` self-hosted for the homepage video section. | |
| D-69 | Badge files | Crop SBC + Ministry of Commerce badges from the old strip for now; Dhia will replace with better files later. | |

## Status

Rounds 1–4 complete on 2026-09-12. Vision summary approved ("OKAY"). **BRD v1.0 written 2026-09-12**: editable sections in `docs/brd-sections/00–08`, master file `B7R-WEBSITE-MASTER-BRD.md` built by `docs/build-brd.py`. Resources reorganised (see `resources/README.md`); fonts converted to WOFF2; badges cropped.

Decisions Claude made while writing (reversible): footer/dark surfaces use a derived navy `#0A2F5E` and hover `#004A94` from the brand hue (D-07 gave only the three logo blues); consent bar sits at the inline-end (left in RTL) so it never collides with the WhatsApp button at the physical right; Phase 1a deploys to a temporary CranL domain with `noindex` before DNS cutover (not a staging environment); hero auto-advance 6 s; product strip order tee · hoodie · oversize · tote · onesie; sample design "تصميمك هنا" loads by default in the designer; blog hub slugs in Latin.

## Open items for Round 3 (resolved above)

| # | Question | Status |
|---|---|---|
| O-13 | Logo in SVG/AI format available? | open |
| O-14 | Analytics: reuse GA4 `G-JPB02M7C49` and Umami at umami.b7r.app? | open |
| O-17 | Confirm the mug/cap/pin/phone-case mockups are decorative only, not listed products. | open |
| O-18 | Misk Launchpad cohort/year + logo file. | open |
| O-19 | Cal.com account, meeting types, who takes the meetings. | open |
| O-20 | Level 2–4 scope questions (see round 3 message). | open |

## Open items for Round 2 (resolved above)

| # | Question | Status |
|---|---|---|
| O-01 | Final product list + base price + material/sizes for mug, cap, pin, phone case (which iPhone models). Which 5 products star in the homepage hover strip. | open |
| O-02 | "كيف نعمل": its own page (SEO) plus a homepage section, or anchor only? | open |
| O-03 | Video section placement and heading. | open |
| O-04 | Hero copy: 4 headline/subline pairs, CTA labels. | open |
| O-05 | Delivery wording: 5 days counted from order receipt? | open |
| O-06 | Why-us: pick 3 of 5 proposed. | open |
| O-07 | Webfont kit (WOFF2) files for Rayat Round to add to resources. | open |
| O-08 | Hosting platform exact name/URL; confirms Docker + Postgres. | open |
| O-09 | Keep SBC + Ministry of Commerce badges in footer next to payment logos? | open |
| O-10 | Author bio line for DHIA; founder section on About page? | open |
| O-11 | Contact form in level 1: sends email (Resend) or UI only? | open |
| O-12 | Level 1 content architecture: static typed content vs Payload CMS from day one. | open |
| O-13 | Logo in SVG/AI format available? | open |
| O-14 | Analytics for level 1: reuse GA4 `G-JPB02M7C49` and Umami at umami.b7r.app? | open |
| O-15 | Suggested selling-price defaults for the profit calculator per product. | open |
| O-16 | FAQ wording check, especially the prepaid-wallet explanation. | open |
