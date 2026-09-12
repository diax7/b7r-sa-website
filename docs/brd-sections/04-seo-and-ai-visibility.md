## 7. SEO and AI-search visibility requirements

Principle (from `docs/research/04`): there is no separate "AI SEO". Answer engines cite pages that are indexed, server-rendered, clearly structured, fresh, and mentioned elsewhere. Everything below is a build requirement for Level 1 unless marked L2/L3.

### 7.1 Rendering and crawlability

1. Every indexable route is statically rendered at build (Next.js App Router, no `dynamic = 'force-dynamic'`), with all text, links, images (with `alt`), and JSON-LD in the initial HTML. Client components only for the designer, carousels, accordions, forms, widgets.
2. No content behind client-side fetches. No infinite scroll.
3. `Content-Language: ar` response header on every page (set in `next.config.ts` `headers()`), plus `<meta http-equiv="content-language" content="ar">`.
4. Canonical URL on every page: `https://b7r.sa{path}` without trailing slash and without query strings (the designer deep-link query is ignored by canonical).
5. hreflang: none in Level 1 (a single language). When `/en` ships: `ar`, `en`, and `x-default → ar`, self-referencing, emitted from `sitemap.ts` alternates and `<link rel="alternate">`.
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
- `alternates.canonical`.
- Open Graph: `type` (`website`, `product` on product pages, `article` on posts), `locale: ar_SA`, `siteName: بحر برنت`, `title`, `description`, `images` (1200 × 630). Default OG image: designed once (`public/og/default.png`): white background, the colour logo, the tagline منصة الطباعة عند الطلب في السعودية, and a row of the five product photos; product pages use a generated OG image with the product photo and "يبدأ من {price}" (`next/og` `ImageResponse`, ITF Rayat Round Bold loaded from the woff2 files); posts use the cover.
- Twitter card `summary_large_image`, `site: @b7rprint`.
- `robots: { index, follow, 'max-image-preview': 'large' }`; `noindex` on 404 and on any non-production host.
- Icons: `favicon.ico` (32), `icon.svg` if available else PNG 192/512, `apple-touch-icon` 180, `manifest.webmanifest` (name "بحر برنت", `lang: ar`, `dir: rtl`, `theme_color: #0058B0`, `background_color: #FFFFFF`, display `browser`).
- Verification meta tags from env: `GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION`.

### 7.4 Structured data (JSON-LD, rendered in the page component, one `<script type="application/ld+json">` per page)

| Page | Types |
|---|---|
| Home | `OnlineStore` (name بحر برنت, alternateName B7R Print, url, logo ≥ 112 px, `sameAs` [X, Instagram, TikTok], `address` {addressLocality: جدة, addressRegion: منطقة مكة المكرمة, addressCountry: SA}, `contactPoint` {telephone +966501699572, contactType "customer support", availableLanguage ar}, `hasMerchantReturnPolicy` per Appendix B (no returns on custom goods; reprint or refund on B7R error within 10 days), `hasShippingService`/`shippingDetails` {shippingDestination SA, transitTime max 5 days}) + `WebSite` (name, alternateName, url) |
| Products listing | `ItemList` of the five product URLs + `BreadcrumbList` |
| Product | `Product` (name, description, image[], brand "بحر برنت", material, `offers`: `Offer` {price = base cost, priceCurrency "SAR", availability InStock, url, `priceSpecification` note "تكلفة للتاجر"}) + `BreadcrumbList` |
| How it works, About, Contact, FAQ, Legal | `WebPage` + `BreadcrumbList` (no FAQPage, no HowTo: rich results discontinued) |
| Blog post | `BlogPosting` (headline, description, image, datePublished, dateModified, inLanguage ar, author `Person` {name ضياء, url /about}, publisher `Organization`) + `BreadcrumbList` |

Validate with Google's Rich Results Test and the Schema.org validator in CI where possible (at least a JSON parse + required-fields unit test).

### 7.5 Sitemap (`app/sitemap.ts`)

All indexable routes with `lastModified` (ISO 8601 with time; from the content file's `updatedAt` field, updated only on real content changes), `changeFrequency` omitted (ignored by engines), image entries for product pages (`images: [...]`). Excludes 404, API, and query-string variants. Submitted to Google Search Console and Bing Webmaster Tools at launch (§12.4).

### 7.6 IndexNow

`public/{INDEXNOW_KEY}.txt` containing the key. A small utility `lib/indexnow.ts` posts `{ host, key, keyLocation, urlList }` to `https://api.indexnow.org/indexnow`. In Level 1 it runs from a GitHub Actions step after a production deploy with the list of changed routes (diff of `sitemap.xml` before/after). Level 2 moves it to a publish hook.

### 7.7 Measurement setup

- Google Search Console: domain property for `b7r.sa` verified by DNS TXT; sitemap submitted; keep "Search generative AI control" on Include.
- Bing Webmaster Tools: verified; sitemap submitted; IndexNow enabled.
- GA4: property `G-JPB02M7C49` (existing). Add a custom channel group "AI Assistants" above Referral with the session-source regex `^(chatgpt\.com|chat\.openai\.com|perplexity\.ai|www\.perplexity\.ai|claude\.ai|gemini\.google\.com|copilot\.microsoft\.com|deepseek\.com|grok\.com|x\.ai|meta\.ai|you\.com|poe\.com)$`. Mark `cta_click`, `outbound_app_click`, `contact_submit`, `whatsapp_click` as key events.
- Umami: website added under `umami.b7r.app`; the same events sent with `umami.track`.
- Quarterly manual check: run 20 Arabic buyer prompts (from Appendix E) in ChatGPT, Gemini, Perplexity, Copilot, and Google AI Mode; log whether b7r.sa is cited.

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
- Internal links as in §5.3. External links only to b7r.app, the social profiles, and Misk (nofollow not needed).
- Visible publish and update dates on posts and legal pages, matching JSON-LD.
- Author identity: ضياء, مؤسس بحر برنت, linked to `/about` (Level 3 adds an author page).

### 7.10 Explicitly not done

`llms.txt` (no measured effect; optional later), `FAQPage`/`HowTo`/`SearchAction` schema, `Speakable`, Google Business Profile (no customer-facing premises), `LocalBusiness` schema (use `OnlineStore`).
