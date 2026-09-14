# CI on the PR only, merged through one script

Date: 2026-09-15. Branch `ci/pr-only-and-build-cache`. One PR. CTO plan review: 79 (revision 1
below), then re-reviewed.

## Why

Every PR costs two identical CI events: the `pull_request` run and the `push` run on `main`
after the squash merge. Each event is ~32 billed minutes (the quality job ~24, the S3 job ~8 in
parallel), so ~64 minutes per PR plus reruns; the month's 2,000 free minutes ran out on
2026-09-14 with a private repository and blocked PR #15. The repository is public for now and
its minutes are free, but Dhia will make it private again; the plan is written for that case.

Step durations of the last green run on `main` (34865487681, private-repository runner:
2 vCPU, 8 GB; the public one has 4 vCPU and measures differently):

| Step | Quality job | S3 job |
| --- | --- | --- |
| E2E | 631 s | 280 s (subset) |
| Lighthouse CI | 327 s | |
| Build | 81 s (the English-off build, cold) + 20 s (the second build in the same job) | 92 s |
| Install Playwright browsers | 55 s | 22 s |
| Unit tests | 49 s | |
| Seed check | 40 s | 38 s |

## Changes

1. **Triggers: `pull_request` and `workflow_dispatch`; no `push` to `main`.** Changes land by
   squash merge only (BRD 8.2), so a branch that contains `origin/main` lands the tree the PR
   run already tested (`refs/pull/N/merge`): the push run repeats it and adds no information.
   `workflow_dispatch` keeps a full run of `main` one command away
   (`gh workflow run ci.yml --ref main`). The deploy workflow keeps its own `push` trigger (it
   builds the image; it never depended on CI, and its `next build` fails closed on a broken
   `main`). Saves ~32 billed minutes per PR (half).
2. **The merge routine is a script, `scripts/merge-pr.sh <number> [subject]`,** so the property
   the push run used to check is checked every time and the same way: fetch; `origin/<branch>`
   must contain `origin/main` (the remote head is what the run tested), else stop with the
   instruction to merge `main` in and let the PR run again; `gh pr checks --watch --fail-fast`
   on the head, then print every check line; `gh pr merge --squash --delete-branch`;
   `git checkout main && git pull`. `set -euo pipefail`; shellcheck-clean.
3. **The warm-up asks for AVIF.** `e2e/global-setup.ts` and `scripts/ci/warm-lib.sh` request
   every image transform a page references so no test pays for a cold encode, but Next encodes
   the format the request accepts: fetch's and curl's default (any type) got a resized JPEG,
   while every browser in the suite and Lighthouse's Chrome ask for AVIF, so the warm-up
   warmed nothing a test used (verified on the review server: the same URL answers
   `image/jpeg` to `*/*` and `image/avif` to a browser's Accept). Found through PR #15's
   second run, where the two no-JS home tests waited past 30 s for `load` in the first minute
   of a two-worker run. Both warmers now send `image/avif,image/webp,*/*;q=0.8`.
4. **Docs.** ADR-045: the decision, its dependency on BRD 8.2, and the trade-off it accepts
   (no CI event on `main`; the deploy trusts the routine; a merge from the GitHub UI skips the
   script) with the re-arm path (`push: main` back plus a `workflow_run` gate on the deploy).
   BRD 8.7's title and step 9 (already superseded by ADR-033); RUNBOOK's gates section points at
   the script; the `docs/` BRD copy rebuilt. The memory of the phase gate: the merge goes
   through the script.

## Not changed, and why

- Keeping `.next/cache` between runs (Next's documented `actions/cache` pattern): a
  `pull_request` run's cache is scoped to that PR, and with no trusted run on `main` nothing
  ever writes `main`'s scope, so the cache would warm only the reruns of one PR: about 20 to
  45 s per job after restore and save, nothing on a PR's first run. It would also need a
  restore/save split so the runtime image cache (`.next/cache/images`, written by `next start`
  during the e2e and Lighthouse) is never saved and served stale to the budgets test. Not worth
  four workflow steps; it can return with a trusted trigger on `main`.
- Caching the Playwright browsers: Playwright's own CI guide says not to (restoring the cache
  takes about as long as the download, and the OS dependencies cannot be cached).
- The CI worker count (Playwright's default is 50% of cores: 1 on the private runner, 2 on the
  public one): Playwright recommends stability over parallelism on hosted runners; the WebKit
  device projects are the ones a starved runner makes flaky, and the default adapts to the
  runner class.
- Sharding the e2e across jobs: shorter wall clock, more billed minutes (each shard repeats
  install, seed and build); the wrong trade for a repository that will be private again.
- Lighthouse's three runs per URL: the floor for a stable performance score; fewer runs turn
  the perf gate into noise.
- `paths-ignore` for docs-only PRs: rare here (docs ride with their feature), and it would skip
  `check:dash` on the very files it guards.
- Follow-up for Dhia's call, not this PR: the admin suite (the `cms` project, 24 tests) runs
  twice per event, in the quality job against local-disk media and in the S3 job against
  MinIO; production only runs S3 (ADR-029). Dropping it from the quality job would take about
  3 minutes off the 24-minute job, at the cost of the run that keeps Playwright's project
  ordering.

## Evidence

- `zizmor .github/workflows/` (the one high finding is `deploy.yml`'s, unchanged);
  `shellcheck` and `shfmt -d` on `scripts/merge-pr.sh` and `scripts/ci/warm-lib.sh`;
  `pnpm check:dash` on the docs.
- The PR's CI: both check lines green (no other event exists any more); the e2e step's log
  shows the warm-up, and the no-JS home tests pass on the first try.
- The script's refusal path: this branch is behind `main` once PR #15 lands, so the script is
  run once before `main` is merged in (it must refuse with the instruction), then `main` is
  merged in, the PR runs again, and the merge is the script's first happy path.
