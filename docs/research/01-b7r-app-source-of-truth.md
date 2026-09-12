# B7R App Codebase — Source of Truth Report

> Research report generated 2026-09-12 by a read-only codebase exploration of `B7R-App` (v3.12.2, HEAD d810e5c2). Input for the B7R marketing-site BRD. Not the BRD itself. Every fact carries a `path:line` pointer into the app repo.

---

## 1. Stack

**Framework & runtime**
- Next.js `^16.3.4`, App Router, React `^19.0.0`, TypeScript `^5.8.0` — `package.json:76,84,85`
- Node `22.x` engine pin — `package.json:5-7`
- `output: 'standalone'` (Docker) — `next.config.ts:41`
- Name/version: `"name": "b7r"`, `"version": "3.12.2"` — `package.json:2-3`

**Database / backend**
- **Supabase Cloud (Frankfurt)** — Postgres + Auth + Storage + Realtime. `@supabase/supabase-js ^2.49.0`, `@supabase/ssr ^0.10.0` — `package.json:47-48`; region stated at `CLAUDE.md:188`
- **No Prisma.** Migrations are raw SQL in `supabase/migrations/`; schema snapshot at `supabase/schema-snapshot.json`
- Redis self-hosted (`ioredis ^5.6.0`) — `package.json:74`
- MinIO / S3 (`@aws-sdk/client-s3`) for invoices + KYC docs — `package.json:33`; `docs/INTEGRATIONS.md:22`
- Errors: `@sentry/nextjs ^10.48.0` pointed at self-hosted **GlitchTip** — `package.json:46`
- Analytics: self-hosted **Umami** — `README.md` tech table, `lib/env.ts:145`

**Styling**
- **Tailwind v4** (`tailwindcss ^4.1.0`, `@tailwindcss/postcss`) — CSS-first config, **no `tailwind.config.*` file exists**. All tokens live in `app/globals.css` (961 lines) via `@theme inline` — `app/globals.css:96`
- **shadcn/ui** — `components.json` present; Radix primitives + `class-variance-authority`, `tailwind-merge`, `lucide-react`
- Dark mode via `next-themes ^0.4.6` + custom variant `@custom-variant dark (&:where(.dark, .dark *))` — `app/globals.css:51`
- Fabric.js `^7.4.0` (customizer canvas), TipTap (rich text), `@react-pdf/renderer` (invoices), `recharts`

**i18n**
- **No third-party i18n library.** Hand-rolled: React Context + JSON message files — `lib/i18n/index.ts:2-36`
- Locales: **`ar` (default) and `en` only** — `lib/i18n/index.ts:31,97-98`; `lib/i18n/messages/ar.json` (199,666 bytes), `en.json` (154,839 bytes)
- Locale persisted in cookie `b7r_locale`, SameSite=Lax — `lib/i18n/index.ts:77-84`
- AR = RTL, EN = LTR; direction map at `lib/i18n/index.ts:63`
- CI gates: `lint:i18n-keys`, `lint:no-bilingual`, `lint:no-client-arabic`, `lint:rtl`, AR/EN key-parity test
- Locked: Western numerals + Gregorian only, **no Hijri, no Arabic-Indic digits** — `CLAUDE.md:87`, `lib/format/index.ts:15-17`

**Fonts**
- **"ITF Rayat Round" / "itfrayatround": NOT FOUND anywhere in the repo.**
- The only font is **Baloo Bhaijaan 2**, self-hosted variable font, weights `400 800`, `font-display: swap` — `app/globals.css:56-80`
- Files: `public/fonts/BalooBhaijaan2-VariableFont_wght.woff2` (~105 KB) and `.ttf` (~280 KB)
- No `next/font` usage — raw `@font-face`; preload link in `app/layout.tsx:171-174`
- Token: `--font-sans` and `--font-heading` both `'Baloo Bhaijaan 2', system-ui, sans-serif`; `--font-mono: 'Menlo', 'Consolas', 'Courier New', monospace` — `app/globals.css:105-107`
- Designer instruction: single family for AR + EN, weights 400–800, no second typeface — `docs/board-presentation-designer-brief.md:112-118`, `b7r-handoff/UserInterface.md:105-118`
- **Removed font:** `@emran-alhaddad/saudi-riyal-font` dropped because it maps the SAR glyph to PUA U+20C1 and rendered tofu on font-load failure — `app/globals.css:25-44`

**Deployment**
- Docker Compose → Railway (staging) → **Saudi cloud (GCP Dammam)** for production — `docs/DEPLOYMENT.md:5-11`, `CLAUDE.md:188`
- `Dockerfile`, `docker-compose.yml`, `.dockerignore` at root; multi-stage build at `docs/DEPLOYMENT.md:13-37`
- Cloudflare edge: DNS/CDN/WAF/Turnstile; CDN worker `cdn.b7r.app/m/{bucket}/{path}` — `lib/storage/cdn-url.ts:5,14`
- Scheduled jobs via **cron-job.org** hitting `POST /api/internal/cron/run?job=<key>` (Trigger.dev never installed) — `docs/INTEGRATIONS.md:41-49`

**URLs**
- App URL: **`https://b7r.app`** — `lib/env.ts:1393`, `lib/env.ts:1316-1327`
- Root `/` renders the login form inline for anon visitors; logged-in users redirect to role dashboard — `app/page.tsx:1-27`
- `robots.txt` is a **blanket `Disallow: /`** plus `X-Robots-Tag: noindex, nofollow` — no public content on b7r.app — `app/robots.ts:12-38`
- **Marketing site `b7r.sa` is explicitly a separate project** — `CLAUDE.md:44,78`, `docs/spec/01_IDENTITY_AND_ARCHITECTURE.md:5`
- `b7r.sa` references: website `https://b7r.sa`, support email `contact@b7r.sa`, phone `0501699572` — `docs/salla-listing/README.md:234-238`; sender mailbox `system@b7r.sa` — `.env.example:83,85`; `info@b7r.sa` on invoices — `docs/spec/05_WALLET_AND_FINANCE.md:69`
- Subdomains: `cdn.b7r.app`, `umami.b7r.app`, `glitchtip.b7r.app`
- Email asset host: `https://b7r.app/email/{x,instagram,tik-tok,whatsapp}.png` — `server/email/internal/templates/base-layout.ts:45,125-127`

