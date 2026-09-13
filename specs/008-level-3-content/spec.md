# Feature Specification: Level 3, the blog in the CMS and the automated content engine

**Branches**: `level-3/blog` (3a), `level-3/engine` (3b), `level-3/live` (3c), each from
`main` after the previous one merges | **Date**: 2026-09-14
**Requested by**: Dhia, "start 3a, 3b, 3c, all of them autonomous with the cto cycle."
**BRD**: §10 (Level 3), §6.11 (templates), §7 (SEO), Appendix E (hubs, seed topics, seasonal
windows), §12.3 phases 3a/3b/3c, §10.3 acceptance.

## Decisions taken (autonomous run; every departure from the BRD is an ADR)

| Question | Decision |
|---|---|
| Post body format | Lexical rich text (the editor Dhia already uses on pages). The engine writes Markdown and converts it with Payload's `convertMarkdownToLexical`; the site renders Lexical through the existing converters. |
| The in-post CTA block | Placed by the template after the second H2, as in Level 1. No CTA block in the editor (nothing to misplace). |
| Search on `/blog` | A client island over an index the page embeds (slug, title, excerpt, hub of the published posts), folded like the palette; not `plugin-search` (one collection, a few hundred posts at most) and no server query, so `/blog` stays static. ADR. |
| Pagination | `/blog/page/[n]` and `/blog/category/[hub]/page/[n]` as static routes; never `?page=` (a `searchParams` read makes the route dynamic, Constitution II). ADR + BRD amendment. |
| Monitoring | A "Content engine" card on the dashboard for admins instead of a separate view (CTO). |
| Image generation | `hubDefault` and `stock` ship; `generate` is refused until an image provider is wired (CTO). |
| Freshness | Regenerates a drifted `ai` post from the outline stored on its run; `ai-edited` posts are exempt (CTO). |
| First live posts | `reviewFirstRuns` (default 3) lands a live provider's first posts as drafts; Dhia sets it to 0 once they read well (CTO). |
| The three Level 1 posts | Migrated published, `origin: ai` (they were machine-written, ADR-018), still owed Dhia's read (CTO). |
| Scheduling | Payload's job schedules on the in-process runner (ADR-033), not an external hourly `GET /api/jobs/run` call. The hourly `content-tick` job checks the switch, the caps and the Riyadh publish hour. ADR. |
| Provider keys | Stored in `ai-settings`, encrypted with Payload's `encrypt`, masked on read. Dhia enters them in the panel; nothing in the repo or in CI. |
| Live runs (3c) | Everything is built and run end to end with the mock provider; the live run per provider needs Dhia's keys and is the one acceptance item left for Dhia. |
| Image mode default | `hubDefault` (each hub's default cover). Stock needs a Pexels key. |

## Goals

1. **3a** An editor writes, previews, schedules and publishes a post in the panel; the post,
   its hub page, the author page, the feed, the sitemap and IndexNow update; the templates
   from Level 1 stay and gain a table of contents, reading time, an "updated" date, related
   posts by hub then tags, and previous/next within the hub; the editorial rules of §10.1
   are enforced on publish (hard) or shown as warnings (soft).
2. **3b** The engine exists and is tested with a mocked provider: settings, topics, runs,
   the provider layer (Vercel AI SDK: openai, deepseek, anthropic, google), the
   `generatePost` workflow with its nine tasks, the guardrails of §10.2.5, and the admin
   screens (settings, topics with bulk add and "generate now", runs, monitoring).
3. **3c** The engine runs on its own: the hourly tick, the weekly freshness job, the seeded
   backlog of 30 topics, ten posts produced end to end (mock provider here; live provider
   when Dhia adds a key), the weekly digest and failure e-mails, the kill switch.

## Non-goals

- Search Console-driven topics and analytics (Level 4).
- An AI disclosure anywhere public (D-47); an "AI author".
- Comments, reactions, multilingual posts (the content locale stays Arabic).

## Acceptance (BRD §10.3, mapped)

| # | Item | Phase | How it is proven |
|---|---|---|---|
| 1 | Manual post: write, preview, schedule, publish; hub pages, RSS, sitemap, IndexNow, related posts update | 3a | cms e2e: create a post through the REST API, publish, assert `/blog`, `/blog/category/{hub}`, `/blog/{slug}`, `/feed.xml`, `/sitemap.xml` |
| 2 | Automatic posts, `postsPerDay = 1`, five days, each ≥ 80, three takeaways, internal links, a cover with Arabic alt text, no banned phrases, numbers matching the facts sheet | 3b (mock), 3c (live) | vitest pipeline test with the mock provider and a clock; cms e2e runs the workflow once with the mock provider; live run left for Dhia |
| 3 | `site-settings.delivery.maxDays` change + freshness job updates affected posts and their `updatedAt` | 3c | vitest with the mock provider |
| 4 | Kill switch stops the next run within an hour; failure path e-mails Dhia | 3b, 3c | vitest (tick honours `enabled` and `AI_CONTENT_ENABLED`); e-mail through the console adapter in tests |
| 5 | No public page, feed or schema mentions AI | 3a, 3b | e2e greps `/blog`, a post, the feed and the JSON-LD for "AI", "ذكاء اصطناعي", "generated" |
