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

*Amended 2026-09-18 (site audit item 12, the CTO's settlement): performance 90 is the gate on the seven LHCI URLs (`/`, `/products`, `/products/tee-essential`, `/contact` at warn, `/blog/{sample}`, `/en`, `/en/products/tee-essential`); every other route carries a floor of 85, asserted as a warn on four of them in CI (`/how-it-works`, `/faq`, `/privacy`, `/en/compare-printful`) and on all of them by the launch-checklist `lh-all` pass, because what a CMS page ships before its paint is React DOM and the app router (116 KB gzip of 168) and the simulated LCP floor is theirs (ADR-014). Accessibility, best practices, SEO and CLS keep their thresholds on every route.*

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