---

## 2. Design tokens

Canonical implementation is `app/globals.css`; canonical design intent (with hex) is `b7r-handoff/UserInterface.md` and `docs/board-presentation-designer-brief.md`.

**Brand / primary**
| Token | Light | Dark | Source |
|---|---|---|---|
| Primary | `#019CE6` = `hsl(199 99% 45%)` | `#33C3F5` = `hsl(199 99% 55%)` | `b7r-handoff/UserInterface.md:32`; `app/globals.css:302,428` |
| Primary foreground | `hsl(0 0% 100%)` | `hsl(0 0% 100%)` | `app/globals.css:303,429` |
| Brand secondary / navy | `#015CB5` | `#015CB5` | `b7r-handoff/UserInterface.md:33`, `docs/DESIGN_SYSTEM.md:12` |
| Primary cyan (hover/highlight) | `#1EC7FF` | — | `docs/board-presentation-designer-brief.md:88` |
| Email/deck dark navy | `#0a2747` | — | `server/email/internal/templates/base-layout.ts:105` |
| Email brand cyan | `#0297E0` | — | `base-layout.ts:99` |
| PWA theme color | `#019CE4` | — | `public/manifest.webmanifest` |

**Surfaces / text (light)** — `app/globals.css:296-315`, `b7r-handoff/UserInterface.md:37-47`
- Background `hsl(0 0% 94.12%)` = `#F0F0F0`
- Card `hsl(0 0% 98.82%)` = `#FCFCFC` (deck brief says `#FFFFFF` for slides)
- Popover `#FFFFFF`
- Foreground `hsl(0 0% 10.2%)` = `#1A1A1A`
- Border `hsl(0 0% 90.98%)` = `#E8E8E8`
- Input `hsl(0 0% 70.98%)` (UserInterface.md says `#B5B5B5`)
- Muted bg `hsl(0 0% 89.02%)` = `#E3E3E3`; muted text `hsl(0 0% 35%)` (UserInterface.md lists `#212121`, deck brief `#5A5A5A`)
- Secondary `hsl(0 0% 76.86%)`; Accent `hsl(199 60% 90%)` / accent-fg `hsl(210 40% 20%)`
- Sidebar `hsl(210 25% 98%)` = `#F8FAFC`

**Surfaces (dark)** — `app/globals.css:416-451`
- Background `hsl(210 20% 6%)` = `#0C0F12` · Card `#141A1F` · Popover `#101418`
- Foreground `#DEE7F0` · Border `#1F262E` · Input/Muted `#1E2E3E` · Muted text `#7B8C9D`

**Semantic** — `app/globals.css:317-329,440-447`
- Success `hsl(142 76% 36%)` = `#16A34A` (dark `hsl(142 70% 45%)`)
- Warning `hsl(38 92% 50%)` = `#F59E0B` (UserInterface.md says `#EA580C`)
- Info `hsl(221 83% 53%)` = `#2563EB`
- Destructive `hsl(0 100% 42.55%)` = `#D90000` light / `#F42E21` dark

**Order-status palette** — `app/globals.css:331-339`: all = blue `hsl(221 83% 53%)` · created = purple `hsl(262 83% 58%)` · in-production = pink `hsl(330 81% 56%)` · shipped = orange `hsl(25 95% 48%)` · delivered = green `hsl(142 71% 35%)` · cancelled = red `hsl(0 74% 50%)` · refunded = dark red `hsl(0 63% 38%)`

**Chart palette (fixed order)** — `app/globals.css:348-352`: 1 `#019CE6` · 2 `#00B87A` · 3 `#F5C035` · 4 `#35A85A` · 5 `#DF3568`

**Radius** — `app/globals.css:110-125`
- `--radius: 0.8rem` (~13px) — cards, buttons, inputs, badges, dialogs. Circles = 50%. One sanctioned inner tier: `--radius-inner: 0.375rem` (6px). Also `--radius-sm: 0.1875rem`, `--radius-md: 0.375rem`, `--radius-lg: 0.5625rem`.
- "One radius everywhere, do not mix radii on a page" — `b7r-handoff/UserInterface.md:200-204`

**Shadows** — foreground-mix so they adapt to dark mode — `app/globals.css:389-407`
```
--shadow-input:        0 1px 2px 0 color-mix(in hsl, var(--foreground) 5%, transparent)
--shadow-card:         0 1px 2px 0 …6%, 0 1px 3px 0 …4%
--shadow-card-hover:   0 2px 4px 0 …8%, 0 4px 10px 0 …6%
--shadow-popover:      0 4px 6px -1px …10%, 0 2px 4px -2px …6%
--shadow-modal:        0 10px 15px -3px …12%, 0 4px 6px -4px …8%
--shadow-overlay:      0 25px 50px -12px …25%
```
Philosophy: "shadows are nearly invisible" — `b7r-handoff/UserInterface.md:224-234`

**Motion** — `app/globals.css:374-385`: `--duration-fast 100ms`, `--duration-base 150ms`, `--duration-slow 200ms`, `--duration-slower 300ms`; `--ease-standard cubic-bezier(0.4,0,0.2,1)`, `--ease-exit cubic-bezier(0.4,0,1,1)`

**Type ramp** — `b7r-handoff/UserInterface.md:120-132`: H1 30px/700, H2 24px/600, H3 20px/600, H4 18px/500, H5 16px/500, H6 14px/500, Body 16px/400 lh1.6, Small 14px, Caption 12px. Dense tier `--text-2xs: 0.6875rem` (11px).

