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

- `SiteSettings` { brandName, tagline, contact { phone, whatsapp, email }, social { x, instagram, tiktok }, offer { welcomeCredit: 30 }, delivery { maxDays: 5, origin: "جدة" }, bookingUrl?: string, appUrls { register, login } }
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

| Name | Purpose | Required in prod |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://b7r.sa`; anything else triggers noindex | yes |
| `NEXT_PUBLIC_APP_URL` | `https://b7r.app` | yes |
| `NEXT_PUBLIC_WHATSAPP` | `966501699572` | yes |
| `NEXT_PUBLIC_GA_ID` | `G-JPB02M7C49` | yes |
| `NEXT_PUBLIC_UMAMI_SRC`, `NEXT_PUBLIC_UMAMI_ID` | Umami script URL and website id | yes |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Contact form anti-spam; the admin login gate (ADR-034) | yes (amended 2026-09-13: required in production since the login is gated by it) |
| `RESEND_API_KEY`, `RESEND_FROM` (`بحر برنت <no-reply@b7r.sa>`), `CONTACT_TO` (`contact@b7r.sa`), `RESEND_AUDIENCE_ID` | Email | yes |
| `BOOKING_URL` | Cal.com link; empty until Dhia creates it | no |
| `INDEXNOW_KEY` | 32-char hex | yes |
| `GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION` | Meta tags | yes |

Secrets never reach the client; only `NEXT_PUBLIC_*` do. `.env.example` lists all with comments. Validate at startup with zod (`lib/env.ts`) and fail fast.

### 8.6 Hosting on CranL and deployment

- **Build:** multi-stage `Dockerfile` (deps → build → runner on `node:22-alpine`, non-root user, `HOSTNAME=0.0.0.0`, `PORT=3000`, copies `.next/standalone`, `.next/static`, `public`). Image size target ≤ 250 MB.
- **CranL app:** connect the GitHub repo, deploy on push to `main`, Dockerfile build, region **Saudi Arabia**, custom domain `b7r.sa` with automatic SSL, `www.b7r.sa` redirecting to the apex, env vars from §8.5, health check `GET /api/health` → `{ ok: true, version }`. Enable CranL's CDN zone for `/_next/static/*`, `/images/*`, `/fonts/*`, `/video/*` if available; otherwise rely on Next's cache headers (`public, max-age=31536000, immutable` for hashed assets).
- **Rollback:** redeploy the previous image from CranL's deployment list; document in `RUNBOOK.md`.
- **Cutover (§12.4):** keep WordPress live at Hostinger until Level 1 is approved; then point `b7r.sa` DNS to CranL; verify redirects and TLS; keep the old host for 14 days as a fallback, then cancel.
- **Level 2 additions:** a CranL managed Postgres and an S3 bucket in the same project (§9.2).

### 8.7 CI pipeline (`.github/workflows/ci.yml`, on every PR and on `main`)

1. `pnpm install --frozen-lockfile`
2. `pnpm typecheck` (`tsc --noEmit`)
3. `pnpm lint` (oxlint) and `pnpm format:check` (oxfmt)
4. `pnpm check:rtl` (script fails on physical-direction Tailwind classes or CSS properties outside an allowlist file)
5. `pnpm test` (Vitest: profit math, redirects map, `SarAmount` formatting, content schemas, JSON-LD required fields, rate limiter)
6. `pnpm build`
7. `pnpm e2e` (Playwright against the built app: navigation, mobile menu, hero controls, designer upload and drag, calculator values, contact form validation + honeypot, newsletter, WhatsApp link, consent bar behaviour, 404 status, five redirects, axe scan on each page with zero serious violations)
8. `pnpm lhci` (Lighthouse CI, mobile preset, thresholds from §7.8 on `/`, `/products`, `/products/tee-essential`, `/contact`, `/blog/{sample}`); the report is uploaded as an artifact and linked in the PR.
9. On `main` only: after CranL reports the deploy healthy, run `scripts/indexnow.ts` for changed URLs.

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

- Headers: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera, microphone, geolocation off), `X-Frame-Options: DENY` (except Level 4 pages that embed Cal.com use `frame-src` in CSP instead), and a CSP with `default-src 'self'`; `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://challenges.cloudflare.com {UMAMI_ORIGIN}`; `style-src 'self' 'unsafe-inline'` (required: `next/image fill`, the reveal and hero primitives emit inline `style` attributes — amended in Phase 1c); `img-src 'self' data: blob: https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com`; `connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://region1.google-analytics.com {UMAMI_ORIGIN}`; `frame-src https://challenges.cloudflare.com`; `font-src 'self'`; `media-src 'self'`; `object-src 'none'`; `base-uri 'self'`; `form-action 'self'`; `frame-ancestors 'none'`. No nonces: every page is static, so a per-response nonce is impossible without dynamic rendering, and a nonce next to `'unsafe-inline'` would switch the latter off in CSP3 browsers and break the inline script gtag injects (ADR-016). An e2e (`e2e/csp.spec.ts`) asserts zero `securitypolicyviolation` events on home load, a designer upload, consent → GA, and a contact submit.
- Dependencies: pinned exact versions; `pnpm audit` in CI weekly (Dependabot with 7-day cooldown, grouped updates).
- API routes: zod validation, honeypot, rate limit, no PII in logs, generic error messages to clients.
- Uploads in the designer never leave the browser.

### 8.11 Observability

`/api/health` returns build version and time. Errors: Next.js `error.tsx` and `global-error.tsx` with the brand 404-style design and a WhatsApp link. Level 2 adds GlitchTip (Sentry SDK) as the B7R app does. CranL's live analytics cover request-level monitoring.
