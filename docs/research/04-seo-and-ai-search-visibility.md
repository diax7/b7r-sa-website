# SEO + AI Search Visibility Research (as of Sept 2026)

> Research report generated 2026-09-12 by a background agent with current primary sources. Input for the B7R marketing-site BRD. Not the BRD itself. Items resting on secondary or unverified reporting are flagged inline.

## Executive summary (the ten things that matter)

1. **Google's own position, stated twice in 2026: there is no AI-specific SEO.** Eligibility for AI Overviews / AI Mode = indexed + snippet-eligible. Google tells site owners to *ignore* llms.txt, "chunking," AI-specific rewriting, and manufactured mentions. ([Google AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide); [AI features doc](https://developers.google.com/search/docs/appearance/ai-features))
2. **Server-rendered HTML is non-negotiable.** Google: SSR is "still a great idea… not all bots can run JavaScript"; Bing: content hidden behind client-side rendering may not be indexed or selected for Copilot grounding; OpenAI/Anthropic/Perplexity crawlers are reported (not vendor-confirmed) to fetch raw HTML only.
3. **robots.txt must separate training bots from search/retrieval bots.** Allow `OAI-SearchBot`, `Claude-SearchBot`, `Claude-User`, `PerplexityBot`, `Bingbot`, `Googlebot`, `Applebot`. Training bots (`GPTBot`, `ClaudeBot`, `Google-Extended`, `Applebot-Extended`, `CCBot`, `Meta-ExternalAgent`, `Amazonbot`) are a business decision; blocking them does not remove you from any answer engine.
4. **llms.txt has no measured effect.** 97% of files got zero requests (Ahrefs, 137K sites); no correlation with citations (SE Ranking, 300K domains); Google ignores it. Publish one if it costs 10 minutes; don't build a plan on it.
5. **Structured data landscape has shrunk.** FAQ rich results gone (fully removed 7 May 2026), HowTo gone (Sept 2023), Sitelinks Searchbox gone (Nov 2024). Still live: Organization/OnlineStore (with `sameAs`, logo, return + shipping policy), WebSite (site name only), BreadcrumbList, Product/Offer (`priceCurrency: "SAR"`), Article/BlogPosting with author + dates, LocalBusiness only with a customer-facing physical location.
6. **Rankings predict Google's AI citations; they barely predict ChatGPT/Perplexity.** ~38% of AI Overview citations come from the top 10 (Ahrefs, Mar 2026); ChatGPT cited URLs overlap Google top-10 at 4–12%. Cross-engine overlap is tiny (Jaccard 0.09).
7. **What gets cited (measured):** answer-first sections, Q&A structure, named-author E-E-A-T, statistics/quotes/citations (+30–40% in the only controlled study), claims in the first ~30% of the page, topical hub pages, recently *updated* content. Domain authority and backlinks are weak predictors; brand mentions (especially YouTube) are the strongest correlate.
8. **Arabic is a different citation graph.** In Arabic AI Overviews, Reddit is ~5% of social citations; Instagram (29%), YouTube (26%), TikTok (9%), LinkedIn (8%) dominate (Profound, 3.25B citations). Arabic AI Overviews cite vendor-owned pages ~91% of the time and directories 0% (small audit). English "Reddit + listicle" playbooks do not transfer.
9. **Scaled AI publishing is exactly what Google's March 2024 policy and Jan 2025 rater guidelines target.** AI-assisted is fine; unreviewed daily volume with no original value is "Lowest." No controlled study shows daily beats 2–4 quality posts/week; correlational data support 8–16 posts/month in topic clusters.
10. **Measurement now has first-party AI reports:** Search Console generative AI performance report (since 31 Aug 2026, impressions only), Bing Webmaster Tools AI Performance (Feb 2026; Citation Share June 2026), GA4 "AI Assistant" default channel (13 May 2026). ChatGPT appends `utm_source=chatgpt.com`.

---

## 1. Technical SEO baseline (Next.js-style site)

