#!/usr/bin/env bash
# Integration check of the content seed and the first-admin script against a real Postgres
# (ADR-026): an empty database is seeded once, a second run is refused, --force adds nothing
# and overwrites nothing, and admin:create enforces the password policy. Needs DATABASE_URL,
# PAYLOAD_SECRET, ADMIN_EMAIL and ADMIN_PASSWORD; the schema must already be migrated.
set -euo pipefail
cd "$(dirname "$0")/../.."

expect_exit() {
  local wanted="$1"
  shift
  local code=0
  "$@" >/tmp/seed-check.log 2>&1 || code=$?
  if [ "$code" != "$wanted" ]; then
    echo "seed-check: '$*' exited $code, expected $wanted" >&2
    cat /tmp/seed-check.log >&2
    exit 1
  fi
}

echo "seed-check: empty database seeds"
expect_exit 0 pnpm content:migrate
created=$(grep -o 'created [0-9]*, skipped 0' /tmp/seed-check.log | grep -o '[0-9]*' | head -1)
[ -n "$created" ] && [ "$created" -gt 0 ] || { cat /tmp/seed-check.log >&2; exit 1; }

echo "seed-check: a second run without --force is refused"
expect_exit 2 pnpm content:migrate

echo "seed-check: --force adds nothing and overwrites nothing"
expect_exit 0 pnpm content:migrate --force
grep -q 'created 0, skipped [1-9]' /tmp/seed-check.log || { cat /tmp/seed-check.log >&2; exit 1; }

echo "seed-check: admin:create refuses a short password"
expect_exit 1 env ADMIN_PASSWORD=short pnpm admin:create

echo "seed-check: admin:create creates the first admin once"
expect_exit 0 pnpm admin:create
grep -q 'created' /tmp/seed-check.log
expect_exit 0 pnpm admin:create
grep -q 'nothing to do' /tmp/seed-check.log
echo "seed-check: ok"