**Other systems**
- Z-scale `--z-header 20 … --z-popover 90` — `app/globals.css:272-281`
- "Elevate" system (`hover-elevate` / `active-elevate-2` / `toggle-elevate`) intensities `--elevate-1 rgba(0,0,0,0.03)`, `--elevate-2 rgba(0,0,0,0.08)` — `app/globals.css:284-287`, "the secret sauce for feels-polished"
- **10% badge rule:** every status badge = `bg-{color}/10 text-{color} border-{color}/20`, never a solid fill — `b7r-handoff/UserInterface.md:79-87`
- Token enforcement gate: `npm run lint:design-tokens`
- Brand/visual don'ts: no purple/pink/teal/magenta, no glassmorphism, no neon gradients, no rainbow gradient text, no raster icons (Lucide only), no second typeface — `docs/board-presentation-designer-brief.md:107,166-194`

---

## 3. Store integrations

**Allowlist (single source of truth):** `salla`, `zid`, `shopify` — `lib/integrations/store-platforms.ts:27`
- **WooCommerce: NOT FOUND** (only a hypothetical example in a comment, `store-platforms.ts:23`)
- DB column `store_connections.store_type` is free text with no CHECK constraint — `supabase/migrations/20260413000001_create_store_connections_table.sql:52-57`

**Status per platform** (feature-flag kill switches) — `supabase/migrations/20260502000007_seed_integration_feature_flags.sql:48-65`
| Platform | Flag | Seeded state | Note |
|---|---|---|---|
| Salla | `salla_integration` | **ON** | "Live — one Salla store connected" (`docs/INTEGRATIONS.md:15`) |
| Zid | `zid_integration` | **OFF** | Connect button hidden; flag-gated skeleton until the Zid OAuth app + n8n flow ship |
| Shopify | `shopify_integration` | **OFF** | same |
- Merchant UI: "Salla: active. Zid, Shopify: disabled with **Coming Soon** badge" — `components/merchant/settings/integrations-tab.tsx:8-11`
- Merchant copy: "اربط متجرك على سلة أو زد أو شوبيفاي لاستقبال الطلبات تلقائياً" — `ar.json` `settings.noStoresConnectedDesc`

**How connection works**
- **OAuth**, not API key: "لربط متجر، تفوّض بحر برنت عبر مسار OAuth الخاص بالمنصة. ونحن نخزّن رموز التفويض مشفَّرة" — `docs/legal/TERMS_AND_CONDITIONS_AR.md:341-343`
- Salla listing copy: "one secure click — no API keys to copy" — `docs/salla-listing/README.md:120-121`
- **All store traffic routed through self-hosted n8n.** B7R code never imports a Salla/Zid/Shopify SDK; store-agnostic contract at `/api/integrations/*`
- Secondary bind path: **pairing code** emailed after installing the app from Salla (ADR-192)
- **Multiple stores per platform allowed** — `CLAUDE.md:54`
- New store connection requires a **verified** account
- Disconnect is immediate for future orders; in-flight orders are not cancelled
- Store-side cancellations are never auto-cancelled; admin decides — `CLAUDE.md:96`

**Assets & brand tiles** — `public/platform-icons/{salla,shopify,zid}.svg`; `STORE_CONFIG` in `components/merchant/store-source-badge.tsx:38-61`:
- salla bg `#004D5A`, icon `#cff7ee` · zid bg `#AE72FF`, icon `#1f0433` · shopify bg `#F2F2F0`, icon `#95BF46`
- Arabic labels: سلة / زد / شوبيفاي / يدوي

**Non-store integrations** (direct API) — `docs/INTEGRATIONS.md:13-24`
- **OTO** shipping (live, aggregates 50+ carriers) · **Taqnyat** SMS (configured; probe failing since 2026-05-18) · **Gmail SMTP** primary + **Resend** fallback (SES dropped, ADR-131) · **StreamPay** payments (built, flag OFF) · Supabase · Cloudflare · MinIO
- **Nano Banana AI: never built**

**Salla-specific docs:** `docs/SALLA_N8N_SETUP_GUIDE.md`, `docs/SALLA_SHIPPING_APP_DECISIONS.md`, `docs/SALLA_EASY_MODE_CUTOVER.md`, `docs/ZID_N8N_INTEGRATION_GUIDE.md`, `docs/SHOPIFY_N8N_INTEGRATION_GUIDE.md`, `salla/`, `n8n/`.

---

## 4. Product catalog

**Caveat:** the catalog is **admin-managed in production** (SuperAdmin product wizard). Numbers below are the **seed catalog** used for dev — `scripts/seed-catalog.ts:1-29`; migration says "NOT production data. Production data is inserted via the admin panel." — `supabase/migrations/20260412000001_create_product_catalog_tables.sql:236-238`

### Products (5) — `scripts/seed-catalog.ts:195-322`

| SKU prefix | EN name | AR name | Category | Technique | **Base cost (SAR)** | Weight | Colors | Sizes | Media slots |
|---|---|---|---|---|---|---|---|---|---|
| `ET` | Essential T-Shirt | تيشيرت أساسي | clothes | DTG | **45** | 180 g | white, black | S, M, L, XL, 2XL | 4 |
| `OV` | Oversized T-Shirt | تيشيرت أوفرسايز | clothes | DTG | **55** | 240 g | white, black | S, M, L, XL, 2XL | 4 |
| `HD` | Hoodie | هودي | clothes | DTG | **95** | 520 g | white, black | S, M, L, XL | 4 |
| `BO` | Baby Onesie | بربتوز أطفال | clothes | **DTF** | **35** | 80 g | white | 0-3M, 3-6M, 6-12M, 12-18M | 2 |
| `TB` | Tote Bag | حقيبة قماشية | bags | DTG | **30** | 220 g | beige | One Size | 2 |

