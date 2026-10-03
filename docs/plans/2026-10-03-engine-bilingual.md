# The engine in both languages, every day (2026-10-03)

Dhia, 2026-10-03: the blog engine writes one post a day, in Arabic and English, sounding like a
person, ready for Google and the answer engines, publishing on its own. Production that day:
the engine switched on, the OpenAI connection on `gpt-6.1-sol` (tested), `reviewFirstRuns` 0,
and the first run published post 99 (`/blog/sell-tshirts-without-capital`, score 96, $0.058,
89 s, Arabic only; `/en/blog/…` is a 404). His four answers: one post in both languages (each
written natively, not word for word), GPT-6.1 Sol, publish automatically, start today.

Revision 2 after the CTO's plan review (82): M1 to M4 and m1 to m10 taken as below.

## What stands

`src/modules/ai-content/` (ADR-042, ADR-043): `pipeline/run.ts` runs nine steps in the
topic's language (`topic.language`) and writes one locale of one post; `prompts.ts` carries the
prompts per locale, each brief with its own link allowlist (`/en/blog/…` in English);
`checks.ts` scores per locale; `store/payload-store.ts` writes the post (`createPost`, and
`replacePost`, which already writes a locale's takeaways onto the shared rows by id);
`workflow.ts` wraps each step in a Payload inline task with `retries`; the mock provider answers
by the prompt's `LANGUAGE:` line and the request's `step` (`mock.ts`, `mock-en.ts`). `cms()`
starts the jobs cron (`getPayload({ cron: true })`) at the first call, inside a request.

## What is wrong or missing

1. **One language per post.** A post has no English unless a person writes it.
2. **The publish step can fail in a job.** The cron is created inside whichever request first
   calls `cms()`; its ticks inherit that request's store; `revalidatePath` then throws
   `DynamicServerError` (prerender-legacy) or the `connection()` error (prerender), which
   `safeRevalidatePath` does not tolerate, and the post's `afterChange` throws (memory
   2026-10-02). Post 99 published, so it does not bite every boot.
3. **Step retries never happen.** An inline task's failure surfaces as `TaskError` and Payload
   retries only by re-running the whole workflow from `runJob`; `runPipeline` swallows the
   error, so `retries: 2` is never exercised. The AI SDK retries a retryable `APICallError`
   twice itself, then throws `RetryError`; a timeout or a schema miss is not retried at all, and
   a failed run counts toward `postsPerDay`, so one bad call loses the day's post.
4. **Topic `notes` never reach the model**; the priority help text says 1 is highest (the code
   runs 5 first); the banned-phrases help text says "may not start a sentence" (the check
   matches anywhere; only «هناك» is sentence-initial).
5. **An em dash refuses without a revision pass** (the loop requires `refused.length === 0`).
6. **The citation ledger's Claude row fails daily since 2026-09-23**: `webSearch_20260209`
   needs programmatic tool calling, which `claude-haiku-4-5` lacks, and the SDK (4.0.53) sends
   no `allowed_callers` for provider tools.

## The change

### Phase 1: the engine

**A. The companion language** (`pipeline/companion.ts`; `run.ts` already holds a ~385-line
`runPipeline`, so the review loop moves out with it, see m10 below). After the source passes
review, links and SEO, the run writes the other locale (`ar` ↔ `en`):

- Load the other locale's facts, hub and style.
- **Outline** (step record `outline-en`, provider `step: 'outline'`): `provider.object` with
  `CompanionOutlineSchema` = `OutlineSchema` + `title` (the working title in that language) +
  `keyword` (its natural search phrase). The prompt hands the source outline and asks for the
  same sections for that language's reader, adapted, not translated. The companion brief is
  `buildBrief({ ...topic, language: other, title, primaryKeyword: keyword,
  secondaryKeywords: [] }, hub, facts, style)`, so `TOPIC:` and `KEYWORD:` read in its language.
