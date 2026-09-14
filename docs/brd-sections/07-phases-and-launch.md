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

This BRD is a living document. When a feature changes, the agent updates the relevant section in `docs/brd-sections/`, rebuilds the master file, and records an ADR. Appendix H (the English copy bank) is generated from `src/content/copy/en.ts` by `pnpm copy:appendix` before the rebuild; it is never edited by hand. When a phase completes, its DoD evidence is linked from `docs/DECISIONS.md`. The BRD never lags the code by more than one merged PR.

### 12.6 Future blocks (reserved, not built until Dhia schedules them)

Salla and Zid landing pages (`/salla`, `/zid`) with app-store deep links · Comparison page "بحر مقابل Printful وPrintify" · Seasonal calendar hub · Creators landing (`/creators`) · Business landing (`/business`) · 2FA for admin · GlitchTip error tracking · Product-level Merchant Center feed · Newsletter campaigns · Case studies collection · Live order ticker on product pages (once volume exists) · WebMCP readiness.