**No mug and no cap product exists.** "أكواب / Mugs" is only a seeded *category*. "Polo Shirts / بولو" is also a seeded category with no product.

### Arabic descriptions (verbatim, `scripts/seed-catalog.ts`)
- **تيشيرت أساسي**: "تيشيرت كلاسيكي بياقة دائرية وقصة منتظمة تناسب الجميع. مصنوع من نسيج قطني ناعم وعالي الجودة يوفر راحة مثالية طوال اليوم، وهو الخيار الأول للبراندات التي تبحث عن قطعة أساسية تدوم طويلاً وتتحمل الاستخدام المتكرر."
- **تيشيرت أوفرسايز**: "يتميز هذا التيشيرت بقصة واسعة وأكتاف منسدلة ليعطي مظهراً عصرياً وجريئاً. القماش ثقيل ومتين ليناسب أزياء الشارع (Streetwear)، مما يوفر مساحة واسعة ومسطحة تسمح بتصاميم إبداعية كبيرة الحجم بجودة احترافية."
- **هودي**: "هودي دافئ وعصري مزود بفتحات عند نهاية الأكمام لإدخال الإبهام، مما يساعد في ثبات الأكمام ويوفر تدفئة إضافية لليدين. مصنوع من قماش فاخر ببطانة ناعمة، مما يجعله خياراً ممتازاً للمجموعات الشتوية والملابس الرياضية."
- **بربتوز أطفال**: "ملابس أطفال قطعة واحدة مصممة بعناية لتكون ناعمة جداً على بشرة الرضيع الحساسة. يتميز بفتحات مرنة لسهولة اللبس والخلع، ونستخدم فيه تقنيات طباعة تضمن بقاء الألوان زاهية وسلامة التصميم حتى بعد دورات غسيل متعددة."
- **حقيبة قماشية**: "حقيبة قماشية عملية ومتينة مصنوعة من الكانفاس عالي الجودة، مصممة لتكون رفيقاً يومياً مثالياً للتسوق أو العمل. تتميز بمساحة واسعة تسمح بطباعة تصاميم فنية كبيرة وواضحة، مع مقابض قوية تتحمل الاستخدام المستمر والأوزان المختلفة."

### Categories — `scripts/seed-catalog.ts:41-44`: `clothes` = ملابس (sort 1) · `bags` = حقائب (sort 2). Migration also seeds تيشيرتات, هوديز, بولو, أكواب.

### Techniques — `scripts/seed-catalog.ts:47-58`: `dtg` — طباعة مباشرة على القماش (DTG) · `dtf` — طباعة حرارية (DTF). Migration also seeds تطريز/Embroidery and طباعة على الشاشة/Screen Print. Techniques carry a global `cost_delta_sar`.

### Colors — `scripts/seed-catalog.ts:69-113`
| slug | AR | EN | Hex | SKU prefix |
|---|---|---|---|---|
| white | أبيض | White | `#FFFFFF` | WH |
| black | أسود | Black | `#000000` | BK |
| beige | بيج | Beige | `#F5F5DC` | BG |
| navy | كحلي | Navy | `#1E3A5F` | NV |
| gray | رمادي | Gray | `#6B7280` | GY |
| red | أحمر | Red | `#EF4444` | RD |

### Sizes + measurements — `scripts/seed-catalog.ts:121-170`
| Label | SKU prefix | Measurements (cm) |
|---|---|---|
| S | SM | length 68, chest 88, sleeve 20 |
| M | MD | length 71, chest 96, sleeve 21 |
| L | LG | length 74, chest 104, sleeve 22 |
| XL | XL | length 77, chest 112, sleeve 23 |
| 2XL | XX | length 80, chest 120, sleeve 24 |
| 0-3M | BA | chest 22, length 38 |
| 3-6M | BB | chest 24, length 42 |
| 6-12M | BC | chest 26, length 46 |
| 12-18M | BD | chest 28, length 50 |
| One Size | OS | null |

### Print areas / zones
- Table `print_zones` with `name_ar`/`name_en`, normalized `x`/`y`, physical `width_cm`/`height_cm`, `media_slot` — `…20260412000001…sql:171-183`
- **Seeded: one zone per product, "الواجهة الأمامية" / "Front", 28 cm × 38 cm, at x=50 y=50** — `scripts/seed-catalog.ts:788-796`
- Wizard products can have 2 zones; per-zone-combo pricing table `base_product_zone_combo_pricing`
- Media gallery: up to **6 admin-labeled photo slots**; per-color-per-zone mockups in `base_product_color_zone_media`

### Suggested retail price
- **There is no `suggested_retail_price` field anywhere.**
- Merchant sets `merchant_products.retail_price` themselves: "profit = retail - base" — `…20260412000002…sql:29,46`
- Demo-seed retail prices (illustrative only) — `scripts/seed-merchant-products.ts:59-105`: Essential Tee **89** (base 45) · Oversized **119** (base 55) · Hoodie **189** (base 95) · Canvas Tote **65** (base 30)

### Stock: `base_product_stock` per product+color, levels `in_stock | low | out_of_stock`, informational only.

### SKU: prefix `[2-char product][1-char color][1-4-char size]` + 5-digit sequence; never reused — `docs/SKU_AND_ID_CONVENTIONS.md`

---

## 5. Pricing / profit model

**Merchant profit formula (Terms § 7.2)** — `docs/legal/TERMS_AND_CONDITIONS_AR.md:266-274`
```
سعر البيع (متجرك) − التكلفة الأساسية من بحر برنت − رسوم الشحن − أي ضريبة قيمة مضافة سارية
```
"لا تتحكّم بحر برنت في سعر بيعك، ولا تطّلع عليه، ولا تضمنه."

**Implemented formula including customer-paid shipping** — `…20260502000012_add_customer_shipping_amount.sql:18-27`
```
profit = (Σ(selling_price × qty) + customer_shipping_amount) − (Σ(base_cost × qty) + shipping_cost)
```

