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

`Button` (variants primary, secondary [white with primary border], ghost, link, shiny and inverseShiny [the sheen, ADR-054, the site-wide admin switch]; sizes md 44 px, lg 52 px; optional trailing arrow icon mirrored in RTL; loading state) · `Chip` (pill, optional check icon) · `Badge` (tint background, 10% colour rule: `bg-{color}/10 text-{color} border-{color}/20`) · `Card` · `SectionHeader` (eyebrow + H2 + lead, start-aligned) · `Accordion` (single-open, chevron rotates, `aria-expanded`) · `Input`, `Textarea`, `Select`, `Stepper` (numeric with +/−), `Slider` · `Dialog` · `Toast` · `SarAmount` (§3.11) · `ProductCard` · `WaveDivider` · `CtaRibbon` · `WhatsAppWidget` · `ConsentBar` · `VideoPlayer` · `Breadcrumbs` · `Icon` (RTL-aware Lucide wrapper) · `Container`, `Section` · `BookingPicker` (Level 4, ADR-062: the strip of days on the Riyadh clock as 56×64 px chips, the weekday above the day number, the selected one filled primary, a closed day greyed with its reason as a title; the free times as 44 px pills with Western digits; the form reuses `Input`, `Textarea` and `Button`; a client island loaded near the viewport over a server-rendered stand-in, on `/book` and inline in the contact card).

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
