#!/usr/bin/env bash
# Squash-merge a pull request the way the CI shape assumes (ADR-045). CI runs on the pull
# request only, so the merge must land the tree that run tested: the branch's remote head has
# to contain `origin/main` (else the squash would combine untested work), and every check on
# that head has to be green. Usage: scripts/merge-pr.sh <number> [subject]
set -euo pipefail
cd "$(dirname "$0")/.."

pr="${1:?usage: scripts/merge-pr.sh <number> [subject]}"
branch=$(gh pr view "$pr" --json headRefName -q .headRefName)
# The squash commit: the subject given, or the PR's title the way GitHub writes it, and no
# body (the generated list of the branch's commits says nothing the PR does not).
subject="${2:-$(gh pr view "$pr" --json title -q .title) (#$pr)}"

git fetch -q origin main "$branch"
if ! git merge-base --is-ancestor origin/main "origin/$branch"; then
  echo "merge-pr: origin/$branch does not contain origin/main; merge main into the branch," \
    "push, let the PR run again, then retry" >&2
  exit 1
fi
echo "merge-pr: origin/$branch contains origin/main"

# `--fail-fast` stops at the first failed check; the second call prints every line for the
# record (both jobs must read pass).
gh pr checks "$pr" --watch --fail-fast
gh pr checks "$pr"

gh pr merge "$pr" --squash --delete-branch --subject "$subject" --body ""
git checkout main
git pull