**B7R's revenue model:** "base cost margin on every order" — `CLAUDE.md:46`. Shipping margin = merchant price − OTO cost.

**Platform fee / commission: NOT FOUND.** Pure markup only; per-merchant discounts and volume tiers explicitly cancelled — `CLAUDE.md:85`. No monthly subscription: "بدون أي التزامات أو اشتراكات شهرية — نستقطع منك فقط تكلفة الطلب بعد العمل عليه" — `docs/salla-listing/README.md:76`

**Cost buildup shown in the customizer:** `"الأساس {base} + التقنية {tech} + المنطقة {zone}"` — `ar.json` `customizer.costBarBreakdown`
- `customizer.baseCostDeductionNote`: "بحر برنت تخصم هذا المبلغ من محفظتك عند كل طلب"
- `customizer.retailPriceHint`: "السعر الذي ستبيع به للعملاء"
- `customizer.profitPerUnit`: "الربح لكل قطعة"; `profitNegativeWarning`: "ستخسر {amount} في كل قطعة تبيعها. فكّر في رفع السعر."
- Profit projection widget: `profitWidget` "إذا بعت 10 قطع يومياً" → `profitWidgetMonth` "ريال / شهر"

**Base cost rules** — `CLAUDE.md:92-93`: flat per product (not per size/color); price locked at order creation (ADR-108).

**Wallet mechanics** — `CLAUDE.md:91`, Terms § 5.8
- Order created → immediate debit of `base cost × qty + carrier shipping fee`
- Insufficient balance → order flagged "غير مدفوع", auto-clears oldest-first on next top-up
- No merchant withdrawal ever
- Top-up min **10 SAR**, max **100,000 SAR**, whole-SAR only (ADR-100)
- Top-up methods: bank transfer (Al Rajhi) Day 1; StreamPay (Mada/card/Apple Pay) skeleton, flag OFF. Bank transfer approved "خلال يوم عمل"
- Payment brand assets: `public/payment-brands/{applepay,mada,mastercard,visa}.svg`
- Low-balance threshold default **100** SAR
- B7R-fault refund: cancel with preset → full wallet refund → SuperAdmin recreates order free
- Audit logs append-only

**Shipping fee model** — per-order, per-carrier, flat (not city-based, not per-item)
- Terms § 5.9: "الشحن ليس بسعر موحَّد. تُحدَّد رسوم الشحن لطلب ما بحسب شركة الشحن التي يختارها التاجر"
- `price_sar` is VAT-inclusive (gross) — `…20260508120000…sql:21-23`
- Merchant copy: "كل طلب تشحنه يُسلَّم عبر شركة الشحن التالية، وتُخصم رسوم الشحن المعروضة على البطاقة من محفظتك مع كل طلب"

**COD: not supported at launch** — `server/integrations/internal/outbound-shipment-push.ts:314`

**VAT**: per-order, VAT-inclusive pricing (ADR-098); `tax_settings.vat_rate` default 0.15; ZATCA Phase-2-compatible invoices; invoice ID format `W[YY][MM][DD][5-digit seq]`.

**Currency formatting** — `lib/format/index.ts`
- SAR only; multi-currency out of scope
- `formatCurrency(amount)` → `Intl.NumberFormat('en-US', {min/maxFractionDigits: 2})` → `"1,000.00"`
- `formatSarAmount(amount)` drops decimals for integers
- `roundToCents()` mandatory at storage boundaries
- `bdi(value)` wraps LTR numbers in `<bdi>` for RTL safety
- **The symbol is never text.** `<SarSymbol />` inlines the **official Saudi Central Bank SVG path**, inheriting `currentColor` — `components/shared/sar-symbol.tsx:1-32`. "Never use a text character, emoji, or Unicode ﷼ — always this component"; "Never use text 'SAR' — always the glyph component" — `docs/DESIGN_SYSTEM.md:78`
- `<SarAmount value={100.5} />` puts the symbol **always to the left of the digits regardless of direction** — `sar-symbol.tsx:27-30`
- Legacy `"ر.س"` strings still exist in some notification bodies
- Dates pinned to `Asia/Riyadh`; format `"12 May 2026, 2:03 PM"`

---

## 6. Onboarding & offers

**Registration: 3 steps** — `components/auth/registration-stepper.tsx:1-30`
1. **Identity** ("هويتك") — name, email, phone, store name
2. **Security** — password + confirm (8+ chars, 1 uppercase, 1 number, 1 symbol)
3. **Review + T&C**
- Phone must be a valid Saudi number (`5XXXXXXXX`); one account per phone (UNIQUE index)
- Cloudflare **Turnstile** on register/login/forgot
- Disposable-email domains blocked
- Social login IN scope (ADR-195): Apple + Google behind flags, both OFF until configured
- Register subtitle: "انضم إلى بحر برنت وابدأ ببيع منتجاتك المخصّصة"
- Login subtitle: "أدخل بيانات حسابك للوصول إلى لوحة التحكم"
- Sessions: 90-day sliding

**In-app onboarding checklist (6 items)** — "خطوات البداية": تأكيد البريد الإلكتروني → إكمال توثيق الهوية → رفع أول تصميم → إنشاء أول منتج → ربط متجرك → استلام أول طلب

