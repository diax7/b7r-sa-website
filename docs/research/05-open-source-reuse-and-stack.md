# Open-Source Reuse and Stack Research (verified Sept 2026)

> Research report generated 2026-09-12 by a background agent; versions, licences, release dates and stars verified against npm, GitHub or vendor docs. Input for the B7R marketing-site BRD. Not the BRD itself.

Scope: Arabic-first/English, SEO-critical, 4 levels (landing → admin/SEO settings → blog + AI content w/ review queue → booking/inbox/analytics).

---

## A. Web framework

| | Next.js | Astro |
|---|---|---|
| Version / date | **16.3.4** (2026-08-31) | **7.2.3** (2026-08-18); 7.0 shipped 2026-06-22 w/ Rust compiler, Vite 8 |
| Licence | MIT | MIT |
| Rendering | SSG / ISR / SSR / `'use cache'` / PPR in one app | Static by default; SSR per route via adapter; Server Islands |
| i18n routing ar/en | Not built-in for App Router → **next-intl 4.13.4** (MIT; `[locale]` segment, static rendering, hreflang) — [docs](https://next-intl.dev/docs/routing/setup) | Built-in `i18n` config, sitemap includes fallback routes |
| RTL | `<html dir="rtl">` from locale + Tailwind **4.3.1** logical utilities (`ps-/pe-/ms-/me-/start-/end-/text-start`) | Same |
| SEO baseline | Ships ~85-120 KB React runtime even on static pages; needs discipline | Zero JS by default; Lighthouse 95+ without work |
| Admin panel fit | **Payload runs inside Next.js** (same repo, same deploy) | Payload can't run in Astro → separate deployment |
| Interactive designer | React islands native | `client:visible` React island works |

**Recommendation: Next.js 16.3 (App Router) + next-intl.** Deciding factor is levels 2–4: the admin panel, AI pipeline, form inbox and analytics are app-shaped, and Payload 3 is Next.js-native. Astro would win a pure brochure site by ~15 Lighthouse points but forces a second deployment and splits the "core + blocks" architecture. Mitigate JS cost: marketing pages as Server Components, static-render all `[locale]` routes via `generateStaticParams`, ISR/`revalidateTag` from Payload hooks. Note: the B7R app itself is Next.js 16 + Tailwind 4 + shadcn, so the same conventions apply.

---

## B. CMS / blog backend (doubles as the admin panel)

| | Payload 3 | Strapi 5 | Directus 12 | Keystatic | Ghost 6 | Sanity | MDX-in-repo |
|---|---|---|---|---|---|---|---|
| Version / date | **3.87.0** 2026-07-31 | 5.52.2 | 12.3.1 | 0.6.4 | 6.60.0 | Studio v3/v4 | n/a |
| Licence | **MIT** (no ceiling) | MIT core; `ee/` proprietary (SSO, RBAC, audit log, **review workflows** paid) | **MSCL source-available** (since v12, Apr 2026): free only if <$5M revenue & <50 staff, needs registration key — [announcement](https://directus.com/resources/directus-v12-license-change) | MIT | MIT | Studio MIT; **Content Lake proprietary, not self-hostable** | your code |
| Stars | 44.5k | 72.3k | ~37k | 2.25k ("experimental") | ~50k | 6.3k | – |
| Arabic admin UI | **Yes** — `ar` in `@payloadcms/translations`; per-locale `rtl: true` flips admin | **No official RTL** (open since 2020, [#5133](https://github.com/strapi/strapi/issues/5133)) | Vue admin; RTL partial | English only | **English-only** | Not first-class | n/a |
| Content i18n | Field-level `localization` w/ fallback; experimental `localizeStatus` | i18n plugin | Built-in | Per-file | Not per-field | Built-in | Folder per locale |
| Draft/review + schedule | Drafts, versions, autosave, `schedulePublish` (via built-in Jobs), access-control-gated publish | Draft/publish; review workflows **paid** | Native workflows | Git PRs | Scheduled publish | Yes (Growth) | PR review |
| Image handling | Uploads w/ sizes, focal point, S3/R2/Vercel Blob adapters | Media library | DAM | Cloud add-on | Built-in | Sanity CDN | `<Image>` |
| Custom collections / settings screens / AI screens | Config-as-code collections + **Globals**; **custom views**, custom fields, hooks, `payload.encrypt` for secrets; **Jobs Queue** built in; `plugin-mcp` | Content-Type Builder + plugins | Extensions (Vue) | Limited | Not an app admin | Studio plugins | None |
| "WordPress-like" feel | Yes with SEO plugin (Yoast-style preview), form-builder, redirects, search, live preview, nested docs — all in official **website template** | Yes | Yes | Basic | Blog only | Yes (hosted) | No |

**Recommendation: Payload 3.** Only option that is (a) MIT with no revenue ceiling, (b) ships an Arabic + RTL admin, (c) runs in the same Next.js app, (d) has a built-in jobs queue for scheduled publishing and the AI pipeline, (e) lets you add "AI content" collections and settings Globals as plain TypeScript. Start from the official website template (`pnpx create-payload-app -t website`), which wires `plugin-seo`, `plugin-form-builder`, `plugin-redirects`, `plugin-search`, `plugin-nested-docs`, live/draft preview, on-demand revalidation and scheduled publish ([template README](https://github.com/payloadcms/payload/blob/main/templates/website/README.md)).

Caveats: Directus is no longer open source; Strapi's review workflow and granular RBAC are paid and admin has no RTL; Sanity's data store is proprietary; Ghost's admin is English-only.

---

## C. AI content pipeline

**Reference architectures (OSS on GitHub):**

| Repo | Stack | Notable |
|---|---|---|
| [mahdibrr/nextjs-seo-content-engine](https://github.com/mahdibrr/nextjs-seo-content-engine) | Next.js MDX | GSC sync → keyword gaps → pillar taxonomy → content scoring → AI drafts → `review-pending/` → publish |
| [vipulawl/blogging-agent](https://github.com/vipulawl/blogging-agent) | Python agents on GitHub Actions | Strategy → Research (GSC+GA4+competitors) → Writer → Editor → approve → publish |
| [arul-buk/autoblog](https://github.com/arul-buk/autoblog) | Gemini, config-driven | Trending topics → keywords → post → cover image → translate |
| [jabluetooth/zeropress](https://github.com/jabluetooth/zeropress) | 37-node n8n workflow + Next.js | Research → write → illustrate → publish every 6 h |
| [IamRamgarhia/BlogPilot](https://github.com/IamRamgarhia/BlogPilot-Open-Source-AI-SEO-Content-Studio) | Next.js, MIT | 39 modules: keyword research, outline, GEO/AI-Overviews optimisation |
| [nometria/blog-pipeline](https://github.com/nometria/blog-pipeline) | Python, multi-LLM | 7-pass pipeline incl. humanizer + quality gate |
| [maximemarsal/open-seo](https://github.com/maximemarsal/open-seo) | Next.js | Multi-provider (OpenAI/Anthropic/Gemini/DeepSeek), Perplexity research, Unsplash images, calendar scheduling, **encrypted API-key storage** |

Common shape: `topic research → keyword pick → outline → draft → image → review queue → scheduled publish`, each step a retryable job writing to a `drafts` store with a status field. None are Arabic-first; pattern references, not forks.

**Building blocks (verified):**

| Concern | Pick | Version / licence | Notes |
|---|---|---|---|
| LLM abstraction | **Vercel AI SDK** | `ai` **7.0.47** (2026-07-31), Apache-2.0 | `createProviderRegistry({openai, anthropic, google, …})` → `registry.languageModel('anthropic:claude-…')`; model id becomes a settings string; `generateImage` for image providers; Node 22 + ESM — [docs](https://ai-sdk.dev/docs/reference/ai-sdk-core/provider-registry) |
| Job orchestration (default) | **Payload Jobs Queue** | part of Payload 3, MIT | Tasks + workflows w/ retries, `schedule: [{cron}]`; on Vercel via `vercel.json` cron → `GET /api/payload-jobs/run`; on a VPS use `payload jobs:run` or `autoRun` — [docs](https://payloadcms.com/docs/jobs-queue/overview) |
| Long-running jobs (if needed) | Trigger.dev | SDK 4.5.16, MIT; platform Apache-2.0, self-hostable | No timeout |
| | Inngest | server SSPL + delayed Apache-2.0; SDKs Apache-2.0 | Not OSI open source |
| | BullMQ | 5.81.3 MIT | Needs Redis + always-on worker |
| Visual orchestrator | **n8n** | 2.37.7, Sustainable Use License | **Allowed** for own internal automation (this case) — [licence](https://docs.n8n.io/privacy-and-security/sustainable-use-license). B7R already runs n8n. |
| Cron on Vercel | Vercel Cron | Hobby: once/day; **Pro: per-minute** | [pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing) |
| Image gen (hero/OG) | **OpenAI gpt-image-2** (2026-04-21) | 1024²: $0.006 low / $0.053 med / $0.211 high | Best-in-class **Arabic text rendering** incl. letter joining/RTL (verify with native speaker) |
| | Ideogram 4 / v3 API | $0.03–$0.09 | Arabic/Hebrew/Persian; typography-first |
| | FLUX.2 Pro via fal/Replicate | ~$0.03/image | Photoreal, weak on text |
| | Google Imagen 4 | $0.02–$0.04 | Good text |
| Stock photos | **Pexels API** | Free; 200 req/h, 20k/mo; attribution required | Simplest terms |
| | Unsplash API | Demo 50 req/h → 1000/h after approval; must hotlink + attribute | Stricter |
| API-key storage | Env vars for keys; admin picks provider/model in an `AiSettings` Global. If editors must rotate keys in-admin: Payload `payload.encrypt()`/`decrypt()` (AES via `PAYLOAD_SECRET`) + field-level `access.read` hiding | | [rotating secret](https://payloadcms.com/docs/authentication/rotating-secret) |

**Recommended pipeline design:** Payload collections `ai-topics` (source: GSC gaps / manual / n8n webhook) → workflow `generateArticle` with tasks `research → outline → draftAr → draftEn → image → seoMeta` writing to `posts` as `_status: draft` with `aiReview: pending` → editors approve in a custom "Review queue" view → `schedulePublish`. Use Payload Jobs first; add Trigger.dev only if a task exceeds Vercel's function limit (300 s default, 800 s on Pro). Use n8n for exploratory research nodes that call Payload's REST API.

---

## D. Scheduling / meetings

| Option | Licence / status | Cost | Fit |
|---|---|---|---|
| **Cal.com hosted, Free plan + embed** | Proprietary SaaS (since 2026-04-15 the commercial repo is closed source) | Free forever for 1 user: unlimited event types, calendars, email/SMS, **embed inline / floating / popup**; branding removed only on Teams ($12/seat/mo) | **Best pragmatic path** — no OAuth app setup, no ops; inline embed in `/[locale]/book`, webhook → Payload `bookings` collection |
| **cal.diy self-host** | **MIT**, 48k stars, Docker; fork with Teams, Orgs, Insights, Workflows, SSO removed; README: "strictly recommended for personal, non-production use" — [repo](https://github.com/calcom/cal.diy) | VPS + Postgres + own Google/MS OAuth apps | Only if data-residency forces it |
| Cal.com Platform API / Atoms | Starter free (25 bookings/mo) → Essentials $299/mo | | Overkill |
| Rallly | AGPL-3.0 | Self-host | Group polls, not 1:1 booking |
| Easy!Appointments | GPL-3.0, PHP/MySQL | Self-host | Different stack |
| Zcal | Proprietary SaaS | Free tier | No self-host |

**Recommendation:** Hosted Cal.com Free + inline embed for phase 4. Keep cal.diy as the exit path.

---

## E. Forms + email

| Concern | Pick | Verified facts |
|---|---|---|
| Form builder + inbox | **`@payloadcms/plugin-form-builder`** | Admin-defined forms, submissions stored in DB + managed in admin, confirmation/notification emails, `beforeEmail` hook — [docs](https://payloadcms.com/docs/plugins/form-builder) |
| Transactional email | **Resend** (default) | 3,000/mo free, Pro $20/50k; Payload adapter `@payloadcms/email-resend`. B7R app already has Resend. |
| | Postmark / SES | Alternatives |
| Spam protection | **Cloudflare Turnstile** | Free, invisible, works off-Cloudflare; server-side verify; add honeypot + rate limit. B7R app already uses Turnstile. |
| WhatsApp | `https://wa.me/9665XXXXXXXX?text=<urlencoded>` (international format, no +/0/dashes) — [official](https://faq.whatsapp.com/5913398998672934) | Store number + prefilled text in `site-settings` Global |

---

## F. Analytics

| Concern | Pick | Verified facts |
|---|---|---|
| GA4 embed | `@next/third-parties/google` `<GoogleAnalytics gaId>` **plus** a `beforeInteractive` inline `gtag('consent','default',{…denied})` and `consent update` from the banner | Consent Mode v2 not supported by the component itself |
| Saudi PDPL | Explicit, granular, Arabic consent for analytics/ads cookies; reject-all equal to accept-all; consent receipt logged | [PDPL guide](https://www.flexyconsent.com/blog/saudi-arabia-pdpl-cookie-consent-guide/) |
| Privacy-friendly first-party | **Umami 3.3.1** (2026-08-20), MIT, Node + Postgres, cookieless (no banner) | B7R already self-hosts Umami at umami.b7r.app — reuse |
| Vercel Web Analytics | Hobby 50k events/mo; Pro $3/100k | Bonus |
| Search Console in admin | Search Console API `searchanalytics.query` (service account added as property user), scope `webmasters.readonly` — [docs](https://developers.google.com/webmaster-tools/v1/how-tos/search_analytics) | Nightly Payload job caches into `seo-metrics`; custom admin view charts it |
| GA4 in admin | Analytics Data API v1 `properties.runReport`, service account — [docs](https://developers.google.com/analytics/devguides/reporting/data/v1/basics) | Same pattern |
| Bing | Bing Webmaster API via OAuth2 or API key — [docs](https://learn.microsoft.com/en-us/bingwebmaster/oauth2) | Also IndexNow |

---

## G. Hosting

| | Vercel | Self-host (Coolify on VPS) | Cloudflare Workers |
|---|---|---|---|
| Fit for Next+Payload | Native; Payload Jobs via Vercel Cron; `dxb1` Dubai compute region; **Saudi PoP unconfirmed** | **Coolify 4.3.11** (2026-08-25), Apache-2.0; Next `output:'standalone'` Docker; Payload `autoRun` worker always-on | **vinext** (beta) or **OpenNext `@opennextjs/cloudflare` 1.18.x** (no Node middleware) |
| Cost | Hobby is non-commercial → Pro $20/user/mo + usage | VPS €5–20/mo; in-Kingdom: Zenlayer Riyadh, Oracle Jeddah/Riyadh, **GCP Dammam (via CNTXT) — where the B7R app already runs** | Workers free 100k req/day; R2 zero egress |
| KSA edge | Traffic terminates at nearest PoP → Dubai compute | Put **Cloudflare** in front: data centers in **Riyadh, Jeddah, Dammam** | Native in-Kingdom |
| Coming | – | AWS KSA region Dec 2026; Azure Saudi Arabia East Nov 2026 | – |

**Recommendation:** Levels 1–3 on **Vercel Pro** with **Cloudflare DNS + Turnstile + R2** (media via `@payloadcms/storage-s3` on R2). Keep a `Dockerfile` (standalone) from day one so moving to **Coolify + Cloudflare proxy** (in-Kingdom edge, always-on worker) is a config change. Alternative given B7R's existing GCP Dammam + Docker setup: deploy the site on the same infrastructure from day one. Avoid vinext/OpenNext for now.

---

## H. Interactive mockup / designer

| Lib | Version / licence | Downloads | React binding | Best at |
|---|---|---|---|---|
| **Konva** | **10.3.0** (2026-04-30), MIT | 2.2M/wk | **react-konva 19.2.5** (official, React 19) | Drag/scale/rotate with built-in `Transformer`, multi-layer canvas, `toDataURL()` |
| Fabric.js | **7.4.0** (2026-05-18), MIT | 780k/wk | none official | SVG import/export, filters, inline text editing. **The B7R app customizer uses Fabric.js 7.** |
| PixiJS | 8.20.1, MIT | ~200k/wk | `@pixi/react` | WebGL games |

**Simplest "upload → drag/scale on t-shirt → switch product":** react-konva `Stage` → `Layer` with product `Image` (mockup PNG) → clipped `Group` (print area rect from a `products` collection) → user `Image` with `draggable` + `Transformer`; switching product swaps mockup + print-area coords; export `stage.toDataURL({pixelRatio:2})`. Keep it a client island. Consideration: using Fabric.js instead would match the real app customizer and could share print-zone conventions (28×38 cm front zone).

OSS references: [zyadhajaji/threadforge](https://github.com/zyadhajaji/threadforge) (MIT, Next 14 + Fabric 5), [nuvocode/canvas-editor](https://github.com/nuvo-code/canvas-editor) (Konva), [vnxx/tshirt.designer](https://github.com/vnxx/tshirt.designer) (react-konva), [Empty-Developer/Custom-Print-Product-Builder](https://github.com/Empty-Developer/Custom-Print-Product-Builder-Web-App). None mature enough to adopt wholesale.

---

## I. Modular architecture

**Verdict: single Next.js app as a modular monolith; no monorepo until a second deployable exists.** Feature colocation gives ~90% of the isolation.

```
b7r-web/
├─ src/
│  ├─ app/
│  │  ├─ (frontend)/[locale]/            # public site (next-intl; ar default, /en prefix)
│  │  │  ├─ layout.tsx · page.tsx        # dir=rtl|ltr set here
│  │  │  ├─ blog/[slug]/ · contact/ · book/ · designer/
│  │  ├─ (payload)/admin/[[...segments]] # Payload admin (Arabic UI)
│  │  ├─ (payload)/api/[...slug]         # Payload REST/GraphQL
│  │  └─ api/turnstile · api/webhooks/cal
│  ├─ modules/                           # the "blocks"
│  │  ├─ core/       site-settings Global (feature flags, WhatsApp, GA id), Media, Users, SEO, email, i18n
│  │  ├─ pages/      Pages + layout blocks                          (L1)
│  │  ├─ blog/       Posts, Categories, Authors                     (L3)
│  │  ├─ ai-content/ AiTopics, AiSettings Global, jobs/tasks, Review-queue view (L3)
│  │  ├─ forms/      form-builder config + Inbox list view          (L4)
│  │  ├─ booking/    Cal embed settings, Bookings (webhook mirror)  (L4)
│  │  ├─ analytics/  GSC/GA4/Bing connectors, cached metrics, Dashboard view (L4)
│  │  └─ designer/   Products (mockup + print area), canvas editor  (L1 section / L5)
│  │     └─ index.ts  → { collections, globals, jobs, plugins, views, flag }
│  ├─ payload.config.ts   # composes: modules.filter(m => enabled(m.flag)).flatMap(…)
│  ├─ i18n/ (routing.ts, request.ts) · messages/{ar,en}.json
│  └─ lib/ (ai/registry.ts, email.ts, turnstile.ts)
├─ Dockerfile (standalone) · vercel.json (crons) · docker-compose.yml (postgres, worker)
```

Rules: each module exports a manifest and a public `index.ts`; ESLint `no-restricted-imports` forbids `modules/a` importing `modules/b/internal`; feature flags live in the `site-settings` Global and gate both admin registration and routes. Extract to `packages/` only when a second app needs the code.

---

## Recommended stack (with reasons)

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16.3 + next-intl 4.13 + Tailwind 4.3 (logical props) | One app for site + admin; static/ISR for SEO; RTL via `dir` + logical utilities; same family as the B7R app |
| CMS/admin | Payload 3.87 (website template) + plugin-seo/form-builder/redirects/search | MIT, Arabic RTL admin, drafts + scheduled publish, jobs queue, custom views |
| DB / media | Postgres (Supabase project, Neon, or VPS) · R2 via storage-s3 | Standard; zero-egress media |
| AI | AI SDK 7 provider registry; gpt-image-2 for Arabic-text images, FLUX/Pexels for cheap heroes | Model as a settings string |
| Jobs | Payload Jobs (Vercel Cron or worker); n8n optional; Trigger.dev if >13 min | No new service until needed |
| Booking | Hosted Cal.com Free inline embed + webhook | Zero ops; cal.diy exit |
| Forms/email | Payload form-builder + Resend + Turnstile + wa.me | Stored inbox + notifications |
| Analytics | GA4 (consent-gated, Arabic banner) + Umami; GSC/GA4/Bing APIs into admin | PDPL-safe first-party numbers |
| Hosting | Vercel Pro + Cloudflare, Docker-ready for Coolify/GCP Dammam + Cloudflare proxy | Fast start, in-Kingdom edge path |
| Designer | react-konva 19 / Konva 10 (or Fabric.js 7 to match the app) | Official React binding, Transformer |

## What to reuse vs build

| Capability | Reuse | Build |
|---|---|---|
| Pages, layout blocks, SEO meta, redirects, search, live preview | Payload website template + plugins | Arabic-first block designs, `ar`/`en` copy |
| Blog, drafts, scheduling, localized status | Payload versions/drafts/jobs | Locale-aware publish rules, sitemap/hreflang/JSON-LD |
| Admin Arabic UI/RTL | `@payloadcms/translations` `ar` + `rtl:true` | Custom labels |
| AI pipeline | AI SDK registry, Payload Jobs, Pexels/Unsplash, gpt-image-2 | Task handlers, prompts (Arabic style guide), review-queue view, `AiSettings` Global |
| Model/API-key switching | `createProviderRegistry`, `payload.encrypt` | Settings schema + field access |
| Booking | Cal.com embed + webhooks | `bookings` mirror + notifications |
| Contact inbox | plugin-form-builder, Resend, Turnstile | Turnstile verify route, Arabic templates |
| Analytics | GA4 tag, Umami, Google/Bing APIs | Consent banner (PDPL), dashboard view, metrics cache job |
| Designer | Konva/react-konva or Fabric | Product/print-area model, export, upload validation |
| Infra | Vercel/Coolify, Cloudflare, Docker standalone | Module manifest + feature-flag composition, ESLint boundaries |

Unverified: whether Vercel has a PoP physically in Saudi Arabia; Cloudflare's three in-Kingdom sites are confirmed.