| Item | Requirement / target | Source |
|---|---|---|
| Rendering | SSR/SSG for every indexable page; all primary content, links, and JSON-LD in initial HTML. Dynamic rendering is "a workaround, not a recommended solution." | [Google JS SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics) |
| Bing rendering | "content that cannot be reliably rendered may not be indexed or selected for grounding results." | [Bing guidelines](https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a) |
| AI crawlers + JS | Reported (secondary): GPTBot/OAI-SearchBot/ChatGPT-User fetch raw HTML with no JS. SSR makes it moot. | [DeepSmith](https://deepsmith.ai/blog/how-chatgpt-fetches-renders-your-pages) (unverified) |
| Sitemaps | XML, UTF-8, absolute canonical URLs, ≤50k URLs/50MB per file, index if split. `lastmod` ISO 8601 date+time only on real change; Bing ignores `changefreq`/`priority`. Image sitemap tags for product mockups; news sitemap only if in Google News. `hreflang` can live in the sitemap via `xhtml:link`. | [Build a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [Bing on lastmod](https://blogs.bing.com/webmaster/July-2025/Keeping-Content-Discoverable-with-Sitemaps-in-AI-Powered-Search) |
| Next.js sitemap | `app/sitemap.ts` supports `alternates.languages` (emits hreflang), `generateSitemaps()` for >50k URLs. | [Next.js sitemap](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap) |
| robots.txt | Controls crawling, not indexing; use `noindex` for exclusion. Put `Sitemap:` line in it. Next.js `app/robots.ts` with env check so staging returns `Disallow: /`. | [Google robots](https://developers.google.com/search/docs/crawling-indexing/robots/intro) |
| Canonical | `rel=canonical` on every page; must agree with sitemap; one trailing-slash convention. | [Consolidate duplicates](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) |
| hreflang (ar / en / x-default) | Every page's set must list all variants including itself. Codes ISO 639-1 (+ optional region). Use `ar` (+ `ar-SA` later) and `en`, plus `x-default` → the Arabic URL. Google does **not** use `hreflang`/`lang` to detect page language. | [Localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions), [x-default](https://developers.google.cn/search/blog/2023/05/x-default) |
| Bing + language | hreflang is "a far weaker signal than content-language at Bing." Add `Content-Language` header/meta + correct `html lang`. (Reported second-hand.) | [patrickstox](https://patrickstox.com/international-seo/hreflang/) (secondary) |
| Geotargeting | Search Console International Targeting tool deprecated Sept 2022; remaining geo signals: ccTLD, hreflang, URL structure, content language, links. | [GSC notice](https://support.google.com/webmasters/answer/12474899) |
| `lang` / `dir` | `<html lang="ar" dir="rtl">` on root (W3C: "never use CSS to apply the base direction"); `dir="ltr" lang="en"` on English blocks; `dir="auto"`/`<bdi>` for user-generated text; CSS logical properties. Don't put `dir` on `<body>`. | [W3C dir](https://www.w3.org/International/questions/qa-html-dir.html), [W3C bidi](https://www.w3.org/International/docs/bp-html-bidi/) |
| Core Web Vitals | Good at 75th percentile, mobile and desktop: **LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1**. | [web.dev](https://web.dev/articles/defining-core-web-vitals-thresholds) |
| Images | `next/image` with `sizes` on every image; `preload` only on the LCP hero (Next 16 deprecates `priority` for `preload`); Arabic alt text; image sitemap. | [next/image](https://nextjs.org/docs/app/api-reference/components/image) |
| IndexNow | Host `{key}.txt` at root; POST JSON to `https://api.indexnow.org/indexnow` with `host`, `key`, `urlList` (≤10,000); fire on publish/update/delete from the CMS. Bing may deprecate its own URL Submission API in favour of IndexNow. | [IndexNow](https://www.indexnow.org/documentation) |
| Search Console | Verify via DNS TXT (Domain property); submit sitemap; keep **Search generative AI control** on "Include" (default). | [GSC control](https://support.google.com/webmasters/answer/16908024) |
| Bing Webmaster Tools | Verify, submit sitemap, enable IndexNow, use AI Performance report. Bing processes sitemaps at least daily. | [Bing setup](https://blogs.bing.com/webmaster/June-2025/Start-Using-Bing-Webmaster-Tools-to-Improve-Your-Site-Visibility) |
| Metadata | `generateMetadata` for dynamic pages; JSON-LD does **not** go in `generateMetadata`, render `<script type="application/ld+json">` in the page component. | [Next.js generateMetadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata) |

---

## 2. Structured data: current status of each type

| Type | Status (Sept 2026) | What to do | Source |
|---|---|---|---|
| **Organization / OnlineStore** | Supported. `logo` (≥112×112), `sameAs`, `address`, `telephone`, `vatID`; `OnlineStore` accepts `hasMerchantReturnPolicy` and `hasShippingService`. | Homepage; use `OnlineStore`; KSA return window, `addressCountry: "SA"`, `sameAs` to Instagram, X, LinkedIn, YouTube, TikTok, Wikidata. | [Organization](https://developers.google.com/search/docs/appearance/structured-data/organization), [Return policy](https://developers.google.com/search/docs/appearance/structured-data/return-policy) |
| **WebSite (+ SearchAction)** | `WebSite` still used for **site names**; Sitelinks Searchbox removed 21 Nov 2024. | `WebSite` with `name`, `alternateName` (Arabic + Latin brand forms), `url` on homepage only. Drop `SearchAction`. | [Site names](https://developers.google.com/search/docs/appearance/site-names), [Farewell Searchbox](https://developers.google.com/search/blog/2024/10/sitelinks-search-box) |
| **BreadcrumbList** | Supported. Breadcrumb schema on 15–20% of AI-cited pages (Semrush). | Every product, category, article page. | [Breadcrumb](https://developers.google.cn/search/docs/appearance/structured-data/breadcrumb), [Semrush](https://www.semrush.com/blog/technical-seo-impact-on-ai-search-study/) |
| **Product / Offer (merchant listing)** | Supported; requires nested `Offer` with `price > 0`, `priceCurrency` `"SAR"`, `availability`; optional `shippingDetails`, `hasMerchantReturnPolicy`. Free listings in Merchant Center support Saudi Arabia. | Mark up catalog products with starting price; `AggregateOffer` for variable pricing. | [Merchant listing](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing), [Free listings countries](https://support.google.com/merchants/answer/13692890) |
| **FAQPage** | **Rich result removed for all sites 7 May 2026** (docs removed June 2026). Markup harmless but produces nothing. | Keep on-page FAQ *content* (Q&A format correlates +25% with AI citation); markup optional. | [Google updates](https://developers.google.com/search/updates) |
| **HowTo** | **Removed Sept 2023**; docs deleted. | Don't implement. Write steps with headings/lists. | [Google updates](https://developers.google.com/search/updates) |
| **Article / BlogPosting** | Supported. `author` (Person with `url`), `datePublished`, `dateModified` (ISO 8601 with tz), `image` (1:1, 4:3, 16:9). Article schema on 20–26% of AI-cited pages. | Every post; author pages with `ProfilePage`; dates must match visible dates. | [Article](https://developers.google.com/search/docs/appearance/structured-data/article), [Byline dates](https://developers.google.cn/search/docs/appearance/publication-dates) |
| **LocalBusiness** | Requires a real `address`; Google Business Profile requires in-person contact; online-only businesses ineligible. | Only with a showroom/office receiving customers. | [LocalBusiness](https://developers.google.com/search/docs/appearance/structured-data/local-business), [GBP eligibility](https://support.google.com/business/answer/13763036) |
| **Speakable** | Beta since 2018; US/English news only. | Skip. | [Speakable](https://developers.google.com/search/docs/appearance/structured-data/speakable) |

Google's framing: structured data "isn't required… there's no special schema.org markup you need to add… it's a good idea to continue using it… as it helps with being eligible for rich results."

---

## 3. AI-engine visibility (GEO/AEO)

### 3a. Crawler allow/deny matrix

| Token | Operator | Purpose | Blocking it means | Honours robots.txt | Recommendation |
|---|---|---|---|---|---|
| `Googlebot` | Google | Search index → AI Overviews, AI Mode, Gemini grounding | Gone from Search | Yes | Allow |
| `Google-Extended` | Google | Control token: Gemini app/Vertex training + grounding. Does not affect Search or AI Overviews. | Opts out of Gemini training/grounding only | n/a | Allow |
| `Bingbot` | Microsoft | Bing index → Copilot, ChatGPT Enterprise/Edu | Gone from Bing + Copilot | Yes | Allow |
| `OAI-SearchBot` | OpenAI | ChatGPT search index. "Sites that are opted out… will not be shown in ChatGPT search answers." | No ChatGPT citations | Yes | **Allow** |
| `ChatGPT-User` | OpenAI | User-triggered fetch; robots rules may not apply | Nothing reliable | No | Allow |
| `GPTBot` | OpenAI | Training only | Out of future training; no effect on citations | Yes | Business choice |
| `Claude-SearchBot` | Anthropic | Search index | Fewer Claude citations | Yes | **Allow** |
| `Claude-User` | Anthropic | User-initiated fetch | Reduced visibility for user-directed search | Yes | **Allow** |
| `ClaudeBot` | Anthropic | Training | Out of future training | Yes | Business choice |
| `PerplexityBot` | Perplexity | Search index; "not used… for AI foundation models" | No Perplexity citations | Yes | **Allow** |
| `Perplexity-User` | Perplexity | User fetch; generally ignores robots | Nothing reliable | No | Allow |
| `Applebot` | Apple | Spotlight/Siri/Safari search | Out of Apple search | Yes | Allow |
| `Applebot-Extended` | Apple | Training opt-out token | Out of Apple training | n/a | Business choice |
| `Meta-ExternalAgent` | Meta | Training crawler | Out of Meta training | Yes | Business choice |
| `Amazonbot` | Amazon | Training + Alexa | Out of Amazon training | Yes | Business choice |
| `CCBot` | Common Crawl | Open archive feeding many LLMs | Out of future dumps | Yes | Business choice |

Sources: [OpenAI bots](https://developers.openai.com/api/docs/bots), [OpenAI publisher FAQ](https://help.openai.com/en/articles/12627856-publishers-and), [Anthropic crawlers](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler), [Perplexity crawlers](https://docs.perplexity.ai/docs/resources/perplexity-crawlers), [Google-Extended](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers), [Applebot](https://support.apple.com/en-us/119829).

Trade-off: for a marketing site whose goal is to be recommended, there is no visibility upside to blocking training bots. Also **whitelist the search/retrieval user agents in the CDN/WAF** (Cloudflare's one-click "block AI bots" blocks retrieval agents too). Leave Search Console's **Search generative AI control** on Include.

### 3b. llms.txt / llms-full.txt
- Spec: Markdown at `/llms.txt` with H1, blockquote summary, H2 link sections. Proposal by Jeremy Howard (Sept 2024); not a standard.
- Evidence: Ahrefs (137K sites, May 2026): 28% publish it, **97% received zero requests**. SE Ranking (300K domains): no correlation with citation frequency. Common Crawl (500K files): 68% template-generated, 22% contain no links. ([Ahrefs](https://ahrefs.com/blog/llmstxt-study/), [SEJ](https://www.searchenginejournal.com/common-crawl-llms-txt-robots-txt/588786/))
- Vendor positions: Google Search "ignores them… won't harm (nor help)"; John Mueller: "none of the AI services have said they're using LLMs.TXT." OpenAI, Anthropic, Perplexity, Microsoft: no statement.
- Verdict: optional, "later" tier.

### 3c. How each engine sources answers

| Engine | Retrieval source | Evidence |
|---|---|---|
| Google AI Overviews / AI Mode | Google's index with "query fan-out". Available in Arabic since May 2025 (AIO) and Oct 2025 (AI Mode). | [AIO in Arabic](https://blog.google/intl/en-mena/product-updates/explore-get-answers/bringing-ai-overviews-to-mena-and-in-arabic-globally/), [AI Mode in Arabic](https://blog.google/intl/en-mena/product-updates/explore-get-answers/introducing-ai-mode-in-arabic/) |
| Gemini app | Google Search grounding | [Google-Extended](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers) |
| ChatGPT search | Own crawler (OAI-SearchBot) + third-party providers (Bing, Shopify named). Independent Aug 2026 measurement: OpenAI's own index served ~75% of free-tier results; paid "thinking" mode ~75% scraped Google; index stores title + ~200-char snippet anchored on the H1 (meta description ignored). **Unofficial; changes weekly.** | [OpenAI help](https://help.openai.com/en/articles/9237897-chatgpt-search), [SEL](https://searchengineland.com/chatgpt-retrieval-stack-index-cache-pages-485036) |
| Perplexity | Own index + real-time search | [Perplexity](https://docs.perplexity.ai/docs/resources/perplexity-crawlers) |
| Claude | Brave Search index + Claude-SearchBot/Claude-User | [Simon Willison](https://simonwillison.net/2025/Mar/21/anthropic-use-brave/) |
| Copilot | Bing index | [Bing guidelines](https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a) |

Implication: being in Google's *and* Bing's indexes (IndexNow + sitemaps) covers Google AI, Gemini, Copilot, ChatGPT Enterprise; allowing OAI-SearchBot, PerplexityBot, Claude-SearchBot covers the rest.

### 3d. What gets cited (studies, with their limits)

| Finding | Study | Caveat |
|---|---|---|
| Adding **statistics, quotations, and cited sources** raised generative-engine visibility 30–40%; keyword stuffing did nothing | Princeton/IIT GEO paper, KDD 2024, the only controlled experiment | 2023 engines |
| Cited pages score higher on **clarity/summary (+32.8%), E-E-A-T (+30.6%), Q&A format (+25.5%), section structure (+22.9%)**; promotional tone negative (−26%) | Semrush, 304K AI-cited URLs (2025) | Correlational |
| **44% of ChatGPT citations come from the first 30% of the page**; top 30 domains per topic capture 67%; repeatedly cited pages are broad hubs answering 10+ prompts | Kevin Indig, 1.2M ChatGPT responses (2026) | Correlational |
| Only **1.5% of cited URLs are homepages**; 74.7% ≥2 path segments deep | Foglift Q3 2026 | Small panel |
| **Freshness**: AI assistants cite content ~26% newer than organic SERPs; median server `Last-Modified` of cited pages = 3 days | Ahrefs 17M citations; parse.gl 8.2M | parse.gl aged only 1.4% of citations |
| **Brand mentions beat links**: YouTube mentions r≈0.74, branded web mentions 0.66–0.71, branded search 0.35–0.47, backlinks 0.22 | Ahrefs, 75K brands (Dec 2025) | Correlational |
| **Rank ≠ citation**: 38% of AIO citations rank top-10 (down from 76%); 18% of non-ranking citations are YouTube; ChatGPT overlap with Google top-10 4–12% | Ahrefs Mar 2026 |, |
| **Engines don't agree**: mean pairwise Jaccard 0.094 across five engines | Foglift; Wellows 22.7M citations |, |

Sources: [GEO paper](https://arxiv.org/abs/2311.09735), [Semrush](https://www.semrush.com/blog/content-optimization-ai-search-study/), [Indig](https://www.growth-memo.com/p/the-science-of-how-ai-picks-its-sources), [Foglift](https://foglift.io/research/ai-search-citation-benchmark-2026-q3), [Ahrefs freshness](https://ahrefs.com/blog/do-ai-assistants-prefer-to-cite-fresh-content/), [parse.gl](https://parse.gl/research/how-old-are-the-pages-ai-cites), [Ahrefs brand factors](https://ahrefs.com/blog/ai-brand-visibility-correlations/), [Ahrefs top-10](https://ahrefs.com/blog/ai-overview-citations-top-10/), [Wellows](https://wellows.com/blog/ai-citation-overlap-study/).

**"Answer-first" page pattern:** question-shaped H2 → 1–2 sentence direct answer (20–40 words) → supporting detail with a named statistic or source → list/table → link to related cluster pages. Definitive claims in the top third.

### 3e. Author E-E-A-T and brand entity
- Google: "We strongly encourage adding accurate authorship information, such as bylines." Trust is the most important E-E-A-T component. ([Creating helpful content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content))
- Article `author.url` → author page marked up as `ProfilePage`.
- Entity stack (practitioner consensus, not vendor-documented): Organization `sameAs` → Wikidata item (Arabic + English labels), LinkedIn company page, Crunchbase, verified SBC/Maroof, consistent NAP. Arabic Wikidata coverage is thin, an opening.
- Google Business Profile: only with a customer-facing location.

---

## 4. Arabic-specific SEO

**Keyword behaviour**
- Saudi users mix MSA and Gulf/Najdi/Hejazi dialect, often with English or Arabizi ("ايفون 15 برو"). MSA-only or machine-translated keyword sets miss volume; diacritics omitted; root morphology means tools undercount. Method: Keyword Planner (KSA) + google.com.sa autocomplete + Search Console; validate with a native Saudi speaker. (Agency sources: seosaudiarabia, Crawlix, Udjat, consistent, none quantitative.)
- POD terminology observed: "الطباعة عند الطلب" (b7r.sa), "طباعة حسب الطلب" (madarprint, riyadhprints, lana-designs). Target the cluster: `الطباعة عند الطلب`, `طباعة حسب الطلب`, `print on demand السعودية`, `طباعة تيشيرتات`, `متجر طباعة تيشيرت`.
- Numbers: Latin digits (123) are what Saudi users type and read online.

**URL slugs**
- Google: "Use words in your audience's language in the URL (and, if applicable, transliterated words)", Arabic-script slugs supported if percent-encoded. ([URL structure](https://developers.google.com/search/docs/crawling-indexing/url-structure))
- Practitioner consensus: transliterated/English Latin slugs avoid encoded-URL ugliness when shared (WhatsApp, Instagram bios) and tracking breakage. **Recommendation:** `/ar/` prefix + short Latin slugs (17–40 chars); Arabic in title, H1, breadcrumbs.

**Fonts and performance**
- Arabic WOFF2 weight varies 8.7 KB (Tajawal 400) to 132 KB; IBM Plex Sans Arabic 400 = 41.8 KB, Cairo 400 = 13.0 KB. Load Arabic and Latin as separate `@font-face` with `unicode-range`; preload only the primary Arabic face; `font-display: swap` with `size-adjust` fallbacks; a subset-and-preload change measured −330 ms LCP on slow 4G. ([benchmark](https://moayyadfaris.com/arabic-web-stats/font-performance))

**RTL pitfalls**: `dir` on `<html>` not `<body>`; never CSS `direction` as base mechanism; logical properties; `<span dir="ltr">` around SKUs/codes; `dir="auto"` on inputs; mirror directional icons (arrows) but not checkmarks.

**Saudi local signals**
- `.sa` open to any registrant; `.com.sa` requires a valid CR. A `.sa` domain is a clear KSA signal.
- E-store registration: since 29 Mar 2023 the Ministry of Commerce moved store verification to the **Business Platform (business.sa, Saudi Business Center)**; **Maroof** remains a public trust profile/badge. Display CR number, VAT number in the footer (E-Commerce Law disclosure). Confirm current requirements on business.sa and maroof.sa before spec sign-off.
- Search share: Google ~97% of KSA mobile search (StatCounter); Bing matters via Copilot/ChatGPT-Enterprise grounding.

**Arabic content in AI engines**
- Google AI Overviews are the most language-faithful engine (85% local-language citations for non-English prompts; ChatGPT 70%; Grok 52%).
- Profound (3.25B citations, Mar 2026, KSA/UAE prompts in Arabic): in Arabic AIO, social citations within the social slice: **Instagram 29%, YouTube 26%, Facebook 10%, TikTok 9%, LinkedIn 8%, Reddit 4.9%**. ([Profound](https://www.tryprofound.com/blog/how-query-language-reshapes-ai-citations))
- Small audit (16 prompts): Arabic AIO cited vendor-owned pages 91%, directories 0%. Directional only.
- Academic (arXiv 2509.13930): models prefer to cite documents in the *query language*, with English bias growing for lower-resource languages, publish natively in Arabic **and** an English twin.
- Bing/Copilot Arabic: no published study; unverified.

---

## 5. Content engine strategy (programmatic / AI-assisted blog)

**Policy text to design against**

> "Scaled content abuse is when many pages are generated for the primary purpose of manipulating search rankings and not helping users… Examples… Using generative AI tools or other similar tools to generate many pages without adding value for users… Scraping feeds… (including through automated transformations like synonymizing, translating, or other obfuscation techniques)…", [Google spam policies](https://developers.google.com/search/docs/essentials/spam-policies) (March 2024)

> "Appropriate use of AI or automation is not against our guidelines… Using AI doesn't give content any special gains. It's just content.", [Google AI content guidance](https://developers.google.com/search/blog/2023/02/google-search-and-ai-content)

> Rater guidelines (Jan 2025, §4.6.6): "The Lowest rating applies if all or almost all of the MC on the page… is copied, paraphrased, embedded, auto or AI generated, or reposted from other sources with little to no effort, little to no originality, and little to no added value."

Note the explicit inclusion of "translating": **auto-translating the English blog into Arabic (or vice versa) at scale is named in the policy.**

**What the evidence supports**
- Cadence: Stratabeat 2025: 9+ posts/month → +20.1% organic traffic; top decile ~11/month. theStacc 247-site analysis: 8–16/month sweet spot; >24/month, median post length collapsed and average position dropped 14% by month 3. HubSpot: +50% volume gave only +5% traffic. **No controlled study shows daily > 2–3 quality posts/week.** Cluster depth (≥3 related posts per 90 days) and quality floor matter more than count. ([Stratabeat](https://stratabeat.com/blogging-frequency/), [HubSpot](https://blog.hubspot.com/marketing/blog-strategy-quality-quantity), [theStacc](https://thestacc.com/blog/content-velocity-sweet-spot/))
- Architecture: hub/cluster pages that answer many related questions get cited repeatedly; "one keyword, one page" pages are cited once and vanish. Internal links hub↔spoke.
- Topic selection: search demand (Keyword Planner KSA, autocomplete, Search Console) × business intent (blank types, DTF/DTG, pricing, Salla/Zid integration, shipping, seasonal) × fan-out sub-questions.
- Refreshing: AI engines skew to recently updated content; Google warns against fake date bumps. Update `dateModified` and sitemap `lastmod` only on real edits.
- Images: custom graphics correlated with +44.7% organic traffic vs −2.6% for stock (Stratabeat). Real product photos and customer-design mockups are the originality asset.
- Human review: Google's "Who/How/Why": bylines that lead to author bios; explain how automation was used; "giving AI an author byline is probably not the best way." A named Saudi editor must review every post.

---

## 6. Measurement

| Surface | Tool | Gives | Limits |
|---|---|---|---|
| Google AI Overviews / AI Mode | Search Console → Generative AI performance report (all sites since 31 Aug 2026) | Impressions by page, country, device, date | Impressions only |
| Copilot / Bing AI | Bing Webmaster Tools → AI Performance (Feb 2026; Citation Share June 2026) | Citations, cited pages, grounding queries | Preview; not in API |
| AI referrals | GA4 default channel "AI Assistant" (13 May 2026): covers ChatGPT, Gemini, Deepseek, Copilot, Grok; excludes Google AIO/AI Mode | Automatic | Not retroactive |
| AI referrals (custom) | Custom channel group regex: `^(chatgpt\.com\|chat\.openai\.com\|perplexity\.ai\|www\.perplexity\.ai\|claude\.ai\|gemini\.google\.com\|copilot\.microsoft\.com\|deepseek\.com\|grok\.com\|x\.ai\|meta\.ai\|you\.com\|poe\.com)$`; ChatGPT adds `utm_source=chatgpt.com` | Per-vendor breakdown | Update quarterly |
| Citation monitoring | Otterly ($29/mo, 15 prompts), Peec AI (~€85/mo), Semrush AI Toolkit ($99/mo), Ahrefs Brand Radar, Profound | Share per engine | Run prompts **in Arabic** |
| Crawler activity | Server/CDN logs: hits by `OAI-SearchBot`, `PerplexityBot`, `Claude-SearchBot`, `Bingbot` | Proves retrieval bots can reach you | Anthropic publishes no IP ranges |
| Manual baseline | Monthly: 20–30 Arabic + English buyer prompts in ChatGPT, Gemini, Perplexity, Copilot, Claude, AI Mode | Free | Manual |

---

## 7. Checklist for the website spec

### Must-have at launch
1. SSR/SSG for all indexable routes; content, links, JSON-LD in initial HTML.
2. `<html lang="ar" dir="rtl">` on Arabic routes, `lang="en" dir="ltr"` on English; logical CSS; `<bdi>`/`dir="auto"` for mixed text.
3. hreflang cluster `ar`, `en`, `x-default`→Arabic, self-referencing, implemented once.
4. `Content-Language` header/meta + correct `html lang`.
5. Self-referencing canonical; one trailing-slash convention.
6. `app/sitemap.ts` with accurate `lastmod`, hreflang alternates, image tags; referenced in robots.txt; submitted to GSC + BWT.
7. `app/robots.ts`: allow public, disallow `/api/`, `/admin/`, internal search; explicit Allow for `OAI-SearchBot`, `Claude-SearchBot`, `Claude-User`, `PerplexityBot`, `Bingbot`, `Applebot`; staging = `Disallow: /`; `Sitemap:` line.
8. CDN/WAF rule exempting verified search/retrieval bots from JS challenges.
9. IndexNow: key file at root, POST on publish/update/delete.
10. Core Web Vitals budget in CI: LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1 at p75 mobile; hero `preload`, `sizes` on every image, Arabic font subset + `unicode-range` + one preload + `font-display: swap`.
11. JSON-LD: `OnlineStore` (logo, `sameAs`, address, VAT, return + shipping policy), `WebSite` on homepage, `BreadcrumbList` everywhere, `Product`/`Offer` `priceCurrency:"SAR"` on catalog pages, `BlogPosting` + `Person` author on posts.
12. No `FAQPage`/`HowTo`/`SearchAction` effort; on-page FAQ content in Q&A format.
13. Author system: named Saudi editor(s), author pages (`ProfilePage`), bylines, "how this was made" note when AI assisted.
14. Visible publish + updated dates matching `datePublished`/`dateModified` and sitemap `lastmod`; CMS "last meaningful update" separate from autosave.
15. Footer trust block: CR number, VAT number, SBC authentication, physical address, phone.
16. Native Arabic copy (not machine translation) for all commercial pages; both `عند الطلب` / `حسب الطلب` phrasings.
17. GSC (domain property) + BWT verified; GA4 with custom AI channel group.
18. URL scheme: `/ar/` and `/en/` prefixes, short Latin slugs, Arabic in titles/H1/breadcrumbs.

### Should-have (first 90 days)
19. Google Merchant Center account (KSA supported) with feed matched to `Product` markup.
20. Content model: 3–5 topic hubs (POD basics, blanks & printing methods, pricing/margins, Salla/Zid integration, seasonal) with spoke posts; 8–16 posts/month cap with a quality floor (named editor, ≥1 original data point/photo, answer-first).
21. Answer-first template enforced in CMS.
22. Original imagery pipeline: real production photos, customer-design mockups, Arabic-labelled diagrams; image sitemap.
23. Brand entity: Wikidata item (AR + EN), LinkedIn company page, Crunchbase, consistent NAP, all in `sameAs`.
24. Arabic social/video presence: YouTube, Instagram, TikTok, LinkedIn with brand name in titles.
25. English twin of hub pages (not word-for-word translation).
26. Quarterly refresh program with real `dateModified` bumps.
27. Monthly manual AI prompt audit in Arabic and English + log analysis.
28. Google Business Profile only if a customer-facing location exists.

### Later / optional
29. `/llms.txt` (curated, linked from footer).
30. Paid AI citation tracker once a prompt set is stable.
31. Documented decision on training bots, revisited quarterly.
32. `.sa`/`.com.sa` domain hygiene with 301s (already on b7r.sa).
33. `ar-SA`/`ar-AE`/`ar-EG` variants only after KSA is solid.
34. WebMCP / agentic checkout readiness.
35. Speakable, LocalBusiness reviews, video sitemap.

## 8. Flagged as unverified or weak
- AI crawlers not executing JavaScript: widely reported, not in vendor docs.
- ChatGPT's internal index and Google-scraping split: independent reverse-engineering (SEL/Resoneo, Aug 2026).
- Bing's "hreflang weaker than content-language": second-hand quote.
- Wikidata/Crunchbase → AI citations: practitioner inference.
- Publishing-cadence numbers: correlational or unpublished methodology.
- Arabic-vs-English AIO audit: 16 prompts, one day.
- Maroof/Business Platform process details from consultancy write-ups; confirm on business.sa and maroof.sa.