**Welcome credit / free balance**
- One-time **welcome bonus** credited to the prepaid wallet, pending until email verified, no expiry — `CLAUDE.md:94`, Terms § 5.7
- Amount is the live setting `wallet_settings.welcome_bonus_amount`, SuperAdmin-editable (ADR-136)
- Migration default = 100 SAR — `…20260411300001…sql:337`
- **Current production value is 30 SAR** — `docs/DECISIONS.md:4991`, `docs/system-review-2026-09/LEDGER.md:70`. `CLAUDE.md:94`: "Never hardcode or quote a figure". Terms § 5.7.1 still says 100 SAR and is stale.
- Amount snapshotted at registration — `docs/DECISIONS.md:3495`
- Flag `welcome_bonus` gates promise and payment
- Abuse controls: one account per phone + per email; bonus spendable on orders, never withdrawable
- Merchant copy: "أكّد بريدك الإلكتروني لاستلام مكافأة الترحيب" · "مكافأة الترحيب محجوزة لك. أكّد بريدك الإلكتروني وسنُضيفها إلى رصيد محفظتك" · Notification: "أُضيفت مكافأة الترحيب بقيمة {amount} ر.س إلى محفظتك. استخدمها في أول طلب لك."
- **No other promo/coupon/discount-code system exists.**

**Wallet / balance** — "المحفظة", "رصيدك الحالي", "تعبئة الرصيد"; transaction types: تعبئة رصيد · خصم طلب · استرداد طلب · مكافأة الترحيب · تعديل إداري · تصحيح خصم طلب

**KYC / verification — "Dynamic Verification Engine"** — `…20260411100004…sql:289-296`
| key | seeded | AR |
|---|---|---|
| `email` | ON | التحقق من البريد الإلكتروني |
| `phone` | OFF | التحقق من رقم الجوال |
| `national_id` | ON | الهوية الوطنية (للسعوديين) |
| `iqama` | ON | الإقامة (للمقيمين) |
| `cr_number` | ON | السجل التجاري |
| `freelance_cert` | ON | شهادة العمل الحر |
| `vat_number` | ON | الرقم الضريبي |
- Either/or groups: national ID **or** iqama; CR **or** freelance cert — "تحتاج إلى واحد فقط مما يلي."
- Unverified blocks only new store connections + manual orders
- Upload limits: PDF/JPEG/PNG/WebP, max 10 MB

**Welcome email drip: Day 0 / 1 / 3 / 7** — `server/email/internal/templates/welcome-drip.ts`; Day 3 subject "نحن هنا للمساعدة، بحر برنت"; signature "فريق بحر برنت". First-order celebration: "وصل أول طلب!" / "مبروك، استلمت أول طلب في متجرك. انطلقت البداية!"

---

## 7. Shipping & fulfillment

**Provider:** **OTO** (direct API) — aggregates 50+ Saudi/GCC carriers — `docs/INTEGRATIONS.md:16`, Terms § 10.1

**Active carrier catalog seeded (merchant-facing)** — `…20260508120002_seed_shipping_carriers.sql:40-93`
| AR name | Price (SAR, VAT-incl) | Method | ETA | Default |
|---|---|---|---|---|
| SMSA Express - توصيل للمنزل | **25.00** | `home` | **2–4 days** | ✅ |
| SMSA Express - استلام من الفرع | **20.00** | `pickup` | **1–3 days** | — |

**OTO carrier options (COST to B7R, 1 kg, snapshot 2026-06-14)** — `docs/OTO_CARRIER_CATALOG.md:31-46`: SMSA 23.2 SAR (6/6 coverage, launch carrier); J&T 19.0; Aymakan 19.95; Naqel 20.9; Aramex 20.33 (1–2 days); UPS 23.5; iMile 18.0; Shipa 18.0; others. Pickup/locker: Redbox 13.0; SMSA PUDO 13.92; SPL PUDO 14.0; Aramex PUDO 16.0.

**Cities / coverage**: measured as N/6 sampled routes from Riyadh to Riyadh, Jeddah, Dammam, Makkah, Abha, Tabuk. No city-level shipping table. Origin is a single B7R facility (`shipping_origin_settings`, seeded empty). Each merchant gets an OTO warehouse carrying the merchant's name/brand but B7R's physical address. Market framing: "Saudi Arabia, UAE, Bahrain" — `b7r-handoff/UserInterface.md:13`

**Order status lifecycle** — `created` جديد → `in_production` قيد الإنتاج → `shipped` شحن → `delivered` مستلم; plus `cancelled` ملغي. Strictly one step at a time (ADR-139). Merchant can cancel only while `created`. Tracking events: picked_up, in_transit, out_for_delivery, delivered, returned, failed_delivery. Merchant forwards tracking to the end customer. **Known gap:** OTO has never delivered a webhook event (D-15).

**Delivery promises (marketing-usable, with caveat)**
- "In-country production — 1-3 day shipping via local carriers (SMSA default) vs 7-21 days at 40-80 SAR through cross-border POD" — `docs/spec/01_IDENTITY_AND_ARCHITECTURE.md:17`
- Terms § 10.4: ETA ranges are carrier estimates, not guarantees
- **No production/print turnaround SLA exists in code.** Terms § 12.1: no published SLA at launch.

**White-label guarantee** — Terms § 10.3: "تعرض ملصقات الشحن العلامة التجارية للتاجر فقط. ولا تُعرَّف بحر برنت على الطرد، ولا على بوليصة الشحن (AWB)، ولا في أي اتصال تتبّع يتلقّاه العميل النهائي." CI-enforced.

**Returns:** none. "Custom POD = no returns. B7R-fault handled via cancel + recreate" — `CLAUDE.md:82`

---

## 8. Marketing copy already in the app

### A. Auth carousel — 5 value props (AR, with images `public/auth-carousel/slide-1..5.png`)
1. **"أطلق علامتك التجارية خلال دقائق"** — "اختر منتجاتك، وأضف تصاميمك بسهولة، وابدأ ببيع منتجاتك مباشرة بدون التعقيدات التشغيلية واللوجستية."
2. **"بدون رأس مال ولا مخزون"** — "نطبع منتجاتك فقط بعد وصول الطلب من عميلك، لتبدأ البيع مباشرة بدون شراء كميات مسبقة أو تحمل تكاليف التخزين."
3. **"تكامل تلقائي مع متجرك الإلكتروني"** — "اربط متجرك بسهولة لينتقل كل طلب إلى نظامنا تلقائيًا، فيوفّر وقتك ويجعل تنفيذ الطلبات يجري بسلاسة دون تدخل منك."
4. **"طباعة احترافية بأحدث التقنيات"** — "نستخدم أحدث تقنيات الطباعة المباشرة على الملابس لإنتاج منتجات عالية الجودة بألوان دقيقة ونتائج ثابتة لكل طلب."
5. **"نتولى التغليف والشحن باسم متجرك"** — "نغلّف المنتجات باحترافية ونشحنها مباشرة إلى عميلك النهائي، بالكامل تحت اسم علامتك التجارية."