- **Draft** (`draft-en`, `step: 'draft'`): `draftPrompt` + the source article as reference with
  its Markdown links reduced to their text (the source's paths are the other site's), and the
  instruction: same facts, numbers and order of sections, written as a native writer would.
- **Review and revise** (`review-en`, `revise-en`): `writeReviewed(ctx, settings, brief, draft)`
  in `pipeline/review.ts`, the loop `runPipeline` runs today, extracted so both languages call
  it; it returns draft, score, rubric, problems, refused and its step records, and writes
  nothing to the run itself (the run's score, rubric and outline stay the source's; the
  companion's score is in its `review-en` summary). **m2:** a refusal (an em dash, an AI
  mention) takes the revision pass with the refusal in `problems`; it refuses only after the
  last pass, in both languages.
- **Links**: `sanitizeLinks` against the companion's allowlist, at least 2 internal links.
- **SEO** (`seo-en`, `step: 'seo'`): `SeoSchema`; the slug is ignored (the slug is shared).
- **Write** (`publish-en`): new `Store.writeLocale(id, fields, locale, status)`:
  `payload.update` in that locale with `title`, `excerpt`, `takeaways` onto the existing rows by
  id (one helper shared with `replacePost`), `body`, `seo`, `_status` as the source's and
  `draft: status === 'draft'`, with `context: { [SKIP_TRANSLATIONS]: true }` as a safeguard (the
  engine writes each locale itself; there is no form JSON to apply).
- **No dedupe in the other language** (M1): the source passed dedupe and the companion is the
  same article. The backlog's mirrored topics are handled below.
- **A companion failure never fails the run.** Any companion error (refusal or score after the
  last pass, a model error after retries) is caught: the source post stands, a `companion` step
  record is marked not ok, the run is `done` with its `error` field holding "Published in
  Arabic only: …" (the field's description amended in both languages), and the e-mail alert
  goes when `failureAlerts` and `notifyEmail`. The label is patched at finish: `[ar+en]`,
  `[en+ar]`, `[ar]` or `[en]`.
- Regeneration and freshness write both locales the same way, so the languages never drift.
- Stock covers: `uploadImage` takes the locale of the alt it writes, and the companion's alt goes
  onto the media's other locale (n2). Production runs on hub default covers; no change there.
- Cost about doubles (post 99: $0.058; both ≈ $0.12, worst case with retries ≈ $0.18).