### B. Salla App Store listing — `docs/salla-listing/README.md` (2026-06-01)
- **App name:** EN `B7R Print` · AR `بحر برنت`
- **Short description (AR):** "بحر برنت منصة طباعة عند الطلب مقرّها السعودية، تتيح لك تصميم وبيع منتجاتك بسهولة وجودة عالية بدون مخزون أو معدات. نتولّى الطباعة والتغليف والشحن محلياً تحت علامتك التجارية لتصل طلباتك بسرعة."
- **Long description headline (AR):** "حوّل متجرك في سلة إلى مشروع طباعة عند الطلب، بدون مخزون، وبدون معدات، وبدون رأس مال."
- **"كيف يعمل؟" 5 steps:** اربط متجرك بضغطة زر واحدة (ربط آمن، بدون مشاركة أي بيانات حساسة) → اختر المنتجات وخصّصها وحدّد سعر البيع → انشره إلى متجرك بضغطة واحدة (يُزامَن الاسم والصور والخيارات والسعر تلقائياً) → يشتري العميل ويتزامن الطلب فوراً → نطبع ونغلّف ونشحن تحت علامتك التجارية إلى باب بيت العميل
- **"لماذا بحر برنت؟" 5 differentiators:** إنتاج وشحن محلي داخل السعودية (توصيل سريع، بدون جمارك أو تأخير استيراد) · علامة بيضاء بالكامل · بدون حد أدنى للطلبات · بدون أي التزامات أو اشتراكات شهرية · منصة عربية أولاً مبنية للتجار السعوديين بدعم مباشر على مدار 24 ساعة
- **Closing CTA:** "أطلق خط منتجاتك بعلامتك التجارية اليوم مع بحر برنت."
- **Catalog phrasing:** "تيشيرتات، هودي، حقائب قماشية، وبحر من المنتجات المختلفة المتجددة باستمرار" (pun on بحر = sea)
- **SEO terms:** طباعة عند الطلب, print on demand, POD, طباعة تيشيرتات, تصميم منتجات, منتجات مخصصة, طباعة محلية, بدون مخزون, دروب شيبينج, dropshipping, طباعة هودي, طباعة مج, علامة تجارية خاصة, تيشيرت مخصص, طباعة سعودية, white label, custom products, طباعة شعار, متجر طباعة, تجارة بدون رأس مال, بحر برنت, b7r print
- **Demo video:** `https://www.youtube.com/watch?v=CDAPX46E9aw` (flagged "confirm final")
- **3 onboarding steps:** أنشئ حساب بحر برنت · اربط متجرك في سلة · خصّص وانشر أول منتج
- **5 "Key Benefits" tiles:** بدون مخزون ولا رأس مال / Zero inventory, zero capital · إنتاج وشحن داخل السعودية / Made & shipped in Saudi · علامتك التجارية بالكامل / 100% your own brand · طلباتك تتزامن تلقائياً / Orders sync automatically · صمّم منتجاتك بنفسك / Design in your browser
- **Featured hero brief:** deep navy → royal blue gradient, subtle wave texture, logo lockup, tagline "منصة الطباعة عند الطلب / Print-on-Demand", white t-shirt + tote mockup, "متكامل مع سلة" badge, mood "premium, minimal, Saudi-first"

### C. Legal / policy pages
- Live routes: `app/(public)/terms`, `app/(public)/privacy`, `app/(public)/unsubscribe`; merchant-scoped `legal/terms`, `faq`, `help-center`
- Live text is DB-served via `/admin/settings/legal` (TipTap)
- Full drafts: `docs/legal/TERMS_AND_CONDITIONS_AR.md` (651 lines, 18 sections), `PRIVACY_POLICY_AR.md` (431 lines), plus `_EN.md`. AR versions carry "requires professional legal review before publishing"; EN governs on conflict.
- Privacy placeholder body: "يخزّن بحر برنت بيانات التجار داخل المملكة العربية السعودية، ويشفّر جميع البيانات الشخصية بخوارزمية AES-256، ولا يبيع بياناتك أو يشاركها مع أي طرف ثالث. العملاء النهائيون لا يتلقون أي مراسلات من بحر برنت."
- No standalone delivery-policy page; delivery terms live in Terms § 10 and § 5.9.

### D. Support contact
- **WhatsApp is the only support channel** (+ in-app feedback) — Terms § 13.1
- Number is an admin setting `platform_settings.support_whatsapp` (E.164); link `https://wa.me/{digits}`; CTAs omitted when unset (ADR-196)
- Real contacts recorded for Salla profile: support email `contact@b7r.sa`, phone `0501699572`, website `https://b7r.sa`
- **Invoice issuer block (company legal details)** — `docs/spec/05_WALLET_AND_FINANCE.md:69`: **B7R Print Company, CR 7050997746, Saudi Arabia, Mecca Region, Jeddah, An Nahdah Dist 4992, Abu AlHassan Ibn Masoud St 7438, National Address JENA7438, ZIP 23615, info@b7r.sa, +966 50 169 9572**
- Sender mailbox `system@b7r.sa`; `support@b7r.app` is a banned dev-mailbox tripwire
- Help-center copy: "هل تحتاج مزيداً من المساعدة؟" / "إذا لم تجد إجابتك أعلاه، أرسل لنا رسالة من داخل التطبيق وسنرد عليك في نفس القناة." CTAs "إرسال ملاحظة" + "تواصل معنا عبر واتساب"

### E. Social links — handle **`b7rprint`** everywhere: X `https://x.com/b7rprint` · Instagram `https://instagram.com/b7rprint` · TikTok `https://tiktok.com/@b7rprint` · WhatsApp dynamic. No Snapchat, LinkedIn, or YouTube channel.

### F. Email brand shell — footer "بحر برنت · المملكة العربية السعودية · © 2026"; dark-navy header slab with centred white logo, cyan wave-gradient stripe, white card body with `#E8E8E8` borders; radius 13px.

### G. FAQ — `faq_entries` table exists, admin-authored; **no seeded FAQ content in the repo**. `faqPage.title` = "الأسئلة الشائعة". `contact_submissions` table exists, no ticket system.

### H. Other reusable strings
- Catalog: "اختر منتجاً وابدأ بتخصيصه بتصميمك." / "يبدأ من" / "تخصيص المنتج"
- Dashboard empty chart: "أول عملية بيع على بُعد نقرات قليلة. أطلق منتجك الأول وشاهد هذه الرسمة تنبض بالحياة."
- Customizer steps: التصميم → السعر → التفاصيل; "منطقة الطباعة"; "مجاناً"
- PWA manifest: name **"B7R Print · بحر برنت"**, description **"Saudi-first Print-on-Demand platform for merchants"**, `lang: "ar"`, `dir: "rtl"`, `background_color #F0F0F0`, `theme_color #019CE4`, `start_url /login`
- `<head>`: title `B7R Print · بحر برنت`, description `Saudi-first Print-on-Demand platform`
- Logo assets: `public/logo.png`, `public/logo/small-colored-logo.png`, `public/logo/small-white-logo.png`, `public/favicon.png`, icons 192/512 + maskable + apple-touch-icon-180. **No SVG logo in the repo.**

---

## 9. Existing docs

**`CLAUDE.md`** (32,917 bytes) — project constitution: business model, revenue model, white-label rule, three roles, merchant journey, IN/OUT scope table (marketing site `b7r.sa` is OUT), Critical Business Rules (`:90-99`), 6 architecture rules, locked tech stack (`:186-190`). Founder: "Dhia (founder, solo, bilingual AR/EN)", values "directness, honest trade-offs, consultant-level reasoning".

**`README.md`** — "White-label Print-on-Demand SaaS for the Saudi & GCC market", architecture diagram, tech-stack table, status "live in production", licence proprietary.

**Docs a marketing-site BRD should lean on:**
| Doc | Why |
|---|---|
| `b7r-handoff/UserInterface.md` (782 lines) | Canonical visual design — full hex color system light+dark, typography, spacing, radius, shadows, buttons, inputs; written for any stack |
| `docs/board-presentation-designer-brief.md` | Brand identity + brand voice + visual don'ts, elevator pitch, merchant journey, palette, type scale, logo rules, "Apple-Keynote / Linear / Stripe aesthetic", photography direction |
| `docs/salla-listing/README.md` | Ready-written AR+EN marketing copy |
| `docs/spec/01_IDENTITY_AND_ARCHITECTURE.md` | Identity, merchant journey, "Saudi Competitive Advantages over Printful/Printify" table (`:15-20`) |
| `docs/spec/05_WALLET_AND_FINANCE.md` | Wallet, invoice format, company legal details, VAT, welcome bonus |
| `docs/INTEGRATIONS.md` | Integration reality (verified 2026-07-31) |
| `docs/DESIGN_SYSTEM.md` | Hex tokens `#019ce6` / `#015cb5`, radius, SAR symbol rule |
| `docs/LOCALIZATION.md` + `docs/LOCALIZATION_GOTCHAS.md` | AR/EN + RTL rules |
| `docs/legal/` | Terms + Privacy AR/EN |
| `docs/OTO_CARRIER_CATALOG.md` | Carrier list, costs, coverage |

**ADRs:** `docs/DECISIONS.md` (~838 KB, 150+ ADRs). Read `docs/DECISIONS_INDEX.md` first. Marketing-relevant: ADR-002 (welcome bonus 100 SAR — superseded) · ADR-136 (editable welcome credit) · ADR-108/175 (price lock) · ADR-138/139 (status moves) · ADR-195 (social login) · ADR-196 (support WhatsApp setting) · ADR-192 (pairing code) · ADR-131 (SES dropped) · ADR-100 (whole-SAR top-ups)

**Roadmap:** `docs/spec/11_LAUNCH_AND_PHASES.md` is HISTORICAL. Current truth: `CHANGELOG.md`, `docs/DECISIONS.md`, `docs/system-review-2026-09/LEDGER.md`, `docs/LAUNCH_READINESS_AUDIT_2026_07_26.md`.

---

## Flags for the requirements doc

1. **ITF Rayat Round does not exist in the app.** App font is Baloo Bhaijaan 2 (self-hosted, AR+EN, 400–800), and docs say "do not introduce a second typeface." Using Rayat Round on the site is a new brand decision.
2. **Welcome bonus: do not hardcode a number.** Live SuperAdmin setting; evidence says current value is 30 SAR; Terms § 5.7.1 still says 100 and is stale. Confirm with Dhia.
3. **No suggested retail prices exist.** Only base costs (45/55/95/35/30) and demo-seed retail prices (89/119/189/65). Any "sell for X" figure is new content.
4. **Only 5 products exist; mugs/caps are not among them.** Salla listing hedges with "وبحر من المنتجات المختلفة المتجددة باستمرار".
5. **Only Salla is live.** Zid and Shopify are flag-gated OFF with "Coming Soon". WooCommerce does not exist.
6. **COD is off, returns don't exist, no SLA is published.** Don't promise any of the three.
7. **Two hex sets disagree slightly** between `app/globals.css` (ships) and design docs (intent).
8. **No logo SVG in the repo.**