**C. Retries at the provider boundary** (M3): `withRetries(provider, { sleep, waits: [3_000,
10_000] })` in `provider/retry.ts`, applied once in `generatePost`; store calls are never
retried. Retryable: `RetryError` (the SDK's own two retries exhausted), a `TimeoutError` or
`AbortError` (the 120 s `AbortSignal.timeout`), `NoObjectGeneratedError` (a schema or JSON miss).
Never: a non-retryable `APICallError` (400, 401, 403, 404), `providerOrRefusal`'s refusal,
`PipelineStop`. A failed attempt's `NoObjectGeneratedError.usage` is added to the run's usage.
The inline tasks keep their logging role with `retries: 0`.

**E (part).** `Topic.notes` read by `toTopic` and put in the header as `NOTES:` when set.

**Tests** (`tests/engine-pipeline.test.ts`, in-memory store + mock): an Arabic topic writes `ar`
and `en` onto one post (both bodies, both takeaway sets on the same row ids, both SEO pairs,
every en link `/en/…`, the en title from the companion outline); an English topic writes `en`
then `ar`; a companion refusal after its revision publishes the source alone with the run's
`error`, the label `[ar]` and the alert; a refusal in the source takes its revision pass;
regeneration rewrites both; a draft source writes the other locale as a draft; the run's
score, rubric and outline stay the source's; the companion's usage is in `costUsd`; a
`RetryError` and a timeout retry and pass, a 401 does not retry, a `NoObjectGeneratedError`'s
usage is counted; the mock serves the companion's steps (`title`, `keyword`). The engine e2e
(`e2e/admin.spec.ts` 4744-5040) flips its English-topic assertions rather than adding new ones:
the step list (4848), the label (4967), `hrefLang="ar"` now present (4988), `/blog/<slug>` now
200 (4989), the post now in `/feed.xml` (4993); and the Arabic run gains its `/en/blog/<slug>`.

### Phase 2: the edges and the docs

**B. The cron is born at boot** (m1): `register()` calls the existing `cms()` (the instrument
layer is server-only, and `@/lib/env-server` already imports `server-only` there) under
`NEXT_RUNTIME === 'nodejs'` and not `phase-production-build`, **not awaited**:
`void cms().catch(...)` logs at error level that Payload did not start at boot and that the
first request will start it (the leak returns for that process). Next awaits `register()`, so
an awaited init with `prodMigrations` and an unreachable database would hold the server
un-ready. A request arriving meanwhile awaits the same cached promise; the crons are created in
the boot's async chain, outside any request store. Unit test with `cms` mocked: called on
nodejs, not during the build, a rejection logged while `register` resolves.

**E (rest), help texts** (m6, rule 4, ux-araby, both languages): topic `priority`, the
banned phrases, the topic `language` ("the post is written in it first, then in the other
language"), the run `error` (also "done in one language"), the regenerate hint (both
languages).

**F. The ledger's Claude search**: `searchTool` uses `webSearch_20250305` for every Claude model
(no beta header, `maxUses: 1` kept); the test asserts the tool id
`anthropic.web_search_20250305` beside `tests/visibility-ledger.test.ts:299-301`.

**Digest** (m5): a done run with an `error` shows it ("one language: …"); a post with no Arabic
links `/en/blog/…`.

**Docs** (m9): ADR-066 in `docs/DECISIONS.md`, naming what it amends: ADR-033 (the runner starts
at boot, not at the first render or probe), ADR-042 (retries at the provider boundary, not the
inline task), ADR-043 and BRD §10.2.2 (a topic's language is the language written first; the
post is written in both), ADR-049 D5 (the 2025-03-05 search tool; the comment at `model.ts:49`).
BRD §10.2 amended in `docs/brd-sections/06-levels-2-3-4.md`, the master rebuilt by
`docs/build-brd.py`. RUNBOOK's engine section: the tab is "Schedule and limits"; set
`notifyEmail` before the first bilingual run; a deploy mid-run leaves the run `running` and the
topic `generating` (n4).

## The backlog's mirrored topics and post 99 (m7)

Most of the 15 English seed topics mirror an Arabic one. With every post bilingual, the second
of each pair is the same subject in both languages. The source dedupe rejects most of them
(0.75 measured on the clothing-brand pair) but by luck. The decision for Dhia, after the merge
(a production write): retire the mirrored English topics, keep the three with no Arabic twin
(Shopify, creator merch, Salla and Zid for founders). Post 99 gets its English by one
Regenerate after the deploy (it rewrites the Arabic too, from the same topic).

## Gates

`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm check:dash`, `pnpm check:rtl`, the admin
strings and config tests, the engine e2e on the review database with the mock.

## Out of scope

`FAQPage` on posts (M4: ADR-050 keeps it to `/faq` because the same questions as `FAQPage` on
many pages is what the guidelines warn against, every brief asks the same two questions, and
Google shows the rich result only for government and health sites; the question-H2 plus direct
answer structure is what the answer engines extract). Generated covers, Pexels attribution, the
`scheduled` topic status, the unused `imageStyle`, a language alternation rule, separate word
limits per language (watch the English `length` deduction).

## Judgment calls

- The companion is written after the source passes, not in parallel: it adapts the final text.
- A failed companion publishes the source alone rather than failing the day.
- No dedupe on the companion (the same article; regeneration would match itself).
- `webSearch_20250305` for every Claude model rather than a model list to keep current.
- Boot init fire-and-forget, logged, instead of blocking or failing the boot.
